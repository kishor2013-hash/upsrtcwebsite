import React, { useState, useEffect, useCallback } from 'react';
import { User, DutyRecord, DutyStats } from '../types';
import { api } from '../services/api';
import { PdfReportModal } from './PdfReportModal';
import { 
  Table, 
  Search, 
  Filter, 
  ArrowLeft, 
  Download, 
  Printer, 
  Eye, 
  ChevronLeft, 
  ChevronRight, 
  RefreshCw, 
  Bus, 
  Calendar,
  IndianRupee,
  TrendingUp,
  X,
  Clock,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

interface ShowDataViewProps {
  user: User;
  onNavigate: (view: string) => void;
}

export const ShowDataView: React.FC<ShowDataViewProps> = ({
  user,
  onNavigate
}) => {
  const [records, setRecords] = useState<DutyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<DutyRecord | null>(null);
  const [showPdfModal, setShowPdfModal] = useState(false);

  // Filters and pagination state
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const [search, setSearch] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>(String(new Date().getMonth() + 1));
  const [selectedYear, setSelectedYear] = useState<string>(String(new Date().getFullYear()));
  const [busFilter, setBusFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Derived calculations state
  const [stats, setStats] = useState<DutyStats>({
    total_duties: 0,
    total_km: 0,
    total_income: 0,
    total_trips: 0,
    avg_km: 0,
    avg_income: 0,
    avg_load_factor: 0
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getDuties(user, {
        page,
        limit,
        month: selectedMonth ? parseInt(selectedMonth) : undefined,
        year: selectedYear ? parseInt(selectedYear) : undefined,
        bus: busFilter.trim() || undefined,
        status: statusFilter || undefined,
        search: search.trim() || undefined
      });

      setRecords(res.records);
      setTotalPages(res.pagination.total_pages || 1);
      setTotalRecords(res.pagination.total_records || 0);
      setStats(res.summary);
    } catch (err) {
      console.error('Error fetching duty records:', err);
    } finally {
      setLoading(false);
    }
  }, [user, page, limit, selectedMonth, selectedYear, busFilter, statusFilter, search]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleClearFilters = () => {
    setSearch('');
    setSelectedMonth('');
    setSelectedYear(String(new Date().getFullYear()));
    setBusFilter('');
    setStatusFilter('');
    setPage(1);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-blue-900 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadData()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Reload</span>
          </button>

          <button
            onClick={() => setShowPdfModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-blue-900 to-indigo-900 hover:from-blue-800 hover:to-indigo-800 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-950/20 transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-amber-400" />
            <span>Export PDF Report</span>
          </button>
        </div>
      </div>

      {/* Calculated Monthly Statistics Cards (Strictly Real MySQL Data - Section 17) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] text-slate-500 font-semibold uppercase">Total Duties</p>
          <p className="text-xl font-black text-slate-900 mt-1">{stats.total_duties}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Recorded trips</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] text-slate-500 font-semibold uppercase">Total Distance</p>
          <p className="text-xl font-black text-amber-600 mt-1">{stats.total_km.toLocaleString('en-IN')} <span className="text-xs font-normal text-slate-500">KM</span></p>
          <p className="text-[10px] text-slate-400 mt-0.5">Cumulative mileage</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] text-slate-500 font-semibold uppercase">Total Income</p>
          <p className="text-xl font-black text-emerald-600 mt-1">₹{stats.total_income.toLocaleString('en-IN')}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Ticket &amp; cash revenue</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] text-slate-500 font-semibold uppercase">Avg Distance</p>
          <p className="text-xl font-black text-blue-900 mt-1">{stats.avg_km} <span className="text-xs font-normal text-slate-500">KM</span></p>
          <p className="text-[10px] text-slate-400 mt-0.5">Per duty average</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] text-slate-500 font-semibold uppercase">Avg Income</p>
          <p className="text-xl font-black text-emerald-700 mt-1">₹{stats.avg_income}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Per duty average</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] text-slate-500 font-semibold uppercase">Avg Load Factor</p>
          <p className="text-xl font-black text-sky-600 mt-1">{stats.avg_load_factor}%</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Passenger occupancy</p>
        </div>
      </div>

      {/* Filter and Search Bar Card */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-4 sm:p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Box */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search bus, route, record ID, employee..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Month Filter */}
          <div>
            <select
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
            >
              <option value="">All Months</option>
              <option value="1">January (जनवरी)</option>
              <option value="2">February (फ़रवरी)</option>
              <option value="3">March (मार्च)</option>
              <option value="4">April (अप्रैल)</option>
              <option value="5">May (मई)</option>
              <option value="6">June (जून)</option>
              <option value="7">July (जुलाई)</option>
              <option value="8">August (अगस्त)</option>
              <option value="9">September (सितंबर)</option>
              <option value="10">October (अक्टूबर)</option>
              <option value="11">November (नवंबर)</option>
              <option value="12">December (दिसंबर)</option>
            </select>
          </div>

          {/* Year Filter */}
          <div>
            <select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
            >
              <option value="">All Years</option>
              <option value="2027">2027</option>
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
            </select>
          </div>

          {/* Reset Filters */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleClearFilters}
              className="w-full py-2 px-3 border border-slate-300 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-600 transition cursor-pointer text-center"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Main Records Table Card */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Table className="w-4 h-4 text-blue-900" />
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Duty Records Log
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            Showing {records.length} of {totalRecords} Records
          </span>
        </div>

        {/* Responsive Table for Desktop + Card view for Mobile */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="p-3 pl-5">Duty Date</th>
                <th className="p-3">Duty No</th>
                <th className="p-3">Bus Number</th>
                <th className="p-3">Route</th>
                <th className="p-3 text-right">KM</th>
                <th className="p-3 text-right">Income (₹)</th>
                <th className="p-3 text-center">Load %</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-center pr-5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="p-10 text-center text-slate-500">
                    <div className="inline-block w-6 h-6 border-2 border-blue-900 border-t-transparent rounded-full animate-spin mb-2"></div>
                    <p className="font-semibold text-xs">Loading duty records from central MySQL...</p>
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-slate-500">
                    <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                      <Bus className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-slate-700">No duty records found.</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      There are no duty records matching the selected filters. Click "FEED DUTY" to record your daily operational shift.
                    </p>
                    <button
                      onClick={() => onNavigate('feed-duty')}
                      className="mt-4 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider transition cursor-pointer"
                    >
                      Record First Duty
                    </button>
                  </td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr key={r.record_id || r.id} className="hover:bg-blue-50/40 transition">
                    <td className="p-3 pl-5 font-semibold text-slate-900 whitespace-nowrap">
                      {r.duty_date}
                    </td>
                    <td className="p-3 text-slate-700 whitespace-nowrap">
                      {r.duty_number}
                    </td>
                    <td className="p-3 font-mono font-bold text-blue-950 whitespace-nowrap">
                      {r.bus_number}
                    </td>
                    <td className="p-3 font-medium text-slate-800 max-w-xs truncate" title={r.route}>
                      {r.route}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900">
                      {r.total_km}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-700">
                      ₹{r.income.toLocaleString('en-IN')}
                    </td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 bg-slate-100 rounded text-[11px] font-semibold text-slate-700">
                        {r.load_factor ? `${r.load_factor}%` : '-'}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 tracking-wider">
                        {r.status}
                      </span>
                    </td>
                    <td className="p-3 pr-5 text-center">
                      <button
                        onClick={() => setSelectedRecord(r)}
                        className="p-1.5 rounded-lg text-blue-900 hover:bg-blue-100 hover:text-blue-950 transition cursor-pointer"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Server Pagination Footer */}
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Record Details Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-slate-900">
            <div className="bg-blue-950 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bus className="w-4 h-4 text-amber-400" />
                <h4 className="text-sm font-bold tracking-wider uppercase">
                  Duty Record Details
                </h4>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-blue-900 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex justify-between items-center">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Record ID</span>
                  <span className="font-mono font-bold text-blue-950 text-sm">{selectedRecord.record_id}</span>
                </div>
                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[10px] uppercase">
                  {selectedRecord.status}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-2.5 bg-slate-50 rounded-lg">
                  <span className="text-slate-400 block text-[10px]">Duty Date</span>
                  <span className="font-bold text-slate-800">{selectedRecord.duty_date}</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg">
                  <span className="text-slate-400 block text-[10px]">Bus Number</span>
                  <span className="font-mono font-bold text-blue-900">{selectedRecord.bus_number}</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg">
                  <span className="text-slate-400 block text-[10px]">Shift</span>
                  <span className="font-bold text-slate-800">{selectedRecord.shift}</span>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-lg">
                  <span className="text-slate-400 block text-[10px]">Total Distance</span>
                  <span className="font-bold text-amber-600 font-mono">{selectedRecord.total_km} KM</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg">
                  <span className="text-slate-400 block text-[10px]">Income / Revenue</span>
                  <span className="font-bold text-emerald-700 font-mono">₹{selectedRecord.income.toLocaleString('en-IN')}</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg">
                  <span className="text-slate-400 block text-[10px]">Load Factor</span>
                  <span className="font-bold text-sky-700 font-mono">{selectedRecord.load_factor ? `${selectedRecord.load_factor}%` : '-'}</span>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-lg col-span-2 sm:col-span-3">
                  <span className="text-slate-400 block text-[10px]">Route Description</span>
                  <span className="font-bold text-slate-800">{selectedRecord.route}</span>
                </div>

                {selectedRecord.remarks && (
                  <div className="p-2.5 bg-amber-50 rounded-lg col-span-2 sm:col-span-3 border border-amber-200">
                    <span className="text-amber-800 block text-[10px] font-bold">Remarks:</span>
                    <span className="text-slate-700">{selectedRecord.remarks}</span>
                  </div>
                )}
              </div>

              <button
                onClick={() => setSelectedRecord(null)}
                className="w-full py-2 bg-blue-950 hover:bg-blue-900 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition cursor-pointer mt-3"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PDF Report Modal Component */}
      <PdfReportModal
        isOpen={showPdfModal}
        onClose={() => setShowPdfModal(false)}
        user={user}
        records={records}
        summary={stats}
        month={selectedMonth ? parseInt(selectedMonth) : undefined}
        year={selectedYear ? parseInt(selectedYear) : undefined}
      />
    </div>
  );
};
