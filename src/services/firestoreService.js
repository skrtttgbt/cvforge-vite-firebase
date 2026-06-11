import {
  doc,
  setDoc,
  getDoc,
  addDoc,
  collection,
  serverTimestamp,
  query,
  where,
  getDocs,
  deleteDoc,
  increment,
} from "firebase/firestore";

import { db, isConfigured } from "./firebase";
export async function saveProfile(userId, data) {
  if (!isConfigured) return { offline: true, data };

  await setDoc(
    doc(db, "profiles", userId),
    {
      ...data,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  return { success: true };
}

export async function getProfile(userId) {
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
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  return { success: true };
}

export async function getProfileSources(userId) {
  if (!isConfigured) return null;

  const snap = await getDoc(doc(db, "profileSources", userId));

  return snap.exists() ? snap.data() : null;
}


export async function saveResumeDraft(userId, data) {
  if (!isConfigured) return { offline: true, data };

  await setDoc(
    doc(db, "resumeDrafts", userId),
    {
      ...data,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  return { success: true };
}

export async function getResumeDraft(userId) {
  if (!isConfigured) return null;

  const snap = await getDoc(doc(db, "resumeDrafts", userId));

  return snap.exists() ? snap.data() : null;
}
export async function saveWebPortfolioDraft(userId, data) {
  if (!isConfigured) return { offline: true, data };

  await setDoc(
    doc(db, "webPortfolioDrafts", userId),
    {
      ...data,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
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
    where("userId", "==", userId)
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
  const payload = {
    ownerId,
    ...tokenData,
    views: tokenData.views ?? 0,
    status: "Active",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (!isConfigured) return { id: crypto.randomUUID(), ...payload };

  const ref = await addDoc(collection(db, "tokens"), payload);

  return {
    id: ref.id,
    ...payload,
  };
}

export async function getTokensByOwner(ownerId) {
  if (!isConfigured) return [];

  const q = query(
    collection(db, "tokens"),
    where("ownerId", "==", ownerId)
  );

  const snap = await getDocs(q);

  const tokens = snap.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
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
    { merge: true }
  );

  return { success: true };
}

export async function revokeToken(tokenId) {
  if (!isConfigured) return { offline: true };

  await setDoc(
    doc(db, "tokens", tokenId),
    {
      status: "Revoked",
      revokedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  return { success: true };
}

export async function deleteToken(tokenId) {
  if (!isConfigured) return { offline: true };

  await deleteDoc(doc(db, "tokens", tokenId));

  return { success: true };
}

export async function findToken(tokenValue) {
  if (!isConfigured) return null;

  const q = query(
    collection(db, "tokens"),
    where("tokenValue", "==", tokenValue),
    where("status", "==", "Active")
  );

  const snap = await getDocs(q);

  return snap.empty
    ? null
    : {
        id: snap.docs[0].id,
        ...snap.docs[0].data(),
      };
}
export async function saveEmployerCandidateView(employerId, data) {
  if (!isConfigured) return { offline: true, data };

  const ref = await addDoc(collection(db, "employerCandidateViews"), {
    employerId,
    ...data,
    shortlisted: data.shortlisted ?? false,
    viewedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return {
    success: true,
    id: ref.id,
  };
}

export async function getEmployerCandidateViews(employerId) {
  if (!isConfigured) return [];

  const q = query(
    collection(db, "employerCandidateViews"),
    where("employerId", "==", employerId)
  );

  const snap = await getDocs(q);

  const views = snap.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));

  return views.sort((a, b) => {
    const aTime = a.viewedAt?.toMillis?.() || 0;
    const bTime = b.viewedAt?.toMillis?.() || 0;

    return bTime - aTime;
  });
}

export async function updateEmployerCandidateView(viewId, data) {
  if (!isConfigured) return { offline: true, data };

  await setDoc(
    doc(db, "employerCandidateViews", viewId),
    {
      ...data,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  return { success: true };
}

export async function incrementTokenViews(tokenId) {
  if (!isConfigured) return { offline: true };

  await setDoc(
    doc(db, "tokens", tokenId),
    {
      views: increment(1),
      lastViewedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  return { success: true };
}