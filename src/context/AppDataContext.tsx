import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getAppDate, advanceAppDate as advanceDateHelper, resetAppDate } from '../lib/appDate';
import { generateSeed } from '../lib/seed';
import { recordAudit } from '../lib/db';
import { useAuth } from './AuthContext';

interface AppDataContextType {
  appDate: string;
  dataVersion: number;
  triggerRefresh: () => void;
  simulateNextDay: () => void;
  resetDemoData: () => Promise<void>;
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

export const AppDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [appDate, setAppDateState] = useState<string>(() => getAppDate());
  const [dataVersion, setDataVersion] = useState<number>(0);
  const { user } = useAuth();

  const triggerRefresh = useCallback(() => {
    setAppDateState(getAppDate());
    setDataVersion(v => v + 1);
  }, []);

  useEffect(() => {
    // Listen to localStorage changes in other tabs (R32)
    const handleStorage = (e: StorageEvent) => {
      if (e.key?.startsWith('qf_') || !e.key) {
        triggerRefresh();
      }
    };

    // Listen to internal app data changes
    const handleAppDataChanged = () => {
      triggerRefresh();
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('app_data_changed', handleAppDataChanged);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('app_data_changed', handleAppDataChanged);
    };
  }, [triggerRefresh]);

  // R28: Simulate next day — advances by 1 day, no automatic readings/visits
  const simulateNextDay = () => {
    const nextDate = advanceDateHelper();
    setAppDateState(nextDate);
    if (user) {
      recordAudit(
        `Advanced simulated app date to ${nextDate}.`,
        user.userId,
        user.name,
        user.role,
        null
      );
    }
    triggerRefresh();
  };

  // R27: Reset demo data
  const resetDemoData = async () => {
    generateSeed();
    resetAppDate();
    setAppDateState(getAppDate());
    if (user) {
      recordAudit(
        'Reset demo data restored seed dataset (70 active, 22 closed cases) and reset app date.',
        user.userId,
        user.name,
        user.role,
        null
      );
    }
    triggerRefresh();
  };

  return (
    <AppDataContext.Provider
      value={{
        appDate,
        dataVersion,
        triggerRefresh,
        simulateNextDay,
        resetDemoData,
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
};

export function useAppData(): AppDataContextType {
  const ctx = useContext(AppDataContext);
  if (!ctx) {
    throw new Error('useAppData must be used within an AppDataProvider');
  }
  return ctx;
}
