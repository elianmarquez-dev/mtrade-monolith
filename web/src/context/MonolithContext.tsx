import React, { createContext, useContext, useEffect, useState } from 'react';
import { telemetry } from '../services';
import { ServiceCallLog, ServiceHealth, ServiceName } from '../types';

interface MonolithContextType {
  logs: ServiceCallLog[];
  servicesHealth: ServiceHealth[];
  isInspectorOpen: boolean;
  openInspector: () => void;
  closeInspector: () => void;
  toggleInspector: () => void;
  clearLogs: () => void;
  selectedServiceFilter: ServiceName | 'all';
  setSelectedServiceFilter: (service: ServiceName | 'all') => void;
  lastCallTimestamp: string | null;
}

const MonolithContext = createContext<MonolithContextType | undefined>(undefined);

export const MonolithProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [logs, setLogs] = useState<ServiceCallLog[]>([]);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [selectedServiceFilter, setSelectedServiceFilter] = useState<ServiceName | 'all'>('all');
  const [servicesHealth] = useState<ServiceHealth[]>(() => telemetry.getServicesHealth());
  const [lastCallTimestamp, setLastCallTimestamp] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = telemetry.subscribe((newLogs) => {
      setLogs(newLogs);
      if (newLogs.length > 0) {
        setLastCallTimestamp(newLogs[0].timestamp);
      }
    });
    return () => unsubscribe();
  }, []);

  const openInspector = () => setIsInspectorOpen(true);
  const closeInspector = () => setIsInspectorOpen(false);
  const toggleInspector = () => setIsInspectorOpen((prev) => !prev);
  const clearLogs = () => telemetry.clearLogs();

  return (
    <MonolithContext.Provider
      value={{
        logs,
        servicesHealth,
        isInspectorOpen,
        openInspector,
        closeInspector,
        toggleInspector,
        clearLogs,
        selectedServiceFilter,
        setSelectedServiceFilter,
        lastCallTimestamp
      }}
    >
      {children}
    </MonolithContext.Provider>
  );
};

export const useMonolith = () => {
  const context = useContext(MonolithContext);
  if (!context) {
    throw new Error('useMonolith must be used within a MonolithProvider');
  }
  return context;
};
