import React, { useState } from 'react';
import { Play, Pause, SkipForward, Maximize2, Minimize2, Music } from 'lucide-react';
import { Track, DarkThemeConfig } from '../types/music';

interface QuickWidgetProps {
  track: Track | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onNext: () => void;
  onOpenFullscreen: () => void;
  activeTheme: DarkThemeConfig;
}

export const QuickWidget: React.FC<QuickWidgetProps> = ({
  track,
  isPlaying,
  onTogglePlay,
  onNext,
  onOpenFullscreen,
  activeTheme,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!track) return null;

  return (
    <div 
      className="hidden md:flex fixed bottom-24 right-6 z-40 rounded-2xl shadow-2xl border transition-all duration-300 p-2.5 items-center gap-3 backdrop-blur-md"
      style={{
        backgroundColor: activeTheme.bgHex === '#000000' ? 'rgba(10,10,10,0.95)' : 'rgba(20,24,35,0.9)',
        borderColor: activeTheme.borderHex,
        boxShadow: `0 10px 25px -5px ${activeTheme.glowHex}`,
      }}
    >
      {/* Thumbnail */}
      <div 
        onClick={onOpenFullscreen}
        className="w-10 h-10 rounded-lg overflow-hidden shrink-0 cursor-pointer relative group border border-white/10"
      >
        <img 
          src={track.coverUrl} 
          alt={track.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
          <Maximize2 className="w-3.5 h-3.5 text-white" />
        </div>
      </div>

      {!isCollapsed && (
        <div className="max-w-[140px] truncate">
          <h5 
            onClick={onOpenFullscreen}
            className="text-xs font-semibold text-white truncate cursor-pointer hover:underline"
          >
            {track.title}
          </h5>
          <p className="text-[10px] text-slate-400 truncate mt-0.5">{track.artist}</p>
        </div>
      )}

      {/* Mini Controls */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={onTogglePlay}
          className="w-7 h-7 rounded-full flex items-center justify-center text-black font-bold transition-transform active:scale-95"
          style={{ backgroundColor: activeTheme.accentHex }}
          title={isPlaying ? 'Pausar' : 'Reproducir'}
        >
          {isPlaying ? (
            <Pause className="w-3.5 h-3.5 fill-current" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
          )}
        </button>

        <button
          onClick={onNext}
          className="p-1 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          title="Siguiente canción"
        >
          <SkipForward className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 rounded-full text-slate-400 hover:text-white transition-colors"
          title={isCollapsed ? 'Expandir widget' : 'Minimizar widget'}
        >
          {isCollapsed ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
        </button>
      </div>
    </div>
  );
};
