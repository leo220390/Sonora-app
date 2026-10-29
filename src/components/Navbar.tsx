import React from 'react';
import { 
  Zap, 
  Battery, 
  BatteryCharging, 
  Sliders, 
  Sparkles, 
  Cloud, 
  Bell, 
  DownloadCloud, 
  Layers,
  Mic,
  Moon
} from 'lucide-react';
import { DarkThemeConfig, BatteryState, UserProfile } from '../types/music';

interface NavbarProps {
  currentView: 'home' | 'explore' | 'library' | 'offline' | 'equalizer';
  onSelectView: (view: 'home' | 'explore' | 'library' | 'offline' | 'equalizer') => void;
  activeTheme: DarkThemeConfig;
  onOpenThemeModal: () => void;
  batteryState: BatteryState;
  onOpenBatteryModal: () => void;
  onOpenEqModal: () => void;
  onOpenCollabModal: () => void;
  onOpenNotifyModal: () => void;
  onOpenAiDj: () => void;
  onOpenVoiceSearch: () => void;
  onOpenAudioSettings: () => void;
  sleepTimerRemaining: number | null;
  profile: UserProfile;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onSelectView,
  activeTheme,
  onOpenThemeModal,
  batteryState,
  onOpenBatteryModal,
  onOpenEqModal,
  onOpenCollabModal,
  onOpenNotifyModal,
  onOpenAiDj,
  onOpenVoiceSearch,
  onOpenAudioSettings,
  sleepTimerRemaining,
  profile,
}) => {
  const batteryPct = Math.round(batteryState.level * 100);

  return (
    <header 
      className="sticky top-0 z-40 flex items-center justify-between gap-8 px-4 sm:px-6 py-3 border-b transition-colors duration-200"
      style={{
        backgroundColor: activeTheme.surfaceHex,
        borderColor: activeTheme.borderHex,
      }}
    >
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <button 
          onClick={() => onSelectView('home')}
          className="flex items-center gap-2.5 text-left focus:outline-none group"
        >
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-black transition-transform group-hover:scale-105"
            style={{ backgroundColor: activeTheme.accentHex }}
          >
            <span className="text-sm font-extrabold tracking-tighter">S</span>
          </div>
          <span className="text-lg font-bold tracking-tight text-white whitespace-nowrap">
            Sonora
          </span>
        </button>
      </div>

      {/* Zone 2: Clean single-line text navigation links */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
        <button
          onClick={() => onSelectView('home')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
            currentView === 'home' ? 'text-white font-semibold' : 'text-slate-400'
          }`}
        >
          Inicio
        </button>
        <button
          onClick={() => onSelectView('explore')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
            currentView === 'explore' ? 'text-white font-semibold' : 'text-slate-400'
          }`}
        >
          Explorar
        </button>
        <button
          onClick={() => onSelectView('library')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
            currentView === 'library' ? 'text-white font-semibold' : 'text-slate-400'
          }`}
        >
          Mi Biblioteca
        </button>
        <button
          onClick={() => onSelectView('offline')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
            currentView === 'offline' ? 'text-white font-semibold' : 'text-slate-400'
          }`}
        >
          <DownloadCloud className="w-3.5 h-3.5" />
          <span>Offline</span>
        </button>
        <button
          onClick={onOpenEqModal}
          className="hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 text-slate-400"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Ecualizador</span>
        </button>
      </nav>

      {/* Zone 3: 1 primary action cluster */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        {/* Sonora AI DJ button */}
        <button
          onClick={onOpenAiDj}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black bg-gradient-to-r from-[#1DB954] to-emerald-300 text-black shadow-lg hover:shadow-[#1DB954]/25 hover:scale-102 active:scale-95 transition-all"
          title="Sonora AI DJ - Curador Musical Inteligente con Gemini"
        >
          <Sparkles className="w-3.5 h-3.5 fill-current animate-spin [animation-duration:4s]" />
          <span className="hidden xs:inline">Sonora AI</span>
        </button>

        {/* Global Voice Search Button */}
        <button
          onClick={onOpenVoiceSearch}
          title="Búsqueda por Voz instantánea"
          className="p-1.5 rounded-lg text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition-colors relative group"
        >
          <Mic className="w-4 h-4 text-[#1DB954] group-hover:scale-110 transition-transform" />
        </button>

        {/* Audio Quality / Crossfade / Sleep Timer Settings */}
        <button
          onClick={onOpenAudioSettings}
          title="Ajustes de Audio (Calidad HD/Eco, Crossfade y Apagado Programado)"
          className="flex items-center gap-1.5 p-1.5 sm:px-2 rounded-lg text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition-colors"
        >
          <Moon className="w-4 h-4 text-indigo-400" />
          {sleepTimerRemaining !== null && sleepTimerRemaining > 0 && (
            <span className="text-[10px] font-mono text-emerald-400 font-bold tabular-nums">
              {Math.ceil(sleepTimerRemaining / 60)}m
            </span>
          )}
        </button>

        {/* Battery Saver Button */}
        <button
          onClick={onOpenBatteryModal}
          title="Gestión de batería y modo ultra ahorro"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap ${
            batteryState.saverActive
              ? 'bg-amber-950/40 text-amber-300 border-amber-600/50'
              : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300 border-slate-700/60'
          }`}
        >
          {batteryState.isCharging ? (
            <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <Battery className="w-3.5 h-3.5" />
          )}
          <span className="tabular-nums font-mono">{batteryPct}%</span>
          {batteryState.saverActive && (
            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400">Eco</span>
          )}
        </button>

        {/* Theme Selector Button */}
        <button
          onClick={onOpenThemeModal}
          title="Personalizar Modo Oscuro (OLED, Medianoche, etc.)"
          className="p-1.5 rounded-lg text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition-colors"
        >
          <Layers className="w-4 h-4" />
        </button>

        {/* Notifications & Daily Digest */}
        <button
          onClick={onOpenNotifyModal}
          title="Notificaciones y resumen diario"
          className="hidden sm:flex p-1.5 rounded-lg text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition-colors"
        >
          <Bell className="w-4 h-4" />
        </button>

        {/* Cloud Sync & Guest Profile */}
        <button
          onClick={onOpenCollabModal}
          className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-lg text-xs font-medium border transition-all text-slate-200 hover:text-white"
          style={{
            backgroundColor: activeTheme.cardHex,
            borderColor: activeTheme.borderHex,
          }}
        >
          <div 
            className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-black"
            style={{ backgroundColor: activeTheme.accentHex }}
          >
            {profile.name.charAt(0)}
          </div>
          <span className="hidden sm:inline font-medium truncate max-w-[100px]">
            {profile.name}
          </span>
          <Cloud className="w-3.5 h-3.5 text-slate-400" />
        </button>
      </div>
    </header>
  );
};
