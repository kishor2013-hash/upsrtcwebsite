import React, { useState } from 'react';
import { api } from '../services/api';
import { User, AppSettings } from '../types';
import { PWAInstallButton } from './PWAInstallButton';
import { 
  Eye, 
  EyeOff, 
  Lock, 
  User as UserIcon, 
  Bus, 
  AlertCircle, 
  CheckCircle2, 
  ShieldCheck,
  Globe,
  Phone,
  Sparkles,
  ArrowRight,
  Info
} from 'lucide-react';

interface LoginViewProps {
  settings: AppSettings;
  onLoginSuccess: (user: User) => void;
  onNavigateRegister: () => void;
  onOpenForgotPassword: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  settings,
  onLoginSuccess,
  onNavigateRegister,
  onOpenForgotPassword
}) => {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [googleNotice, setGoogleNotice] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!loginId.trim() || !password) {
      setErrorMsg('Please enter your Login ID / Email and Password.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.login(loginId, password, rememberMe);
      if (res.success && res.user) {
        onLoginSuccess(res.user);
      } else {
        setErrorMsg(res.message || 'Invalid credentials. If you are a new employee, please click Sign Up.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Unable to connect to server. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // Section 5: Real OAuth integration notice
    setGoogleNotice(true);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-slate-100 selection:bg-amber-500 selection:text-slate-950">
      {/* Top Bar with PWA install button */}
      <div className="w-full max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500 p-0.5 flex items-center justify-center">
            <img src="/icon.svg" alt="UPSRCTC" className="w-full h-full object-contain" />
          </div>
          <span className="text-xs font-bold text-amber-400 tracking-wider">UPSRCTC ROADWAYS</span>
        </div>
        <div>
          <PWAInstallButton compact={true} />
        </div>
      </div>

      {/* Main Login Card Container */}
      <div className="w-full max-w-md mx-auto px-4 py-6">
        <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-700/80 p-6 sm:p-8 relative overflow-hidden">
          {/* Subtle Top Accent */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500"></div>

          {/* Logo & Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 p-1 shadow-lg shadow-amber-500/20 mb-3">
              <div className="w-full h-full bg-blue-950 rounded-[14px] flex items-center justify-center p-2">
                <img src="/icon.svg" alt="UPSRCTC Emblem" className="w-full h-full object-contain" />
              </div>
            </div>
            
            <h1 className="text-xl sm:text-2xl font-black text-amber-400 tracking-wider uppercase">
              {settings.app_title || 'UPSRCTC ROADWAYS'}
            </h1>
            <div className="inline-block mt-1 px-3 py-0.5 rounded-full bg-blue-900/60 border border-blue-700 text-xs font-bold text-slate-200 tracking-wider">
              {settings.app_subtitle || 'DIGITAL DUTY PORTAL V4.0'}
            </div>
            <p className="text-xs text-slate-400 mt-2 font-medium">
              Official Duty Portal for Drivers &amp; Conductors
            </p>
          </div>

          {/* Empty Database / Setup Helper Tip */}
          <div className="mb-5 bg-blue-950/60 border border-blue-800/80 rounded-xl p-3 text-xs text-slate-300 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-300">Production Zero-Demo Mode</p>
              <p className="text-[11px] text-slate-300 leading-relaxed mt-0.5">
                The database is clean with zero demo data. First time here? Click{' '}
                <button 
                  onClick={onNavigateRegister}
                  type="button" 
                  className="text-amber-400 font-bold underline hover:text-amber-300 cursor-pointer"
                >
                  Create Account
                </button>{' '}
                to register your official Driver or Conductor profile.
              </p>
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <span className="leading-snug">{errorMsg}</span>
            </div>
          )}

          {/* Google OAuth Notice Modal / Dialog */}
          {googleNotice && (
            <div className="mb-4 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/40 text-amber-200 text-xs">
              <div className="flex items-center justify-between font-bold text-amber-400 mb-1">
                <span>Google OAuth Production Setup</span>
                <button 
                  onClick={() => setGoogleNotice(false)} 
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                As specified in Section 5 of the Master Prompt, backend Google OAuth requires adding your Google Cloud Client ID and Secret in Hostinger <code className="text-amber-300 font-mono">.env</code> or <code className="text-amber-300 font-mono">config.php</code>. Please use the secure <strong>Email / Employee ID &amp; Password</strong> login below.
              </p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                Login ID / Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  placeholder="Enter CND Number or Email"
                  required
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={onOpenForgotPassword}
                  className="text-xs font-semibold text-amber-400 hover:text-amber-300 transition cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-amber-500 focus:ring-amber-500 focus:ring-offset-slate-900 cursor-pointer"
                />
                <span>Remember Me</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-sm uppercase tracking-wider rounded-xl shadow-lg shadow-amber-500/25 active:scale-[0.99] transition duration-150 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>LOGIN</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Optional Google Login */}
            <div className="pt-2">
              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-800"></div>
                <span className="flex-shrink mx-3 text-[10px] uppercase font-bold text-slate-500 tracking-wider">or sign in with</span>
                <div className="flex-grow border-t border-slate-800"></div>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full mt-2 py-2.5 px-4 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200 flex items-center justify-center gap-2.5 transition active:scale-[0.99] cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>Continue with Google</span>
              </button>
            </div>
          </form>

          {/* Sign Up Redirect */}
          <div className="mt-6 pt-5 border-t border-slate-800 text-center">
            <p className="text-xs text-slate-400">
              New Employee?{' '}
              <button
                type="button"
                onClick={onNavigateRegister}
                className="font-bold text-amber-400 hover:text-amber-300 underline underline-offset-2 transition cursor-pointer"
              >
                SIGN UP (Create Account)
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="w-full max-w-7xl mx-auto px-4 py-4 text-center text-xs text-slate-500 border-t border-slate-800/80">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>उत्तर प्रदेश राज्य सड़क परिवहन निगम • Digital Duty Portal V4.0</span>
          <div className="flex items-center gap-2 text-slate-400">
            <span>Powered by <strong className="text-amber-400">{settings.partner_name || 'Grofasto Digital Solutions'}</strong></span>
            <span>•</span>
            <span>{settings.partner_phone || '+91 9457690255'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
