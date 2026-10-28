import { useState, useEffect } from 'react';
import { 
  Search, 
  Download, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  Users, 
  RotateCcw,
  CheckCircle,
  FileSpreadsheet
} from 'lucide-react';
import { getRegistrations, exportRegistrations } from '../../lib/api';
import { useDataMode } from '../../contexts/DataModeContext';
import { LoadingSpinner, ErrorState, EmptyState } from '../../components/ui/States';
import { formatSourceName, formatDateTime, getSourceColor } from '../../lib/utils';
import type { Registration } from '../../types';

export default function RegistrationsPage() {
  const { isDemo, refreshKey } = useDataMode();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // reset to page 1 on search
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    let mounted = true;
    async function fetchRegs() {
      setLoading(true);
      setError(null);
      try {
        const res = await getRegistrations({
          demo: isDemo,
          page,
          limit: 15,
          search: debouncedSearch,
          source: sourceFilter || undefined,
        });
        if (mounted) {
          setRegistrations(res.registrations);
          setTotal(res.total);
          setTotalPages(res.totalPages);
        }
      } catch (err: any) {
        if (mounted) setError(err.message || 'Failed to load registrations');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchRegs();
    return () => { mounted = false; };
  }, [isDemo, page, debouncedSearch, sourceFilter, refreshKey]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await exportRegistrations(isDemo);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = isDemo ? 'demo_workshop_registrations.csv' : 'workshop_registrations.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      alert('Failed to export CSV: ' + err.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Registration Records
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
              {total} total
            </span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Real-time view of registrations stored in the database.
          </p>
        </div>

        <button
          onClick={handleExport}
          disabled={exporting || total === 0}
          className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2 shadow-sm self-start sm:self-auto"
        >
          <FileSpreadsheet className="w-4 h-4" />
          {exporting ? 'Generating CSV...' : 'Export Safe CSV'}
        </button>
      </div>

      {/* Filters and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative sm:col-span-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name, college, or registration ID..."
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
            >
              Clear
            </button>
          )}
        </div>

        <div>
          <select
            value={sourceFilter}
            onChange={(e) => { setSourceFilter(e.target.value); setPage(1); }}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
          >
            <option value="">All Acquisition Channels</option>
            <option value="whatsapp">College WhatsApp Groups</option>
            <option value="class_representative">Class Representatives</option>
            <option value="tech_club">Tech Clubs & Communities</option>
            <option value="referral">Student Referrals</option>
            <option value="organic">Organic / Email</option>
            <option value="direct">Direct</option>
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-12">
            <LoadingSpinner message="Loading registration records..." />
          </div>
        ) : error ? (
          <div className="p-8">
            <ErrorState message={error} />
          </div>
        ) : registrations.length === 0 ? (
          <div className="p-12 text-center">
            <EmptyState 
              title="No registrations found" 
              description={debouncedSearch || sourceFilter ? "No matching records found for the active filter. Try resetting your query." : "No registrations have been captured yet."}
              icon={<Users className="w-8 h-8 text-slate-500 mx-auto" />}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="text-[11px] text-slate-400 uppercase bg-slate-800/80 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4 font-semibold">Reg ID</th>
                  <th className="py-3 px-4 font-semibold">Student Name</th>
                  <th className="py-3 px-4 font-semibold">College & Branch</th>
                  <th className="py-3 px-4 font-semibold">Grad Year</th>
                  <th className="py-3 px-4 font-semibold">Source Channel</th>
                  <th className="py-3 px-4 font-semibold">Referral Used</th>
                  <th className="py-3 px-4 font-semibold">Own Ref Code</th>
                  <th className="py-3 px-4 font-semibold">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-normal">
                {registrations.map((reg) => (
                  <tr key={reg.registration_id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-blue-400 whitespace-nowrap">
                      {reg.registration_id}
                    </td>
                    <td className="py-3 px-4 font-medium text-white whitespace-nowrap">
                      {reg.full_name}
                    </td>
                    <td className="py-3 px-4 max-w-[220px] truncate" title={`${reg.college} (${reg.branch})`}>
                      <span className="text-slate-200">{reg.college}</span>
                      <span className="text-slate-500 block text-[11px] truncate">{reg.branch}</span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-300">
                      {reg.graduation_year}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span 
                        className="inline-block px-2 py-0.5 rounded text-[10px] font-medium"
                        style={{
                          backgroundColor: `${getSourceColor(reg.acquisition_source)}15`,
                          color: getSourceColor(reg.acquisition_source),
                          border: `1px solid ${getSourceColor(reg.acquisition_source)}30`
                        }}
                      >
                        {formatSourceName(reg.acquisition_source)}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                      {reg.referral_code_used ? (
                        <span className="text-emerald-400 font-semibold">{reg.referral_code_used}</span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-300 whitespace-nowrap">
                      {reg.own_referral_code}
                    </td>
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                      {formatDateTime(reg.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div>
              Showing page <span className="text-white font-medium">{page}</span> of{' '}
              <span className="text-white font-medium">{totalPages}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 border border-slate-700"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 border border-slate-700"
                aria-label="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CSV Safety Note */}
      <div className="text-[11px] text-slate-500 leading-relaxed px-1">
        * <strong>Security note:</strong> CSV export automatically mitigates CSV Formula Injection (DDE) by sanitizing cells beginning with formula triggers (<code className="text-slate-400">=, +, -, @</code>).
      </div>
    </div>
  );
}
