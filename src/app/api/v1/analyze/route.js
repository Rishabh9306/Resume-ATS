import { NextResponse } from 'next/server';
import { parseResume } from '@/lib/resume-parser';
import { analyzeResume } from '@/lib/ats-engine';
import { getAdminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

/**
 * POST /api/v1/analyze
 * Accepts multipart form data with a single `resumeFile` and a `jobDescription`.
 * Validates request using the `X-API-Key` header.
 */
export async function POST(request) {
  try {
    // ── Get and Verify API Key ──────────────────────────────
    const apiKey = request.headers.get('x-api-key');
    if (!apiKey || !apiKey.startsWith('ats_live_')) {
      return NextResponse.json(
        { error: 'Unauthorized. Missing or invalid X-API-Key header.' },
        { status: 401 }
      );
    }

    const adminDb = await getAdminDb();
    const userQuery = await adminDb
      .collection('users')
      .where('apiKey', '==', apiKey)
      .limit(1)
      .get();

    if (userQuery.empty) {
      return NextResponse.json(
        { error: 'Unauthorized. Invalid API Key.' },
        { status: 401 }
      );
    }

    const userDocRef = userQuery.docs[0].ref;
    const userData = userQuery.docs[0].data();

    // Confirm they are still on Enterprise tier
    if (userData.plan !== 'enterprise') {
      return NextResponse.json(
        { error: 'Forbidden. Enterprise plan required for API access.' },
        { status: 403 }
      );
    }

    // ── Parse form input ─────────────────────────────────────
    const formData = await request.formData();
    const resumeFile = formData.get('resumeFile');
    const jobDescription = formData.get('jobDescription');
    const jobTitle = formData.get('jobTitle') || 'API Integration Scan';

    if (!resumeFile || !(resumeFile instanceof File)) {
      return NextResponse.json(
        { error: 'Bad Request. resumeFile is required.' },
        { status: 400 }
      );
    }

    if (!jobDescription || typeof jobDescription !== 'string' || jobDescription.trim().length < 20) {
      return NextResponse.json(
        { error: 'Bad Request. jobDescription is required (minimum 20 characters).' },
        { status: 400 }
      );
    }

    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!allowedTypes.includes(resumeFile.type)) {
      return NextResponse.json(
        { error: 'Unsupported Media Type. Only PDF and DOCX files are allowed.' },
        { status: 415 }
      );
    }

    const MAX_SIZE = 5 * 1024 * 1024;
    if (resumeFile.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'Payload Too Large. Resume file size limit is 5MB.' },
        { status: 413 }
      );
    }

    // ── Parse and Analyze ─────────────────────────────────────
    const arrayBuffer = await resumeFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { text: resumeText, wordCount, pageEstimate } = await parseResume(
      buffer,
      resumeFile.type
    );

    if (!resumeText || resumeText.trim().length < 50) {
      return NextResponse.json(
        { error: 'Unprocessable Entity. Could not parse text from resume.' },
        { status: 422 }
      );
    }

    const analysis = analyzeResume(resumeText, jobDescription.trim());

    // Save scan to database
    const scanData = {
      userId: userDocRef.id,
      createdAt: new Date(),
      score: analysis.overallScore,
      overallScore: analysis.overallScore,
      breakdown: analysis.breakdown,
      suggestions: analysis.suggestions,
      resumeText: resumeText.slice(0, 5000),
      jobDescription: jobDescription.trim().slice(0, 2000),
      jobTitle: jobTitle.trim().slice(0, 200),
      wordCount,
      pageEstimate,
      fileName: resumeFile.name,
      source: 'api_integration',
    };

    const scanRef = await adminDb.collection('scans').add(scanData);

    // Update scansUsed in user profile
    const admin = await import('firebase-admin');
    await userDocRef.update({
      scansUsed: admin.default.firestore.FieldValue.increment(1),
    });

    // ── Return Response ───────────────────────────────────────
    return NextResponse.json({
      success: true,
      scanId: scanRef.id,
      overallScore: analysis.overallScore,
      breakdown: analysis.breakdown,
      suggestions: analysis.suggestions,
      wordCount,
      pageEstimate,
    });
  } catch (err) {
    console.error('API analyze endpoint error:', err);
    return NextResponse.json(
      { error: 'Internal Server Error.', details: err.message },
      { status: 500 }
    );
  }
}
