// One precedence order for every owner profile-photo surface.
export function profilePhoto(profile, user) {
  return profile?.imgUrl || profile?.photoURL || user?.photoURL || '';
}

export function draftWithProfilePhoto(draft, profile, config = null) {
  if (!draft?.resume) return draft;
  if (config?.photoMode === "none") {
    return { ...draft, resume: { ...draft.resume, imgUrl: "" } };
  }
  if (config?.photoMode === "custom") {
    const customPhoto = safeUrl(config.customPhotoUrl);
    return {
      ...draft,
      resume: { ...draft.resume, imgUrl: customPhoto || "" },
    };
  }
  const currentPhoto = safeUrl(profilePhoto(profile));
  if (config?.photoMode === "profile") {
    return { ...draft, resume: { ...draft.resume, imgUrl: currentPhoto || "" } };
  }
  return currentPhoto ? { ...draft, resume: { ...draft.resume, imgUrl: currentPhoto } } : draft;
}
import { safeUrl } from './grounding.js';
