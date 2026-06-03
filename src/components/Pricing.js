'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PLANS } from '@/lib/constants';

export default function Pricing() {
  const [annual, setAnnual] = useState(false);

  const getPrice = (price) => {
    if (price === 0) return 0;
    return annual ? Math.round(price * 0.6) : price;
  };

  const planEntries = Object.values(PLANS);

  return (
    <section id="pricing" className="section-padding">
      <div className="container">
        <div className="section-heading">
          <h2>Simple, Transparent <span className="gradient-text">Pricing</span></h2>
          <p>Start free. Upgrade when you&apos;re ready. Cancel anytime.</p>
        </div>

        <div className="pricing__toggle">
          <span className={!annual ? 'pricing__toggle-label--active' : 'pricing__toggle-label'}>Monthly</span>
          <button
            className={`pricing__toggle-switch ${annual ? 'pricing__toggle-switch--active' : ''}`}
            onClick={() => setAnnual(!annual)}
            aria-label="Toggle annual pricing"
          >
            <span className="pricing__toggle-knob" />
          </button>
          <span className={annual ? 'pricing__toggle-label--active' : 'pricing__toggle-label'}>
            Annual <span className="badge badge-success" style={{ marginLeft: '4px' }}>Save 40%</span>
          </span>
        </div>

        <div className="pricing__grid">
          {planEntries.map((plan) => (
            <div key={plan.id} className={`pricing-card glass-card ${plan.popular ? 'pricing-card--popular' : ''}`}>
              {plan.popular && <div className="pricing-card__badge">Most Popular</div>}
              <h3 className="pricing-card__name">{plan.name}</h3>
              <div className="pricing-card__price">
                {plan.price === 0 ? (
                  <span className="pricing-card__amount">Free</span>
                ) : (
                  <>
                    <span className="pricing-card__currency">₹</span>
                    <span className="pricing-card__amount">{getPrice(plan.price)}</span>
                    <span className="pricing-card__period">/mo</span>
                  </>
                )}
              </div>
              <ul className="pricing-card__features">
                {plan.features.map((f, i) => (
                  <li key={i} className="pricing-card__feature">
                    <span className="pricing-card__feature-check">✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link
                href={plan.price === 0 ? '/login' : '/login'}
                className={plan.popular ? 'btn-primary btn-lg' : 'btn-secondary btn-lg'}
                style={{ width: '100%', textAlign: 'center' }}
              >
                {plan.price === 0 ? 'Start Free' : plan.id === 'enterprise' ? 'Contact Sales' : plan.id === 'teams' ? 'Get Teams' : `Get ${plan.name}`}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
