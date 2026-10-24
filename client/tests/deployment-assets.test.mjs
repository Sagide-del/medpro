import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';

test('all emitted page chunks and their dependencies exist in the build', async () => {
  const manifest = JSON.parse(await readFile(new URL('../dist/.vite/manifest.json', import.meta.url)));
  assert(Object.values(manifest).filter((entry) => entry.isDynamicEntry).length >= 60);
  for (const entry of Object.values(manifest)) {
    for (const file of [entry.file, ...(entry.css || []), ...(entry.assets || [])]) {
      await access(new URL(`../dist/${file}`, import.meta.url));
    }
    for (const dependency of [...(entry.imports || []), ...(entry.dynamicImports || [])]) {
      assert(manifest[dependency], `Missing manifest dependency: ${dependency}`);
    }
  }
});
test('the SPA fallback cannot return HTML for missing JavaScript assets', async () => {
  const config = JSON.parse(await readFile(new URL('../vercel.json', import.meta.url)));
  const fallback = config.rewrites.find((rewrite) => rewrite.destination === '/index.html');
  const pattern = new RegExp(`^${fallback.source}$`);
  assert.equal(pattern.test('/assets/Dashboard-old.js'), false);
  assert.equal(pattern.test('/student/dashboard'), true);
});
