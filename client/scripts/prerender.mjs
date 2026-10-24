import { createServer } from 'vite';
import { readFile, writeFile } from 'node:fs/promises';
import { renderToString } from 'react-dom/server';
import React from 'react';
import { StaticRouter } from 'react-router-dom/server.js';

const origin = 'https://www.medprohub.co.ke';
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
try {
  const { default: Home } = await server.ssrLoadModule('/src/pages/Home.jsx');
  const markup = renderToString(React.createElement(StaticRouter, { location: '/' }, React.createElement(Home)));
  let html = await readFile('dist/index.html', 'utf8');
  // Vite's build has fingerprinted the imported hero image; use that URL in SSR HTML too.
  const { readdir } = await import('node:fs/promises');
  const hero = (await readdir('dist/assets')).find((name) => name.startsWith('hero-paramedics-'));
  if (!hero) throw new Error('Built hero image missing');
  html = html.replace('<div id="root"></div>', `<div id="root">${markup.replaceAll('/src/assets/hero-paramedics.png', `/assets/${hero}`)}</div>`);
  const structured = {
    '@context': 'https://schema.org', '@type': 'WebSite',
    name: 'MedProHub', url: origin + '/', inLanguage: 'en',
    description: 'EMT and paramedic revision resources, practice questions, flashcards, and clinical cases.'
  };
  html = html.replace('</head>', `<script type="application/ld+json">${JSON.stringify(structured)}</script>\n</head>`);
  await writeFile('dist/index.html', html);
  // Authentication routes get explicit noindex HTML without homepage content.
  for (const [route, title] of [['login', 'Sign in'], ['register', 'Create your student account']]) {
    const shell = html.replace(/<div id="root">[\s\S]*<\/div>\s*<\/body>/, '<div id="root"></div>\n</body>')
      .replace(/<title>.*?<\/title>/, `<title>${title} | MedProHub</title>`)
      .replace(/<meta name="robots" content="[^"]*"\s*\/>/, '<meta name="robots" content="noindex, follow" />')
      .replace(/<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${origin}/${route}" />`);
    await writeFile(`dist/${route}.html`, shell);
  }
  console.log('Pre-rendered home page and generated noindex authentication shells.');
} finally {
  await server.close();
}
