import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore'
import { db, firebaseReady } from './firebase'

const safeId = () => Math.random().toString(36).slice(2, 10)

export async function saveUserProfile(uid, data) {
  if (!firebaseReady) return { id: uid || safeId(), ...data }
  await setDoc(doc(db, 'profiles', uid), { ...data, userId: uid, updatedAt: serverTimestamp() }, { merge: true })
  return { id: uid, ...data }
}

export async function getUserProfile(uid) {
  if (!firebaseReady) return null
  const snap = await getDoc(doc(db, 'profiles', uid))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export async function saveCollectionItem(name, data) {
  if (!firebaseReady) return { id: safeId(), ...data }
  const ref = await addDoc(collection(db, name), { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
  return { id: ref.id, ...data }
}

export async function updateCollectionItem(name, id, data) {
  if (!firebaseReady) return { id, ...data }
  await updateDoc(doc(db, name, id), { ...data, updatedAt: serverTimestamp() })
  return { id, ...data }
}

export async function removeCollectionItem(name, id) {
  if (!firebaseReady) return true
  await deleteDoc(doc(db, name, id))
  return true
}

export async function getItemsByUser(name, uid) {
  if (!firebaseReady) return []
  const q = query(collection(db, name), where('userId', '==', uid))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function getTokenRecord(token) {
  if (!firebaseReady) return null
  const snap = await getDoc(doc(db, 'tokens', token))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export async function createTokenRecord(token, data) {
  if (!firebaseReady) return { id: token, ...data }
  await setDoc(doc(db, 'tokens', token), { ...data, token, createdAt: serverTimestamp() })
  return { id: token, ...data }
}
