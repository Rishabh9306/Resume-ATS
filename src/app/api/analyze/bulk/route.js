import { NextResponse } from 'next/server';
import { parseResume } from '@/lib/resume-parser';
import { analyzeResume } from '@/lib/ats-engine';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

/**
 * POST /api/analyze/bulk
 * Accepts multipart form data with multiple `resumeFiles` and a single `jobDescription`.
 * Requires authenticated Enterprise user.
 */
export async function POST(request) {
  try {
    // ── Verify Authentication ────────────────────────────────
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    let userId;
    try {
      const adminAuth = await getAdminAuth();
      const decoded = await adminAuth.verifyIdToken(token);
      userId = decoded.uid;
    } catch {
      return NextResponse.json({ error: 'Invalid authentication token.' }, { status: 401 });
    }

    const adminDb = await getAdminDb();
    const userRef = adminDb.collection('users').doc(userId);
    const userSnap = await userRef.get();
    if (!userSnap.exists || userSnap.data().plan !== 'enterprise') {
      return NextResponse.json({ error: 'Enterprise subscription required for bulk scanning.' }, { status: 403 });
    }

    // ── Parse form fields ────────────────────────────────────
    const formData = await request.formData();
    const resumeFiles = formData.getAll('resumeFiles');
    const jobDescription = formData.get('jobDescription');

    if (!resumeFiles || resumeFiles.length === 0) {
      return NextResponse.json({ error: 'At least one resume file is required.' }, { status: 400 });
    }

    if (resumeFiles.length > 5) {
      return NextResponse.json({ error: 'Maximum 5 files can be processed in a bulk scan batch.' }, { status: 400 });
    }

    if (!jobDescription || typeof jobDescription !== 'string' || jobDescription.trim().length < 20) {
      return NextResponse.json({ error: 'Job description is required (minimum 20 characters).' }, { status: 400 });
    }

    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    const MAX_SIZE = 5 * 1024 * 1024;

    // ── Process files in parallel ─────────────────────────────
    const results = await Promise.all(
      resumeFiles.map(async (file) => {
        try {
          if (!(file instanceof File)) {
            return { fileName: 'Unknown', error: 'Invalid file object format.' };
          }
          if (!allowedTypes.includes(file.type)) {
            return { fileName: file.name, error: 'Only PDF and DOCX files are supported.' };
          }
          if (file.size > MAX_SIZE) {
            return { fileName: file.name, error: 'File size must not exceed 5 MB.' };
          }

          const arrayBuffer = await file.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          
          const { text: resumeText, wordCount, pageEstimate } = await parseResume(buffer, file.type);
          if (!resumeText || resumeText.trim().length < 50) {
            return { fileName: file.name, error: 'Could not extract text. Check if file is image-only.' };
          }

          const analysis = analyzeResume(resumeText, jobDescription.trim());

          // Save scan details to database
          const scanData = {
            userId,
            createdAt: new Date(),
            score: analysis.overallScore,
            overallScore: analysis.overallScore,
            breakdown: analysis.breakdown,
            suggestions: analysis.suggestions,
            resumeText: resumeText.slice(0, 5000),
            jobDescription: jobDescription.trim().slice(0, 2000),
            jobTitle: 'Bulk Scan: ' + file.name,
            wordCount,
            pageEstimate,
            fileName: file.name,
          };

          const scanRef = await adminDb.collection('scans').add(scanData);

          return {
            success: true,
            scanId: scanRef.id,
            fileName: file.name,
            overallScore: analysis.overallScore,
            wordCount,
            pageEstimate,
          };
        } catch (err) {
          return {
            fileName: file.name || 'Unknown',
            error: err.message || 'An unexpected error occurred during processing.'
          };
        }
      })
    );

    // Increment scansUsed in user profile by total successful scans
    const successfulScans = results.filter(r => r.success).length;
    if (successfulScans > 0) {
      const admin = await import('firebase-admin');
      await userRef.update({
        scansUsed: admin.default.firestore.FieldValue.increment(successfulScans),
      });
    }

    return NextResponse.json({ success: true, results });
  } catch (err) {
    console.error('Bulk analysis error:', err);
    return NextResponse.json({ error: 'Bulk processing failed.', details: err.message }, { status: 500 });
  }
}
