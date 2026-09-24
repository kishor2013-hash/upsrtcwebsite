import React, { useState, useEffect } from 'react';
import { User, DutyDraft } from '../types';
import { api } from '../services/api';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { 
  Bus, 
  ArrowLeft, 
  Save, 
  Send, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Clock, 
  MapPin, 
  Calendar, 
  ShieldCheck,
  FileCheck,
  FileText
} from 'lucide-react';

interface FeedDutyViewProps {
  user: User;
  onNavigate: (view: string) => void;
  onDutySubmitted?: () => void;
}

export const FeedDutyView: React.FC<FeedDutyViewProps> = ({
  user,
  onNavigate,
  onDutySubmitted
}) => {
  const isOnline = useOnlineStatus();

  // Get local date YYYY-MM-DD
  const todayStr = new Date().toISOString().split('T')[0];

  const [dutyDate, setDutyDate] = useState(todayStr);
  const [dutyNumber, setDutyNumber] = useState('Duty 1');
  const [busNumber, setBusNumber] = useState('');
  const [busRegNumber, setBusRegNumber] = useState('');
  const [route, setRoute] = useState('');
  const [routeNumber, setRouteNumber] = useState('');
  const [startPoint, setStartPoint] = useState('');
  const [endPoint, setEndPoint] = useState('');
  const [startTime, setStartTime] = useState('06:00');
  const [endTime, setEndTime] = useState('14:30');
  const [shift, setShift] = useState('Morning');

  // Daily Operational Fields (Starts blank for each new duty)
  const [totalKm, setTotalKm] = useState<string>('');
  const [income, setIncome] = useState<string>('');
  const [passengerCount, setPassengerCount] = useState<string>('');
  const [loadFactor, setLoadFactor] = useState<string>('');
  const [tripsCount, setTripsCount] = useState<string>('2');
  const [ticketCollection, setTicketCollection] = useState<string>('');
  const [cashCollection, setCashCollection] = useState<string>('');
  const [remarks, setRemarks] = useState('');

  // Auto-fill status notification
  const [autoFillRef, setAutoFillRef] = useState<{ recordId: string; date: string } | null>(null);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [availableDrafts, setAvailableDrafts] = useState<DutyDraft[]>([]);

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string; recordId?: string } | null>(null);

  // Load previous duty for smart auto-fill & check drafts
  useEffect(() => {
    let isMounted = true;

    // 1. Fetch smart previous duty reusable fields (Section 12 & 13)
    api.getLatestDutyForAutoFill(user).then((res) => {
      if (!isMounted) return;
      if (res.has_previous && res.previous_duty) {
        const prev = res.previous_duty;
        setBusNumber(prev.bus_number || '');
        setBusRegNumber(prev.bus_reg_number || '');
        setRoute(prev.route || '');
        setRouteNumber(prev.route_number || '');
        setStartPoint(prev.start_point || '');
        setEndPoint(prev.end_point || '');
        if (prev.shift) setShift(prev.shift);
        if (prev.duty_number) setDutyNumber(prev.duty_number);

        setAutoFillRef({
          recordId: prev.ref_record_id,
          date: prev.ref_duty_date
        });
      }
    }).catch(() => {});

    // 2. Fetch any drafts for this employee
    api.getDrafts(user).then((drafts) => {
      if (isMounted) setAvailableDrafts(drafts);
    }).catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [user]);

  // Load selected draft into form
  const handleLoadDraft = (draft: DutyDraft) => {
    const data = draft.draft_data;
    if (draft.duty_date) setDutyDate(draft.duty_date);
    if (data.duty_number) setDutyNumber(data.duty_number);
    if (data.bus_number) setBusNumber(data.bus_number);
    if (data.bus_reg_number) setBusRegNumber(data.bus_reg_number);
    if (data.route) setRoute(data.route);
    if (data.route_number) setRouteNumber(data.route_number);
    if (data.start_point) setStartPoint(data.start_point);
    if (data.end_point) setEndPoint(data.end_point);
    if (data.start_time) setStartTime(data.start_time);
    if (data.end_time) setEndTime(data.end_time);
    if (data.shift) setShift(data.shift);

    if (data.total_km !== undefined) setTotalKm(String(data.total_km));
    if (data.income !== undefined) setIncome(String(data.income));
    if (data.passenger_count !== undefined) setPassengerCount(String(data.passenger_count));
    if (data.load_factor !== undefined) setLoadFactor(String(data.load_factor));
    if (data.trips_count !== undefined) setTripsCount(String(data.trips_count));
    if (data.ticket_collection !== undefined) setTicketCollection(String(data.ticket_collection));
    if (data.cash_collection !== undefined) setCashCollection(String(data.cash_collection));
    if (data.remarks) setRemarks(data.remarks);

    setDraftId(draft.draft_id);
    setStatusMessage({
      type: 'success',
      text: `Draft ${draft.draft_id} loaded successfully.`
    });
  };

  // Sync route string when start/end points change if empty
  const handleStartPointChange = (val: string) => {
    setStartPoint(val);
    if (!route || route.includes('→')) {
      setRoute(`${val} → ${endPoint}`);
    }
  };

  const handleEndPointChange = (val: string) => {
    setEndPoint(val);
    if (!route || route.includes('→')) {
      setRoute(`${startPoint} → ${val}`);
    }
  };

  // Handle Save Draft (Section 15)
  const handleSaveDraft = async () => {
    setStatusMessage(null);
    try {
      setSavingDraft(true);
      const draftPayload = {
        duty_date: dutyDate,
        duty_number: dutyNumber,
        bus_number: busNumber,
        bus_reg_number: busRegNumber,
        route,
        route_number: routeNumber,
        start_point: startPoint,
        end_point: endPoint,
        start_time: startTime,
        end_time: endTime,
        shift,
        total_km: parseFloat(totalKm) || 0,
        income: parseFloat(income) || 0,
        passenger_count: parseInt(passengerCount) || 0,
        load_factor: parseFloat(loadFactor) || 0,
        trips_count: parseInt(tripsCount) || 1,
        ticket_collection: parseFloat(ticketCollection) || 0,
        cash_collection: parseFloat(cashCollection) || 0,
        remarks
      };

      const res = await api.saveDraft(user, draftPayload, draftId || undefined, !isOnline);
      if (res.success) {
        setDraftId(res.draft_id);
        setStatusMessage({
          type: 'success',
          text: res.message
        });
        // Refresh drafts
        api.getDrafts(user).then(setAvailableDrafts);
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Failed to save draft.'
      });
    } finally {
      setSavingDraft(false);
    }
  };

  // Handle Submit Duty (Sections 10, 11, 14)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    // Section 29: Offline network failure check
    if (!isOnline) {
      setStatusMessage({
        type: 'error',
        text: 'Internet connection unavailable. Please reconnect and try again, or click "SAVE DRAFT" to store locally.'
      });
      return;
    }

    if (!dutyDate) {
      setStatusMessage({ type: 'error', text: 'Duty Date is required.' });
      return;
    }
    if (!busNumber.trim()) {
      setStatusMessage({ type: 'error', text: 'Bus Number is required.' });
      return;
    }
    if (!route.trim()) {
      setStatusMessage({ type: 'error', text: 'Route details are required.' });
      return;
    }
    const kmNum = parseFloat(totalKm);
    if (isNaN(kmNum) || kmNum <= 0) {
      setStatusMessage({ type: 'error', text: 'Please enter a valid Total KM greater than 0.' });
      return;
    }
    const incomeNum = parseFloat(income);
    if (isNaN(incomeNum) || incomeNum < 0) {
      setStatusMessage({ type: 'error', text: 'Please enter a valid Income amount.' });
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        duty_date: dutyDate,
        duty_number: dutyNumber.trim() || 'Duty 1',
        bus_number: busNumber.trim().toUpperCase(),
        bus_reg_number: busRegNumber.trim(),
        route: route.trim(),
        route_number: routeNumber.trim(),
        start_point: startPoint.trim() || 'Depot',
        end_point: endPoint.trim() || 'Depot',
        start_time: startTime,
        end_time: endTime,
        shift,
        total_km: kmNum,
        income: incomeNum,
        passenger_count: parseInt(passengerCount) || 0,
        load_factor: parseFloat(loadFactor) || 0,
        trips_count: parseInt(tripsCount) || 1,
        ticket_collection: parseFloat(ticketCollection) || incomeNum,
        cash_collection: parseFloat(cashCollection) || 0,
        remarks: remarks.trim(),
        draft_id: draftId || undefined
      };

      const res = await api.submitDuty(user, payload);

      if (res.success) {
        setStatusMessage({
          type: 'success',
          text: res.message || 'Duty record submitted successfully.',
          recordId: res.record_id
        });

        // Reset operational inputs for next entry
        setTotalKm('');
        setIncome('');
        setPassengerCount('');
        setLoadFactor('');
        setTicketCollection('');
        setCashCollection('');
        setRemarks('');
        setDraftId(null);

        if (onDutySubmitted) {
          onDutySubmitted();
        }

        // Scroll to top of form
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setStatusMessage({
          type: 'error',
          text: res.message || 'Failed to submit duty record.'
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Server error while submitting duty record.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Top Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-blue-900 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>

        {/* Available Drafts Quick Selector */}
        {availableDrafts.length > 0 && (
          <div className="flex items-center gap-2 text-xs bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl text-amber-900">
            <FileText className="w-3.5 h-3.5 text-amber-700" />
            <span className="font-semibold">Saved Drafts:</span>
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {availableDrafts.slice(0, 3).map((d) => (
                <button
                  key={d.draft_id}
                  onClick={() => handleLoadDraft(d)}
                  className="px-2 py-0.5 rounded bg-white hover:bg-amber-100 border border-amber-300 text-[11px] font-mono font-bold transition cursor-pointer"
                >
                  {d.duty_date}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Duty Form Card */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 text-white p-5 sm:p-6 border-b-2 border-amber-500">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-500 text-slate-950 uppercase tracking-wide">
                  Entry Form
                </span>
                <span className="text-xs text-blue-200 font-mono">
                  FEED-DUTY-PORTAL
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-amber-400 tracking-wide uppercase">
                Daily Duty Entry Form
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                UPSRCTC Roadways Official Operational Recording System
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-blue-200">Depot:</span>
              <span className="px-2.5 py-1 bg-blue-900/90 border border-blue-700 rounded-lg text-xs font-bold text-amber-300">
                {user.depot_name}
              </span>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-8 space-y-6">
          {/* Status Notification Alerts */}
          {statusMessage && (
            <div
              className={`p-4 rounded-xl border flex items-start gap-3 animate-in slide-in-from-top duration-200 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : 'bg-rose-50 border-rose-300 text-rose-900'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              )}
              <div className="text-xs sm:text-sm">
                <p className="font-bold">{statusMessage.text}</p>
                {statusMessage.recordId && (
                  <p className="mt-1 text-xs text-emerald-800 font-mono font-semibold">
                    Unique Record ID: <span className="bg-emerald-100 px-2 py-0.5 rounded">{statusMessage.recordId}</span>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Smart Auto-fill Banner (Sections 12 & 13) */}
          {autoFillRef && (
            <div className="bg-amber-50/80 border border-amber-300/80 rounded-xl p-3.5 text-xs text-amber-950 flex items-start gap-3">
              <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <p className="font-bold text-amber-900">
                  ⚡ Smart Previous Data Auto-Fill Active
                </p>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  Reusable bus and route values were conveniently auto-filled from your previous duty (<span className="font-mono font-bold">{autoFillRef.recordId}</span> on {autoFillRef.date}). Today's daily operational figures (KM, Income, Passengers) remain blank for fresh entry. You can modify any field freely.
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1. EMPLOYEE IDENTITY (Auto-Loaded From Database - Read-Only per Section 10) */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4 text-blue-900" />
                  <span>1. Authenticated Employee Identity (Read-Only)</span>
                </div>
                <span className="text-[10px] text-slate-400 font-medium italic">Verified from MySQL</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">
                    Employee Name
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={user.full_name}
                    className="w-full px-2.5 py-1.5 bg-slate-100/90 border border-slate-300/80 rounded-lg font-bold text-slate-900 select-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">
                    Employee ID / CND
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={user.emp_id}
                    className="w-full px-2.5 py-1.5 bg-slate-100/90 border border-slate-300/80 rounded-lg font-mono font-bold text-blue-900 select-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">
                    Employee Role
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={user.emp_type}
                    className="w-full px-2.5 py-1.5 bg-slate-100/90 border border-slate-300/80 rounded-lg font-bold text-emerald-800 uppercase"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">
                    Depot
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={user.depot_name}
                    className="w-full px-2.5 py-1.5 bg-slate-100/90 border border-slate-300/80 rounded-lg font-semibold text-slate-800"
                  />
                </div>
              </div>
            </div>

            {/* 2. DUTY SCHEDULE & ASSIGNMENT */}
            <div>
              <div className="flex items-center gap-2 pb-2 mb-3 border-b border-slate-200 text-blue-950 font-bold text-xs uppercase tracking-wider">
                <Calendar className="w-4 h-4 text-amber-500" />
                <span>2. Duty Schedule &amp; Bus Assignment</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Duty Date (Native browser/device date picker - Section 11) */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Duty Date <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      required
                      value={dutyDate}
                      onChange={(e) => setDutyDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 shadow-xs cursor-pointer"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">Native device date picker</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Duty Number / Shift Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Duty 1 or Shift A"
                    value={dutyNumber}
                    onChange={(e) => setDutyNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Shift Period
                  </label>
                  <select
                    value={shift}
                    onChange={(e) => setShift(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs cursor-pointer"
                  >
                    <option value="Morning">Morning Shift (सुबह)</option>
                    <option value="Evening">Evening Shift (शाम)</option>
                    <option value="Night">Night Shift (रात)</option>
                    <option value="Double">Double Shift (डबल)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Bus Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. UP 15 AT 1234"
                    value={busNumber}
                    onChange={(e) => setBusNumber(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs"
                  />
                  <p className="text-[10px] text-slate-500 mt-0.5">Bus plate registration</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Depot Bus ID (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. BUS-409"
                    value={busRegNumber}
                    onChange={(e) => setBusRegNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 3. ROUTE DETAILS */}
            <div>
              <div className="flex items-center gap-2 pb-2 mb-3 border-b border-slate-200 text-blue-950 font-bold text-xs uppercase tracking-wider">
                <MapPin className="w-4 h-4 text-amber-500" />
                <span>3. Route Information</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Start Point (शुरुआत)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Meerut Sohrab Gate"
                    value={startPoint}
                    onChange={(e) => handleStartPointChange(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    End Point (गंतव्य)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Anand Vihar ISBT Delhi"
                    value={endPoint}
                    onChange={(e) => handleEndPointChange(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Route Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Meerut → Delhi"
                    value={route}
                    onChange={(e) => setRoute(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs"
                  />
                </div>
              </div>
            </div>

            {/* 4. DAILY OPERATIONAL DATA (Today's Actuals - Blank for Entry) */}
            <div className="bg-amber-50/40 border border-amber-200/80 rounded-2xl p-4 sm:p-5">
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-amber-200 text-amber-950 font-bold text-xs uppercase tracking-wider">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-amber-600" />
                  <span>4. Daily Operational Data (Today's Actuals)</span>
                </div>
                <span className="text-[10px] text-amber-800 font-semibold bg-amber-200/60 px-2 py-0.5 rounded">
                  Mandatory Entry
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1">
                    Total KM (कुल किलोमीटर) <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      required
                      placeholder="e.g. 280.5"
                      value={totalKm}
                      onChange={(e) => setTotalKm(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-base font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs"
                    />
                    <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs font-bold text-slate-400">
                      KM
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1">
                    Income / Collection (कुल आय) <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-sm font-bold text-slate-500">
                      ₹
                    </span>
                    <input
                      type="number"
                      step="1"
                      required
                      placeholder="e.g. 12450"
                      value={income}
                      onChange={(e) => {
                        setIncome(e.target.value);
                        if (!ticketCollection) setTicketCollection(e.target.value);
                      }}
                      className="w-full pl-8 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-base font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1">
                    Passenger Count (यात्री संख्या)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 85"
                    value={passengerCount}
                    onChange={(e) => setPassengerCount(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-base font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1">
                    Load Factor % (लोड फैक्टर)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      placeholder="e.g. 82.5"
                      value={loadFactor}
                      onChange={(e) => setLoadFactor(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-base font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs"
                    />
                    <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs font-bold text-slate-400">
                      %
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1">
                    Number of Trips (फेरे)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={tripsCount}
                    onChange={(e) => setTripsCount(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-base font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1">
                    Ticket Machine Collection (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-sm font-bold text-slate-500">
                      ₹
                    </span>
                    <input
                      type="number"
                      placeholder="e.g. 11900"
                      value={ticketCollection}
                      onChange={(e) => setTicketCollection(e.target.value)}
                      className="w-full pl-8 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-base font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs"
                    />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-slate-900 mb-1">
                    Duty Remarks / Special Notes (टिप्पणी)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Regular express service on time, diesel refueled at depot"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons (Section 10 & 14) */}
            <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => onNavigate('dashboard')}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs uppercase tracking-wider transition cursor-pointer"
              >
                CANCEL
              </button>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                {/* Save Draft Button (Section 15) */}
                <button
                  type="button"
                  disabled={savingDraft || submitting}
                  onClick={handleSaveDraft}
                  className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl border-2 border-slate-800 text-slate-900 hover:bg-slate-100 font-extrabold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4 text-slate-700" />
                  <span>{savingDraft ? 'Saving Draft...' : 'SAVE DRAFT'}</span>
                </button>

                {/* Submit Duty Button (Sections 10 & 14) */}
                <button
                  type="submit"
                  disabled={submitting || savingDraft}
                  className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/25 active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 text-slate-950" />
                      <span>SUBMIT DUTY</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
