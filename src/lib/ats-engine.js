import { ATS_CRITERIA } from './constants';

// ────────────────────────────────────────────────────────────
// Stop words to filter from keyword extraction
// ────────────────────────────────────────────────────────────
const STOP_WORDS = new Set([
  'a','an','the','and','or','but','in','on','at','to','for','of','with','by',
  'from','as','is','was','are','were','be','been','being','have','has','had',
  'do','does','did','will','would','could','should','may','might','shall',
  'can','need','must','ought','i','me','my','myself','we','our','ours',
  'ourselves','you','your','yours','yourself','yourselves','he','him','his',
  'himself','she','her','hers','herself','it','its','itself','they','them',
  'their','theirs','themselves','what','which','who','whom','this','that',
  'these','those','am','about','above','after','again','against','all','any',
  'both','each','few','more','most','other','some','such','no','nor','not',
  'only','own','same','so','than','too','very','just','because','if','when',
  'where','how','while','during','before','after','between','through','into',
  'out','up','down','over','under','then','once','here','there','why','also',
  'well','back','still','even','new','work','working','worked','use','used',
  'using','etc','including','within','across','per','via','e.g','i.e',
  'able','get','make','like','know','take','come','see','look','find','give',
  'part','based','role','job','company','team','project','ensure','provide',
  'support','help','key','set','high','strong','good','best','great','etc',
]);

// ────────────────────────────────────────────────────────────
// Strong action verbs for impact scoring
// ────────────────────────────────────────────────────────────
const ACTION_VERBS = [
  'achieved','accelerated','accomplished','administered','advanced','advocated',
  'analyzed','architected','assembled','audited','automated','boosted','budgeted',
  'built','calculated','centralized','chaired','coached','collaborated',
  'communicated','compiled','consolidated','constructed','consulted','contributed',
  'converted','coordinated','created','customized','decreased','delegated',
  'delivered','demonstrated','deployed','designed','developed','devised',
  'diagnosed','directed','documented','drove','earned','edited','eliminated',
  'enabled','enforced','engineered','enhanced','established','evaluated',
  'exceeded','executed','expanded','expedited','facilitated','finalized',
  'forecasted','formulated','founded','generated','governed','grew','guided',
  'headed','identified','implemented','improved','increased','influenced',
  'initiated','innovated','inspected','instituted','integrated','introduced',
  'invented','investigated','launched','led','leveraged','liaised','maintained',
  'managed','maximized','mediated','mentored','migrated','minimized','mobilized',
  'modernized','monitored','motivated','navigated','negotiated','operated',
  'optimized','orchestrated','organized','outperformed','overhauled','oversaw',
  'partnered','performed','persuaded','pioneered','planned','prepared',
  'presented','prioritized','processed','produced','programmed','promoted',
  'proposed','provisioned','published','pursued','reconciled','recruited',
  'redesigned','reduced','refined','regulated','rehabilitated','remodeled',
  'reorganized','repaired','replaced','reported','represented','researched',
  'resolved','restructured','revamped','reviewed','revitalized','scheduled',
  'secured','simplified','solved','spearheaded','standardized','steered',
  'stimulated','strategized','streamlined','strengthened','supervised',
  'surpassed','sustained','synchronized','systematized','targeted','trained',
  'transformed','translated','troubleshot','unified','upgraded','utilized',
  'validated','visualized','volunteered','yielded',
];

// Pre-compute a Set of lower-cased action verbs for O(1) lookup
const ACTION_VERB_SET = new Set(ACTION_VERBS);

// ────────────────────────────────────────────────────────────
// Standard ATS-friendly section headings
// ────────────────────────────────────────────────────────────
const SECTION_PATTERNS = {
  contact: {
    patterns: [
      /^(contact\s*(info(rmation)?)?|personal\s*(info(rmation)?|details)?)$/i,
    ],
    // Also matched if email + phone found in first ~200 chars
    required: true,
    label: 'Contact Information',
  },
  summary: {
    patterns: [
      /^(professional\s*summary|summary|executive\s*summary|profile|objective|career\s*objective|about\s*me|overview)$/i,
    ],
    required: true,
    label: 'Professional Summary',
  },
  experience: {
    patterns: [
      /^(work\s*experience|experience|professional\s*experience|employment(\s*history)?|work\s*history|career\s*history)$/i,
    ],
    required: true,
    label: 'Work Experience',
  },
  education: {
    patterns: [
      /^(education|academic(\s*background)?|qualifications|academic\s*qualifications)$/i,
    ],
    required: true,
    label: 'Education',
  },
  skills: {
    patterns: [
      /^(skills|technical\s*skills|core\s*competencies|competencies|areas\s*of\s*expertise|proficiencies|key\s*skills)$/i,
    ],
    required: true,
    label: 'Skills',
  },
  certifications: {
    patterns: [
      /^(certifications?|licenses?(\s*(&|and)\s*certifications?)?|professional\s*certifications?|credentials?)$/i,
    ],
    required: false,
    label: 'Certifications',
  },
  projects: {
    patterns: [
      /^(projects|personal\s*projects|key\s*projects|notable\s*projects)$/i,
    ],
    required: false,
    label: 'Projects',
  },
  awards: {
    patterns: [
      /^(awards?(\s*(&|and)\s*honors?)?|honors?|achievements?|accomplishments?)$/i,
    ],
    required: false,
    label: 'Awards & Honors',
  },
};

// Non-standard headings that confuse ATS parsers
const CREATIVE_HEADING_FLAGS = [
  { pattern: /my\s*journey/i, suggestion: 'Work Experience' },
  { pattern: /what\s*i\s*do/i, suggestion: 'Skills' },
  { pattern: /who\s*i\s*am/i, suggestion: 'Professional Summary' },
  { pattern: /my\s*story/i, suggestion: 'Professional Summary' },
  { pattern: /toolbox/i, suggestion: 'Skills' },
  { pattern: /passion/i, suggestion: 'Professional Summary' },
  { pattern: /playground/i, suggestion: 'Projects' },
  { pattern: /superpowers/i, suggestion: 'Skills' },
  { pattern: /my\s*adventures?/i, suggestion: 'Work Experience' },
  { pattern: /things\s*i('ve|\s*have)\s*(built|made)/i, suggestion: 'Projects' },
];

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────

/**
 * Tokenise text into lowercase words, stripping punctuation.
 */
function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9#+.\-/]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1);
}

/**
 * Extract n-grams (1 to maxN) from a token list.
 */
function ngrams(tokens, maxN = 3) {
  const results = [];
  for (let n = 1; n <= maxN; n++) {
    for (let i = 0; i <= tokens.length - n; i++) {
      results.push(tokens.slice(i, i + n).join(' '));
    }
  }
  return results;
}

/**
 * Extract meaningful keywords from the job description.
 * Returns a deduplicated array of keyword strings (lower-cased).
 */
function extractKeywords(jobDescription) {
  const tokens = tokenize(jobDescription);

  // Single-word keywords: nouns, technical terms — exclude stop words & very short tokens
  const singleWords = tokens.filter(
    (t) => !STOP_WORDS.has(t) && t.length > 2
  );

  // Multi-word phrases (bigrams & trigrams) – keep those that look like skill phrases
  const allNgrams = ngrams(tokens, 3);
  const multiWord = allNgrams.filter((phrase) => {
    const parts = phrase.split(' ');
    // At least one non-stop word in the phrase
    return parts.length > 1 && parts.some((p) => !STOP_WORDS.has(p) && p.length > 2);
  });

  // Deduplicate via Set
  const keywordSet = new Set([...singleWords, ...multiWord]);

  // Remove multi-word phrases whose constituent single words are already standalone
  // but keep the phrase if it's a recognisable compound term (2+ non-stop words)
  const keywords = [...keywordSet].filter((kw) => {
    if (!kw.includes(' ')) return true; // single-word → keep
    const parts = kw.split(' ');
    const meaningfulParts = parts.filter((p) => !STOP_WORDS.has(p) && p.length > 2);
    return meaningfulParts.length >= 2;
  });

  return keywords;
}

/**
 * Check if a keyword (possibly multi-word) appears in text.
 * Uses word-boundary aware matching.
 */
function keywordInText(keyword, textLower) {
  // Escape regex special chars
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(?:^|\\W)${escaped}(?:\\W|$)`, 'i');
  return re.test(textLower);
}

// ────────────────────────────────────────────────────────────
// Individual scoring functions
// ────────────────────────────────────────────────────────────

function scoreKeywordMatch(resumeText, jobDescription) {
  const keywords = extractKeywords(jobDescription);
  if (keywords.length === 0) {
    return { score: 100, matched: [], missing: [], total: 0, details: 'No keywords extracted from job description.' };
  }

  const resumeLower = resumeText.toLowerCase();
  const matched = [];
  const missing = [];

  for (const kw of keywords) {
    if (keywordInText(kw, resumeLower)) {
      matched.push(kw);
    } else {
      missing.push(kw);
    }
  }

  const score = Math.round((matched.length / keywords.length) * 100);

  let details = `Matched ${matched.length} of ${keywords.length} keywords (${score}%).`;
  if (missing.length > 0) {
    const topMissing = missing.slice(0, 10);
    details += ` Top missing: ${topMissing.join(', ')}.`;
  }

  return { score, matched, missing, total: keywords.length, details };
}

function scoreSectionCompleteness(resumeText) {
  const lines = resumeText.split('\n').map((l) => l.trim());
  const found = [];
  const missing = [];
  const foundKeys = new Set();

  for (const line of lines) {
    // Section headings are typically standalone lines, possibly with colons
    const cleaned = line.replace(/:$/, '').trim();
    if (!cleaned || cleaned.split(/\s+/).length > 5) continue; // skip long lines

    for (const [key, section] of Object.entries(SECTION_PATTERNS)) {
      if (foundKeys.has(key)) continue;
      for (const pattern of section.patterns) {
        if (pattern.test(cleaned)) {
          found.push(section.label);
          foundKeys.add(key);
          break;
        }
      }
    }
  }

  // Check for implicit contact info (email + phone in first ~300 chars)
  if (!foundKeys.has('contact')) {
    const header = resumeText.slice(0, 300);
    const hasEmail = /[\w.-]+@[\w.-]+\.\w{2,}/.test(header);
    const hasPhone = /(\+?\d[\d\s\-().]{7,}\d)/.test(header);
    if (hasEmail && hasPhone) {
      found.push('Contact Information (implicit)');
      foundKeys.add('contact');
    }
  }

  // Determine missing required sections
  for (const [key, section] of Object.entries(SECTION_PATTERNS)) {
    if (section.required && !foundKeys.has(key)) {
      missing.push(section.label);
    }
  }

  const totalRequired = Object.values(SECTION_PATTERNS).filter((s) => s.required).length;
  const foundRequired = totalRequired - missing.length;

  // Bonus points for optional sections
  const optionalFound = found.filter((f) => {
    return Object.values(SECTION_PATTERNS)
      .filter((s) => !s.required)
      .some((s) => f.startsWith(s.label));
  }).length;

  const baseScore = (foundRequired / totalRequired) * 90;
  const bonusScore = Math.min(optionalFound * 5, 10);
  const score = Math.min(100, Math.round(baseScore + bonusScore));

  let details = `Found ${found.length} sections.`;
  if (missing.length > 0) {
    details += ` Missing required: ${missing.join(', ')}.`;
  }

  return { score, found, missing, details };
}

function scoreFormatting(resumeText) {
  const issues = [];
  let deductions = 0;

  // Check for excessive tab characters (possible tables)
  const tabLines = resumeText.split('\n').filter((l) => (l.match(/\t/g) || []).length >= 3);
  if (tabLines.length > 2) {
    issues.push('Possible tables detected (excessive tab characters) — most ATS cannot parse tables.');
    deductions += 20;
  }

  // Check for image references
  if (/\[image\]|\[logo\]|\[photo\]|\[picture\]/i.test(resumeText)) {
    issues.push('Image references detected — ATS systems cannot read images.');
    deductions += 10;
  }

  // Check for unusual Unicode characters
  // eslint-disable-next-line no-control-regex
  const unusualChars = resumeText.match(/[^\x00-\x7F\u2018\u2019\u201C\u201D\u2013\u2014\u2022\u00E9\u00E8\u00F1\u00FC\u00F6\u00E4]/g);
  if (unusualChars && unusualChars.length > 5) {
    issues.push(`${unusualChars.length} unusual/special characters detected that ATS may not parse correctly.`);
    deductions += 10;
  }

  // Check for consistent bullet usage
  const bulletTypes = new Set();
  const bulletPatterns = [
    { re: /^\s*[-]\s/m, type: 'dash' },
    { re: /^\s*[•]\s/m, type: 'bullet' },
    { re: /^\s*[*]\s/m, type: 'asterisk' },
    { re: /^\s*[►▪▸→‣]\s/m, type: 'fancy-symbol' },
    { re: /^\s*\d+[.)]\s/m, type: 'numbered' },
  ];
  for (const bp of bulletPatterns) {
    if (bp.re.test(resumeText)) bulletTypes.add(bp.type);
  }
  if (bulletTypes.has('fancy-symbol')) {
    issues.push('Fancy bullet symbols (►, ▪, etc.) may not parse correctly. Use simple dashes or bullets.');
    deductions += 10;
  }
  if (bulletTypes.size > 2) {
    issues.push('Inconsistent bullet point styles detected. Stick to one style throughout.');
    deductions += 5;
  }

  // Check for header/footer indicators (page numbers)
  if (/page\s*\d+\s*(of\s*\d+)?/i.test(resumeText)) {
    issues.push('Page numbers detected — can confuse ATS parsers.');
    deductions += 5;
  }

  // Check for all-caps overuse (beyond headings)
  const allCapsLines = resumeText.split('\n').filter((l) => {
    const trimmed = l.trim();
    return trimmed.length > 10 && trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed);
  });
  if (allCapsLines.length > 5) {
    issues.push('Excessive use of ALL CAPS. Use standard title case for readability.');
    deductions += 5;
  }

  const score = Math.max(0, 100 - deductions);
  const details = issues.length === 0
    ? 'No formatting issues detected. Clean, ATS-friendly format.'
    : `${issues.length} formatting issue(s) found.`;

  return { score, issues, details };
}

function scoreImpactMetrics(resumeText) {
  const words = tokenize(resumeText);
  const foundVerbs = new Set();

  for (const word of words) {
    if (ACTION_VERB_SET.has(word)) {
      foundVerbs.add(word);
    }
  }

  // Count quantified achievements: numbers, percentages, dollar/rupee amounts
  const metricPatterns = [
    /\d+%/g,                           // percentages
    /\$\s?\d[\d,.]*/g,                // dollar amounts
    /₹\s?\d[\d,.]*/g,                // rupee amounts
    /\d+\+?\s*(users?|clients?|customers?|employees?|members?|people|team\s*members?)/gi,
    /\d+\+?\s*(projects?|applications?|systems?|products?|features?)/gi,
    /\b\d{2,}[xX]\b/g,               // multipliers like 10x
    /\b(increased|decreased|reduced|grew|improved|boosted|saved|generated|delivered)\s+.*?\d+/gi,
    /\d[\d,.]*\s*(million|billion|thousand|mn|bn|cr|lakh|lakhs|crore|crores)/gi,
  ];

  let metricsCount = 0;
  for (const pattern of metricPatterns) {
    const matches = resumeText.match(pattern);
    if (matches) metricsCount += matches.length;
  }

  // Scoring: action verbs density + metrics
  const verbScore = Math.min(40, foundVerbs.size * 4); // up to 40 pts for 10+ unique verbs
  const metricScore = Math.min(40, metricsCount * 8);  // up to 40 pts for 5+ metrics
  const baseScore = verbScore + metricScore;

  // Bonus for having both
  const bonus = foundVerbs.size >= 5 && metricsCount >= 3 ? 20 : (foundVerbs.size >= 3 && metricsCount >= 1 ? 10 : 0);
  const score = Math.min(100, baseScore + bonus);

  let details = `Found ${foundVerbs.size} unique action verbs and ${metricsCount} quantified metrics.`;
  if (foundVerbs.size < 5) {
    details += ' Consider using more strong action verbs to begin your bullet points.';
  }
  if (metricsCount < 3) {
    details += ' Add more quantified achievements (numbers, percentages, dollar amounts).';
  }

  return {
    score,
    actionVerbs: [...foundVerbs],
    metrics: metricsCount,
    details,
  };
}

function scoreLengthDensity(resumeText) {
  const words = resumeText.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  let score;
  let details;

  if (wordCount < 100) {
    score = 10;
    details = `Only ${wordCount} words. Resume appears too short or may not have parsed correctly.`;
  } else if (wordCount < 200) {
    score = 35;
    details = `${wordCount} words — significantly below the recommended range. Aim for 400–800 words for early career, 600–1200 for experienced.`;
  } else if (wordCount < 400) {
    score = 60;
    details = `${wordCount} words — somewhat short. Consider adding more detail to your experience and skills sections.`;
  } else if (wordCount <= 800) {
    score = 100;
    details = `${wordCount} words — ideal length for most resumes.`;
  } else if (wordCount <= 1200) {
    score = 90;
    details = `${wordCount} words — good length for experienced professionals.`;
  } else if (wordCount <= 1500) {
    score = 70;
    details = `${wordCount} words — on the longer side. Consider tightening to focus on the most relevant experience.`;
  } else {
    score = 45;
    details = `${wordCount} words — too long. Most ATS and recruiters prefer concise resumes (1–2 pages). Trim less relevant content.`;
  }

  return { score, wordCount, details };
}

function scoreCompatibility(resumeText) {
  const issues = [];
  let deductions = 0;

  // 1. Check for non-standard / creative section headings
  const lines = resumeText.split('\n').map((l) => l.trim());
  for (const line of lines) {
    if (!line || line.split(/\s+/).length > 6) continue;
    for (const flag of CREATIVE_HEADING_FLAGS) {
      if (flag.pattern.test(line)) {
        issues.push(`Non-standard heading "${line}" — consider using "${flag.suggestion}" instead.`);
        deductions += 8;
        break;
      }
    }
  }

  // 2. Check for special characters that ATS struggle with
  const problematicChars = resumeText.match(/[|{}[\]<>\\~^`]/g);
  if (problematicChars && problematicChars.length > 3) {
    issues.push(`${problematicChars.length} special characters (|, {}, [], etc.) detected that may break ATS parsing.`);
    deductions += 10;
  }

  // 3. Check for consistent date formats
  const dateFormats = {
    'MM/YYYY': /\b\d{1,2}\/\d{4}\b/g,
    'Month YYYY': /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b/gi,
    'Mon YYYY': /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\.?\s+\d{4}\b/gi,
    'YYYY-MM': /\b\d{4}-\d{2}\b/g,
    'MM-YYYY': /\b\d{2}-\d{4}\b/g,
  };

  const foundFormats = [];
  for (const [name, re] of Object.entries(dateFormats)) {
    if (re.test(resumeText)) foundFormats.push(name);
  }
  if (foundFormats.length > 2) {
    issues.push(`Inconsistent date formats detected (${foundFormats.join(', ')}). Use one format throughout.`);
    deductions += 10;
  }

  // 4. Check that email is present in the first portion of the resume
  const header = resumeText.slice(0, 400);
  const hasEmail = /[\w.-]+@[\w.-]+\.\w{2,}/.test(header);
  const hasPhone = /(\+?\d[\d\s\-().]{7,}\d)/.test(header);

  if (!hasEmail) {
    issues.push('No email address found in the header. Place contact info at the top.');
    deductions += 15;
  }
  if (!hasPhone) {
    issues.push('No phone number found in the header. Include a phone number in your contact section.');
    deductions += 10;
  }

  // 5. Check for URLs / LinkedIn
  if (/linkedin\.com/i.test(header)) {
    // Good — no deduction
  } else if (/linkedin/i.test(resumeText)) {
    // Mentioned but not in header
    issues.push('LinkedIn URL mentioned but not in the header section. Move it to your contact info.');
    deductions += 3;
  }

  const score = Math.max(0, 100 - deductions);
  const details = issues.length === 0
    ? 'Excellent ATS compatibility. Standard headings, consistent formatting, contact info properly placed.'
    : `${issues.length} compatibility issue(s) found.`;

  return { score, issues, details };
}

// ────────────────────────────────────────────────────────────
// Generate top actionable suggestions
// ────────────────────────────────────────────────────────────
function generateSuggestions(breakdown) {
  const suggestions = [];

  // Keyword suggestions
  if (breakdown.keywordMatch.score < 60) {
    const topMissing = breakdown.keywordMatch.missing.slice(0, 5).join(', ');
    suggestions.push(`Add missing keywords from the job description: ${topMissing}`);
  } else if (breakdown.keywordMatch.score < 80) {
    suggestions.push('Incorporate more keywords from the job description naturally into your experience bullets.');
  }

  // Section suggestions
  if (breakdown.sectionCompleteness.missing.length > 0) {
    suggestions.push(`Add missing sections: ${breakdown.sectionCompleteness.missing.join(', ')}`);
  }

  // Formatting suggestions
  if (breakdown.formatting.issues.length > 0) {
    suggestions.push(breakdown.formatting.issues[0]); // top formatting issue
  }

  // Impact suggestions
  if (breakdown.impactMetrics.metrics < 3) {
    suggestions.push('Quantify your achievements — add numbers, percentages, and dollar amounts to demonstrate impact.');
  }
  if (breakdown.impactMetrics.actionVerbs.length < 5) {
    suggestions.push('Start more bullet points with strong action verbs (e.g., "Spearheaded", "Optimized", "Delivered").');
  }

  // Length suggestions
  if (breakdown.lengthDensity.wordCount < 300) {
    suggestions.push('Your resume is too short. Add more detail about your experience, projects, and skills.');
  } else if (breakdown.lengthDensity.wordCount > 1500) {
    suggestions.push('Your resume is too long. Trim older or less relevant experience to keep it to 1–2 pages.');
  }

  // Compatibility suggestions
  if (breakdown.compatibility.issues.length > 0) {
    for (const issue of breakdown.compatibility.issues.slice(0, 2)) {
      if (!suggestions.includes(issue)) suggestions.push(issue);
    }
  }

  // Return top 5
  return suggestions.slice(0, 5);
}

// ────────────────────────────────────────────────────────────
// Main analysis function
// ────────────────────────────────────────────────────────────

/**
 * Analyse a resume against a job description.
 * @param {string} resumeText  – plain-text resume content
 * @param {string} jobDescription – job posting text
 * @returns {object} full analysis result
 */
export function analyzeResume(resumeText, jobDescription) {
  if (!resumeText || typeof resumeText !== 'string') {
    throw new Error('Resume text is required for analysis.');
  }
  if (!jobDescription || typeof jobDescription !== 'string') {
    throw new Error('Job description is required for analysis.');
  }

  const breakdown = {
    keywordMatch: scoreKeywordMatch(resumeText, jobDescription),
    sectionCompleteness: scoreSectionCompleteness(resumeText),
    formatting: scoreFormatting(resumeText),
    impactMetrics: scoreImpactMetrics(resumeText),
    lengthDensity: scoreLengthDensity(resumeText),
    compatibility: scoreCompatibility(resumeText),
  };

  // Weighted overall score
  const overallScore = Math.round(
    Object.entries(ATS_CRITERIA).reduce((sum, [key, criteria]) => {
      return sum + (breakdown[key]?.score || 0) * criteria.weight;
    }, 0)
  );

  const suggestions = generateSuggestions(breakdown);

  return {
    overallScore,
    breakdown,
    suggestions,
    resumeText,
  };
}
