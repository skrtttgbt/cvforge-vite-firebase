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

  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error("Cloudinary is not configured. Add VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET to .env.");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: formData,
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.error?.message || "Cloudinary rejected the profile photo upload.");
  }

  if (!data.secure_url) {
    throw new Error("Cloudinary upload completed without a secure image URL.");
  }

  return data.secure_url;
}
