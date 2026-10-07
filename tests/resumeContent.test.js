import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeResume, reviewCandidates } from '../src/utils/resumeContent.js';
import { portfolioAvailability, portfolioContactAvailability } from '../src/utils/portfolioSections.js';
import { buildPortfolioSuggestions, applyPortfolioSuggestions } from '../src/utils/portfolioSuggestions.js';
import { draftWithProfilePhoto } from '../src/utils/profilePhoto.js';
import { requestPortfolioSuggestions } from '../src/utils/requestPortfolioSuggestions.js';

test('portfolio recovers from Groq JSON validation errors with a valid second response', async () => {
  let calls=0;
  const result=await requestPortfolioSuggestions([],async()=>{
    if(++calls===1) throw Object.assign(new Error('Failed to generate JSON. Please adjust your prompt.'),{code:'json_validate_failed'});
    return {choices:[{message:{content:JSON.stringify({summary:'Create SQL reports.',projects:[],experience:[]})}}]};
  });
  assert.equal(calls,2);assert.equal(result.fallback,false);assert.equal(result.data.summary,'Create SQL reports.');
});

test('portfolio repeatedly invalid generated JSON uses labeled templates, while provider failures propagate', async () => {
  for(const response of [null,{choices:[{message:{content:'{"summary":12,"projects":[],"experience":[]}'}}]}]) {
    let calls=0;
    const result=await requestPortfolioSuggestions([],async()=>{calls++;return response;});
    assert.equal(calls,2);assert.equal(result.fallback,true);
  }
  await assert.rejects(requestPortfolioSuggestions([],async()=>{throw Object.assign(new Error('Invalid API key'),{status:401});}),/Invalid API key/);
});

test('existing drafts pick up the saved Cloudinary photo without changing approval decisions or mutating inputs', () => {
  const url='https://res.cloudinary.com/drowvkwku/image/upload/v1791386432/jys4p0oudyig4cumjnbx.jpg';
  const draft={status:'approved',resume:{imgUrl:'https://example.com/old.jpg',education:[]}};
  const updated=draftWithProfilePhoto(draft,{imgUrl:url});
  assert.equal(updated.resume.imgUrl,url);
  assert.equal(updated.status,'approved');
  assert.deepEqual(updated.resume.education,[]);
  assert.equal(draft.resume.imgUrl,'https://example.com/old.jpg');
  assert.equal(draftWithProfilePhoto(draft,{}),draft);
});

test('portfolio approvals apply only approved wording and preserve profile records', () => {
  const profile={summary:'I build SQL reports.',targetRole:'Data Analyst',skills:['SQL'],projects:[{projectTitle:'Reports',description:'I build SQL reports.'}],experience:[{companyName:'Team',jobTitle:'Analyst',description:'I test reports.'}],education:{college:[{schoolName:'College'}]}};
  const original=structuredClone(profile);
  const choices=buildPortfolioSuggestions(profile,{summary:'Expert with 10 years experience.',projects:[{index:0,description:'Led 50 engineers.'}]});
  assert.ok(choices.every(item=>item.status==='pending'));
  assert.ok(!choices.some(item=>item.value.includes('50') || item.value.includes('10 years')));
  choices[0].status='approved';choices[0].value='Owner confirmed introduction.';
  choices[1].status='declined';choices[1].value='Rejected wording.';
  const resume=applyPortfolioSuggestions(profile,choices);
  assert.equal(resume.professionalSummary,'Owner confirmed introduction.');
  assert.equal(resume.projects[0].description,profile.projects[0].description);
  assert.equal(resume.education[0].school,'College');
  assert.deepEqual(profile,original);
});

test('portfolio sharing options disable absent contacts and invalid source links', () => {
  assert.deepEqual(portfolioContactAvailability({}, [{url:''},{url:'javascript:alert(1)'}]), {showEmail:false,showPhone:false,showAddress:false,showLinks:false});
  assert.deepEqual(portfolioContactAvailability({email:'person@example.com',phone:'123',location:'Manila'},[{url:'https://example.com'}]), {showEmail:true,showPhone:true,showAddress:true,showLinks:true});
});

test('portfolio options require supplied facts and an approved resume', () => {
  const empty=portfolioAvailability({summary:'',skills:[{skillName:''}],education:{college:[{schoolName:''}]},projects:[{}],experience:[{}],certifications:[{}]});
  assert.ok(Object.values(empty).every(value=>!value));
  const available=portfolioAvailability({summary:'Build SQL reports.',skills:['SQL'],education:{college:[{schoolName:'College'}]},projects:[{projectTitle:'Reports'}],experience:[{companyName:'Team'}],certifications:[{name:'Certificate'}],email:'test@example.com'},{status:'approved'});
  assert.ok(Object.values(available).every(Boolean));
  assert.equal(portfolioAvailability({}, {status:'draft'})['Resume Download'],false);
});
test('strings and profile field names render as named skills and education',()=>{
  const resume=normalizeResume({technicalSkills:['SQL',{skillName:'Python',proficiencyLevel:'Beginner'}],education:[{degreeProgram:'ICT',schoolName:'Test College',yearGraduated:2025}]});
  assert.deepEqual(resume.technicalSkills.map(row=>row.name),['SQL','Python']);
  assert.deepEqual(resume.education,[{degree:'ICT',school:'Test College',year:'2025'}]);
  assert.equal(normalizeResume({education:['ICT diploma']}).education[0].degree,'ICT diploma');
});
test('normalization preserves explicit exclusions; only fresh drafts fill empty source sections',()=>{
  const profile={skills:['SQL'],education:{college:[{degreeProgram:'ICT',schoolName:'Test College'}]}};
  assert.deepEqual(normalizeResume({technicalSkills:[],education:[]},profile).technicalSkills,[]);
  assert.deepEqual(normalizeResume({technicalSkills:[],education:[]},profile).education,[]);
  assert.equal(normalizeResume({technicalSkills:[],education:[]},profile,{fillEmpty:true}).technicalSkills[0].name,'SQL');
  assert.equal(normalizeResume(undefined,profile).education[0].school,'Test College');
});
test('review offers omitted profile facts without duplicates or invented recommendations',()=>{
  const choices=reviewCandidates({technicalSkills:['SQL'],education:[]},{skills:[{skillName:'SQL',category:'Database'},{skillName:'Python'}],education:{college:[{schoolName:'Test College'}]}});
  assert.deepEqual(choices.technicalSkills.map(row=>row.item.name),['SQL','Python']);
  assert.equal(choices.technicalSkills[1].included,false);
  assert.equal(choices.education[0].included,false);
  assert.equal(reviewCandidates({},{}).technicalSkills.length,0);
});
