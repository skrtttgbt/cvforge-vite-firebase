import assert from "node:assert/strict";
import { chromium } from "playwright";
import { initializeTestEnvironment } from "@firebase/rules-unit-testing";
import { doc, setDoc } from "firebase/firestore";
const projectId = "demo-cvforge";
const signup = await fetch(
  "http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-key",
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "qa@example.com",
      password: "LocalTest123!",
      returnSecureToken: true,
    }),
  },
);
let identity = await signup.json();
if (identity.error?.message === "EMAIL_EXISTS")
  identity = await (
    await fetch(
      "http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=fake-key",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "qa@example.com",
          password: "LocalTest123!",
          returnSecureToken: true,
        }),
      },
    )
  ).json();
if (!identity.localId) throw new Error(JSON.stringify(identity));
const env = await initializeTestEnvironment({
  projectId,
  firestore: { host: "127.0.0.1", port: 8089 },
});
await env.clearFirestore();
await env.withSecurityRulesDisabled(async (context) => {
  const profile = {
    uid: identity.localId,
    userId: identity.localId,
    fullName: "QA Applicant",
    email: "qa@example.com",
    phone: "+639123456789",
    location: "Manila",
    targetRole: "Data Analyst",
    summary: "A".repeat(250),
    education: {
      college: [
        {
          schoolName: "Test College",
          degreeProgram: "ICT",
          yearGraduated: "2025",
        },
      ],
    },
    skills: [
      { skillName: "SQL", category: "Database", proficiencyLevel: "Beginner" },
    ],
    experience: [],
    projects: [],
    certifications: [],
  };
  await setDoc(doc(context.firestore(), "profiles", identity.localId), profile);
  await setDoc(doc(context.firestore(), "resumeDrafts", identity.localId), {
    config: { targetRole: "Stale role" },
    draft: {
      status: "draft",
      resume: {
        fullName: profile.fullName,
        targetRole: profile.targetRole,
        professionalSummary: profile.summary,
        technicalSkills: profile.skills,
        workExperience: [],
        projects: [],
        certifications: [],
        education: [],
        contact: { email: profile.email },
      },
    },
  });
});
const browser = await chromium.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
});
const page = await browser.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
try {
  await page.goto("http://127.0.0.1:5173/login");
  await page.getByText("Privacy Policy", { exact: true }).click();
  await page.getByRole("dialog").waitFor();
  await page.keyboard.press("Escape");
  await assert.equal(await page.getByRole("dialog").count(), 0);
  assert.equal(
    await page.evaluate(() => document.activeElement.textContent.trim()),
    "Privacy Policy",
  );
  await page.evaluate(async () => {
    const auth = await import("/src/services/authservice.js");
    await auth.loginWithEmail("qa@example.com", "LocalTest123!", false);
  });
  await page.goto('http://127.0.0.1:5173/dashboard');
  await page.getByRole('heading',{name:'QA Applicant',exact:true}).waitFor();
  await page.waitForFunction(()=> [...document.querySelectorAll('header img[alt="QA Applicant"],img[alt="Profile"]')].every(img=>img.complete && img.naturalWidth>0));
  const defaultAvatar = await page.locator('header img[alt="QA Applicant"]').getAttribute('src');
  assert.equal(await page.locator('img[alt="Profile"]').getAttribute('src'),defaultAvatar);
  await page.goto('http://127.0.0.1:5173/profile');
  await page.waitForFunction(()=>{
    const photo=document.querySelector('img[alt="QA Applicant profile"]');
    return photo?.complete && photo.naturalWidth>0;
  });
  assert.equal(await page.locator('img[alt="QA Applicant profile"]').getAttribute('src'),defaultAvatar);
  await page.evaluate(async()=>{
    const {auth}=await import('/src/services/firebase.js');
    const {saveProfile}=await import('/src/services/firestoreService.js');
    await saveProfile(auth.currentUser.uid,{imgUrl:'/missing-avatar.jpg'});
  });
  await page.goto('http://127.0.0.1:5173/dashboard');
  await page.reload();
  await page.getByRole('heading',{name:'QA Applicant',exact:true}).waitFor();
  await page.waitForFunction(()=> [...document.querySelectorAll('header img[alt="QA Applicant"],img[alt="Profile"]')].every(img=>img.complete && img.naturalWidth>0 && img.getAttribute('src').includes('profile.jpg')));
  const blocked=url=>url.port==='8089';
  await page.route(blocked,route=>route.abort());
  await page.reload();
  await page.getByRole('alert').filter({hasText:'Unable to load your profile'}).waitFor({timeout:20000});
  await page.unroute(blocked);
  await page.getByRole('button',{name:'Retry',exact:true}).click();
  await page.getByRole('heading',{name:'QA Applicant',exact:true}).waitFor({timeout:20000});
  await page.goto('http://127.0.0.1:5173/profile');
  await page.waitForFunction(()=>{
    const photo=document.querySelector('img[alt="QA Applicant profile"]');
    return photo?.complete && photo.naturalWidth>0 && photo.getAttribute('src').includes('profile.jpg');
  });
  assert.equal(await page.locator('img[alt="QA Applicant profile"]').getAttribute('src'),defaultAvatar);
  // A real stored image must also match across the three surfaces, not just the fallback.
  await page.evaluate(async()=>{
    const {auth}=await import('/src/services/firebase.js');
    const {saveProfile}=await import('/src/services/firestoreService.js');
    await saveProfile(auth.currentUser.uid,{imgUrl:'http://127.0.0.1:5173/src/assets/images/logo.png'});
  });
  await page.reload();
  await page.locator('img[alt="QA Applicant profile"][src$="logo.png"]').waitFor();
  const savedAvatar=await page.locator('img[alt="QA Applicant profile"]').getAttribute('src');
  assert.equal(await page.locator('header img[alt="QA Applicant"]').getAttribute('src'),savedAvatar);
  await page.goto('http://127.0.0.1:5173/dashboard');
  await page.getByRole('heading',{name:'QA Applicant',exact:true}).waitFor();
  assert.equal(await page.locator('img[alt="Profile"]').getAttribute('src'),savedAvatar);
  assert.equal(await page.locator('header img[alt="QA Applicant"]').getAttribute('src'),savedAvatar);
  await page.goto("http://127.0.0.1:5173/resume-builder");
  await page.getByRole("button", { name: "Approve", exact: true }).waitFor();
  assert.equal(await page.title(), "Resume Builder | CVForge");
  assert.equal(
    await page
      .getByRole("button", { name: "Download Resume", exact: true })
      .isDisabled(),
    true,
  );
  assert.equal(
    await page.getByLabel("Target ICT Role").inputValue(),
    "Data Analyst",
  );
  for (const width of [320, 375, 390, 414]) {
    await page.setViewportSize({ width, height: 900 });
    const dimensions = await page.evaluate(() => ({
      width: innerWidth,
      scroll: document.documentElement.scrollWidth,
    }));
    assert.ok(dimensions.scroll <= width, JSON.stringify(dimensions));
  }
  await page.getByRole("button", { name: "Approve", exact: true }).click();
  await page.getByRole('dialog',{name:'Review Resume'}).waitFor();
  for(let questionCount=0; await page.getByRole('button',{name:'Yes, include',exact:true}).count(); questionCount++) {
    assert.ok(questionCount<30,'Review should finish in a finite number of questions');
    await page.getByRole('button',{name:'Yes, include',exact:true}).click();
  }
  await page.getByRole('button',{name:'Confirm approval',exact:true}).click();
  await page.waitForFunction(() =>
    [...document.querySelectorAll("button")].some(
      (b) => b.textContent.trim() === "Download Resume" && !b.disabled,
    ),
  );
  // Reproduce legacy/generated strings and education aliases that previously broke editing/rendering.
  await page.evaluate(async()=>{
    const {auth}=await import('/src/services/firebase.js');
    const service=await import('/src/services/firestoreService.js');
    const saved=await service.getResumeDraft(auth.currentUser.uid);
    await service.saveResumeDraft(auth.currentUser.uid,{...saved,draft:{...saved.draft,status:'draft',resume:{...saved.draft.resume,technicalSkills:['SQL'],education:[{degreeProgram:'ICT',schoolName:'Test College',yearGraduated:'2025'}]}}});
  });
  await page.reload();
  await page.getByRole('heading',{name:'Technical Skills',exact:true}).waitFor();
  await page.getByRole('heading',{name:'Education',exact:true}).waitFor();
  assert.match(await page.textContent('main'),/SQL/);
  assert.match(await page.textContent('main'),/Test College/);
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  await page.getByRole('region',{name:'Edit resume'}).waitFor();
  await page.getByRole('button',{name:'Add skill',exact:true}).click();
  await page.getByRole('group',{name:'Technical Skills 2',exact:true}).getByLabel('Name',{exact:true}).fill('Python');
  await page.getByRole('button',{name:'Remove skill 2',exact:true}).click();
  await page.getByLabel("Professional Summary").fill("Owner reviewed summary.");
  await page.getByRole("button", { name: "Save edits as draft" }).click();
  await page.waitForFunction(() =>
    [...document.querySelectorAll("button")].some(
      (b) => b.textContent.trim() === "Download Resume" && b.disabled,
    ),
  );
  // Review one question at a time, skip SQL and retain education; decisions survive reload.
  await page.getByRole('button',{name:'Approve',exact:true}).click();
  await page.getByRole('dialog',{name:'Review Resume'}).waitFor();
  await page.keyboard.press('Escape');
  assert.equal(await page.getByRole('dialog').count(),0);
  assert.equal(await page.getByRole('button',{name:'Download Resume',exact:true}).isDisabled(),true);
  await page.getByRole('button',{name:'Approve',exact:true}).click();
  await page.getByRole('dialog',{name:'Review Resume'}).waitFor();
  await page.getByRole('button',{name:'Yes, include',exact:true}).click();
  await page.getByRole('heading',{name:'Do you want to add this skill?',exact:true}).waitFor();
  await page.getByRole('button',{name:'Yes, include',exact:true}).click();
  await page.getByRole('button',{name:'Back',exact:true}).click();
  await page.getByRole('heading',{name:'Do you want to add this skill?',exact:true}).waitFor();
  await page.getByRole('button',{name:'No, skip',exact:true}).click();
  for(let questionCount=0; await page.getByRole('button',{name:'Yes, include',exact:true}).count(); questionCount++) {
    assert.ok(questionCount<30,'Review should finish in a finite number of questions');
    const isSkill=await page.getByRole('heading',{name:'Do you want to add this skill?',exact:true}).count();
    await page.getByRole('button',{name:isSkill?'No, skip':'Yes, include',exact:true}).click();
  }
  await page.getByRole('button',{name:'Confirm approval',exact:true}).click();
  await page.waitForFunction(()=>[...document.querySelectorAll('button')].some(b=>b.textContent.trim()==='Download Resume' && !b.disabled));
  assert.equal(await page.getByRole('heading',{name:'Technical Skills',exact:true}).count(),0);
  await page.getByRole('heading',{name:'Education',exact:true}).waitFor();
  await page.reload();
  await page.getByRole('heading',{name:'Education',exact:true}).waitFor();
  assert.equal(await page.getByRole('heading',{name:'Technical Skills',exact:true}).count(),0);
  await page.goto("http://127.0.0.1:5173/privacy");
  assert.equal(await page.title(), "Privacy Policy | CVForge");
  assert.match(
    await page.textContent("main"),
    /Groq API using the openai\/gpt-oss-20b model/,
  );
  await page.goto("http://127.0.0.1:5173/unknown-page");
  await page
    .getByRole("heading", { name: "Page not found", exact: true })
    .waitFor();
  assert.equal(await page.title(), "Page not found | CVForge");
  await page.goto("http://127.0.0.1:5173/interview-preparation");
  await page.getByRole("note").waitFor();
  assert.match(
    await page.getByRole("note").textContent(),
    /not an official employer/,
  );
  await page.getByRole("button", { name: /History/ }).click();
  await page.getByRole("dialog").waitFor();
  await page.keyboard.press("Escape");
  assert.equal(await page.getByRole("dialog").count(), 0);
  await page.goto("http://127.0.0.1:5173/web-portfolio");
  await page
    .getByRole("button", { name: "Generate Portfolio", exact: true })
    .waitFor();
  assert.equal(await page.getByLabel("Visibility").inputValue(), "private");
  for (const name of [
    "Share Email",
    "Share Phone",
    "Share Address",
    "Share Links",
  ])
    assert.equal(
      await page.getByLabel(name, { exact: true }).isChecked(),
      false,
    );
  const sharing = await page.evaluate(async () => {
    const { auth } = await import('/src/services/firebase.js');
    const service = await import('/src/services/firestoreService.js');
    const uid = auth.currentUser.uid;
    const resume = await service.getResumeDraft(uid);
    const approved = { ...resume.draft, status: 'approved' };
    await service.saveResumeDraft(uid, { ...resume, draft: approved });
    await service.saveWebPortfolioDraft(uid, { draft: approved, config: { visibility:'private', showEmail:false, showPhone:false, showAddress:false, showLinks:false } });
    const token = await service.createToken(uid, {accessType:'Full Access Resume & Portfolio',expiresAt:new Date(Date.now()+600000),maxViews:1,allowDownload:false});
    const slug = await service.publishPortfolio(uid, {draft:approved});
    // Publishing changes the portfolio revision, so reissue the combined share.
    const live = await service.createToken(uid, {accessType:'Full Access Resume & Portfolio',expiresAt:new Date(Date.now()+600000),maxViews:1,allowDownload:false});
    const direct = await service.createToken(uid, {accessType:'Resume Only',expiresAt:new Date(Date.now()+600000),maxViews:1,allowDownload:true});
    const portfolioOnly = await service.createToken(uid, {accessType:'Portfolio Only',expiresAt:new Date(Date.now()+600000),maxViews:1,allowDownload:false});
    return { token:live.tokenValue, stale:token.tokenValue, direct:direct.tokenValue, portfolioOnly:portfolioOnly.tokenValue, slug };
  });
  const guestContext = await browser.newContext();
  const guest = await guestContext.newPage();
  guest.on('pageerror', error => errors.push(error.message));
  await guest.goto('http://127.0.0.1:5173/access-token/'+sharing.token);
  await guest.getByRole('heading',{name:'Shared Portfolio',exact:true}).waitFor();
  assert.equal(await guest.getByRole('button',{name:'Print / Download shared content'}).count(),0);
  assert.ok(!(await guest.textContent('main')).includes('qa@example.com'));
  await guest.goto('http://127.0.0.1:5173/access-token/'+sharing.token);
  await guest.getByText('Invalid or non-existent token.',{exact:true}).waitFor();
  await guest.goto('http://127.0.0.1:5173/access-token/'+sharing.stale);
  await guest.getByText('Invalid or non-existent token.',{exact:true}).waitFor();
  await guest.goto('http://127.0.0.1:5173/p/'+sharing.slug);
  await guest.getByText('QA Applicant',{exact:true}).first().waitFor();
  assert.ok(!(await guest.textContent('main')).includes('qa@example.com'));
  await guest.goto('http://127.0.0.1:5173/shared-profile/'+sharing.direct);
  await guest.getByRole('button',{name:'Print / Download shared content'}).waitFor();
  await guest.reload();
  await guest.getByRole('alert').waitFor();
  await guest.goto('http://127.0.0.1:5173/access-token/'+sharing.portfolioOnly);
  await guest.getByRole('heading',{name:'Shared Portfolio',exact:true}).waitFor();
  await guestContext.close();
  await page.evaluate(async () => {
    const { auth } = await import("/src/services/firebase.js");
    const { saveProfile } = await import("/src/services/firestoreService.js");
    await saveProfile(auth.currentUser.uid, {
      targetRole: "Frontend Developer",
    });
  });
  await page.goto("http://127.0.0.1:5173/resume-builder");
  await page.getByRole("button", { name: "Approve", exact: true }).waitFor();
  assert.equal(
    await page.getByLabel("Target ICT Role").inputValue(),
    "Frontend Developer",
  );
  assert.equal(
    await page
      .getByRole("button", { name: "Download Resume", exact: true })
      .isDisabled(),
    true,
  );
  await page.getByRole("link", { name: "Skip to main content" }).focus();
  await page.keyboard.press("Enter");
  assert.equal(
    await page.evaluate(() => document.activeElement.id),
    "main-content",
  );
  assert.deepEqual(errors, []);
  console.log(
    "PASS: string-skill editing/add/remove, education aliases, sequential approval/back/cancel/persisted exclusions, stalled Firestore retry/recovery, matching avatar fallback, mobile widths, draft gates, canonical role, privacy/titles/404/Escape, Spark sharing and redaction.",
  );
} finally {
  await browser.close();
  await env.cleanup();
}
