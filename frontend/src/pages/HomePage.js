import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import './HomePage.css';

const FEATURES = [
  { icon: '🎯', title: 'Structured learning path', desc: 'Progress from HTML to Backend in a fixed, skill-building sequence.' },
  { icon: '📝', title: 'Quiz-based evaluation', desc: 'Each phase ends with a 10-question assessment. Score ≥70% to advance.' },
  { icon: '🔓', title: 'Phase unlocking', desc: 'Earn each phase — no skipping ahead. Every step builds on the last.' },
  { icon: '📊', title: 'Progress tracking', desc: 'Visual dashboard shows your scores, phases completed, and best attempts.' },
];

const PHASES = [
  { id: 'html', name: 'HTML', color: '#E34F26', bg: '#FAECE7' },
  { id: 'css', name: 'CSS', color: '#185FA5', bg: '#E6F1FB' },
  { id: 'javascript', name: 'JavaScript', color: '#854F0B', bg: '#FAEEDA' },
  { id: 'dom', name: 'DOM', color: '#534AB7', bg: '#EEEDFE' },
  { id: 'react', name: 'React', color: '#0F6E56', bg: '#E1F5EE' },
  { id: 'backend', name: 'Backend', color: '#5F5E5A', bg: '#F1EFE8' },
];

const FAQS = [
  { q: 'What is PhaseTracker?', a: 'PhaseTracker is a structured web assessment platform that guides students from HTML through Backend development via quiz-based phase progression.' },
  { q: 'How does phase unlocking work?', a: 'Each phase has a 10-question quiz. Score at least 70% to pass and unlock the next phase. You can retry failed phases as many times as needed.' },
  { q: 'Can I skip phases?', a: 'No. The platform enforces sequential learning — you must complete and pass each phase before advancing.' },
  { q: 'Is my progress saved?', a: 'Yes! Your progress is stored in our database and syncs across sessions. Just log in to continue from where you left off.' },
  { q: 'What phases are covered?', a: 'HTML → CSS → JavaScript → DOM → React → Backend. More phases will be added in future updates.' },
];

export default function HomePage() {
  const [openFaq, setOpenFaq] = useState(null);
  const { user } = useAuth();

  return (
    <div className="home">
      <Navbar />

      <section className="hero">
        <div className="hero-inner">
          <div className="hero-badge">Smart learning path tracker</div>
          <h1>Track progress → Manage phases<br />→ Achieve growth</h1>
          <p>PhaseTracker guides students through a structured learning journey with quiz-based assessments and enforced phase progression — from HTML to Backend.</p>
          {!user && (
            <div className="hero-cta">
              <Link to="/register" className="btn btn-primary btn-lg">Start for free →</Link>
              <Link to="/login" className="btn btn-outline btn-lg">Login</Link>
            </div>
          )}
          <div className="hero-phases">
            {PHASES.map((p, i) => (
              <span key={p.id}>
                <span className="phase-pill" style={{ background: p.bg, color: p.color }}>{p.name}</span>
                {i < PHASES.length - 1 && <span className="phase-arrow">→</span>}
              </span>
            ))}
          </div>
        </div>
      </section>

      {!user && (
        <>
          <section className="features" id="features">
            <div className="section-label">Why PhaseTracker?</div>
            <h2>Everything you need to learn systematically</h2>
            <p className="section-sub">Structured, enforced, and trackable — learning the right way.</p>
            <div className="features-grid">
              {FEATURES.map(f => (
                <div key={f.title} className="feature-card">
                  <div className="feature-icon">{f.icon}</div>
                  <h3>{f.title}</h3>
                  <p>{f.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="faq-section" id="faq">
            <div className="section-label">FAQ</div>
            <h2>Frequently asked questions</h2>
            <p className="section-sub">Everything you need to know about PhaseTracker.</p>
            <div className="faq-list">
              {FAQS.map((f, i) => (
                <div key={i} className={`faq-item ${openFaq === i ? 'open' : ''}`}>
                  <button className="faq-q" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                    {f.q}
                    <span className="faq-icon">{openFaq === i ? '−' : '+'}</span>
                  </button>
                  {openFaq === i && <div className="faq-a">{f.a}</div>}
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <div className="nav-logo">
              <div className="nav-logo-icon" style={{ width: 28, height: 28, background: 'var(--green)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
              </div>
              <span style={{ fontSize: 16, fontWeight: 700, color: '#e0e8f0' }}>PhaseTracker</span>
              <span style={{ fontSize: 12, color: '#556677', margin: '0 4px' }}>by</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#D85A30', fontStyle: 'italic' }}>navgurukul</span>
            </div>
            <p>Empowering learning journeys through tracking, guidance and continuous growth.</p>
            <div className="footer-stats">
              <div><span>2K+</span><label>Students</label></div>
              <div><span>150+</span><label>Mentors</label></div>
              <div><span>6</span><label>Phases</label></div>
            </div>
          </div>
          <div className="footer-links">
            <div><h4>Platform</h4><a href="#features">Features</a><Link to="/register">Sign up</Link><Link to="/login">Login</Link></div>
            <div><h4>Resources</h4><a href="#faq">FAQ</a><a href="#features">How it works</a></div>
            <div><h4>Contact</h4><a href="mailto:support@phasetracker.in">support@phasetracker.in</a><a href="#">+91 00000 00000</a></div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2025 PhaseTracker. All rights reserved. Made with ❤️ by Team PhaseTracker</span>
          <div><a href="#">Privacy policy</a><a href="#">Terms</a></div>
        </div>
      </footer>
    </div>
  );
}
