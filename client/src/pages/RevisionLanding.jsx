import {GuideCards} from './RevisionGuides';
import { Link, useParams } from 'react-router-dom';
import Footer from '../components/shared/Footer';
import { REVISION_PAGES } from '../data/publicSeo';

export default function RevisionLanding({ page: suppliedPage }) {
  const { track } = useParams();
  const page = suppliedPage || REVISION_PAGES.find((item) => item.path === `/${track}`);
  if (!page) return null;
  const register = `/register?program=${encodeURIComponent(page.program)}`;
  return <div className="marketing-home revision-landing">
    <a className="public-skip-link" href="#main-content">Skip to content</a>
    <header className="home-navbar"><Link to="/" aria-label="MedProHub home"><img className="home-brand-logo" src="/medpro-logo.png" alt="MedProHub" /></Link><nav className="nav-actions" aria-label="Account"><Link to="/login" className="home-nav-link">Sign in</Link><Link to={register} className="btn-solid">Create account →</Link></nav></header>
    <main id="main-content">
      <section className="revision-hero"><nav aria-label="Breadcrumb"><Link to="/">Home</Link><span aria-hidden="true"> / </span><span>{page.program} revision</span></nav><p className="section-kicker">{page.program.toUpperCase()} REVISION · KENYA & BEYOND</p><h1>{page.heading}</h1><p>{page.intro}</p><Link to={register} className="btn-solid">Start {page.program} revision →</Link><p className="revision-access-note">Create an account to explore available content and subscription options.</p></section>
      <section className="home-section"><h2>What can you revise?</h2><ul className="revision-topics">{page.topics.map((topic) => <li key={topic}>{topic}</li>)}</ul><div className="program-cards">{page.sections.map(([heading, text]) => <article key={heading}><h3>{heading}</h3><p>{text}</p></article>)}</div></section>
      <section className="home-section"><h2>Free {page.program} study guide</h2><GuideCards program={page.program}/><Link className="guide-reading-link" to="/revision-guides">All revision guides →</Link></section>
      <section className="home-study-banner"><div><div className="section-kicker">MAKE TIME FOR YOUR NEXT STEP</div><h2>Build your {page.program.toLowerCase()} study routine.</h2><p>A supplementary revision platform for students. Not a qualification, accredited course, or guarantee of exam results.</p></div><Link to={register} className="btn-solid">Choose {page.program} →</Link></section>
      <nav className="home-section revision-links" aria-label="Explore revision tracks"><h2>Explore revision tracks</h2>{REVISION_PAGES.map((item) => <Link to={item.path} key={item.path}>{item.program} revision →</Link>)}</nav>
    </main><Footer />
  </div>;
}
