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
          error: 'AI suggestions are not available on your current plan.',
          code: 'PLAN_UPGRADE_REQUIRED',
          currentPlan: userData.plan || 'free',
        },
        { status: 403 }
      );
    }

    // Check AI rewrite limits for free tier
    const aiRewritesLimit = plan.aiRewritesPerMonth;
    if (aiRewritesLimit !== -1) {
      const aiRewritesUsed = userData.aiRewritesUsed || 0;
      // Check if we need to reset the monthly counter
      const now = new Date();
      const lastResetDate = userData.aiRewritesResetDate?.toDate?.() || userData.aiRewritesResetDate;
      const needsReset = !lastResetDate || new Date(lastResetDate).getMonth() !== now.getMonth() || new Date(lastResetDate).getFullYear() !== now.getFullYear();

      if (needsReset) {
        // Reset counter for the new month
        await userRef.update({ aiRewritesUsed: 0, aiRewritesResetDate: now });
      } else if (aiRewritesUsed >= aiRewritesLimit) {
        return NextResponse.json(
          {
            error: `You've used all ${aiRewritesLimit} free AI rewrites this month. Upgrade to Pro for unlimited AI rewrites — just ₹149/mo!`,
            code: 'AI_LIMIT_REACHED',
            currentPlan: userData.plan || 'free',
            aiRewritesUsed,
            aiRewritesLimit,
          },
          { status: 403 }
        );
      }
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

    // Increment AI rewrite counter for plans with limits
    if (aiRewritesLimit !== -1) {
      const admin = await import('firebase-admin');
      await userRef.update({
        aiRewritesUsed: admin.default.firestore.FieldValue.increment(1),
      });
    }

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
