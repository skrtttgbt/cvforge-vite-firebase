import { filteredDraft, sharedLinks, validateTokenState, isSecureId } from "../utils/sharing";
import { draftWithProfilePhoto } from '../utils/profilePhoto';
import {
  doc,
  setDoc,
  getDoc as readDocument,
  addDoc,
  collection,
  serverTimestamp,
  query,
  where,
  getDocs as readDocuments,
  deleteDoc,
  writeBatch,
  runTransaction,
  Timestamp,
} from "firebase/firestore";

import { db, isConfigured } from "./firebase";
import { withTimeout } from '../utils/withTimeout';
const getDoc = reference => withTimeout(readDocument(reference));
const getDocs = reference => withTimeout(readDocuments(reference));
export async function saveProfile(userId, profileData) {
  if (!userId) {
    throw new Error("A user ID is required to save the profile.");
  }

  const profileRef = doc(db, "profiles", userId);

  const batch = writeBatch(db);
  batch.set(
    profileRef,
    { ...profileData, uid: userId, userId, updatedAt: serverTimestamp() },
    { merge: true },
  );
  for (const collectionName of ["resumeDrafts", "webPortfolioDrafts"]) {
    const ref = doc(db, collectionName, userId);
    const snap = await getDoc(ref);
    if (snap.exists() && snap.data().draft) {
      const data = snap.data();
      const targetRole =
        profileData.targetRole ?? data.draft.resume?.targetRole ?? "";
      batch.set(
        ref,
        {
          draft: {
            ...data.draft,
            status: "draft",
            resume: { ...data.draft.resume, targetRole, ...(Object.hasOwn(profileData,'imgUrl') ? {imgUrl:profileData.imgUrl || ''} : {}) },
          },
          config: { ...data.config, targetRole },
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
    }
  }
  await batch.commit();
  profileCache.delete(userId);
  window.dispatchEvent(new Event("profile-saved"));
}

const profileCache = new Map();
window.addEventListener("auth-user-changed", () => profileCache.clear());
window.addEventListener("profile-saved", () => profileCache.clear());
export async function getProfile(userId) {
  if (profileCache.has(userId)) return profileCache.get(userId);
  const pending = loadProfile(userId);
  profileCache.set(userId, pending);
  try {
    return await pending;
  } catch (error) {
    if (profileCache.get(userId) === pending) profileCache.delete(userId);
    throw error;
  }
}
async function loadProfile(userId) {
  if (!isConfigured) return null;

  const snap = await getDoc(doc(db, "profiles", userId));

  return snap.exists() ? snap.data() : null;
}

export async function saveProfileSources(userId, data) {
  if (!isConfigured) return { offline: true, data };

  await setDoc(
    doc(db, "profileSources", userId),
    {
      ...data,
      userId,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  return { success: true };
}

export async function getProfileSources(userId) {
  if (!isConfigured) return null;

  const snap = await getDoc(doc(db, "profileSources", userId));

  return snap.exists() ? snap.data() : null;
}

export async function saveResumeDraft(userId, data) {
  const currentProfile = await getProfile(userId);
  data = {
    ...data,
    draft: draftWithProfilePhoto(data.draft,currentProfile),
    config: {
      ...data.config,
      targetRole: currentProfile?.targetRole || "",
    },
  };
  if (!isConfigured) return { offline: true, data };

  await setDoc(
    doc(db, "resumeDrafts", userId),
    {
      ...data,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  return { success: true };
}

export async function getResumeDraft(userId) {
  if (!isConfigured) return null;

  const snap = await getDoc(doc(db, "resumeDrafts", userId));

  return snap.exists() ? snap.data() : null;
}
export async function saveWebPortfolioDraft(userId, data) {
  const sources = await getProfileSources(userId);
  data = { ...data, draft: draftWithProfilePhoto(data.draft,await getProfile(userId)) };
  data = { ...data, approvedSharedSources: data.draft?.status === 'approved' ? sharedLinks(sources?.sources, data.config) : [] };
  data = {
    ...data,
    visibility:
      data.config?.visibility === "public" && data.draft?.status === "approved"
        ? "public"
        : "private",
  };
  if (!isConfigured) return { offline: true, data };

  await setDoc(
    doc(db, "webPortfolioDrafts", userId),
    {
      userId,
      ...data,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  return { success: true };
}

export async function getWebPortfolioDraft(userId) {
  if (!isConfigured) return null;

  const snap = await getDoc(doc(db, "webPortfolioDrafts", userId));

  return snap.exists() ? snap.data() : null;
}

export async function saveInterviewSession(userId, data) {
  if (!isConfigured) return { offline: true, data };

  const ref = await addDoc(collection(db, "interviewSessions"), {
    userId,
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return {
    success: true,
    id: ref.id,
  };
}

export async function getInterviewSessions(userId) {
  if (!isConfigured) return [];

  const q = query(
    collection(db, "interviewSessions"),
    where("userId", "==", userId),
  );

  const snap = await getDocs(q);

  const sessions = snap.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));

  return sessions.sort((a, b) => {
    const aTime = a.createdAt?.toMillis?.() || 0;
    const bTime = b.createdAt?.toMillis?.() || 0;

    return bTime - aTime;
  });
}
export async function createToken(ownerId, tokenData) {
  if (!isConfigured) throw new Error('Firebase is not configured.');
  const accessType=tokenData.accessType;
  if (!['Resume Only','Portfolio Only','Full Access Resume & Portfolio'].includes(accessType)) throw new Error('Choose a valid shared output.');
  const expiresAt=new Date(tokenData.expiresAt);
  const maxViews=tokenData.maxViews || 0;
  if (!Number.isFinite(expiresAt.getTime()) || expiresAt.getTime() <= Date.now() || !Number.isInteger(maxViews) || maxViews < 0 || maxViews > 100000) throw new Error('Invalid token expiration or view limit.');
  const id=crypto.randomUUID();
  const result=await runTransaction(db,async transaction=>{
    const hasResume=/resume/i.test(accessType),hasPortfolio=/portfolio/i.test(accessType);
    const resume=hasResume ? (await transaction.get(doc(db,'resumeDrafts',ownerId))).data() : null;
    const portfolio=hasPortfolio ? (await transaction.get(doc(db,'webPortfolioDrafts',ownerId))).data() : null;
    const unapproved=[];
    if (hasResume && resume?.draft?.status !== 'approved') unapproved.push('resume in Resume Builder');
    if (hasPortfolio && portfolio?.draft?.status !== 'approved') unapproved.push('portfolio in Web Portfolio');
    if (unapproved.length) throw new Error('Approve your '+unapproved.join(' and ')+' before creating this token. You can also choose an access type containing only an approved output.');
    const record={ schemaVersion:2,token:id,tokenValue:id,ownerId,sharedResourceId:id,active:true,status:'Active',expiresAt:Timestamp.fromDate(expiresAt),createdAt:serverTimestamp(),updatedAt:serverTimestamp(),viewCount:0,maxViews,allowDownload:tokenData.allowDownload === true,accessType,hasResume,hasPortfolio,resumeUpdatedAt:resume?.updatedAt || null,portfolioUpdatedAt:portfolio?.updatedAt || null };
    const share={ schemaVersion:2,ownerId,token:id,sharedResume:resume ? filteredDraft(resume.draft) : null,sharedPortfolio:portfolio ? filteredDraft(portfolio.draft,portfolio.config) : null,sharedSources:portfolio?.approvedSharedSources || [] };
    transaction.set(doc(db,'tokens',id),record);
    transaction.set(doc(db,'tokenShares',id),share);
    return { ...record,id,views:0,shareLink:window.location.origin+'/access-token/'+id };
  });
  return result;
}

export async function getTokensByOwner(ownerId) {
  if (!isConfigured) return [];

  const q = query(collection(db, "tokens"), where("ownerId", "==", ownerId));

  const snap = await getDocs(q);

  const tokens = snap.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
    views: docSnap.data().viewCount ?? docSnap.data().views ?? 0,
    shareLink: window.location.origin + '/access-token/' + (docSnap.data().token || docSnap.data().tokenValue),
  }));

  return tokens.sort((a, b) => {
    const aTime = a.createdAt?.toMillis?.() || 0;
    const bTime = b.createdAt?.toMillis?.() || 0;

    return bTime - aTime;
  });
}

export async function updateToken(tokenId, updateData) {
  if (!isConfigured) return { offline: true, updateData };

  await setDoc(
    doc(db, "tokens", tokenId),
    {
      ...updateData,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  return { success: true };
}

export async function revokeToken(tokenId) {
  if (!isConfigured) return { offline: true };

  await setDoc(
    doc(db, "tokens", tokenId),
    {
      status: "Revoked",
      active: false,
      revokedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  return { success: true };
}

export async function deleteToken(tokenId) {
  if (!isConfigured) return { offline:true };
  const ref=doc(db,'tokens',tokenId);const record=await getDoc(ref);
  const batch=writeBatch(db);
  if (record.data()?.schemaVersion === 2) { const shareRef=doc(db,'tokenShares',tokenId);const share=await getDoc(shareRef);if(share.exists()) batch.delete(shareRef); }
  batch.delete(ref);await batch.commit();return {success:true};
}

export async function findToken(tokenValue) {
  if (!isSecureId(tokenValue) || !isConfigured) return null;
  try {
    return await runTransaction(db,async transaction=>{
      const tokenRef=doc(db,'tokens',tokenValue);
      const snap=await transaction.get(tokenRef);if(!snap.exists()) return null;
      const token=snap.data();if(!validateTokenState(token)) return null;
      const shareSnap=await transaction.get(doc(db,'tokenShares',token.sharedResourceId));
      if(!shareSnap.exists()) return null;
      const share=shareSnap.data();
      if(share.token !== tokenValue || share.ownerId !== token.ownerId) return null;
      transaction.update(tokenRef,{viewCount:token.viewCount+1,updatedAt:serverTimestamp()});
      // Do not return token owner metadata or any private source document.
      return {sharedResume:share.sharedResume,sharedPortfolio:share.sharedPortfolio,sharedSources:share.sharedSources || [],allowDownload:token.allowDownload};
    });
  } catch(error) { if(error.code === 'permission-denied' || error.code === 'not-found') return null;throw error; }
}
export async function getPublishedWebPortfolio(publicSlug) {
  const snap = await getDoc(doc(db, "publicPortfolios", publicSlug));
  return snap.exists() ? snap.data() : null;
}
export async function publishPortfolio(ownerId, data) {
  if(data.draft?.status !== 'approved') throw new Error('Approve the portfolio first.');
  return runTransaction(db,async transaction=>{
    const ref=doc(db,'webPortfolioDrafts',ownerId);const source=(await transaction.get(ref)).data();
    if(source?.draft?.status !== 'approved') throw new Error('Approve the saved portfolio first.');
    const id=isSecureId(source.publicSlug) ? source.publicSlug : crypto.randomUUID();
    transaction.update(ref,{visibility:'public',publicSlug:id,'config.visibility':'public',updatedAt:serverTimestamp()});
    transaction.set(doc(db,'publicPortfolios',id),{schemaVersion:2,ownerId,status:'approved',visibility:'public',themeStyle:source.config?.themeStyle === 'Minimal White' ? 'Minimal White' : 'Modern Blue',draft:filteredDraft(source.draft,source.config),publicProfile:{},publicSources:source.approvedSharedSources || [],sourceUpdatedAt:serverTimestamp(),updatedAt:serverTimestamp()});
    return id;
  });
}
