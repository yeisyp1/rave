import { createContext, useContext } from "react";

const ProfileContext = createContext(null);

export const ProfileProvider = ({ profile, children }) => (
  <ProfileContext.Provider value={profile}>{children}</ProfileContext.Provider>
);

// eslint-disable-next-line react-refresh/only-export-components -- hook co-located with its Provider (patrón estándar de Context)
export const useProfile = () => useContext(ProfileContext);
