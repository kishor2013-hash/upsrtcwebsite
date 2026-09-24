import React from 'react';
import { User, DutyRecord, DutyStats } from '../types';
import { Printer, Download, X, Bus, CheckCircle2 } from 'lucide-react';

interface PdfReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  records: DutyRecord[];
  summary: DutyStats;
  month?: number;
  year?: number;
}

export const PdfReportModal: React.FC<PdfReportModalProps> = ({
  isOpen,
  onClose,
  user,
  records,
  summary,
  month,
  year
}) => {
  if (!isOpen) return null;

  const currentYear = year || new Date().getFullYear();
  const currentMonth = month || new Date().getMonth() + 1;
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const periodLabel = `${monthNames[currentMonth - 1]} ${currentYear}`;
  const reportId = `UPSRCTC-REP-${currentYear}${String(currentMonth).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;
  const generatedDate = new Date().toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'medium'
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-300 overflow-hidden my-auto print:m-0 print:border-0 print:shadow-none">
        {/* Print Toolbar (Hidden during actual print) */}
        <div className="bg-slate-900 text-white px-5 py-3 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <Bus className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Official PDF Duty Report Preview
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-6 sm:p-8 text-slate-900 bg-white" id="printable-duty-report">
          {/* Header */}
          <div className="border-b-2 border-blue-950 pb-4 mb-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-blue-950 rounded-xl p-1 flex items-center justify-center border-2 border-amber-500">
                  <img src="/icon.svg" alt="Emblem" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl font-black text-blue-950 tracking-wide uppercase">
                    UTTAR PRADESH STATE ROAD TRANSPORT CORPORATION
                  </h1>
                  <h2 className="text-sm font-bold text-amber-700 tracking-wider">
                    UPSRCTC ROADWAYS • DIGITAL DUTY PORTAL V4.0
                  </h2>
                  <p className="text-[11px] text-slate-600 font-semibold">
                    Monthly Certified Duty Log &amp; Performance Summary
                  </p>
                </div>
              </div>
              <div className="text-right text-xs">
                <p className="font-mono text-slate-500 font-bold">Report ID: {reportId}</p>
                <p className="text-slate-500 text-[11px]">Generated: {generatedDate}</p>
                <span className="inline-block mt-1 px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px] uppercase">
                  Authenticated Database Record
                </span>
              </div>
            </div>
          </div>

          {/* Employee & Period Credentials Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs mb-5">
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Employee Name:</span>
              <span className="font-bold text-slate-900 text-sm">{user.full_name}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold block">CND / Emp ID:</span>
              <span className="font-bold font-mono text-blue-950 text-sm">{user.emp_id}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Designation / Role:</span>
              <span className="font-bold text-slate-800">{user.emp_type} ({user.designation || 'Staff'})</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Depot Name:</span>
              <span className="font-bold text-slate-800">{user.depot_name}</span>
            </div>
          </div>

          {/* Month Calculations Summary Strip */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center mb-5">
            <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg">
              <span className="text-[10px] text-blue-800 font-semibold block uppercase">Total Duties</span>
              <span className="text-base font-black text-blue-950">{summary.total_duties}</span>
            </div>
            <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
              <span className="text-[10px] text-amber-800 font-semibold block uppercase">Total KM</span>
              <span className="text-base font-black text-amber-950">{summary.total_km.toLocaleString('en-IN')}</span>
            </div>
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg">
              <span className="text-[10px] text-emerald-800 font-semibold block uppercase">Total Income</span>
              <span className="text-base font-black text-emerald-950">₹{summary.total_income.toLocaleString('en-IN')}</span>
            </div>
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-[10px] text-slate-700 font-semibold block uppercase">Avg KM/Duty</span>
              <span className="text-base font-black text-slate-900">{summary.avg_km}</span>
            </div>
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-[10px] text-slate-700 font-semibold block uppercase">Avg Income</span>
              <span className="text-base font-black text-slate-900">₹{summary.avg_income}</span>
            </div>
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-[10px] text-slate-700 font-semibold block uppercase">Avg Load Factor</span>
              <span className="text-base font-black text-slate-900">{summary.avg_load_factor}%</span>
            </div>
          </div>

          {/* Records Table */}
          <div className="overflow-x-auto mb-6">
            <table className="w-full text-left text-xs border-collapse border border-slate-200">
              <thead>
                <tr className="bg-blue-950 text-white text-[11px] uppercase tracking-wider">
                  <th className="p-2 border border-blue-900">#</th>
                  <th className="p-2 border border-blue-900">Duty Date</th>
                  <th className="p-2 border border-blue-900">Duty No</th>
                  <th className="p-2 border border-blue-900">Bus Number</th>
                  <th className="p-2 border border-blue-900">Route</th>
                  <th className="p-2 border border-blue-900 text-right">KM</th>
                  <th className="p-2 border border-blue-900 text-right">Income (₹)</th>
                  <th className="p-2 border border-blue-900 text-center">Load %</th>
                  <th className="p-2 border border-blue-900">Record ID</th>
                </tr>
              </thead>
              <tbody>
                {records.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-6 text-center text-slate-400 italic">
                      No duty records recorded for this statement period.
                    </td>
                  </tr>
                ) : (
                  records.map((r, idx) => (
                    <tr key={r.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="p-2 border border-slate-200 font-mono text-[10px] text-slate-500">{idx + 1}</td>
                      <td className="p-2 border border-slate-200 font-semibold">{r.duty_date}</td>
                      <td className="p-2 border border-slate-200">{r.duty_number}</td>
                      <td className="p-2 border border-slate-200 font-mono font-bold text-slate-800">{r.bus_number}</td>
                      <td className="p-2 border border-slate-200">{r.route}</td>
                      <td className="p-2 border border-slate-200 text-right font-bold font-mono">{r.total_km}</td>
                      <td className="p-2 border border-slate-200 text-right font-bold text-emerald-800 font-mono">₹{r.income.toLocaleString('en-IN')}</td>
                      <td className="p-2 border border-slate-200 text-center">{r.load_factor ? `${r.load_factor}%` : '-'}</td>
                      <td className="p-2 border border-slate-200 font-mono text-[10px] text-slate-500">{r.record_id}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Verification & Signatures */}
          <div className="mt-8 pt-6 border-t border-slate-300 flex items-center justify-between text-xs text-slate-600">
            <div className="text-center">
              <div className="w-36 border-b border-slate-400 mb-1"></div>
              <p className="font-semibold">Signature of Employee</p>
              <p className="text-[10px] text-slate-400">({user.emp_id})</p>
            </div>

            <div className="text-center text-[10px] text-slate-400 max-w-xs">
              <p className="font-bold text-slate-700">Powered by Grofasto Digital Solutions</p>
              <p>GROW | CONNECT | SUCCEED. • www.grofasto.com</p>
            </div>

            <div className="text-center">
              <div className="w-36 border-b border-slate-400 mb-1"></div>
              <p className="font-semibold">Depot In-Charge / Admin</p>
              <p className="text-[10px] text-slate-400">({user.depot_name})</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
