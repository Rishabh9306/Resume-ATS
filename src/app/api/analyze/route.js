import { NextResponse } from 'next/server';
import { parseResume } from '@/lib/resume-parser';
import { analyzeResume } from '@/lib/ats-engine';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import { PLANS } from '@/lib/constants';

export const dynamic = 'force-dynamic';

/**
 * POST /api/analyze
 * Accepts multipart form data with a resume file and job description.
 * Optionally authenticates the user to track usage and enforce limits.
 */
export async function POST(request) {
  try {
    const formData = await request.formData();
    const resumeFile = formData.get('resumeFile');
    const jobDescription = formData.get('jobDescription');
    const jobTitle = formData.get('jobTitle') || '';

    // ── Validate inputs ──────────────────────────────────────
    if (!resumeFile || !(resumeFile instanceof File)) {
      return NextResponse.json(
        { error: 'Resume file is required.' },
        { status: 400 }
      );
    }

    if (!jobDescription || typeof jobDescription !== 'string' || jobDescription.trim().length < 20) {
      return NextResponse.json(
        { error: 'Job description is required (minimum 20 characters).' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!allowedTypes.includes(resumeFile.type)) {
      return NextResponse.json(
        { error: 'Only PDF and DOCX files are supported.' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (resumeFile.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'File size must not exceed 5 MB.' },
        { status: 400 }
      );
    }

    // ── Optionally authenticate user ──────────────────────────
    let userId = null;
    let userPlan = 'free';
    let userDoc = null;
    let userEmail = null;

    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split('Bearer ')[1];
      try {
        const adminAuth = await getAdminAuth();
        const adminDb = await getAdminDb();
        const decoded = await adminAuth.verifyIdToken(token);
        userId = decoded.uid;
        userEmail = decoded.email || null;

        const userRef = adminDb.collection('users').doc(userId);
        const snap = await userRef.get();

        if (!snap.exists) {
          // Auto-create user document if missing (e.g. client permissions failed during registration)
          const userAuthData = await adminAuth.getUser(userId);
          const now = new Date();
          const resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
          
          userDoc = {
            uid: userId,
            email: userAuthData.email || '',
            displayName: userAuthData.displayName || '',
            photoURL: userAuthData.photoURL || '',
            plan: 'free',
            scansUsed: 0,
            scansResetDate: resetDate,
            createdAt: now,
          };
          await userRef.set(userDoc);
        } else {
          userDoc = snap.data();
        }

        userPlan = userDoc.plan || 'free';

        // Check scan limits
        const plan = PLANS[userPlan];
        if (plan && plan.scansPerMonth !== -1) {
          // Check if we need to reset the monthly counter
          const resetDate = userDoc.scansResetDate?.toDate?.() || new Date(userDoc.scansResetDate);
          const now = new Date();

          if (resetDate && now >= resetDate) {
            // Reset counter
            const nextReset = new Date(now.getFullYear(), now.getMonth() + 1, 1);
            await userRef.set({
              scansUsed: 0,
              scansResetDate: nextReset,
            }, { merge: true });
            userDoc.scansUsed = 0;
          }

          if ((userDoc.scansUsed || 0) >= plan.scansPerMonth) {
            return NextResponse.json(
              {
                error: `You've used all ${plan.scansPerMonth} scans for this month. Upgrade your plan for more scans.`,
                code: 'SCAN_LIMIT_REACHED',
                currentPlan: userPlan,
                scansUsed: userDoc.scansUsed,
                scansPerMonth: plan.scansPerMonth,
              },
              { status: 429 }
            );
          }
        }
      } catch (authErr) {
        // Token invalid — proceed as unauthenticated
        console.warn('Auth token verification failed:', authErr.message);
        userId = null;
      }
    }

    // ── Parse resume ─────────────────────────────────────────
    const arrayBuffer = await resumeFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { text: resumeText, wordCount, pageEstimate } = await parseResume(
      buffer,
      resumeFile.type
    );

    if (!resumeText || resumeText.trim().length < 50) {
      return NextResponse.json(
        { error: 'Could not extract meaningful text from the resume. Please ensure the file is not image-based or corrupted.' },
        { status: 422 }
      );
    }

    // ── Run ATS analysis ─────────────────────────────────────
    const analysis = analyzeResume(resumeText, jobDescription.trim());

    // ── Save scan for authenticated users ────────────────────
    if (userId) {
      try {
        const adminDb = await getAdminDb();
        
        const memberEmail = userEmail || userDoc?.email || '';
        let teamOwnerIdToSave = null;
        if (userDoc?.teamOwnerId) {
          teamOwnerIdToSave = userDoc.teamOwnerId;
        } else if (['teams', 'enterprise'].includes(userPlan)) {
          teamOwnerIdToSave = userId;
        }

        const scanData = {
          userId,
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
          teamOwnerId: teamOwnerIdToSave,
          userEmail: memberEmail,
          userName: userDoc?.displayName || '',
        };

        const scanRef = await adminDb.collection('scans').add(scanData);
        var savedScanId = scanRef.id;

        // Increment scansUsed
        const userRef = adminDb.collection('users').doc(userId);
        const admin = await import('firebase-admin');
        await userRef.set({
          scansUsed: admin.default.firestore.FieldValue.increment(1),
        }, { merge: true });

        // If the user belongs to a recruiter team, update their scansThisMonth count in the owner's team document
        if (userDoc?.teamOwnerId && memberEmail) {
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
                  scansThisMonth: (member.scansThisMonth || 0) + 1,
                };
              }
              return member;
            });

            if (memberUpdated) {
              await teamRef.update({ members: updatedMembers });
            }
          }
        }
      } catch (saveErr) {
        // Don't fail the analysis if saving fails
        console.error('Failed to save scan:', saveErr.message);
      }
    }

    // ── Return result ────────────────────────────────────────
    return NextResponse.json({
      success: true,
      ...(typeof savedScanId !== 'undefined' && { scanId: savedScanId }),
      overallScore: analysis.overallScore,
      breakdown: analysis.breakdown,
      suggestions: analysis.suggestions,
      wordCount,
      pageEstimate,
      ...(userId && {
        usage: {
          plan: userPlan,
          scansUsed: (userDoc?.scansUsed || 0) + 1,
          scansPerMonth: PLANS[userPlan]?.scansPerMonth ?? 3,
        },
      }),
    });
  } catch (err) {
    console.error('Analysis error:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred during analysis.', details: err.message },
      { status: 500 }
    );
  }
}
