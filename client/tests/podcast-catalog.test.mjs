import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
test('eight EMT episodes ship with real MP3 files, measured durations and matching console catalog',async()=>{
 const catalog=JSON.parse(await readFile(new URL('../src/data/emtPodcasts.json',import.meta.url),'utf8'));
 const backend=JSON.parse(await readFile(new URL('../../server/src/data/emtPodcasts.json',import.meta.url),'utf8'));assert.deepEqual(catalog,backend);assert.equal(catalog.length,8);assert.equal(new Set(catalog.map(item=>item.id)).size,8);
 for(const episode of catalog){assert.equal(episode.program,'EMT');assert.equal(episode.voice,'en-KE-AsiliaNeural');assert(episode.duration_seconds>30);assert(episode.transcript.length>100);assert(!episode.transcript.includes('[COLD OPEN]'));assert((await stat(new URL('../public'+episode.media_url,import.meta.url))).size>10000);}
});
