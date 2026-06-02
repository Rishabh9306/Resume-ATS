import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: 'gemini-2.0-flash',
  generationConfig: {
    temperature: 0.7,
    responseMimeType: 'application/json',
  },
});

/**
 * Get AI-powered resume improvement suggestions.
 *
 * @param {string} resumeText      – plain-text resume
 * @param {string} jobDescription  – target job description
 * @param {object} atsBreakdown    – breakdown object from analyzeResume()
 * @returns {Promise<object>}      – structured suggestions
 */
export async function getAISuggestions(resumeText, jobDescription, atsBreakdown) {
  const prompt = `You are an expert resume writer and ATS optimisation consultant. Analyse the following resume against the target job description and ATS breakdown, then provide actionable improvement suggestions.

## Resume
${resumeText}

## Job Description
${jobDescription}

## ATS Analysis Breakdown
${JSON.stringify(atsBreakdown, null, 2)}

---

Provide your response as a JSON object with the following structure:

{
  "bulletRewrites": [
    {
      "original": "The original bullet point from the resume",
      "improved": "A rewritten version with stronger action verbs, quantified metrics, and relevant keywords",
      "reason": "Brief explanation of why this rewrite is better"
    }
  ],
  "missingSuggestions": [
    {
      "keyword": "missing keyword from the job description",
      "suggestion": "A natural sentence or bullet point that incorporates this keyword"
    }
  ],
  "summaryRewrite": "A complete rewritten professional summary tailored to the job description, incorporating relevant keywords and highlighting key qualifications.",
  "skillsOptimization": "Suggested reorganisation or additions to the skills section, formatted as a comma-separated list grouped by category.",
  "overallAdvice": "2–3 paragraphs of strategic advice on how to improve the resume for this specific role, covering structure, content, and ATS optimisation."
}

Rules:
- Provide 3–6 bullet rewrites, focusing on the weakest ones.
- Include up to 8 missing keyword suggestions.
- The summary rewrite should be 3–4 sentences, professional, and keyword-rich.
- Be specific and actionable — avoid vague advice.
- Use metrics and numbers wherever possible in rewrites.
- Match the tone and seniority level of the target role.`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const suggestions = JSON.parse(text);

    // Validate basic structure
    return {
      bulletRewrites: Array.isArray(suggestions.bulletRewrites) ? suggestions.bulletRewrites : [],
      missingSuggestions: Array.isArray(suggestions.missingSuggestions) ? suggestions.missingSuggestions : [],
      summaryRewrite: suggestions.summaryRewrite || '',
      skillsOptimization: suggestions.skillsOptimization || '',
      overallAdvice: suggestions.overallAdvice || '',
    };
  } catch (err) {
    console.error('Gemini AI suggestions error:', err);
    throw new Error(`Failed to generate AI suggestions: ${err.message}`);
  }
}
