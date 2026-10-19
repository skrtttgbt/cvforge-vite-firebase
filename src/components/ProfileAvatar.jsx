import defaultProfile from '../assets/images/profile.jpg';

export default function ProfileAvatar({ src, alt = 'Profile', fallback = true, ...props }) {
  if (!src && !fallback) return null;
  return <img {...props} src={src || defaultProfile} alt={alt} onError={event => {
    const image = event.currentTarget;
    if (!fallback) image.style.display = 'none';
    else if (image.getAttribute('src') !== defaultProfile) image.src = defaultProfile;
  }} />;
}
