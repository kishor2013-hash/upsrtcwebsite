import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <aside aria-label="Network status banner" className="fixed top-0 left-0 right-0 z-50 bg-rose-600 text-white px-4 py-2 text-xs font-semibold flex items-center justify-center gap-2 shadow-lg animate-in slide-in-from-top duration-300">
      <WifiOff className="w-4 h-4 animate-bounce" />
      <span>Internet connection unavailable. Forms will be saved as LOCAL DRAFT until central MySQL connection is restored.</span>
    </aside>
  );
};
