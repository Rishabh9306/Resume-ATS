'use client';

const features = [
  { icon: '🔍', title: 'Smart Keyword Analysis', desc: 'Instantly identifies missing keywords from the job description using intelligent n-gram matching.' },
  { icon: '📋', title: 'Section Detection', desc: 'Verifies your resume has all critical sections that ATS systems scan for — contact, experience, skills, and more.' },
  { icon: '✨', title: 'AI Rewrite Suggestions', desc: 'Get AI-powered rewrites for every bullet point with stronger action verbs and quantified metrics.' },
  { icon: '📊', title: 'Impact Score', desc: 'Measures the density of action verbs and quantified achievements that make recruiters notice you.' },
  { icon: '📄', title: 'Format Checker', desc: 'Flags formatting issues — tables, images, special characters — that trip up ATS parsers silently.' },
  { icon: '⚡', title: 'Instant Results', desc: 'Full 6-criterion analysis in under 30 seconds. Upload, paste JD, get your score.' },
];

export default function Features() {
  return (
    <section id="features" className="section-padding">
      <div className="container">
        <div className="section-heading">
          <h2>Everything You Need to <span className="gradient-text">Beat the ATS</span></h2>
          <p>Our 6-point analysis covers every factor that determines whether your resume makes it through.</p>
        </div>
        <div className="features__grid">
          {features.map((f, i) => (
            <div key={i} className="feature-card glass-card" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="feature-card__icon">{f.icon}</div>
              <h3 className="feature-card__title">{f.title}</h3>
              <p className="feature-card__desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
