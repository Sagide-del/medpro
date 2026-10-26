import { createServer, loadEnv } from 'vite';
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { renderToString } from 'react-dom/server';
import React from 'react';
import { StaticRouter } from 'react-router-dom/server.js';
import { SITE_ORIGIN as origin, PUBLIC_PAGES, REVISION_PAGES,publicPageSchema } from '../src/data/publicSeo.js';

const escape = (value) => String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
try {
  const { default: Home } = await server.ssrLoadModule('/src/pages/Home.jsx');
  const { default: RevisionLanding } = await server.ssrLoadModule('/src/pages/RevisionLanding.jsx');
  const {default:RevisionGuides}=await server.ssrLoadModule('/src/pages/RevisionGuides.jsx');
  const template = await readFile('dist/index.html', 'utf8');
  const hero = (await readdir('dist/assets')).find((name) => name.startsWith('hero-paramedics-'));
  if (!hero) throw new Error('Built hero image missing');
  const verification = process.env.GOOGLE_SITE_VERIFICATION || loadEnv('production', process.cwd(), '').GOOGLE_SITE_VERIFICATION;
  if (verification && !/^[A-Za-z0-9_-]+$/.test(verification)) throw new Error('GOOGLE_SITE_VERIFICATION must contain only the Google verification token.');
  function metadata(page, indexable = true) {
    const description = escape(page.description);
    let html = template
      .replace(/<title>.*?<\/title>/, `<title>${escape(page.title)}</title>`)
      .replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${description}" />`)
      .replace(/<meta name="robots"[^>]*>/, `<meta name="robots" content="${indexable ? 'index' : 'noindex'}, follow" />`)
      .replace(/<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${origin}${page.path}" />`)
      .replace(/<meta property="og:title"[^>]*>/, `<meta property="og:title" content="${escape(page.title)}" />`)
      .replace(/<meta property="og:description"[^>]*>/, `<meta property="og:description" content="${description}" />`)
      .replace(/<meta property="og:url"[^>]*>/, `<meta property="og:url" content="${origin}${page.path}" />`);
    if (verification) html = html.replace('</head>', `<meta name="google-site-verification" content="${verification}" />\n</head>`);
    return html;
  }
  for (const page of PUBLIC_PAGES) {
    const element = page.path === '/' ? React.createElement(Home) : page.kind==='article'?React.createElement(RevisionGuides,{article:page}):page.kind==='guides'?React.createElement(RevisionGuides):React.createElement(RevisionLanding, { page });
    const markup = renderToString(React.createElement(StaticRouter, { location: page.path }, element))
      .replaceAll('/src/assets/hero-paramedics.png', `/assets/${hero}`);
    let html = metadata(page).replace('<div id="root"></div>', `<div id="root">${markup}</div>`);
    const schema=publicPageSchema(page);
    html = html.replace('</head>', `<script type="application/ld+json">${JSON.stringify(schema).replaceAll('<', '\\u003c')}</script>\n</head>`);
    await writeFile(`dist/${page.path === '/' ? 'index' : page.path.slice(1)}.html`, html);
  }
  for (const [route, title] of [['login', 'Sign in'], ['register', 'Create your student account']]) {
    await writeFile(`dist/${route}.html`, metadata({ path: `/${route}`, title: `${title} | MedProHub`, description: 'Access your MedProHub learning account.' }, false));
  }
  await writeFile('dist/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${PUBLIC_PAGES.map((page) => `  <url><loc>${origin}${page.path}</loc>${page.dateModified?`<lastmod>${page.dateModified}</lastmod>`:''}</url>`).join('\n')}\n</urlset>\n`);
  console.log(`Pre-rendered ${PUBLIC_PAGES.length} public pages, noindex account shells, and sitemap.`);
} finally {
  await server.close();
}
