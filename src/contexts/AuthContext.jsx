import { createContext, useContext, useEffect, useState } from "react";
import { onAuthChange } from "../services/authservice";
import { getProfile } from "../services/firestoreService";
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [state, setState] = useState({
    firebaseUser: null,
    userProfile: null,
    targetRole: "",
    loading: true,
    error: "",
  });
  useEffect(() => {
    let active = true;
    let generation = 0;
    const sessionDeadline = setTimeout(() => {
      if (active && generation === 0) setState(prev => ({
        ...prev, loading: false, error: 'Unable to restore your session. Check your connection and retry.',
      }));
    }, 12000);
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      clearTimeout(sessionDeadline);
      const request = ++generation;
      setState((prev) => ({
        ...prev,
        firebaseUser,
        loading:
          !prev.userProfile || prev.firebaseUser?.uid !== firebaseUser?.uid,
        error: "",
      }));
      try {
        const userProfile = firebaseUser
          ? await getProfile(firebaseUser.uid)
          : null;
        if (active && request === generation)
          setState({
            firebaseUser,
            userProfile,
            targetRole: userProfile?.targetRole || "",
            loading: false,
            error: "",
          });
      } catch {
        if (active && request === generation)
          setState({
            firebaseUser,
            userProfile: null,
            targetRole: "",
            loading: false,
            error: "Unable to load your profile. Please retry.",
          });
      }
    });
    return () => {
      active = false;
      clearTimeout(sessionDeadline);
      unsubscribe();
    };
  }, []);
  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
