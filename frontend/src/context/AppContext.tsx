import React, { createContext, useContext, useState } from 'react';
import { UserRole, UserSession } from '../types';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
}

interface AppContextType {
  activeCity: string;
  setActiveCity: (city: string) => void;
  user: UserSession;
  setUserRole: (role: UserRole) => void;
  scenario: string;
  setScenario: (sc: string) => void;
  refreshTrigger: number;
  triggerRefresh: () => void;
  notifications: ToastMessage[];
  addToast: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
  removeToast: (id: string) => void;
}

const defaultUser: UserSession = {
  role: 'eoc_chief',
  name: 'Commander R. Sharma',
  city: 'Bengaluru',
  ward: 'Central Command EOC',
  badgeNumber: 'NDMA-KA-092'
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeCity, setActiveCity] = useState<string>('All Cities');
  const [user, setUser] = useState<UserSession>(defaultUser);
  const [scenario, setScenario] = useState<string>('monsoon_heavy');
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [notifications, setNotifications] = useState<ToastMessage[]>([
    {
      id: 'init-1',
      message: 'Urban Flood Nowcasting System active: Simulated monsoon telemetry connected.',
      type: 'info',
      timestamp: new Date().toLocaleTimeString()
    }
  ]);

  const triggerRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const setUserRole = (role: UserRole) => {
    if (role === 'citizen') {
      setUser({
        role,
        name: 'Ananya Sharma',
        city: 'Bengaluru',
        ward: 'Bellandur (Ward 150)'
      });
      addToast('Switched to Citizen View (Public crowd alerts & reporting enabled)', 'info');
    } else if (role === 'ward_engineer') {
      setUser({
        role,
        name: 'Er. Praveen Kumar',
        city: 'Bengaluru',
        ward: 'BTM Layout & Silk Board',
        badgeNumber: 'BBMP-EE-104'
      });
      addToast('Switched to Ward Engineer View (Drainage CRUD & Desilting access)', 'info');
    } else if (role === 'admin') {
      setUser({
        role,
        name: 'System Admin',
        city: 'All Cities',
        badgeNumber: 'SYS-ROOT-01'
      });
      addToast('Switched to Administrator View (Weights & Threshold calibration)', 'info');
    } else {
      setUser(defaultUser);
      addToast('Switched to EOC Chief View (Command & Triage dispatch active)', 'info');
    }
  };

  const addToast = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const newToast: ToastMessage = {
      id: Math.random().toString(36).substring(2, 9),
      message,
      type,
      timestamp: new Date().toLocaleTimeString()
    };
    setNotifications(prev => [newToast, ...prev.slice(0, 4)]);

    setTimeout(() => {
      setNotifications(prev => prev.filter(t => t.id !== newToast.id));
    }, 6000);
  };

  const removeToast = (id: string) => {
    setNotifications(prev => prev.filter(t => t.id !== id));
  };

  return (
    <AppContext.Provider
      value={{
        activeCity,
        setActiveCity,
        user,
        setUserRole,
        scenario,
        setScenario,
        refreshTrigger,
        triggerRefresh,
        notifications,
        addToast,
        removeToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
