import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { DataMode } from '../types';
import { seedDemoData as seedApi, clearDemoData as clearApi } from '../lib/api';

interface DataModeContextType {
  mode: DataMode;
  isDemo: boolean;
  setMode: (mode: DataMode) => void;
  toggleMode: () => void;
  seedDemo: () => Promise<void>;
  clearDemo: () => Promise<void>;
  refreshKey: number;
  refresh: () => void;
}

const DataModeContext = createContext<DataModeContextType | null>(null);

export function DataModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<DataMode>('live');
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey(k => k + 1), []);

  const toggleMode = useCallback(() => {
    setMode(m => (m === 'live' ? 'demo' : 'live'));
    refresh();
  }, [refresh]);

  const seedDemo = useCallback(async () => {
    await seedApi(45);
    setMode('demo');
    refresh();
  }, [refresh]);

  const clearDemo = useCallback(async () => {
    await clearApi();
    refresh();
  }, [refresh]);

  return (
    <DataModeContext.Provider
      value={{
        mode,
        isDemo: mode === 'demo',
        setMode,
        toggleMode,
        seedDemo,
        clearDemo,
        refreshKey,
        refresh,
      }}
    >
      {children}
    </DataModeContext.Provider>
  );
}

export function useDataMode() {
  const ctx = useContext(DataModeContext);
  if (!ctx) throw new Error('useDataMode must be used within DataModeProvider');
  return ctx;
}
