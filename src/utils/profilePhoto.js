// One precedence order for every owner profile-photo surface.
export function profilePhoto(profile, user) {
  return profile?.imgUrl || profile?.photoURL || user?.photoURL || '';
}

export function draftWithProfilePhoto(draft, profile) {
  if (!draft?.resume) return draft;
  const currentPhoto = safeUrl(profilePhoto(profile));
  return currentPhoto ? { ...draft, resume: { ...draft.resume, imgUrl: currentPhoto } } : draft;
}
import { safeUrl } from './grounding.js';
