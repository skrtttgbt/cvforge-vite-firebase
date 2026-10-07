export const privacySections = [
  {
    heading: "Information and purpose",
    body: "CVForge processes account details, profile information, resume drafts, portfolio drafts, and text interview answers to provide these features. Employers and HR do not need accounts: they can access only the content authorized by a job seeker through a secure token.",
  },
  {
    heading: "AI processing",
    body: "CVForge uses the Groq API using the openai/gpt-oss-20b model. When you request AI assistance, relevant user-provided information may be transmitted for resume generation, summarization, portfolio generation, skills extraction, and interview preparation. AI output remains a draft until you approve it. Provider retention and processing practices have not been independently verified by CVForge; do not submit sensitive information unnecessary for these purposes.",
  },
  {
    heading: "Firebase and Cloudinary",
    body: "Firebase Authentication processes sign-in information and Firebase Firestore stores profile information, drafts, interview sessions, and sharing records. Uploaded profile images may be processed and stored using Cloudinary. Removing an image reference from your profile does not automatically delete the stored Cloudinary asset.",
  },
  {
    heading: "Sharing choices",
    body: "Portfolios start private. Publishing requires approval and confirmation. Email, phone, address, and contact links are hidden in shared output unless explicitly enabled. Tokens can expire and be revoked or deleted. The application counts accesses, but a recipient using the sharing link outside the application can bypass counting until the stored limit is exhausted. View limits and download controls cannot prevent copying, screenshots, or printing. Revocation cannot erase copies already obtained by a recipient.",
  },
  {
    heading: "Data Privacy Act of 2012",
    body: "CVForge is designed with consideration of the principles of the Data Privacy Act of 2012 (Republic Act No. 10173): transparency, legitimate purpose, and proportionality. Share only information needed for your application and provide consent where applicable. You can access and correct stored profile information through Profile Management. This statement is not a legally verified guarantee of compliance.",
  },
  {
    heading: "Security, retention, and deletion",
    body: "Access controls restrict private records to their owner. You can edit or remove profile fields and delete or revoke tokens through the application. There is currently no automatic retention schedule or complete account and provider-asset deletion workflow. Stored drafts and other records remain until explicitly removed; provider retention may differ. Security measures reduce risk but cannot guarantee absolute security.",
  },
];
