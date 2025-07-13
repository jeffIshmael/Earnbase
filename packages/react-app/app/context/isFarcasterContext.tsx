'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

type IsFarcasterContextType = {
  isFarcaster: boolean;
  setIsFarcaster: (value: boolean) => void;
};

const IsFarcasterContext = createContext<IsFarcasterContextType | undefined>(undefined);

export const IsFarcasterProvider = ({ children }: { children: ReactNode }) => {
  const [isFarcaster, setIsFarcaster] = useState(false);

  return (
    <IsFarcasterContext.Provider value={{ isFarcaster, setIsFarcaster }}>
      {children}
    </IsFarcasterContext.Provider>
  );
};

export const useIsFarcaster = () => {
  const context = useContext(IsFarcasterContext);
  if (!context) {
    throw new Error('useIsFarcaster must be used within an IsFarcasterProvider');
  }
  return context;
};