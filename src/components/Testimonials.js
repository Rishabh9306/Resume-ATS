'use client';

const testimonials = [
  { name: 'Priya S.', role: 'Software Engineer', color: '#6c63ff', quote: 'My resume went from 34% to 91% ATS score. Got 3 interview calls within a week!' },
  { name: 'Rahul M.', role: 'Marketing Manager', color: '#00d4aa', quote: 'The AI suggestions completely transformed my bullet points. Worth every rupee.' },
  { name: 'Sneha K.', role: 'Data Analyst', color: '#ffa502', quote: 'I was applying to 50+ jobs with no response. After using ResumeATS Pro, I got 5 callbacks in 2 weeks.' },
  { name: 'Aditya P.', role: 'Fresh Graduate', color: '#1e90ff', quote: 'The free tier alone helped me understand why my resume wasn\'t working. The Pro plan is a game-changer.' },
];

export default function Testimonials() {
  return (
    <section id="testimonials" className="section-padding">
      <div className="container">
        <div className="section-heading">
          <h2>Trusted by Job Seekers <span className="gradient-text">Across India</span></h2>
          <p>Real results from real users who landed their dream jobs.</p>
        </div>
        <div className="testimonials__grid">
          {testimonials.map((t, i) => (
            <div key={i} className="testimonial-card glass-card" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="testimonial-card__stars">{'★'.repeat(5)}</div>
              <p className="testimonial-card__quote">{t.quote}</p>
              <div className="testimonial-card__author">
                <div className="testimonial-card__avatar" style={{ background: t.color }}>
                  {t.name[0]}
                </div>
                <div>
                  <div className="testimonial-card__name">{t.name}</div>
                  <div className="testimonial-card__title">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
