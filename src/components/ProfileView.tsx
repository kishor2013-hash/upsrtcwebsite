import React, { useState } from 'react';
import { User } from '../types';
import { api } from '../services/api';
import { 
  User as UserIcon, 
  ArrowLeft, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  ShieldCheck, 
  Briefcase, 
  Bus, 
  KeyRound, 
  CheckCircle2, 
  AlertCircle,
  Save
} from 'lucide-react';

interface ProfileViewProps {
  user: User;
  onNavigate: (view: string) => void;
  onUserUpdated?: (updated: User) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  onNavigate,
  onUserUpdated
}) => {
  const [mobile, setMobile] = useState(user.mobile || '');
  const [email, setEmail] = useState(user.email || '');
  const [address, setAddress] = useState(user.address || '');
  const [designation, setDesignation] = useState(user.designation || '');

  // Change password state
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);

    try {
      setSaving(true);
      if (showPasswordSection && newPassword) {
        if (newPassword.length < 6) {
          setMsg({ type: 'error', text: 'Password must be at least 6 characters.' });
          setSaving(false);
          return;
        }
        if (newPassword !== confirmPassword) {
          setMsg({ type: 'error', text: 'Passwords do not match.' });
          setSaving(false);
          return;
        }
      }

      const updated: User = {
        ...user,
        mobile,
        email,
        address,
        designation
      };

      if (onUserUpdated) {
        onUserUpdated(updated);
      }

      setMsg({ type: 'success', text: 'Profile details updated successfully.' });
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Failed to update profile.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-200">
      <button
        onClick={() => onNavigate('dashboard')}
        className="flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-blue-900 transition cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Dashboard</span>
      </button>

      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Banner */}
        <div className="bg-gradient-to-r from-blue-950 to-indigo-950 p-6 text-white border-b-2 border-amber-500">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 p-1 flex items-center justify-center text-slate-950 font-black text-2xl shadow-lg">
              {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-black text-white">{user.full_name}</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-slate-950 uppercase tracking-wider">
                  {user.emp_type}
                </span>
              </div>
              <p className="text-xs text-blue-200 font-mono">CND / Employee ID: {user.emp_id}</p>
              <p className="text-xs text-slate-300 mt-0.5">{user.depot_name} Depot</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6 text-xs">
          {msg && (
            <div
              className={`p-3.5 rounded-xl border flex items-start gap-2.5 ${
                msg.type === 'success'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : 'bg-rose-50 border-rose-300 text-rose-900'
              }`}
            >
              {msg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              )}
              <span className="font-semibold">{msg.text}</span>
            </div>
          )}

          {/* Read-Only Official Identification Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <h3 className="font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-900" />
              <span>Official Department Record</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <span className="text-[10px] text-slate-500 font-semibold block uppercase">Employee ID</span>
                <span className="font-bold font-mono text-slate-900">{user.emp_id}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-semibold block uppercase">Role Type</span>
                <span className="font-bold text-slate-900">{user.emp_type}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-semibold block uppercase">Depot</span>
                <span className="font-bold text-slate-900">{user.depot_name}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-semibold block uppercase">Account Status</span>
                <span className="font-bold text-emerald-700">{user.status}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-semibold block uppercase">Joining Date</span>
                <span className="font-bold text-slate-900">{user.joining_date || 'Official Record'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-semibold block uppercase">Date of Birth</span>
                <span className="font-bold text-slate-900">{user.dob || 'Official Record'}</span>
              </div>
            </div>
          </div>

          {/* Editable Contact Information */}
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <h3 className="font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 pb-1 border-b border-slate-200">
              <UserIcon className="w-4 h-4 text-amber-600" />
              <span>Contact &amp; Personal Info</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mobile Number</label>
                <input
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Designation</label>
                <input
                  type="text"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Residential Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Change Password Toggle */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowPasswordSection(!showPasswordSection)}
                className="flex items-center gap-1.5 text-xs font-bold text-blue-900 hover:text-amber-600 transition cursor-pointer"
              >
                <KeyRound className="w-4 h-4" />
                <span>{showPasswordSection ? 'Hide Change Password' : 'Change Account Password'}</span>
              </button>

              {showPasswordSection && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3 p-4 bg-slate-50 border border-slate-200 rounded-xl animate-in fade-in">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">New Password (Min 6 chars)</label>
                    <input
                      type="password"
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Confirm New Password</label>
                    <input
                      type="password"
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={saving}
              className="mt-4 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition shadow-md cursor-pointer flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
