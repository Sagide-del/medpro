import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';

const read = (name) => readFile(new URL(`../dist/${name}`, import.meta.url), 'utf8');
test('built homepage exposes content and canonical metadata without JavaScript', async () => {
  const html = await read('index.html');
  assert.match(html, /<h1>EMT, paramedic &amp; nursing revision/);
  assert.match(html, /03 \/ NURSING/);
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

test('all revision landing pages have unique crawlable content and sitemap entries', async () => {
  const sitemap = await read('sitemap.xml');
  const titles = new Set();
  for (const track of ['emt', 'paramedic', 'nursing']) {
    const html = await read(`${track}-revision.html`);
    const title = html.match(/<title>(.*?)<\/title>/)[1];
    assert(!titles.has(title)); titles.add(title);
    assert.equal((html.match(/<h1[ >]/g) || []).length, 1);
    assert.match(html, /<meta name="robots" content="index, follow"/);
    assert(html.includes(`href="https://www.medprohub.co.ke/${track}-revision"`));
    assert(sitemap.includes(`<loc>https://www.medprohub.co.ke/${track}-revision</loc>`));
    assert.match(html, /register\?program=/);
  }
  assert.match(await read('nursing-revision.html'), /eight original practice questions/);
});

test('revision articles and hub are crawlable, internally linked and described accurately',async()=>{
 const {REVISION_ARTICLES,ARTICLE_HUB}=await import('../src/data/revisionArticles.js');
 const sitemap=await read('sitemap.xml'),home=await read('index.html'),rewrites=JSON.parse(await readFile(new URL('../vercel.json',import.meta.url),'utf8')).rewrites;
 const titles=new Set();
 for(const page of [ARTICLE_HUB,...REVISION_ARTICLES]){
  const html=await read(page.path.slice(1)+'.html');
  assert.match(html,/<meta name="robots" content="index, follow"/);assert.equal((html.match(/<h1[ >]/g)||[]).length,1);
  assert(html.includes(`href="https://www.medprohub.co.ke${page.path}"`));assert(sitemap.includes(`<loc>https://www.medprohub.co.ke${page.path}</loc>`));
  assert(rewrites.some(item=>item.source===page.path&&item.destination===page.path+'.html'));
  const title=html.match(/<title>(.*?)<\/title>/)[1];assert(!titles.has(title));titles.add(title);
  const schema=JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
  if(page.kind==='article'){
   assert.equal(schema['@type'],'Article');assert.equal(schema.datePublished,'2026-10-26');assert.equal(schema.author.name,'MedProHub');
   for(const section of page.sections)assert(html.includes(section.heading));
   assert.equal(page.questions.length,3);for(const question of page.questions)assert(html.includes(question.answer.replaceAll('&','&amp;')));
   assert(html.includes(`register?program=${page.program}`));assert(home.includes(`href="${page.path}"`));
   assert((await read(page.trackPath.slice(1)+'.html')).includes(`href="${page.path}"`));
  }else assert.equal(schema['@type'],'CollectionPage');
 }
});
