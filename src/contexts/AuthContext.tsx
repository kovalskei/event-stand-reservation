import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  userEmail: string | null;
  setUserEmail: (email: string | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [userEmail, setUserEmailState] = useState<string | null>(() => {
    return localStorage.getItem('userEmail');
  });

  const setUserEmail = (email: string | null) => {
    if (email) {
      localStorage.setItem('userEmail', email);
    } else {
      localStorage.removeItem('userEmail');
    }
    setUserEmailState(email);
  };

  const logout = () => {
    setUserEmail(null);
  };

  return (
    <AuthContext.Provider value={{ userEmail, setUserEmail, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
