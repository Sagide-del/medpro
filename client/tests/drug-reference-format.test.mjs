import test from 'node:test';
import assert from 'node:assert/strict';
import {clinicalHeading,clinicalText,clinicalBullets} from '../src/components/student/drugReferenceFormat.js';
test('drug display removes editorial framing while preserving clinical qualifications and numerical regimens',()=>{
 assert.equal(clinicalHeading('Source-listed Dosage and administration'),'Dose & administration');
 assert.equal(clinicalHeading('The source indications'),'Indications');
 assert.equal(clinicalHeading('The source-listed indications'),'Indications');
 assert.equal(clinicalText('The source lists the following indications: Example indication.'),'Indications: Example indication.');
 const text='Adult: 0.5 mg IV; only if the stated condition applies. Repeat after 5 minutes; maximum 1 mg.';
 const bullets=clinicalBullets(text);assert.equal(bullets.length,2);assert.equal(bullets.join(' '),text);
 assert.deepEqual(clinicalBullets('• Adult: 0.5 mg IV\n• Child: no dose specified'),['Adult: 0.5 mg IV','Child: no dose specified']);
 assert.equal(clinicalText('The source does not specify a paediatric dose.'),'The source does not specify a paediatric dose.');
 assert.equal(clinicalText('Do not administer if contraindicated.'),'Do not administer if contraindicated.');
 assert.equal(clinicalText('These doses are not source-listed for EMT.'),'These doses are not source-listed for EMT.');
 assert.equal(clinicalText('Do not use non-source-listed doses.'),'Do not use non-source-listed doses.');
 assert.equal(clinicalHeading('Adult dose and route'),'Adult dose and route');
});
