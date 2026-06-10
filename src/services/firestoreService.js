import { doc, setDoc, getDoc, addDoc, collection, serverTimestamp, query, where, getDocs } from 'firebase/firestore'
import { db, isConfigured } from './firebase'

export async function saveProfile(userId, data) {
  if (!isConfigured) return { offline: true, data }
  await setDoc(doc(db, 'profiles', userId), { ...data, updatedAt: serverTimestamp() }, { merge: true })
  return { success: true }
}

export async function getProfile(userId) {
  if (!isConfigured) return null
  const snap = await getDoc(doc(db, 'profiles', userId))
  return snap.exists() ? snap.data() : null
}

export async function createToken(ownerId, tokenData) {
  const payload = { ownerId, ...tokenData, createdAt: serverTimestamp(), status: 'Active' }
  if (!isConfigured) return { id: crypto.randomUUID(), ...payload }
  const ref = await addDoc(collection(db, 'tokens'), payload)
  return { id: ref.id, ...payload }
}

export async function findToken(tokenValue) {
  if (!isConfigured) return null
  const q = query(collection(db, 'tokens'), where('tokenValue', '==', tokenValue), where('status', '==', 'Active'))
  const snap = await getDocs(q)
  return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() }
}
