import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { generateRetrievedDraft } from '../src/services/groundedGenerationService.js';
const quote='Cells are the structural and functional units of living organisms.';
const chunks=[{document_id:'book',chunk_id:'passage',text:quote,page_number:3,version:'1',source_document:'anatomy.pdf'}];
test('provider requests preserve evidence, screen questions and cases, and reject fabricated citations', async()=>{
  let calls=0,bad=false;
  const server=http.createServer(async(req,res)=>{
    let body='';for await(const piece of req)body+=piece;
    const payload=JSON.parse(body),data=JSON.parse(payload.messages[1].content);calls++;
    assert(payload.messages[0].content.includes('untrusted') || payload.messages[0].content.includes('data'));
    let result;
    if(data.task) result={preview_questions:Array.from({length:data.count},(_,i)=>({question:`What is the role of cell structure ${i}?`,options:['Cell','Tissue'],answer:'Cell',feedback:quote,type:'multiple_choice',difficulty:'intermediate',chunk_id:bad?'invented':'passage',evidence_quote:quote}))};
    else if(data.questions) result={checks:data.questions.map((_,index)=>({index,supported:true,scope_appropriate:true,numeric_consistent:true}))};
    else if(data.schema) result={items:[{title:'Cell scenario',summary:'Source-grounded scenario',question:'Explain the cell concept.',sections:[{heading:'Evidence',text:quote,chunk_id:'passage',evidence_quote:quote}],rubric:[{criterion:'Cell',expected:quote,points:1}]}]};
    else result={supported:true,scope_appropriate:true,numeric_consistent:true};
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
    assert.equal(cases.preview_questions[0].rubric.length,1);
    assert.equal(calls,4);
    bad=true;await assert.rejects(()=>generateRetrievedDraft({...options,destination:'question_bank'}),/source-evidence/);
  }finally{
    if(previous.key===undefined)delete process.env.DEEPSEEK_API_KEY;else process.env.DEEPSEEK_API_KEY=previous.key;
    if(previous.url===undefined)delete process.env.DEEPSEEK_BASE_URL;else process.env.DEEPSEEK_BASE_URL=previous.url;
    await new Promise(resolve=>server.close(resolve));
  }
});
