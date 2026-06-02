'use client';

import { useEffect, useState } from 'react';

export default function ScoreCard({ score = 0, size = 180, label = 'ATS Score' }) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const [mounted, setMounted] = useState(false);

  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  useEffect(() => {
    setMounted(true);
    // Animate score counting up
    let start = 0;
    const duration = 1500;
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * score);
      setAnimatedScore(current);
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [score]);

  const getScoreColorClass = (s) => {
    if (s < 40) return 'red';
    if (s <= 70) return 'orange';
    return 'green';
  };

  const colorClass = getScoreColorClass(score);
  const offset = circumference - (animatedScore / 100) * circumference;

  return (
    <div className="score-card">
      <div className="score-card__gauge" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
        >
          {/* Background circle */}
          <circle
            className="score-card__gauge-bg"
            cx={center}
            cy={center}
            r={radius}
          />
          {/* Foreground circle */}
          <circle
            className={`score-card__gauge-fill score-card__gauge-fill--${colorClass}`}
            cx={center}
            cy={center}
            r={radius}
            strokeDasharray={circumference}
            strokeDashoffset={mounted ? offset : circumference}
            transform={`rotate(-90 ${center} ${center})`}
          />
        </svg>
        <div className="score-card__value">
          <span className={`score-card__number score-card__number--${colorClass}`}>
            {animatedScore}
          </span>
          <span className="score-card__out-of">/ 100</span>
        </div>
      </div>
      <span className="score-card__label">{label}</span>
    </div>
  );
}
