import { doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { profileSuggestionPatch } from '../utils/resumeSuggestions';

// Called only after the user reviews and confirms the profile-change summary.
export async function saveResumeProfileSuggestions(userId,suggestions,baseline) {
  const result=await runTransaction(db,async transaction=>{
    const profileRef=doc(db,'profiles',userId);
    const snapshot=await transaction.get(profileRef);
    if(!snapshot.exists()) throw new Error('Your profile is missing. Open Profile Management first.');
    const current=snapshot.data();
    if(current.targetRole!==baseline.targetRole) throw new Error('Your target role changed. Restart the improvement questions.');
    const patch=profileSuggestionPatch(current,suggestions,baseline);
    if(!Object.keys(patch).length) return current;
    const dependents=[];
    for(const collection of ['resumeDrafts','webPortfolioDrafts']) {
      const ref=doc(db,collection,userId);const snap=await transaction.get(ref);
      if(snap.exists() && snap.data().draft) dependents.push({ref,data:snap.data()});
    }
    transaction.update(profileRef,{...patch,updatedAt:serverTimestamp()});
    for(const {ref,data} of dependents) transaction.update(ref,{
      draft:{...data.draft,status:'draft',resume:{...data.draft.resume,targetRole:current.targetRole || ''}},updatedAt:serverTimestamp(),
    });
    return {...current,...patch};
  });
  window.dispatchEvent(new Event('profile-saved'));
  return result;
}
