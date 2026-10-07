// One precedence order for every owner profile-photo surface.
export function profilePhoto(profile, user) {
  return profile?.imgUrl || profile?.photoURL || user?.photoURL || '';
}
