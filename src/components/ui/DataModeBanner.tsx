import { useDataMode } from '../../contexts/DataModeContext';
import { Database, Radio, RotateCcw, Trash2, Loader2 } from 'lucide-react';
import { useState } from 'react';

export function DataModeBanner() {
  const { mode, isDemo, toggleMode, seedDemo, clearDemo, refresh } = useDataMode();
  const [seeding, setSeeding] = useState(false);
  const [clearing, setClearing] = useState(false);

  const handleSeed = async () => {
    setSeeding(true);
    try { await seedDemo(); } finally { setSeeding(false); }
  };

  const handleClear = async () => {
    setClearing(true);
    try { await clearDemo(); } finally { setClearing(false); }
  };

  return (
    <div className={`px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-sm border-b ${
      isDemo
        ? 'bg-amber-50 border-amber-200 text-amber-800'
        : 'bg-emerald-50 border-emerald-200 text-emerald-800'
    }`}>
      <div className="flex items-center gap-2">
        {isDemo ? (
          <Database className="h-4 w-4" />
        ) : (
          <Radio className="h-4 w-4" />
        )}
        <span className="font-medium">
          {isDemo ? 'Demo data — simulated registrations' : 'Live data — real registrations'}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={toggleMode}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            isDemo
              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
              : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
          }`}
        >
          Switch to {isDemo ? 'Live' : 'Demo'}
        </button>
        {isDemo && (
          <>
            <button
              onClick={handleSeed}
              disabled={seeding}
              className="px-3 py-1.5 rounded-md text-xs font-medium bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors disabled:opacity-50 flex items-center gap-1"
            >
              {seeding ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
              Reseed
            </button>
            <button
              onClick={handleClear}
              disabled={clearing}
              className="px-3 py-1.5 rounded-md text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors disabled:opacity-50 flex items-center gap-1"
            >
              {clearing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
              Clear Demo
            </button>
          </>
        )}
        <button
          onClick={refresh}
          className="px-3 py-1.5 rounded-md text-xs font-medium bg-white/60 hover:bg-white transition-colors flex items-center gap-1"
          title="Refresh data"
        >
          <RotateCcw className="h-3 w-3" />
          Refresh
        </button>
      </div>
    </div>
  );
}
