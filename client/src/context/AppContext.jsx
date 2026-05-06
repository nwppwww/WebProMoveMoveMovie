import React, { createContext, useContext, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
const AppContext = createContext();
export const useAppContext = () => useContext(AppContext);
export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('mmm_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [globalLoading, setGlobalLoading] = useState(false);
  const [globalError, setGlobalError] = useState(null);
  const [toastData, setToastData] = useState(null);
  const [confirmData, setConfirmData] = useState(null); 
  const navigate = useNavigate();
  const login = useCallback((userData) => {
    setUser(userData);
    localStorage.setItem('mmm_user', JSON.stringify(userData));
  }, []);
  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('mmm_user');
    navigate('/');
  }, [navigate]);
  const toast = useCallback((msg, type = 'success') => {
    setToastData({ msg, type, key: Date.now() });
  }, []);
  const confirm = useCallback((msg, onConfirm, type = 'danger') => {
    setConfirmData({ msg, onConfirm, type });
  }, []);
  const impersonate = useCallback((targetUser) => {
    setUser(targetUser);
    localStorage.setItem('mmm_user', JSON.stringify(targetUser));
  }, []);
  const updateUser = useCallback((newData) => {
    const updated = { ...user, ...newData };
    setUser(updated);
    localStorage.setItem('mmm_user', JSON.stringify(updated));
  }, [user]);
  return (
    <AppContext.Provider value={{ 
      user, login, logout, toast, toastData, setToastData, 
      confirm, confirmData, setConfirmData, impersonate, updateUser,
      globalLoading, setGlobalLoading, globalError, setGlobalError
    }}>
      {children}
    </AppContext.Provider>
  );
};