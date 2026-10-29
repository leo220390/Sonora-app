import React from 'react';
import { Home, Compass, Library, DownloadCloud } from 'lucide-react';
import { DarkThemeConfig } from '../types/music';

interface BottomNavProps {
  currentView: 'home' | 'explore' | 'library' | 'offline';
  onSelectView: (view: 'home' | 'explore' | 'library' | 'offline') => void;
  activeTheme: DarkThemeConfig;
  hasActiveTrack: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentView,
  onSelectView,
  activeTheme,
  hasActiveTrack,
}) => {
  return (
    <nav 
      className={`md:hidden fixed left-0 right-0 z-40 border-t transition-all duration-200 select-none ${
        hasActiveTrack ? 'bottom-16 sm:bottom-20' : 'bottom-0'
      }`}
      style={{
        backgroundColor: activeTheme.bgHex === '#000000' ? 'rgba(0,0,0,0.95)' : activeTheme.surfaceHex,
        borderColor: activeTheme.borderHex,
      }}
    >
      <div className="grid grid-cols-4 items-center h-14 max-w-md mx-auto">
        <button
          onClick={() => onSelectView('home')}
          className="flex flex-col items-center justify-center min-h-[44px] min-w-[44px] py-1 text-center transition-colors"
          style={{ color: currentView === 'home' ? activeTheme.accentHex : '#94a3b8' }}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-medium tracking-tight mt-0.5">Inicio</span>
        </button>

        <button
          onClick={() => onSelectView('explore')}
          className="flex flex-col items-center justify-center min-h-[44px] min-w-[44px] py-1 text-center transition-colors"
          style={{ color: currentView === 'explore' ? activeTheme.accentHex : '#94a3b8' }}
        >
          <Compass className="w-5 h-5" />
          <span className="text-[10px] font-medium tracking-tight mt-0.5">Explorar</span>
        </button>

        <button
          onClick={() => onSelectView('library')}
          className="flex flex-col items-center justify-center min-h-[44px] min-w-[44px] py-1 text-center transition-colors"
          style={{ color: currentView === 'library' ? activeTheme.accentHex : '#94a3b8' }}
        >
          <Library className="w-5 h-5" />
          <span className="text-[10px] font-medium tracking-tight mt-0.5">Biblioteca</span>
        </button>

        <button
          onClick={() => onSelectView('offline')}
          className="flex flex-col items-center justify-center min-h-[44px] min-w-[44px] py-1 text-center transition-colors"
          style={{ color: currentView === 'offline' ? activeTheme.accentHex : '#94a3b8' }}
        >
          <DownloadCloud className="w-5 h-5" />
          <span className="text-[10px] font-medium tracking-tight mt-0.5">Offline</span>
        </button>
      </div>
    </nav>
  );
};
