import test from 'node:test';
import assert from 'node:assert/strict';
import {minorAmount,quantityMilli,previewTotal,amountInWords} from '../lib/business-desk/money';
import {attachmentPermit,verifyAttachmentPermit,attachmentType} from '../lib/business-desk/attachments';
test('business currency input uses exact minor units and refuses unsafe or ambiguous amounts',()=>{
 assert.equal(minorAmount('1234567.89'),123456789);assert.equal(minorAmount('0.01'),1);assert.equal(quantityMilli('2.375'),2375);
 for(const x of ['1e6','NaN','-1','1.234','1,000','01','100000000000.00'])assert.throws(()=>minorAmount(x));
 assert.equal(previewTotal([{quantity:'2.5',price:'100.00',discount:'10.00'},{quantity:'1',price:'50',discount:'0'}],'10','3','2',0),28500);
 assert.equal(amountInWords(1500000,'NGN'),'Fifteen thousand naira only');
 assert.equal(amountInWords(12345,'NGN'),'One hundred and twenty-three naira and forty-five kobo only');
});
test('private attachment permits bind one request, expiry and exact signature',()=>{
 const id='11111111-1111-4111-8111-111111111111',now=1794640000000;const token=attachmentPermit(id,'isolated-test-key',now);
 assert.equal(verifyAttachmentPermit(token,'isolated-test-key',now),id);
 assert.equal(verifyAttachmentPermit(token,'other-key',now),null);
 assert.equal(verifyAttachmentPermit(token+'x','isolated-test-key',now),null);
 assert.equal(verifyAttachmentPermit(token,'isolated-test-key',now+601000),null);
 assert.equal(attachmentType(Buffer.from('<html>fake</html>')),null);
 assert.equal(attachmentType(Buffer.from('%PDF-1.7 test')),'application/pdf');
});
