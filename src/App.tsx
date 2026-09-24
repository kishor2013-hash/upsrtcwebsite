import React, { useState, useEffect } from 'react';
import { User, AppSettings, ExternalPortalLink } from './types';
import { api } from './services/api';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { OfflineIndicator } from './components/OfflineIndicator';
import { LoginView } from './components/LoginView';
import { RegisterView } from './components/RegisterView';
import { ForgotPasswordModal } from './components/ForgotPasswordModal';
import { DashboardView } from './components/DashboardView';
import { FeedDutyView } from './components/FeedDutyView';
import { ShowDataView } from './components/ShowDataView';
import { ProfileView } from './components/ProfileView';
import { AdminPanelView } from './components/AdminPanelView';

export function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [authView, setAuthView] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [prefilledLoginNotice, setPrefilledLoginNotice] = useState<string | null>(null);

  // Authenticated route navigation
  const [currentView, setCurrentView] = useState<'dashboard' | 'feed-duty' | 'show-data' | 'profile' | 'admin'>('dashboard');

  // Application and portal settings
  const [settings, setSettings] = useState<AppSettings>({
    app_title: 'UPSRCTC ROADWAYS',
    app_subtitle: 'DIGITAL DUTY PORTAL V4.0',
    partner_name: 'Grofasto Digital Solutions',
    partner_tagline: 'GROW | CONNECT | SUCCEED.',
    partner_phone: '+91 9457690255',
    partner_website: 'www.grofasto.com',
    allow_registration: '1'
  });

  const [portalLinks, setPortalLinks] = useState<ExternalPortalLink[]>([]);

  // Check existing session on mount
  useEffect(() => {
    let isMounted = true;

    // Load app settings
    api.getSettings().then((data) => {
      if (isMounted) {
        setSettings(data.settings);
        setPortalLinks(data.portal_links);
      }
    }).catch(() => {});

    // Check active session
    api.getSessionUser().then((user) => {
      if (isMounted) {
        setCurrentUser(user);
        setLoadingSession(false);
      }
    }).catch(() => {
      if (isMounted) {
        setLoadingSession(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setCurrentView('dashboard');
  };

  const handleLogout = async () => {
    await api.logout();
    setCurrentUser(null);
    setAuthView('LOGIN');
    setCurrentView('dashboard');
  };

  const handleSettingsUpdated = () => {
    api.getSettings().then((data) => {
      setSettings(data.settings);
      setPortalLinks(data.portal_links);
    });
  };

  // 1. Initial Session Loading Screen
  if (loadingSession) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 p-1 mb-4 flex items-center justify-center shadow-lg animate-pulse">
          <img src="/icon.svg" alt="UPSRCTC Emblem" className="w-12 h-12 object-contain" />
        </div>
        <div className="flex items-center gap-2 text-amber-400 font-bold tracking-wider text-sm uppercase">
          <div className="w-3.5 h-3.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading UPSRCTC Portal V4.0...</span>
        </div>
      </div>
    );
  }

  // 2. UN-AUTHENTICATED STATE: SHOW ONLY LOGIN (Or Registration if clicked)
  // Strict requirement: Zero dashboard, zero employee data, zero fake stats before authentication
  if (!currentUser) {
    return (
      <>
        <OfflineIndicator />
        {authView === 'LOGIN' ? (
          <LoginView
            settings={settings}
            onLoginSuccess={handleLoginSuccess}
            onNavigateRegister={() => setAuthView('REGISTER')}
            onOpenForgotPassword={() => setShowForgotPassword(true)}
          />
        ) : (
          <RegisterView
            settings={settings}
            onNavigateLogin={(notice) => {
              if (notice) setPrefilledLoginNotice(notice);
              setAuthView('LOGIN');
            }}
          />
        )}

        <ForgotPasswordModal
          isOpen={showForgotPassword}
          onClose={() => setShowForgotPassword(false)}
        />
      </>
    );
  }

  // 3. AUTHENTICATED STATE: MAIN APPLICATION
  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900 selection:bg-amber-500 selection:text-slate-950 font-sans">
      <OfflineIndicator />

      {/* Main Persistent Header with Clock, Date, Authenticated Employee & PWA install */}
      <Header
        user={currentUser}
        settings={settings}
        currentView={currentView}
        onNavigate={(view) => setCurrentView(view as any)}
        onLogout={handleLogout}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-6">
        {currentView === 'dashboard' && (
          <DashboardView
            user={currentUser}
            portalLinks={portalLinks}
            onNavigate={(view) => setCurrentView(view as any)}
          />
        )}

        {currentView === 'feed-duty' && (
          <FeedDutyView
            user={currentUser}
            onNavigate={(view) => setCurrentView(view as any)}
            onDutySubmitted={() => {
              // Can stay or navigate
            }}
          />
        )}

        {currentView === 'show-data' && (
          <ShowDataView
            user={currentUser}
            onNavigate={(view) => setCurrentView(view as any)}
          />
        )}

        {currentView === 'profile' && (
          <ProfileView
            user={currentUser}
            onNavigate={(view) => setCurrentView(view as any)}
            onUserUpdated={(updated) => setCurrentUser(updated)}
          />
        )}

        {currentView === 'admin' && (
          <AdminPanelView
            user={currentUser}
            settings={settings}
            portalLinks={portalLinks}
            onNavigate={(view) => setCurrentView(view as any)}
            onSettingsUpdated={handleSettingsUpdated}
          />
        )}
      </main>

      {/* Professional Footer with Grofasto Digital Solutions Partner Info */}
      <Footer settings={settings} />
    </div>
  );
}

export default App;
