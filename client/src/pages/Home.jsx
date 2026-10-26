import {GuideCards} from './RevisionGuides';
import { Link } from 'react-router-dom';
import Footer from '../components/shared/Footer';

import heroImage from '../assets/hero-paramedics.png';

function PulseIcon(props) {
  return (
    <svg viewBox="0 0 32 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M0 12H9L11.5 4L15.5 20L18.5 12H32" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function CapIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M12 3L2 8L12 13L22 8L12 3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M6 10.5V16C6 16 8.5 18.5 12 18.5C15.5 18.5 18 16 18 16V10.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M22 8V14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function ArrowIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M5 12H19M19 12L13 6M19 12L13 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function UserIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <circle cx="12" cy="8" r="3.6" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4.5 20C5.5 16 8.4 14.2 12 14.2C15.6 14.2 18.5 16 19.5 20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function BookIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M4 5.5C4 4.7 4.7 4 5.5 4H11V19.5H5.5C4.7 19.5 4 18.8 4 18V5.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M20 5.5C20 4.7 19.3 4 18.5 4H13V19.5H18.5C19.3 19.5 20 18.8 20 18V5.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}
function ClipboardIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect x="5" y="4.5" width="14" height="17" rx="1.6" stroke="currentColor" strokeWidth="1.6" />
      <path d="M9 4.5C9 3.7 9.7 3 10.5 3H13.5C14.3 3 15 3.7 15 4.5V5.5H9V4.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M8.5 13L10.7 15.2L15.5 10.3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function TrendIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M4 19V13M9.5 19V9M15 19V14.5M20 19V6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M4 9L9.5 4L15 8L20 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15.5 3H20V7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ShieldIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M12 3L19 5.5V11C19 15.5 16 18.7 12 21C8 18.7 5 15.5 5 11V5.5L12 3Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M8.7 12L10.8 14.1L15.3 9.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const FEATURES = [
  { icon: BookIcon, title: 'Structured Learning', desc: 'Well-organized courses and modules.' },
  { icon: ClipboardIcon, title: 'Assess Knowledge', desc: 'Quizzes, exams, and skill assessments.' },
  { icon: TrendIcon, title: 'Track Progress', desc: 'Monitor performance and achievements.' },
  { icon: ShieldIcon, title: 'Learn Anywhere', desc: 'Access anytime, on any device.' },
];

export default function Home() {
  return (
    <div className="marketing-home" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <a className="public-skip-link" href="#main-content">Skip to content</a>
      <header className="home-navbar">
        <Link to="/" className="public-brand" aria-label="MedPro home">
          <img className="home-brand-logo" src="/medpro-logo.png" alt="MedPro" />
        </Link>
        <div className="nav-actions">
          <Link to="/login" className="home-nav-link">
            Sign in
          </Link>
          <Link to="/register" className="btn-solid">
            Create account <ArrowIcon style={{ width: 14, height: 14 }} />
          </Link>
        </div>
      </header>

      <main id="main-content">
      <section className="split-hero">
        <div className="split-hero-text">
          <div className="home-eyebrow">FOR THE NEXT GENERATION OF CLINICIANS</div>
          <h1>EMT, paramedic &amp; nursing revision.<br /><b>Ready for what’s next.</b></h1>
          <p className="split-hero-sub">
            Turn study time into clinical confidence. Practise exam questions, work through patient scenarios, and revisit the topics that matter — wherever you are in your training.
          </p>
          <div className="cta">
            <Link to="/register" className="btn-solid">
              <CapIcon /> Create your student account <ArrowIcon style={{ width: 14, height: 14 }} />
            </Link>
            <Link to="/login" className="btn-outline">
              <UserIcon /> Sign in
            </Link>
          </div>
        </div>
        <div className="split-hero-image">
          <img src={heroImage} alt="Emergency medical professionals preparing for patient care" loading="eager" fetchpriority="high" />
        </div>
      </section>

      <section className="feature-strip">
        {FEATURES.map((f) => {
          const Icon = f.icon;
          return (
            <div className="feature-item" key={f.title}>
              <Icon className="feature-icon" />
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          );
        })}
      </section>

      <section className="home-section" aria-labelledby="program-heading">
        <div className="section-kicker">FIND YOUR FOCUS</div>
        <h2 id="program-heading">Clinical learning, with a clear direction.</h2>
        <p className="section-lead">Study support for learners in Kenya and beyond. Choose a study track or explore the clinical foundations shared across healthcare.</p>
        <div className="program-cards">
          <article><span className="program-number">01 / EMT</span><h3>Build your emergency care foundation</h3><p>Revise EMT topics including patient assessment, airway management, trauma, and emergency care with questions and case-based practice.</p><Link to="/emt-revision">Explore EMT revision →</Link></article>
          <article><span className="program-number">02 / PARAMEDIC</span><h3>Think through the next clinical decision</h3><p>Support your paramedic studies with clinical scenarios, exam practice, flashcards, and structured revision resources.</p><Link to="/paramedic-revision">Explore paramedic study →</Link></article>
          <article><span className="program-number">03 / NURSING</span><h3>Connect the fundamentals of patient care</h3><p>Begin nursing revision with a starter bank covering patient assessment, infection prevention, communication, and medication safety. Eight questions across four fundamentals modules.</p><Link to="/nursing-revision">Explore nursing revision →</Link></article>
        </div>
      </section>
      <section className="home-study-banner"><div><div className="section-kicker">A SMALL HABIT. A STRONGER FOUNDATION.</div><h2>Practise. Reflect. Keep moving forward.</h2><p>Use practice questions to identify gaps, revisit a topic with flashcards, then apply what you’ve learned to a clinical case.</p></div><Link to="/register" className="btn-solid">Build your study routine →</Link></section>
      <section className="home-section home-faq" id="study-faq" aria-labelledby="faq-heading"><div className="section-kicker">BEFORE YOU GET STARTED</div><h2 id="faq-heading">Your study questions, answered.</h2>
        <details><summary>What can I use for EMT and paramedic exam preparation?</summary><p>MedProHub brings together practice questions, clinical cases, flashcards, and revision resources to supplement your EMT or paramedic training. Available content depends on your account and subscription.</p></details>
        <details><summary>Can nursing students use MedProHub?</summary><p>Nursing students can register and select their own revision track. Choose the Nursing track for a starter bank of eight fundamentals questions across four modules. It is not a complete nursing curriculum or nursing licensing exam course.</p></details>
        <details><summary>Is MedProHub a qualification or an accredited training college?</summary><p>MedProHub is a supplementary study platform. It does not replace accredited training, clinical supervision, or professional certification.</p></details>
        <details><summary>How do I get started?</summary><p>Create a student account, choose the EMT, Paramedic, or Nursing track, and sign in to explore the learning platform. Check the subscription page for current access and pricing.</p></details>
      </section>
      <section className="home-section" aria-labelledby="revision-guides-heading"><div className="section-kicker">FREE STUDY GUIDES</div><h2 id="revision-guides-heading">Read, revise and check your understanding.</h2><GuideCards/><Link className="guide-reading-link" to="/revision-guides">Browse revision guides →</Link></section>
      </main>
      <div className="home-footer-line">MedProHub · Keep learning. Be ready.</div>

      <Footer />
    </div>
  );
}
