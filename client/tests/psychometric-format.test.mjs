import test from 'node:test';
import assert from 'node:assert/strict';
import {assessmentScenario,listResponse} from '../src/components/student/psychometricFormat.js';
test('assessment display removes only explicit generation commentary and preserves findings and constraints',()=>{
 const scenario='You are dispatched to an unresponsive adult found supine. No advanced airway equipment is immediately available.';
 assert.equal(assessmentScenario('A source-grounded clinical judgment item covering airway definitions.\n\n'+scenario),scenario);
 assert.equal(assessmentScenario('A source-grounded clinical judgment item covering airway definitions. '+scenario),scenario);
 assert.equal(assessmentScenario('This item assesses initial priorities.\nScenario: '+scenario),scenario);
 for(const text of [scenario,'A source-grounded clinical judgment item with an unresponsive patient. No equipment is available.','This item assesses a patient with a respiratory rate of 8/min.','This item tests priorities without advanced equipment.','Scenario: SpO2 89%; oxygen 2 L/min. Do not omit reassessment.'])assert.equal(assessmentScenario(text),text.replace(/^Scenario: /,''));
 assert.equal(assessmentScenario('A source-grounded clinical judgment item covering airway definitions.'),'');
});
test('list tools structure selected response lines without deleting text or changing clinical numbers',()=>{
 const response='Check airway\nMonitor SpO2 89%\nReview after 5 minutes';
 const result=listResponse(response,0,response.length);assert.equal(result.value,'• Check airway\n• Monitor SpO2 89%\n• Review after 5 minutes');
 const numbered=listResponse(response,13,25,true);assert.equal(numbered.value,'Check airway\n1. Monitor SpO2 89%\nReview after 5 minutes');
 assert.deepEqual(listResponse('',0,0),{value:'• ',start:0,end:2});
});
