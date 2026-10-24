import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';

const read = (name) => readFile(new URL(`../dist/${name}`, import.meta.url), 'utf8');
test('built homepage exposes content and canonical metadata without JavaScript', async () => {
  const html = await read('index.html');
  assert.match(html, /<h1>EMT &amp; paramedic revision/);
  assert.match(html, /NURSING FOUNDATIONS/);
  assert.match(html, /<link rel="canonical" href="https:\/\/www.medprohub.co.ke\/"/);
  assert.match(html, /<meta name="robots" content="index, follow"/);
  assert.equal((html.match(/<h1[ >]/g) || []).length, 1);
  assert.doesNotMatch(html, /\/src\/assets\//);
  const image = html.match(/src="(\/assets\/hero-paramedics-[^"]+)"/);
  assert.ok(image, 'pre-rendered hero uses a built asset');
  await access(new URL(`../dist${image[1]}`, import.meta.url));
  const schema = JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
  assert.equal(schema.url, 'https://www.medprohub.co.ke/');
});
test('authentication shells are noindex, mountable, and do not contain homepage body', async () => {
  for (const route of ['login', 'register']) {
    const html = await read(`${route}.html`);
    assert.match(html, /<meta name="robots" content="noindex, follow"/);
    assert.match(html, /<div id="root"><\/div>/);
    assert.match(html, /<script type="module"[^>]*src="\/assets\//);
    assert.match(html, new RegExp(`rel="canonical" href="https://www.medprohub.co.ke/${route}"`));
    assert.doesNotMatch(html, /<h1[ >]/);
  }
});
test('crawler files list the public homepage and exclude account URLs from sitemap', async () => {
  const robots = await read('robots.txt');
  assert.match(robots, /Sitemap: https:\/\/www.medprohub.co.ke\/sitemap.xml/);
  const sitemap = await read('sitemap.xml');
  assert.match(sitemap, /<loc>https:\/\/www.medprohub.co.ke\/<\/loc>/);
  assert.doesNotMatch(sitemap, /login|register|student|admin/);
});
