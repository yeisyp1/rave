import { createContext, useContext } from "react";

const ProfileContext = createContext(null);

export const ProfileProvider = ({ profile, children }) => (
  <ProfileContext.Provider value={profile}>{children}</ProfileContext.Provider>
);

export const useProfile = () => useContext(ProfileContext);
