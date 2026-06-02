import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import { getAISuggestions } from '@/lib/gemini';
import { PLANS } from '@/lib/constants';

export const dynamic = 'force-dynamic';

/**
 * POST /api/ai-suggestions
 * Returns AI-powered resume improvement suggestions.
 * Requires authentication and a plan that includes AI suggestions.
 */
export async function POST(request) {
  try {
    // ── Authenticate ─────────────────────────────────────────
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required. Please sign in.' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    let userId;
    try {
      const adminAuth = await getAdminAuth();
      const decoded = await adminAuth.verifyIdToken(token);
      userId = decoded.uid;
    } catch {
      return NextResponse.json(
        { error: 'Invalid or expired authentication token.' },
        { status: 401 }
      );
    }

    // ── Check plan permissions ───────────────────────────────
    const adminDb = await getAdminDb();
    const userRef = adminDb.collection('users').doc(userId);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return NextResponse.json(
        { error: 'User profile not found.' },
        { status: 404 }
      );
    }

    const userData = userSnap.data();
    const plan = PLANS[userData.plan || 'free'];

    if (!plan || !plan.aiSuggestions) {
      return NextResponse.json(
        {
          error: 'AI suggestions are not available on your current plan. Upgrade to Starter or above.',
          code: 'PLAN_UPGRADE_REQUIRED',
          currentPlan: userData.plan || 'free',
        },
        { status: 403 }
      );
    }

    // ── Parse body ───────────────────────────────────────────
    const body = await request.json();
    const { resumeText, jobDescription, breakdown } = body;

    if (!resumeText || typeof resumeText !== 'string') {
      return NextResponse.json(
        { error: 'resumeText is required.' },
        { status: 400 }
      );
    }

    if (!jobDescription || typeof jobDescription !== 'string') {
      return NextResponse.json(
        { error: 'jobDescription is required.' },
        { status: 400 }
      );
    }

    if (!breakdown || typeof breakdown !== 'object') {
      return NextResponse.json(
        { error: 'ATS breakdown object is required.' },
        { status: 400 }
      );
    }

    // ── Get AI suggestions ───────────────────────────────────
    const suggestions = await getAISuggestions(resumeText, jobDescription, breakdown);

    return NextResponse.json({
      success: true,
      suggestions,
    });
  } catch (err) {
    console.error('AI suggestions error:', err);
    return NextResponse.json(
      { error: 'Failed to generate AI suggestions.', details: err.message },
      { status: 500 }
    );
  }
}
