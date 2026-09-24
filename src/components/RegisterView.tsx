import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { AppSettings, DepotItem } from '../types';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Lock, 
  Bus, 
  MapPin, 
  Briefcase, 
  AlertCircle, 
  CheckCircle2, 
  ArrowLeft,
  ShieldCheck,
  Eye,
  EyeOff
} from 'lucide-react';

interface RegisterViewProps {
  settings: AppSettings;
  onNavigateLogin: (prefilledMessage?: string) => void;
}

export const RegisterView: React.FC<RegisterViewProps> = ({
  settings,
  onNavigateLogin
}) => {
  const [formData, setFormData] = useState({
    full_name: '',
    dob: '',
    mobile: '',
    email: '',
    password: '',
    confirm_password: '',
    emp_id: '',
    emp_type: 'DRIVER' as 'DRIVER' | 'CONDUCTOR' | 'ADMIN',
    depot_name: 'Sohrab Gate Depot',
    depot_code: 'SOHRAB',
    designation: 'Roadways Driver',
    joining_date: '',
    address: ''
  });

  const [depots, setDepots] = useState<DepotItem[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    api.getDepots().then((data) => {
      setDepots(data);
      if (data.length > 0) {
        setFormData(prev => ({
          ...prev,
          depot_name: data[0].depot_name,
          depot_code: data[0].depot_code
        }));
      }
    });
  }, []);

  const handleDepotChange = (depotName: string) => {
    const found = depots.find(d => d.depot_name === depotName);
    setFormData(prev => ({
      ...prev,
      depot_name: depotName,
      depot_code: found ? found.depot_code : ''
    }));
  };

  const handleEmpTypeChange = (type: 'DRIVER' | 'CONDUCTOR' | 'ADMIN') => {
    setFormData(prev => ({
      ...prev,
      emp_type: type,
      designation: type === 'DRIVER' ? 'Roadways Driver' : type === 'CONDUCTOR' ? 'Roadways Conductor' : 'Depot Administrator'
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    // Form Validations
    if (!formData.full_name.trim()) {
      setErrorMsg('Full Name is required.');
      return;
    }
    const cleanMobile = formData.mobile.replace(/\D/g, '');
    if (cleanMobile.length !== 10) {
      setErrorMsg('Mobile number must be exactly 10 digits.');
      return;
    }
    if (!formData.email.includes('@') || !formData.email.includes('.')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (!formData.emp_id.trim()) {
      setErrorMsg('Employee ID / CND Number is required.');
      return;
    }
    if (formData.password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }
    if (formData.password !== formData.confirm_password) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.register({
        ...formData,
        mobile: cleanMobile
      });

      if (res.success) {
        setSuccessMsg(res.message || 'Account created successfully. Please login to continue.');
        setTimeout(() => {
          onNavigateLogin('Account created successfully. Please login to continue.');
        }, 2000);
      } else {
        setErrorMsg(res.message || 'Registration failed. Please check your details.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Unable to register. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-slate-100 py-8 px-4 selection:bg-amber-500 selection:text-slate-950">
      <div className="max-w-2xl mx-auto">
        {/* Top Back Navigation */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => onNavigateLogin()}
            className="flex items-center gap-2 text-xs font-bold text-amber-400 hover:text-amber-300 transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Login</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Official Portal</span>
            <span className="px-2 py-0.5 rounded bg-blue-900 text-[10px] font-bold text-amber-400 border border-blue-700">
              V4.0
            </span>
          </div>
        </div>

        {/* Card */}
        <div className="bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-700 p-6 sm:p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500"></div>

          {/* Heading */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 p-2 text-amber-400 mb-2">
              <Bus className="w-8 h-8" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-amber-400 uppercase tracking-wide">
              Employee Registration
            </h1>
            <p className="text-xs text-slate-300 mt-1">
              UPSRCTC Roadways • Digital Duty Portal V4.0
            </p>
          </div>

          {/* Messages */}
          {errorMsg && (
            <div className="mb-5 p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-start gap-2 animate-pulse">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span className="font-semibold">{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1. PERSONAL INFORMATION */}
            <div>
              <div className="flex items-center gap-2 pb-2 mb-3 border-b border-slate-800 text-amber-400 font-bold text-xs uppercase tracking-wider">
                <User className="w-4 h-4" />
                <span>1. Personal Information</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Full Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kishor Kumar"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Mobile Number (10 digits) <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs text-slate-500 font-mono">
                      +91
                    </span>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      placeholder="9457690255"
                      value={formData.mobile}
                      onChange={(e) => setFormData({ ...formData, mobile: e.target.value.replace(/\D/g, '') })}
                      className="w-full pl-12 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Email Address <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="employee@upsrctc.in"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Password <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      placeholder="Min 6 characters"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-3 pr-10 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white cursor-pointer"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Confirm Password <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      placeholder="Re-enter password"
                      value={formData.confirm_password}
                      onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                      className="w-full px-3 pr-10 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white cursor-pointer"
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. EMPLOYEE INFORMATION */}
            <div>
              <div className="flex items-center gap-2 pb-2 mb-3 border-b border-slate-800 text-amber-400 font-bold text-xs uppercase tracking-wider">
                <Briefcase className="w-4 h-4" />
                <span>2. Employee Information</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Employee ID / CND Number <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CND-4821 or EMP-1092"
                    value={formData.emp_id}
                    onChange={(e) => setFormData({ ...formData, emp_id: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Employee Type / Role <span className="text-rose-400">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['DRIVER', 'CONDUCTOR', 'ADMIN'] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => handleEmpTypeChange(type)}
                        className={`py-2 px-2 text-xs font-bold rounded-xl border transition cursor-pointer ${
                          formData.emp_type === type
                            ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                            : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 3. DEPOT INFORMATION */}
            <div>
              <div className="flex items-center gap-2 pb-2 mb-3 border-b border-slate-800 text-amber-400 font-bold text-xs uppercase tracking-wider">
                <Bus className="w-4 h-4" />
                <span>3. Depot Information</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Depot Name <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={formData.depot_name}
                    onChange={(e) => handleDepotChange(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {depots.map((d) => (
                      <option key={d.depot_code} value={d.depot_name}>
                        {d.depot_name} ({d.region})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Depot Code
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={formData.depot_code}
                    className="w-full px-3 py-2 bg-slate-800/60 border border-slate-700 rounded-xl text-sm text-slate-400 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* 4. OTHER DETAILS */}
            <div>
              <div className="flex items-center gap-2 pb-2 mb-3 border-b border-slate-800 text-amber-400 font-bold text-xs uppercase tracking-wider">
                <MapPin className="w-4 h-4" />
                <span>4. Additional Information</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Designation
                  </label>
                  <input
                    type="text"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Joining Date
                  </label>
                  <input
                    type="date"
                    value={formData.joining_date}
                    onChange={(e) => setFormData({ ...formData, joining_date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Residential Address
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your current address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-sm uppercase tracking-wider rounded-xl shadow-lg shadow-amber-500/25 active:scale-[0.99] transition duration-150 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer mt-4"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                  <span>Registering Employee...</span>
                </>
              ) : (
                <span>COMPLETE REGISTRATION</span>
              )}
            </button>
          </form>

          <div className="mt-5 text-center text-xs text-slate-400">
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => onNavigateLogin()}
              className="font-bold text-amber-400 hover:text-amber-300 underline cursor-pointer"
            >
              Click here to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
