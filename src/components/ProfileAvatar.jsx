import defaultProfile from '../assets/images/profile.jpg';

export default function ProfileAvatar({ src, alt = 'Profile', ...props }) {
  return <img {...props} src={src || defaultProfile} alt={alt} onError={event => {
    const image = event.currentTarget;
    if (image.getAttribute('src') !== defaultProfile) image.src = defaultProfile;
  }} />;
}
