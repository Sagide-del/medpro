import {orderPracticeOptions} from '../src/services/psychometricPractice.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {validateGroundedArtifacts} from '../src/services/ragService.js';
import {gradePublishedResponse} from '../src/services/publishedGrading.js';
const quote='The documented priority is to recognize the finding before selecting the next action.';
const chunks=[{document_id:'resource',chunk_id:'p1',page_number:4,version:'1',source_document:'Reviewed resource',text:quote}];
const fixture=()=>({title:'Prioritization',summary:'Use the documented clinical finding.',question:'Which source-supported action takes priority?',options:['Recognize the finding','Select an action before assessment','Ignore the observation','Avoid reassessment'],answer:'Recognize the finding',feedback:quote,option_rationales:['Recognize the finding','Select an action before assessment','Ignore the observation','Avoid reassessment'].map(option=>({option,explanation:'Compare this option against the documented priority and sequence.'})),sections:[{heading:'Clinical reasoning',text:quote,chunk_id:'p1',evidence_quote:quote}]});
test('clinical and situational MCQs require four distinct choices, one matching key and a rationale for every choice',async()=>{
 for(const destination of ['psychometric_clinical','psychometric_situational']){
  const valid=validateGroundedArtifacts([fixture()],chunks,destination)[0];assert.equal(valid.type,'multiple_choice');assert.equal((await gradePublishedResponse(valid,'Recognize the finding')).score,100);assert.equal((await gradePublishedResponse(valid,'Avoid reassessment')).score,0);assert(valid.feedback.includes('Avoid reassessment\n'));
  for(const change of [item=>item.options[1]=item.options[0],item=>item.answer='Missing option',item=>item.option_rationales.pop(),item=>item.option_rationales[0].explanation='',item=>item.question='']){const invalid=fixture();change(invalid);assert.throws(()=>validateGroundedArtifacts([invalid],chunks,destination));}
 }
});

test('option order is stable for a student and varies across students without changing choices',()=>{const options=fixture().options;assert.deepEqual(orderPracticeOptions(options,'student-a','activity'),orderPracticeOptions(options,'student-a','activity'));const orders=new Set(Array.from({length:10},(_,i)=>JSON.stringify(orderPracticeOptions(options,String(i),'activity'))));assert(orders.size>1);assert.deepEqual([...orderPracticeOptions(options,'a','activity')].sort(),[...options].sort());});
