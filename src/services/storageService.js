const allowedProfilePhotoTypes = new Set(["image/jpeg", "image/png"]);
const maxProfilePhotoSize = 2 * 1024 * 1024;

export function validateProfilePhoto(file) {
  if (!file) return "Choose a JPG or PNG image.";
  if (!allowedProfilePhotoTypes.has(file.type)) return "Profile photo must be a JPG or PNG image.";
  if (file.size > maxProfilePhotoSize) return "Profile photo must be 2MB or smaller.";
  return "";
}

export async function uploadProfilePhoto(userId, file) {
  if (!userId) throw new Error("A user ID is required to upload a profile photo.");

  const validationError = validateProfilePhoto(file);
  if (validationError) throw new Error(validationError);

  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME?.trim();
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET?.trim();

  if (!cloudName || !uploadPreset) {
    throw new Error("Photo upload is not configured yet. The site needs its Cloudinary cloud name and unsigned upload preset before photos can be uploaded. Your current photo has been kept.");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  let response;
  try { response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/upload`, {
    method: "POST",
    body: formData,
    signal: AbortSignal.timeout(30000),
  }); } catch(error) {
    throw new Error(error.name === 'TimeoutError' ? 'Photo upload timed out. Please try again.' : 'Unable to reach the photo upload service. Check your connection and try again.');
  }
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.error?.message || "Cloudinary rejected the profile photo upload.");
  }

  if (!data.secure_url) {
    throw new Error("Cloudinary upload completed without a secure image URL.");
  }

  return data.secure_url;
}
