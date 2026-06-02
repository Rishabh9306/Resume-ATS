import fs from 'fs';
import { Document, Packer, Paragraph, TextRun } from 'docx';

async function createDummyDocx() {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            children: [
              new TextRun("John Doe\nSoftware Engineer\nEmail: john@example.com | Phone: 123-456-7890\n\nProfessional Summary\nExperienced Software Engineer with a passion for developing innovative programs that expedite the efficiency and effectiveness of organizational success. Well-versed in technology and writing code to create systems that are reliable and user-friendly.\n\nWork Experience\nFrontend Developer | TechCorp | 2020 - Present\n- Developed and maintained responsive web applications using React and Next.js.\n- Increased user engagement by 20% through optimized UI components.\n- Led a team of 4 junior developers in delivering 5 major projects on time.\n- Implemented robust testing strategies, achieving 95% code coverage.\n\nSkills\nJavaScript, React, Next.js, Node.js, CSS, HTML, Firebase, Git"),
            ],
          }),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync('test-resume.docx', buffer);
}

async function runTest() {
  try {
    console.log('1. Creating test DOCX...');
    await createDummyDocx();
    console.log('Test DOCX created successfully.');

    console.log('2. Sending POST to /api/analyze...');
    const docxBuffer = fs.readFileSync('test-resume.docx');
    const blob = new Blob([docxBuffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    const formData = new FormData();
    formData.append('resumeFile', blob, 'test-resume.docx');
    formData.append('jobDescription', `
We are looking for a Senior Frontend Developer.
Requirements:
- Strong experience with JavaScript, React, and Next.js.
- Ability to lead a team and mentor junior developers.
- Focus on performance, responsive design, and testing.
- Experience with Firebase is a plus.
    `);
    formData.append('jobTitle', 'Frontend Developer');

    const response = await globalThis.fetch('http://localhost:3000/api/analyze', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('✅ /api/analyze test PASSED!');
      console.log('Overall Score:', data.overallScore);
      console.log('Word Count:', data.wordCount);
      console.log('Top Suggestion:', data.suggestions[0]);
    } else {
      console.error('❌ /api/analyze test FAILED!');
      console.error('Status:', response.status);
      console.error('Response:', data);
    }
  } catch (err) {
    console.error('Test execution error:', err);
  } finally {
    if (fs.existsSync('test-resume.docx')) {
      fs.unlinkSync('test-resume.docx');
    }
  }
}

runTest();
