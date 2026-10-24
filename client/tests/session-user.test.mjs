import test from 'node:test';
import assert from 'node:assert/strict';
import { restoreSessionUser } from '../src/utils/sessionUser.js';
test('restoring a session removes the effect of a previously switched track',()=>{
 for(const program of ['EMT','Paramedic','Nursing']){
  const token='header.'+Buffer.from(JSON.stringify({role:'student',program})).toString('base64url')+'.signature';
  const restored=restoreSessionUser(JSON.stringify({role:'student',program:program==='EMT'?'Paramedic':'EMT'}),token);
  assert.equal(restored.program,program);
 }
 assert.equal(restoreSessionUser('invalid',''),null);
});
