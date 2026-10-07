import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { doc,setDoc } from 'firebase/firestore';
const origin='http://127.0.0.1:5173';
const email='improvements@example.com',password='LocalTest123!';
async function authenticate(method){return (await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:'+method+'?key=fake-key',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password,returnSecureToken:true})})).json();}
let identity=await authenticate('signUp');if(identity.error?.message==='EMAIL_EXISTS')identity=await authenticate('signInWithPassword');
assert.ok(identity.localId);
const env=await initializeTestEnvironment({projectId:'demo-cvforge',firestore:{host:'127.0.0.1',port:8089}});
const initial={uid:identity.localId,userId:identity.localId,fullName:'Improvement QA',email,phone:'+639123456789',location:'Manila',targetRole:'Data Analyst',summary:'I build SQL reports.',skills:[{skillName:'SQL',category:'Database',proficiencyLevel:'Beginner'}],education:{college:[{schoolName:'Test College',degreeProgram:'ICT',yearGraduated:'2025'}]},projects:[{projectTitle:'Reports',role:'Developer',startDate:'2025-01',description:'Built SQL reports.',projectLink:'https://example.com/reports'}],experience:[{companyName:'Team',jobTitle:'Intern',startDate:'2025-01',description:'Tested reports.',location:'Manila'}],certifications:[]};
initial.projects[0].endDate='2025-06';
initial.experience[0].endDate='2025-06';
await env.withSecurityRulesDisabled(context=>setDoc(doc(context.firestore(),'profiles',identity.localId),initial));
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const page=await browser.newPage();
const errors=[];page.on('pageerror',error=>errors.push(error.message));
const readProfile=()=>page.evaluate(async()=>{
  const {auth}=await import('/src/services/firebase.js');
  const {getProfile}=await import('/src/services/firestoreService.js');
  window.dispatchEvent(new Event('auth-user-changed'));
  return await getProfile(auth.currentUser.uid);
});
async function begin(){
  await page.getByRole('button',{name:'Generate Resume',exact:true}).click();
  await page.getByRole('dialog',{name:'Resume Improvement Questions'}).waitFor();
  assert.match(await page.getByRole('dialog').textContent(),/not automatically considered part of your qualifications/);
  await page.getByRole('button',{name:'Start questions',exact:true}).click();
}
async function review(save){
  const modal=page.getByRole('dialog');
  let count=0;
  while(await modal.getByRole('button',{name:'Approve',exact:true}).count()){
    assert.ok(count++<20);
    const heading=await modal.locator('h3').textContent();
    if(heading.includes('skill')){
      assert.match(await modal.textContent(),/Add these skills only if you actually have them/);
      const excel=await modal.getByText('Excel',{exact:true}).count();
      if(excel && save){
        await modal.getByRole('checkbox').check();
        assert.equal(await modal.getByLabel('Skill category').inputValue(),'Data Analytics');
        await modal.getByLabel('Skill category').fill('Data Analytics');
        await modal.getByLabel('Your proficiency level').selectOption('Beginner');
      }
      if(!excel) await modal.getByRole('checkbox').check();
      await modal.getByRole('button',{name:excel?'Approve':'Decline',exact:true}).click();
    } else {
      const type=heading.includes('summary')?'summary':heading.includes('project')?'project':'experience';
      if(type==='summary'){
        assert.match(await modal.textContent(),/Current professional summary/);
        assert.match(await modal.textContent(),/I build SQL reports\./);
        assert.match(await modal.textContent(),/Create SQL reports\./);
      }
      if(type==='experience' && !save){await modal.getByRole('checkbox').check();await modal.getByRole('button',{name:'Decline',exact:true}).click();continue;}
      await modal.getByRole('button',{name:'Edit',exact:true}).click();
      await modal.getByLabel('Suggested wording').fill(`Owner confirmed ${type} wording.`);
      if(save) await modal.getByRole('checkbox').check();
      await modal.getByRole('button',{name:'Approve',exact:true}).click();
    }
  }
}
try{
  await page.goto(origin+'/login');
  await page.evaluate(async({email,password})=>{const {loginWithEmail}=await import('/src/services/authservice.js');await loginWithEmail(email,password,false);},{email,password});
  await page.goto(origin+'/resume-builder');
  await page.getByRole('button',{name:'Generate Resume',exact:true}).waitFor();
  await begin();await review(false);
  assert.deepEqual((await readProfile()).skills,initial.skills);
  await page.getByRole('button',{name:'Generate Resume Draft',exact:true}).click();
  await page.getByRole('dialog',{name:'Review Resume'}).waitFor();
  await page.getByRole('dialog',{name:'Review Resume'}).getByRole('button',{name:'Cancel review',exact:true}).click();
  assert.equal((await readProfile()).summary,initial.summary);
  assert.deepEqual((await readProfile()).skills,initial.skills);
  assert.equal((await readProfile()).projects[0].description,initial.projects[0].description);
  assert.equal((await readProfile()).experience[0].description,initial.experience[0].description);
  assert.match(await page.textContent('main'),/Excel/);
  assert.ok(!(await page.textContent('main')).includes('Data Visualization'));
  assert.equal(await page.getByRole('button',{name:'Download Resume',exact:true}).isDisabled(),true);
  await begin();await review(true);
  await page.getByRole('button',{name:'Generate Resume Draft',exact:true}).click();
  await page.getByRole('heading',{name:'Add AI Suggestions to Profile?',exact:true}).waitFor();
  assert.equal((await readProfile()).skills.length,1);
  assert.equal((await readProfile()).summary,initial.summary);
  await page.getByRole('button',{name:'Cancel',exact:true}).click();
  assert.equal((await readProfile()).skills.length,1);
  await page.getByRole('button',{name:'Generate Resume Draft',exact:true}).click();
  await page.getByRole('button',{name:'Save to Profile',exact:true}).click();
  await page.getByRole('dialog',{name:'Review Resume'}).waitFor();
  const saved=await readProfile();
  assert.deepEqual(saved.skills.map(s=>s.skillName),['SQL','Excel']);
  assert.equal(saved.summary,'Owner confirmed summary wording.');
  assert.equal(saved.projects.length,1);assert.equal(saved.experience.length,1);
  assert.equal(saved.projects[0].description,'Owner confirmed project wording.');
  assert.equal(saved.projects[0].projectLink,initial.projects[0].projectLink);
  assert.equal(saved.experience[0].description,'Owner confirmed experience wording.');
  assert.equal(saved.experience[0].companyName,initial.experience[0].companyName);
  assert.ok(!saved.skills.some(s=>s.skillName==='Data Visualization'));
  assert.equal(await page.getByRole('button',{name:'Download Resume',exact:true}).isDisabled(),true);
  await page.getByRole('dialog',{name:'Review Resume'}).waitFor();
  while(await page.getByRole('button',{name:'Yes, include',exact:true}).count())await page.getByRole('button',{name:'Yes, include',exact:true}).click();
  await page.getByRole('button',{name:'Confirm approval',exact:true}).click();
  await page.waitForFunction(()=>[...document.querySelectorAll('button')].some(b=>b.textContent.trim()==='Download Resume' && !b.disabled));
  await page.reload();
  await page.waitForFunction(()=>[...document.querySelectorAll('button')].some(b=>b.textContent.trim()==='Download Resume' && !b.disabled));
  assert.equal((await readProfile()).skills.length,2);
  assert.deepEqual(errors,[]);
  console.log('PASS: one-at-a-time pre-generation suggestions, disclaimers, resume-only approvals, declined checkbox safety, editable wording, confirmation cancellation/no writes, atomic profile updates, preserved existing records, draft gate/final approval and reload.');
}finally{await browser.close();await env.cleanup();}
