import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const origin = 'https://www.medprohub.co.ke';
const homeTitle = 'MedProHub | EMT & Paramedic Revision in Kenya';
const homeDescription = 'Build clinical confidence with MedProHub: EMT and paramedic exam practice, flashcards, and clinical cases in Kenya. Explore shared foundations for nursing study.';
export default function RouteMetadata() {
  const { pathname } = useLocation();
  useEffect(() => {
    const home = pathname === '/';
    const title = home ? homeTitle : `${pathname === '/login' ? 'Sign in' : pathname === '/register' ? 'Create your student account' : 'Learning portal'} | MedProHub`;
    document.title = title;
    const set = (selector, content) => document.querySelector(selector)?.setAttribute('content', content);
    set('meta[name="robots"]', home ? 'index, follow' : 'noindex, follow');
    set('meta[name="description"]', home ? homeDescription : 'Access your MedProHub learning account.');
    set('meta[property="og:title"]', title);
    set('meta[property="og:description"]', home ? homeDescription : 'Access your MedProHub learning account.');
    set('meta[property="og:url"]', origin + pathname);
    document.querySelector('link[rel="canonical"]')?.setAttribute('href', origin + pathname);
  }, [pathname]);
  return null;
}
