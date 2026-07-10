import { Link } from 'react-router-dom';
import Footer from '../components/shared/Footer';

// Stand-in photo (Unsplash License — free for commercial use, no attribution
// required): paramedics beside an ambulance at night, grayscale-filtered in CSS
// to match the reference mockup's monochrome treatment.
// https://unsplash.com/photos/Ygyp2kXy2I0
const HERO_IMAGE =
  'https://images.unsplash.com/photo-1634025130850-1d24389e25c7?auto=format&fit=crop&w=1400&q=80';

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
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <header className="home-navbar">
        <div className="brand-block">
          <div className="brand-line1">
            <PulseIcon />
            <span>MedPro</span>
          </div>
          <div className="brand-line2">EMS LEARNING PLATFORM</div>
        </div>
        <div className="nav-actions">
          <Link to="/register" className="btn-solid">
            <CapIcon /> Get Started <ArrowIcon style={{ width: 14, height: 14 }} />
          </Link>
          <Link to="/login" className="btn-outline">
            <UserIcon /> Login
          </Link>
        </div>
      </header>

      <section className="split-hero">
        <div className="split-hero-text">
          <h1>
            Learn. Practice. <b>Save Lives.</b>
          </h1>
          <svg className="pulse-divider" viewBox="0 0 300 40" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
            <path
              d="M0 20 H110 L125 20 L135 4 L150 36 L162 20 L175 20 H300"
              fill="none"
              stroke="#ffffff"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.7"
            />
          </svg>
          <p className="split-hero-sub">
            Professional education and assessment for EMT and Paramedic students.
          </p>
          <div className="cta">
            <Link to="/register" className="btn-solid">
              <CapIcon /> Get Started <ArrowIcon style={{ width: 14, height: 14 }} />
            </Link>
            <Link to="/login" className="btn-outline">
              <UserIcon /> Login
            </Link>
          </div>
        </div>
        <div className="split-hero-image">
          <img src={HERO_IMAGE} alt="Paramedics beside an ambulance at night" loading="eager" />
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

      <div className="home-footer-line">MedPro &middot; Empowering EMS Professionals Through Education</div>

      <Footer />
    </div>
  );
}
