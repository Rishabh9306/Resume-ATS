// imports removed, will be dynamic

/**
 * Parse a resume buffer into plain text.
 * @param {Buffer} buffer  – raw file bytes
 * @param {string} fileType – MIME type (application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document, etc.)
 * @returns {{ text: string, wordCount: number, pageEstimate: number }}
 */
export async function parseResume(buffer, fileType) {
  let rawText = '';

  try {
    if (fileType === 'application/pdf') {
      const pdfModule = await import('pdf-parse');
      const pdf = pdfModule.default || pdfModule;
      const data = await pdf(buffer);
      rawText = data.text || '';
    } else if (
      fileType.includes('wordprocessingml') ||
      fileType.includes('docx') ||
      fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      const mammothModule = await import('mammoth');
      const mammoth = mammothModule.default || mammothModule;
      const result = await mammoth.extractRawText({ buffer });
      rawText = result.value || '';
    } else {
      throw new Error(`Unsupported file type: ${fileType}`);
    }
  } catch (err) {
    throw new Error(`Failed to parse resume: ${err.message}`);
  }

  // Normalise whitespace: collapse runs of spaces/tabs, normalise line endings
  const text = rawText
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const words = text.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  // Rough page estimate: ~450 words per page for a standard resume
  const pageEstimate = Math.max(1, Math.round(wordCount / 450));

  return { text, wordCount, pageEstimate };
}
