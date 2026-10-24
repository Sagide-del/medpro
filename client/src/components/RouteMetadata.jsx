import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import { SITE_ORIGIN as origin, PUBLIC_PAGES } from '../data/publicSeo';
export default function RouteMetadata() {
  const { pathname } = useLocation();
  useEffect(() => {
    const page = PUBLIC_PAGES.find((entry) => entry.path === pathname);
    const home = Boolean(page);
    const title = home ? page.title : `${pathname === '/login' ? 'Sign in' : pathname === '/register' ? 'Create your student account' : 'Learning portal'} | MedProHub`;
    document.title = title;
    const set = (selector, content) => document.querySelector(selector)?.setAttribute('content', content);
    set('meta[name="robots"]', home ? 'index, follow' : 'noindex, follow');
    set('meta[name="description"]', home ? page.description : 'Access your MedProHub learning account.');
    set('meta[property="og:title"]', title);
    set('meta[property="og:description"]', home ? page.description : 'Access your MedProHub learning account.');
    set('meta[property="og:url"]', origin + pathname);
    document.querySelector('link[rel="canonical"]')?.setAttribute('href', origin + pathname);
  }, [pathname]);
  return null;
}
