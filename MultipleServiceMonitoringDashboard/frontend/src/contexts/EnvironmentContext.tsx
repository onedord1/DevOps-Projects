import React, { createContext, useContext, useState } from 'react';
import type { Environment } from '@/config/api';

interface EnvironmentContextType {
  currentEnvironment: Environment;
  setEnvironment: (env: Environment) => void;
}

const EnvironmentContext = createContext<EnvironmentContextType | undefined>(undefined);

export function EnvironmentProvider({ children }: { children: React.ReactNode }) {
  const [currentEnvironment, setCurrentEnvironment] = useState<Environment>('dev');

  const setEnvironment = (env: Environment) => {
    setCurrentEnvironment(env);
    localStorage.setItem('selected_environment', env);
  };

  return (
    <EnvironmentContext.Provider value={{ currentEnvironment, setEnvironment }}>
      {children}
    </EnvironmentContext.Provider>
  );
}

export function useEnvironment() {
  const context = useContext(EnvironmentContext);
  if (context === undefined) {
    throw new Error('useEnvironment must be used within an EnvironmentProvider');
  }
  return context;
}
