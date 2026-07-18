import React, { createContext, useContext } from 'react';

const AuthContext = createContext({
  user: {
    role: 'user',
    plan: { dailyPhotoLimit: 100 }
  },
  usage: {
    photosUsedToday: 0
  },
  onLogout: () => {},
  onOpenFeedback: () => {},
  onOpenSecurity: () => {}
});

export const AuthProvider = ({ value, children }) => {
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    return {
      user: {
        role: 'user',
        plan: { dailyPhotoLimit: 100 }
      },
      usage: {
        photosUsedToday: 0
      },
      onLogout: () => {},
      onOpenFeedback: () => {},
      onOpenSecurity: () => {}
    };
  }
  return context;
};
