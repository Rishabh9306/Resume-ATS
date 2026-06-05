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
    let userDoc = userSnap.exists ? userSnap.data() : {};
    
    const memberEmail = decoded.email || userDoc.email || '';

    // Server-side sync: resolve membership and inherit owner's plan automatically
    if (memberEmail) {
      const membershipRef = adminDb.collection('memberships').doc(memberEmail.toLowerCase());
      const membershipSnap = await membershipRef.get();
      if (membershipSnap.exists) {
        const membData = membershipSnap.data();
        const teamOwnerId = membData.ownerId;
        
        // Fetch the owner's current plan dynamically to ensure it is always up to date
        const ownerRef = adminDb.collection('users').doc(teamOwnerId);
        const ownerSnap = await ownerRef.get();
        if (ownerSnap.exists) {
          const ownerData = ownerSnap.data();
          const ownerPlan = ownerData.plan || 'free';
          
          if (userDoc.teamOwnerId !== teamOwnerId || userDoc.plan !== ownerPlan) {
            const updates = { teamOwnerId, plan: ownerPlan };
            await userRef.set(updates, { merge: true });
            userDoc = { ...userDoc, ...updates };
          }
        }
      } else {
        // If the user is no longer in any team but has a teamOwnerId, revert them to free plan
        if (userDoc.teamOwnerId) {
          const updates = { teamOwnerId: null, plan: 'free' };
          await userRef.set(updates, { merge: true });
          userDoc = { ...userDoc, ...updates };
        }
      }
    }

    const userPlan = userDoc.plan || null;
    if (!['teams', 'enterprise'].includes(userPlan)) {
      return NextResponse.json({ error: 'Teams or Enterprise subscription required for bulk scanning.' }, { status: 403 });
    }

    const memberName = userDoc.displayName || '';
    let teamOwnerIdToSave = userDoc.teamOwnerId || (['teams', 'enterprise'].includes(userPlan) ? userId : null);

    // ── Parse form fields ────────────────────────────────────
    const formData = await request.formData();
    const resumeFiles = formData.getAll('resumeFiles');
    const jobDescription = formData.get('jobDescription');

    if (!resumeFiles || resumeFiles.length === 0) {
      return NextResponse.json({ error: 'At least one resume file is required.' }, { status: 400 });
    }

    const maxBatch = userPlan === 'enterprise' ? 50 : 10;
    if (resumeFiles.length > maxBatch) {
      return NextResponse.json({ error: `Maximum ${maxBatch} files can be processed per batch on your ${userPlan} plan.` }, { status: 400 });
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
            teamOwnerId: teamOwnerIdToSave,
            userEmail: memberEmail,
            userName: memberName,
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

      // Increment scans in owner's team document if this is a recruiter member
      if (userDoc.teamOwnerId && memberEmail) {
        const teamRef = adminDb.collection('teams').doc(userDoc.teamOwnerId);
        const teamSnap = await teamRef.get();
        if (teamSnap.exists) {
          const teamData = teamSnap.data();
          const members = teamData.members || [];
          
          let memberUpdated = false;
          const updatedMembers = members.map((member) => {
            if (member.email?.toLowerCase() === memberEmail.toLowerCase()) {
              memberUpdated = true;
              return {
                ...member,
                scansThisMonth: (member.scansThisMonth || 0) + successfulScans,
              };
            }
            return member;
          });

          if (memberUpdated) {
            await teamRef.update({ members: updatedMembers });
          }
        }
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (err) {
    console.error('Bulk analysis error:', err);
    return NextResponse.json({ error: 'Bulk processing failed.', details: err.message }, { status: 500 });
  }
}
