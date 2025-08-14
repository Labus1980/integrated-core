import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  roles: string[];
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Keycloak OAuth2 configuration
  const KEYCLOAK_URL = import.meta.env.VITE_KEYCLOAK_URL || 'https://your-keycloak-server.com';
  const REALM = import.meta.env.VITE_KEYCLOAK_REALM || 'your-realm';
  const CLIENT_ID = import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'dashboard-client';
  
  // Development mode - set to true to skip real Keycloak authentication
  const DEV_MODE = KEYCLOAK_URL.includes('your-keycloak-server.com');

  useEffect(() => {
    // In development mode, auto-login with mock user
    if (DEV_MODE) {
      setTimeout(() => {
        setUser({
          id: 'dev-user',
          username: 'Разработчик',
          email: 'dev@company.com',
          avatar: '',
          roles: ['admin']
        });
        setIsLoading(false);
      }, 1000);
      return;
    }

    // Check if user is already authenticated
    const token = localStorage.getItem('access_token');
    if (token) {
      validateToken(token);
    } else {
      setIsLoading(false);
    }
  }, []);

  const validateToken = async (token: string) => {
    try {
      const response = await fetch(`${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/userinfo`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const userInfo = await response.json();
        setUser({
          id: userInfo.sub,
          username: userInfo.preferred_username,
          email: userInfo.email,
          avatar: userInfo.picture,
          roles: userInfo.realm_access?.roles || []
        });
      } else {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      }
    } catch (error) {
      console.error('Token validation failed:', error);
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    } finally {
      setIsLoading(false);
    }
  };

  const login = () => {
    if (DEV_MODE) {
      // Mock login for development
      setIsLoading(true);
      setTimeout(() => {
        setUser({
          id: 'dev-user',
          username: 'Разработчик',
          email: 'dev@company.com',
          avatar: '',
          roles: ['admin']
        });
        setIsLoading(false);
      }, 1000);
      return;
    }

    const authUrl = `${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/auth?` +
      `client_id=${CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(window.location.origin)}&` +
      `response_type=code&` +
      `scope=openid email profile`;
    
    window.location.href = authUrl;
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
    
    if (DEV_MODE) {
      // Simple logout for development
      window.location.reload();
      return;
    }
    
    const logoutUrl = `${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/logout?` +
      `redirect_uri=${encodeURIComponent(window.location.origin)}`;
    
    window.location.href = logoutUrl;
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      login,
      logout,
      isLoading
    }}>
      {children}
    </AuthContext.Provider>
  );
};