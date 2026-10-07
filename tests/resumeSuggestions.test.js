import test from 'node:test';
import assert from 'node:assert/strict';
import { buildResumeSuggestions, profileSuggestionPatch, resumeSuggestionProfile, includeApprovedSuggestions } from '../src/utils/resumeSuggestions.js';
const profile={fullName:'Alice',targetRole:'Frontend Developer',summary:'I build accessible pages.',skills:[{skillName:' JavaScript ',category:'Programming',proficiencyLevel:'Beginner'}],projects:[{projectTitle:'Portfolio',role:'Developer',description:'Built HTML pages.',startDate:'2025-01'}],experience:[{companyName:'Team',jobTitle:'Intern',description:'Tested pages.',startDate:'2025-01'}]};
const skill=(value,extras={})=>({id:value,type:'skill',value,status:'approved',addToProfile:false,...extras});
test('recommendations remain pending and unsupported personal claims are rejected',()=>{
  const candidates=buildResumeSuggestions(profile,{skills:[{name:'React',category:' Web Development ',proficiencyLevel:'Expert'},'react',' javascript '],summary:'Expert with 10 years experience',projects:[{index:0,description:'Led 40 engineers.'}]});
  assert.deepEqual(candidates.filter(s=>s.type==='skill').map(s=>s.value),['React']);
  assert.equal(candidates[0].category,'Web Development');
  assert.equal(candidates[0].proficiencyLevel,undefined);
  assert.ok(candidates.every(s=>s.status==='pending' && !s.addToProfile));
  assert.equal(candidates.find(s=>s.type==='summary').value,'Seeking opportunities as a Frontend Developer. Create accessible pages. Skills include JavaScript.');
  assert.equal(candidates.find(s=>s.type==='project').value,profile.projects[0].description);
  assert.deepEqual(profileSuggestionPatch(profile,candidates),{});
});
test('AI can improve summary wording without copying it or adding unsupported qualifications',()=>{
  const summary=buildResumeSuggestions(profile,{skills:[],summary:'Develop accessible pages.'}).find(s=>s.type==='summary');
  assert.equal(summary.value,'Develop accessible pages.');
  assert.equal(summary.originalSummary,profile.summary);
  assert.equal(summary.source,'ai-suggestion');
  assert.equal(summary.status,'pending');
  for(const unsupported of ['Expert developer creating accessible pages.','Develop accessible pages with React.','Develop 50 accessible pages.','Recent graduate developing accessible pages.']){
    assert.notEqual(buildResumeSuggestions(profile,{summary:unsupported}).find(s=>s.type==='summary').value,unsupported);
  }
});

test('unchanged AI summaries are replaced with a suggestion using only saved profile facts', () => {
  const input={...profile,summary:'Interested in building accessible websites.'};
  for (const response of [{summary:input.summary}, {}]) {
    const summary=buildResumeSuggestions(input,response).find(s=>s.type==='summary');
    assert.notEqual(summary.value,input.summary);
    assert.match(summary.value,/Frontend Developer/);
    assert.match(summary.value,/JavaScript/);
    assert.ok(!summary.value.includes('React'));
    assert.equal(summary.source,'wording-template');
    assert.equal(summary.status,'pending');
    assert.equal(summary.addToProfile,false);
  }
});
test('summary wording checks retain negation and can offer profile facts when summary is empty',()=>{
  const candidates=buildResumeSuggestions({...profile,summary:'I do not build accessible pages.'},{summary:'Build accessible pages.'});
  assert.notEqual(candidates.find(s=>s.type==='summary').value,'Build accessible pages.');
  const empty=buildResumeSuggestions({...profile,summary:''},{skills:['React']}).find(s=>s.type==='summary');
  assert.ok(empty.value.includes('Frontend Developer'));
  assert.ok(empty.value.includes('JavaScript'));
  assert.ok(!empty.value.includes('React'));
});
test('approval and persistence are separate; declined checkbox choices never reach either output',()=>{
  const choices=[skill('React'),skill('Git',{status:'declined',addToProfile:true,category:'Programming',proficiencyLevel:'Beginner'})];
  assert.deepEqual(profileSuggestionPatch(profile,choices),{});
  const memory=resumeSuggestionProfile(profile,choices);
  assert.ok(memory.skills.some(s=>s.skillName==='React'));
  assert.ok(!memory.skills.some(s=>s.skillName==='Git'));
  assert.ok(!profile.skills.some(s=>s.skillName==='React'));
  const output=includeApprovedSuggestions({technicalSkills:[]},memory,choices);
  assert.ok(output.technicalSkills.some(s=>s.name==='React'));
  assert.ok(!output.technicalSkills.some(s=>s.name==='Git'));
});
test('confirmed profile skills are trimmed, case-insensitive and do not invent a proficiency',()=>{
  const choice=skill('  React  ',{addToProfile:true,category:'Web Development',proficiencyLevel:'Beginner'});
  const patch=profileSuggestionPatch(profile,[skill('javascript',{addToProfile:true}),choice,{...choice,value:' REACT '}]);
  assert.equal(patch.skills.length,2);
  assert.equal(patch.skills[1].skillName,'React');
  assert.throws(()=>profileSuggestionPatch(profile,[skill('SQL',{addToProfile:true})]),/proficiency/);
});
test('summary and descriptions update only explicitly selected existing records',()=>{
  const choices=[{id:'s',type:'summary',value:'Owner approved summary.',status:'approved',addToProfile:false},{id:'p',type:'project',index:0,original:profile.projects[0],value:'Owner confirmed description.',status:'approved',addToProfile:true}];
  const patch=profileSuggestionPatch(profile,choices);
  assert.equal(patch.summary,undefined);
  assert.equal(patch.projects.length,1);
  assert.equal(patch.projects[0].projectTitle,'Portfolio');
  assert.equal(patch.projects[0].description,'Owner confirmed description.');
  choices[0].addToProfile=true;
  assert.equal(profileSuggestionPatch(profile,choices).summary,'Owner approved summary.');
  assert.throws(()=>profileSuggestionPatch({...profile,projects:[]},choices),/changed/);
  assert.throws(()=>profileSuggestionPatch({...profile,summary:'Changed in another tab'},choices,profile),/summary changed/);
});
