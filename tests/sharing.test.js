import test from 'node:test';
import assert from 'node:assert/strict';
import { filteredDraft, sharedLinks, validateTokenState } from '../src/utils/sharing.js';
test('shared snapshots omit provider data and require approval/contact opt-in',()=>{
  const draft={status:'approved',rawProviderResponse:'private',resume:{fullName:'Alice',professionalSummary:'SQL',contact:{email:'a@example.com',phone:'123',location:'Manila',privateNote:'secret'}}};
  const share=filteredDraft(draft);
  assert.equal(share.rawProviderResponse,undefined);
  assert.deepEqual(share.resume.contact,{email:'',phone:'',location:''});
  assert.equal(filteredDraft(draft,{showEmail:true}).resume.contact.email,'a@example.com');
  assert.equal(filteredDraft(draft,{includeSections:[]}).resume.professionalSummary,'');
  assert.throws(()=>filteredDraft({...draft,status:'draft'}));
});
test('links require opt-in and safe protocols',()=>{
  const sources=[{name:'portfolio',url:'https://example.com'},{url:'javascript:alert(1)'}];
  assert.deepEqual(sharedLinks(sources),[]);
  assert.equal(sharedLinks(sources,{showLinks:true}).length,1);
  assert.deepEqual(sharedLinks(sources,{showLinks:true,includeSections:[]}),[]);
});
test('token client validation rejects expired/revoked/legacy/exhausted/predictable state',()=>{
  const id='12345678-1234-4123-8123-123456789abc';
  const t={schemaVersion:2,token:id,sharedResourceId:id,active:true,status:'Active',expiresAt:{toMillis:()=>200},viewCount:0,maxViews:1};
  assert.equal(validateTokenState(t,100),true);
  for(const patch of [{schemaVersion:1},{token:'guessable'},{active:false},{status:'Revoked'},{viewCount:1},{maxViews:-1}]) assert.equal(validateTokenState({...t,...patch},100),false);
  assert.equal(validateTokenState(t,200),false);
});
