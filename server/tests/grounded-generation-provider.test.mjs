import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { generateRetrievedDraft } from '../src/services/groundedGenerationService.js';
const quote='Cells are the structural and functional units of living organisms.';
const chunks=[{document_id:'book',chunk_id:'passage',text:quote,page_number:3,version:'1',source_document:'anatomy.pdf'}];
test('provider requests preserve evidence, screen questions and cases, and reject fabricated citations', async()=>{
  let calls=0,bad=false,empty=false,screeningOverride=null,thinReadiness=false;
  const server=http.createServer(async(req,res)=>{
    let body='';for await(const piece of req)body+=piece;
    const payload=JSON.parse(body),data=JSON.parse(payload.messages[1].content);calls++;
    assert(payload.messages[0].content.includes('untrusted') || payload.messages[0].content.includes('data'));
    let result;
    if(data.task) result={preview_questions:Array.from({length:data.count},(_,i)=>({question:`What is the role of cell structure ${i}?`,options:['Cell','Tissue'],answer:'Cell',feedback:quote,type:'multiple_choice',difficulty:'intermediate',chunk_id:bad?'invented':'passage',evidence_quote:quote}))};
    else if(data.questions) result={checks:data.questions.map((_,index)=>({index,supported:true,scope_appropriate:true,numeric_consistent:true}))};
    else if(data.schema && empty) result={items:[]};
    else if(data.schema) result={items:[{title:'Cell scenario',summary:'Source-grounded scenario',question:'Explain the cell concept.',sections:[{heading:'Evidence',text:quote,chunk_id:'passage',evidence_quote:quote}],rubric:data.destination==='psychometric_readiness'?['Preparation','Response','Improvement plan'].slice(0,thinReadiness?1:3).map(criterion=>({criterion,expected:quote,points:1})):[{criterion:'Cell',expected:quote,points:1}],...(['psychometric_clinical','psychometric_situational'].includes(data.destination)?{options:['Cell','Tissue','Organ','System'],answer:'Cell',feedback:quote,option_rationales:['Cell','Tissue','Organ','System'].map(option=>({option,explanation:quote}))}:{}),cards:[{front:'Cell concept',back:quote,visual:{kind:'sequence',steps:['Structure','Function']}}]}]};
    else result=screeningOverride || {supported:true,scope_appropriate:true,numeric_consistent:true};
    res.setHeader('Content-Type','application/json');res.end(JSON.stringify({choices:[{message:{content:'```json\n'+JSON.stringify(result)+'\n```'}}]}));
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const previous={key:process.env.DEEPSEEK_API_KEY,url:process.env.DEEPSEEK_BASE_URL};
  process.env.DEEPSEEK_API_KEY='test-only';process.env.DEEPSEEK_BASE_URL=`http://127.0.0.1:${server.address().port}`;
  try{
    const options={chunks,program:'Nursing',topic:'Cells',difficulty:'intermediate',count:5,types:['multiple_choice']};
    const questions=await generateRetrievedDraft({...options,destination:'question_bank'});
    assert.equal(questions.preview_questions.length,5);assert.equal(questions.preview_questions[0].source_reference.page_number,3);
    const cases=await generateRetrievedDraft({...options,destination:'psychometric_clinical'});
    assert.equal(cases.preview_questions[0].options.length,4);assert.equal(cases.preview_questions[0].type,'multiple_choice');assert(cases.preview_questions[0].feedback.includes('System\n'));
    const situational=await generateRetrievedDraft({...options,destination:'psychometric_situational'});assert.equal(situational.preview_questions[0].answer,'Cell');
    const readiness=await generateRetrievedDraft({...options,destination:'psychometric_readiness'});assert.equal(readiness.preview_questions[0].rubric.length,3);
    assert.equal(calls,8);
    thinReadiness=true;await assert.rejects(()=>generateRetrievedDraft({...options,destination:'psychometric_readiness'}),/at least three/);thinReadiness=false;
    for(const destination of ['flashcards','study_guides','cheat_sheets','drug_reference','podcasts','kenya_cases']){
      const resource=await generateRetrievedDraft({...options,destination});
      assert.equal(resource.preview_questions[0].source_reference.chunk_id,'passage');
      if(destination==='flashcards')assert.equal(resource.preview_questions[0].cards[0].visual.steps.length,2);
    }
    for(const destination of ['clinical_protocols','skills_videos'])await assert.rejects(()=>generateRetrievedDraft({...options,destination}),/retired/);
    empty=true;const unsupported=await generateRetrievedDraft({...options,destination:'drug_reference'});assert.equal(unsupported.preview_questions.length,0);empty=false;
    for(const [check,label] of [['supported','Evidence support'],['scope_appropriate','Learner scope'],['numeric_consistent','Numerical consistency']]){
      screeningOverride={supported:true,scope_appropriate:true,numeric_consistent:true,[check]:false,reasons:[{check,reason:'Specific unsupported detail'}]};
      await assert.rejects(()=>generateRetrievedDraft({...options,destination:'cheat_sheets'}),error=>error.status===422 && error.message.includes(label) && error.message.includes('Specific unsupported detail') && error.message.includes('Nothing was published'));
    }
    screeningOverride={supported:true};await assert.rejects(()=>generateRetrievedDraft({...options,destination:'cheat_sheets'}),/incomplete result/);screeningOverride=null;
    bad=true;await assert.rejects(()=>generateRetrievedDraft({...options,destination:'question_bank'}),/source-evidence/);
  }finally{
    if(previous.key===undefined)delete process.env.DEEPSEEK_API_KEY;else process.env.DEEPSEEK_API_KEY=previous.key;
    if(previous.url===undefined)delete process.env.DEEPSEEK_BASE_URL;else process.env.DEEPSEEK_BASE_URL=previous.url;
    await new Promise(resolve=>server.close(resolve));
  }
});
