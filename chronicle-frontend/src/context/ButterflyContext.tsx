import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';

interface ButterflyContextType {
  triggerFlutter: () => void;
  isFluttering: boolean;
}

const ButterflyContext = createContext<ButterflyContextType | null>(null);

export function ButterflyProvider({ children }: { children: ReactNode }) {
  const [isFluttering, setIsFluttering] = useState(false);

  const triggerFlutter = useCallback(() => {
    setIsFluttering(true);
    setTimeout(() => setIsFluttering(false), 3000);
  }, []);

  return (
    <ButterflyContext.Provider value={{ triggerFlutter, isFluttering }}>
      {children}
    </ButterflyContext.Provider>
  );
}

export function useButterfly() {
  const context = useContext(ButterflyContext);
  if (!context) {
    throw new Error('useButterfly must be used within ButterflyProvider');
  }
  return context;
}