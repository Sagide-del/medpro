import test from 'node:test';
import assert from 'node:assert/strict';
import {validateGroundedArtifacts} from '../src/services/ragService.js';
const chunk={document_id:'book',chunk_id:'page-23',page_number:23,version:'1',source_document:'Manual.pdf',text:'The ﬁrst assessment uses a non\u00adbreaking\u00a0approach. The documented dose is 10 mg.'};
const artifact=quote=>[{title:'Assessment',summary:'Source summary',sections:[{heading:'Assessment',text:'Review the source-supported assessment.',chunk_id:chunk.chunk_id,evidence_quote:quote}]}];
test('resource citations tolerate PDF ligatures and soft hyphens, preserving exact evidence and numeric checks',()=>{
 const result=validateGroundedArtifacts(artifact('The first assessment uses a nonbreaking approach.'),[chunk],'cheat_sheets');assert.equal(result[0].source_reference.page_number,23);
 assert.throws(()=>validateGroundedArtifacts(artifact('The documented dose is 100 mg.'),[chunk],'cheat_sheets'),/section 1.*PDF page 23/);
 assert.throws(()=>validateGroundedArtifacts(artifact('An invented clinical statement not present in the source.'),[chunk],'cheat_sheets'),/does not match/);
 assert.throws(()=>validateGroundedArtifacts(artifact('The documented dose is 102 mg.'),[{...chunk,text:'The documented dose is 10² mg.'}],'cheat_sheets'),/does not match/);
 const bad=artifact('The documented dose is 10 mg.');bad[0].sections[0].chunk_id='unknown';assert.throws(()=>validateGroundedArtifacts(bad,[chunk],'cheat_sheets'),/chunk_id/);
 assert.throws(()=>validateGroundedArtifacts(artifact('Too short'),[chunk],'cheat_sheets'),/at least 20/);
});
