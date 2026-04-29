import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();
  const heroRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('.animate-in').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div style={{
      backgroundColor: '#0a0a0f',
      color: '#f0f0f5',
      minHeight: '100vh',
      fontFamily: "'DM Sans', -apple-system, sans-serif",
      overflowX: 'hidden'
    }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Serif+Display:ital@0;1&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .animate-in {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.7s ease, transform 0.7s ease;
        }
        .animate-in.visible {
          opacity: 1;
          transform: translateY(0);
        }
        .delay-1 { transition-delay: 0.1s; }
        .delay-2 { transition-delay: 0.2s; }
        .delay-3 { transition-delay: 0.3s; }
        .delay-4 { transition-delay: 0.4s; }

        .hero-headline {
          font-family: 'DM Serif Display', serif;
          font-size: clamp(40px, 6vw, 80px);
          line-height: 1.1;
          letter-spacing: -1px;
          color: #f0f0f5;
        }
        .hero-headline em {
          font-style: italic;
          color: #4A90E2;
        }

        .cta-primary {
          background: #4A90E2;
          color: white;
          border: none;
          padding: 16px 36px;
          border-radius: 50px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: 'DM Sans', sans-serif;
        }
        .cta-primary:hover {
          background: #357ABD;
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(74, 144, 226, 0.4);
        }

        .cta-secondary {
          background: transparent;
          color: #94a3b8;
          border: 1px solid #2a2a3a;
          padding: 16px 36px;
          border-radius: 50px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: 'DM Sans', sans-serif;
        }
        .cta-secondary:hover {
          border-color: #4A90E2;
          color: #4A90E2;
        }

        .feature-card {
          background: #111118;
          border: 1px solid #1e1e2e;
          border-radius: 16px;
          padding: 32px;
          transition: all 0.3s ease;
        }
        .feature-card:hover {
          border-color: #4A90E2;
          transform: translateY(-4px);
          box-shadow: 0 16px 48px rgba(74, 144, 226, 0.1);
        }

        .step-number {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #4A90E2, #357ABD);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 16px;
          flex-shrink: 0;
        }

        .nav-link {
          color: #94a3b8;
          text-decoration: none;
          font-size: 15px;
          transition: color 0.2s;
          cursor: pointer;
          background: none;
          border: none;
          font-family: 'DM Sans', sans-serif;
        }
        .nav-link:hover { color: #f0f0f5; }

        .score-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(74, 144, 226, 0.1);
          border: 1px solid rgba(74, 144, 226, 0.3);
          border-radius: 50px;
          padding: 6px 16px;
          font-size: 13px;
          color: #4A90E2;
          font-weight: 600;
        }

        .grid-3 {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }
        @media (max-width: 768px) {
          .grid-3 { grid-template-columns: 1fr; }
          .hide-mobile { display: none; }
        }

        .noise-bg {
          position: fixed;
          top: 0; left: 0;
          width: 100%; height: 100%;
          opacity: 0.03;
          pointer-events: none;
          z-index: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
        }

        .glow-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
        }
      `}</style>

      <div className="noise-bg" />

      {/* NAV */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '20px 40px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: 'rgba(10, 10, 15, 0.8)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '20px' }}>✨</span>
          <span style={{ fontFamily: 'DM Serif Display, serif', fontSize: '22px', color: '#f0f0f5' }}>Clarity</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <button className="nav-link hide-mobile" onClick={() => document.getElementById('how-it-works').scrollIntoView({ behavior: 'smooth' })}>
            How it works
          </button>
          <button className="nav-link hide-mobile" onClick={() => document.getElementById('use-cases').scrollIntoView({ behavior: 'smooth' })}>
            Use cases
          </button>
          <button className="cta-primary" style={{ padding: '10px 24px', fontSize: '14px' }} onClick={() => navigate('/login')}>
            Get started free
          </button>
        </div>
      </nav>
{/* HERO */}
<section style={{
  minHeight: '100vh',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: '120px 40px 80px',
  position: 'relative',
}}>
  <div className="glow-orb" style={{
    width: '600px', height: '600px',
    background: 'radial-gradient(circle, rgba(74,144,226,0.15) 0%, transparent 70%)',
    top: '50%', left: '50%',
    transform: 'translate(-50%, -50%)'
  }} />

  <div style={{
    maxWidth: '1100px',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '60px',
    position: 'relative',
    zIndex: 1,
    flexWrap: 'wrap'
  }}>

    {/* LEFT — Copy */}
    <div style={{ flex: '1', minWidth: '300px' }}>
      <div className="animate-in" style={{ marginBottom: '24px' }}>
        <span className="score-badge">
          <span>🎯</span>
          Role-specific alignment scoring
        </span>
      </div>

      <h1 className="hero-headline animate-in delay-1" style={{ marginBottom: '24px', textAlign: 'left' }}>
        Does your team know <em>exactly</em> what they need to do?
      </h1>

      <p className="animate-in delay-2" style={{
        fontSize: 'clamp(16px, 2vw, 20px)',
        color: '#94a3b8',
        lineHeight: '1.6',
        marginBottom: '40px',
        textAlign: 'left'
      }}>
        Clarity tests each team member's understanding of their specific role in achieving the goal. 
        Not just "do you get it" — but "do you know what YOU need to do to make this happen?"
      </p>

      <div className="animate-in delay-3" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        <button className="cta-primary" onClick={() => navigate('/login')}>
          Start for free →
        </button>
        <button className="cta-secondary" onClick={() => document.getElementById('how-it-works').scrollIntoView({ behavior: 'smooth' })}>
          See how it works
        </button>
      </div>

      <p className="animate-in delay-4" style={{ marginTop: '24px', color: '#475569', fontSize: '14px' }}>
        No credit card required • Free forever for small teams
      </p>
    </div>

    {/* RIGHT — Product Preview */}
    <div className="animate-in delay-2 hide-mobile" style={{ flex: '1', minWidth: '320px' }}>
      <div style={{
        background: '#111118',
        border: '1px solid #1e1e2e',
        borderRadius: '20px',
        padding: '24px',
        boxShadow: '0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(74,144,226,0.1)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Window chrome */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '20px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ff5f57' }} />
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#febc2e' }} />
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#28c840' }} />
        </div>

        {/* Mock alignment result */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '11px', color: '#475569', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Team Goal
          </div>
          <div style={{
            background: '#0d1117',
            borderRadius: '8px',
            padding: '12px',
            fontSize: '13px',
            color: '#94a3b8',
            borderLeft: '3px solid #4A90E2'
          }}>
            Launch the iOS vibe coding app by Q3
          </div>
        </div>

        {/* Score display */}
        <div style={{
          textAlign: 'center',
          padding: '20px',
          background: 'linear-gradient(135deg, rgba(74,144,226,0.1), rgba(53,122,189,0.05))',
          borderRadius: '12px',
          marginBottom: '16px',
          border: '1px solid rgba(74,144,226,0.2)'
        }}>
          <div style={{
            fontSize: '52px',
            fontWeight: '700',
            fontFamily: 'DM Serif Display, serif',
            color: '#4ade80',
            lineHeight: '1'
          }}>
            94%
          </div>
          <div style={{ color: '#4ade80', fontSize: '13px', marginTop: '4px', fontWeight: '600' }}>
            Clear
          </div>
          <div style={{ color: '#64748b', fontSize: '12px', marginTop: '8px' }}>
            "Sarah clearly understands her design deliverables and timeline. Her role is well defined."
          </div>
        </div>

        {/* Team members */}
        {[
          { name: 'Sarah Chen', role: 'Designer', score: 94, color: '#4ade80' },
          { name: 'Marcus Lee', role: 'Engineer', score: 87, color: '#4ade80' },
          { name: 'Jordan K.', role: 'PM', score: 62, color: '#facc15' },
        ].map((member, i) => (
          <div key={i} style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 0',
            borderBottom: i < 2 ? '1px solid #1e1e2e' : 'none'
          }}>
            <div>
              <div style={{ fontSize: '13px', color: '#f0f0f5', fontWeight: '500' }}>{member.name}</div>
              <div style={{ fontSize: '11px', color: '#475569' }}>{member.role}</div>
            </div>
            <div style={{
              fontSize: '14px',
              fontWeight: '700',
              color: member.color
            }}>
              {member.score}%
            </div>
          </div>
        ))}

        {/* Glow effect on card */}
        <div style={{
          position: 'absolute',
          top: '-50px', right: '-50px',
          width: '200px', height: '200px',
          background: 'radial-gradient(circle, rgba(74,144,226,0.08) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />
      </div>
    </div>

  </div>
</section>

      {/* SOCIAL PROOF BAR */}
      <section style={{
        padding: '40px',
        borderTop: '1px solid #1e1e2e',
        borderBottom: '1px solid #1e1e2e',
        display: 'flex',
        justifyContent: 'center',
        gap: '60px',
        flexWrap: 'wrap'
      }}>
        {[
          { number: '2 min', label: 'avg completion time' },
          { number: '0-100%', label: 'alignment score' },
          { number: 'AI', label: 'powered by Gemini' },
          { number: 'Free', label: 'to get started' }
        ].map((stat, i) => (
          <div key={i} className="animate-in" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: '700', color: '#4A90E2', fontFamily: 'DM Serif Display, serif' }}>
              {stat.number}
            </div>
            <div style={{ fontSize: '14px', color: '#475569', marginTop: '4px' }}>{stat.label}</div>
          </div>
        ))}
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" style={{ padding: '100px 40px', maxWidth: '1000px', margin: '0 auto' }}>
        <div className="animate-in" style={{ textAlign: 'center', marginBottom: '64px' }}>
          <p style={{ color: '#4A90E2', fontSize: '13px', fontWeight: '600', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '16px' }}>
            How it works
          </p>
          <h2 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 'clamp(32px, 4vw, 52px)', lineHeight: '1.2' }}>
            Three steps to team clarity
          </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {[
            {
              step: '01',
              title: 'Leader sets the mission',
              desc: 'Define your goal and context in plain language. No frameworks, no templates. Just the real objective your team needs to achieve.',
              icon: '🎯'
            },
            {
              step: '02',
              title: 'Team shares their understanding',
              desc: 'Members receive a link and describe what THEY specifically need to do to help achieve the goal — in their own words, based on their role. Takes 2 minutes.',
              icon: '💬'
            },
            {
              step: '03',
              title: 'AI reveals the alignment score',
              desc: 'Google Gemini AI compares each member\'s understanding to the leader\'s goal and returns a 0-100% alignment score with specific feedback.',
              icon: '📊'
            }
          ].map((item, i) => (
            <div key={i} className={`animate-in delay-${i + 1}`} style={{
              display: 'flex', gap: '24px', alignItems: 'flex-start',
              background: '#111118',
              border: '1px solid #1e1e2e',
              borderRadius: '16px',
              padding: '32px'
            }}>
              <div className="step-number">{item.step}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>{item.icon}</div>
                <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px', color: '#f0f0f5' }}>
                  {item.title}
                </h3>
                <p style={{ color: '#94a3b8', lineHeight: '1.6', fontSize: '15px' }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* USE CASES */}
      <section id="use-cases" style={{
        padding: '100px 40px',
        backgroundColor: '#050508',
        borderTop: '1px solid #1e1e2e'
      }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div className="animate-in" style={{ textAlign: 'center', marginBottom: '64px' }}>
            <p style={{ color: '#4A90E2', fontSize: '13px', fontWeight: '600', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '16px' }}>
              Use cases
            </p>
            <h2 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 'clamp(32px, 4vw, 52px)', lineHeight: '1.2' }}>
              Built for teams that move fast
            </h2>
          </div>

          <div className="grid-3">
            {[
              {
                icon: '🏗️',
                title: 'Construction & Field Teams',
                desc: 'Foreman records a voice note. Crew members speak their understanding. Clarity scores alignment before work begins. No typing required.'
              },
              {
                icon: '💼',
                title: 'Corporate Teams',
                desc: 'After a strategy meeting, check if everyone actually got the message. Catch misalignments before they become expensive mistakes.'
              },
              {
                icon: '🚀',
                title: 'Startup Teams',
                desc: 'Move fast without breaking alignment. Weekly clarity checks keep every team member locked in on what matters most right now.'
              },
             {
                icon: '🏛️',
                title: 'Government & Public Sector',
                desc: 'Built for organizations that need clear communication across teams. Supports Google, Microsoft, and email authentication to fit any organization\'s existing workflow.'
              },
              {
                icon: '🎓',
                title: 'Educational Teams',
                desc: 'Ensure students understand project goals before starting. Professors and team leads get instant visibility into comprehension gaps.'
              },
              {
                icon: '🌍',
                title: 'Remote Teams',
                desc: 'Async alignment across time zones. Team members complete checks on their schedule. Leaders see results in real time.'
              }
            ].map((card, i) => (
              <div key={i} className={`feature-card animate-in delay-${(i % 3) + 1}`}>
                <div style={{ fontSize: '32px', marginBottom: '16px' }}>{card.icon}</div>
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '10px', color: '#f0f0f5' }}>
                  {card.title}
                </h3>
                <p style={{ color: '#64748b', lineHeight: '1.6', fontSize: '14px' }}>{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{
        padding: '120px 40px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div className="glow-orb" style={{
          width: '500px', height: '500px',
          background: 'radial-gradient(circle, rgba(74,144,226,0.12) 0%, transparent 70%)',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)'
        }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '600px', margin: '0 auto' }}>
          <h2 className="animate-in" style={{
            fontFamily: 'DM Serif Display, serif',
            fontSize: 'clamp(36px, 5vw, 60px)',
            lineHeight: '1.2',
            marginBottom: '24px'
          }}>
            Stop assuming. Start confirming.
          </h2>
          <p className="animate-in delay-1" style={{
            color: '#94a3b8', fontSize: '18px', lineHeight: '1.6', marginBottom: '40px'
          }}>
            Every failed project has the same story — everyone understood the goal but nobody was clear on what they personally needed to do. Clarity closes that gap before work begins.
          </p>
          <button
            className="cta-primary animate-in delay-2"
            style={{ fontSize: '18px', padding: '18px 48px' }}
            onClick={() => navigate('/login')}
          >
            Try Clarity free →
          </button>
          <p className="animate-in delay-3" style={{ marginTop: '20px', color: '#475569', fontSize: '14px' }}>
            Free to start • No credit card • Takes 2 minutes
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{
        padding: '40px',
        borderTop: '1px solid #1e1e2e',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>✨</span>
          <span style={{ fontFamily: 'DM Serif Display, serif', color: '#f0f0f5' }}>Clarity</span>
          <span style={{ color: '#475569', fontSize: '14px', marginLeft: '8px' }}>
            © 2026 tryclarityapp.live
          </span>
        </div>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <a
            href="mailto:team@tryclarityapp.live"
            style={{ color: '#4A90E2', fontSize: '14px', textDecoration: 'none' }}
          >
            team@tryclarityapp.live
          </a>
          <button className="nav-link" onClick={() => navigate('/login')}>Sign in</button>
          <button className="nav-link" onClick={() => navigate('/login')}>Get started</button>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;