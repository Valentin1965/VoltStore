
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city?: string;
  department?: string;
  cards: any[];
}

interface UserContextType {
  users: UserProfile[];
  currentUser: UserProfile | null;
  registerUser: (userData: Omit<UserProfile, 'id' | 'cards'>) => UserProfile;
  findUser: (emailQuery: string) => UserProfile | undefined;
  login: (user: UserProfile) => void;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const INITIAL_USERS: UserProfile[] = [
  {
    id: 'usr_1',
    name: 'Anders Jensen',
    email: 'anders@greenlight.dk',
    phone: '+45 31 18 58 19',
    address: 'Øster Teglgårdsvej 6, 8800 Viborg, Danmark',
    city: 'Viborg',
    department: 'Øster Teglgårdsvej 6',
    cards: [{ id: 'c1', brand: 'visa', last4: '4242' }, { id: 'c2', brand: 'mastercard', last4: '8899' }]
  }
];

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem('voltstore_users');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('voltstore_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    localStorage.setItem('voltstore_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('voltstore_current_user', JSON.stringify(currentUser));
  }, [currentUser]);

  const registerUser = (userData: Omit<UserProfile, 'id' | 'cards'>) => {
    const newUser: UserProfile = {
      ...userData,
      id: `usr_${Date.now()}`,
      cards: [{ id: `c_${Date.now()}`, brand: 'visa', last4: '1234' }], // Default card for demo
      city: userData.address.split(',')[0] || '',
      department: 'Main Office'
    };
    setUsers(prev => [...prev, newUser]);
    return newUser;
  };

  const findUser = (emailQuery: string) => {
    const q = emailQuery.toLowerCase().trim();
    // Requirement 4: Strictly match by email only
    return users.find(u => u.email.toLowerCase() === q);
  };

  const login = (user: UserProfile) => setCurrentUser(user);
  const logout = () => setCurrentUser(null);

  return (
    <UserContext.Provider value={{ users, currentUser, registerUser, findUser, login, logout }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be used within UserProvider');
  return context;
};
