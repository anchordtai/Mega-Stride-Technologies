import test from 'node:test';
import assert from 'node:assert/strict';
import {academyReturnPath,courseRegistrationPath} from '../lib/academy-navigation';
test('account continuation preserves selected public courses while rejecting external and private destinations',()=>{
  for(const path of ['/academy','/academy/dashboard','/academy/courses/cloud-computing','/academy/register?course=cloud-computing'])assert.equal(academyReturnPath(path),path);
  for(const path of ['https://evil.example','//evil.example','/\\evil.example','/admin','/super-admin','/academy/learn/private','/academy/register?course=x&next=https://evil.example','/academy/register?course=%2F%2Fevil.example',null,123])assert.equal(academyReturnPath(path),null);
  assert.equal(courseRegistrationPath('cloud-computing'),'/academy/register?course=cloud-computing');
});
