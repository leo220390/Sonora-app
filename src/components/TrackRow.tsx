import React from 'react';
import { Play, Pause, Heart, Download, Check, Volume2, Sparkles } from 'lucide-react';
import { Track, DarkThemeConfig } from '../types/music';

interface TrackRowProps {
  track: Track;
  index: number;
  isCurrent: boolean;
  isPlaying: boolean;
  isLiked: boolean;
  isDownloaded: boolean;
  activeTheme: DarkThemeConfig;
  onPlay: (track: Track) => void;
  onToggleLike: (trackId: string) => void;
  onToggleDownload: (track: Track) => void;
}

const formatTime = (seconds: number): string => {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

export const TrackRow: React.FC<TrackRowProps> = ({
  track,
  index,
  isCurrent,
  isPlaying,
  isLiked,
  isDownloaded,
  activeTheme,
  onPlay,
  onToggleLike,
  onToggleDownload,
}) => {
  return (
    <div 
      className={`group flex items-center justify-between px-3 sm:px-4 py-2.5 rounded-xl transition-all duration-150 cursor-pointer ${
        isCurrent ? 'bg-white/10' : 'hover:bg-white/5'
      }`}
      onClick={() => onPlay(track)}
    >
      {/* Left: Index / Play Icon + Cover + Title */}
      <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
        {/* Index or Equalizer bars */}
        <div className="w-5 text-center shrink-0">
          {isCurrent && isPlaying ? (
            <div className="flex items-end justify-center gap-0.5 h-3.5">
              <span className="w-0.5 h-3 bg-emerald-400 animate-pulse" style={{ backgroundColor: activeTheme.accentHex }} />
              <span className="w-0.5 h-2 bg-emerald-400 animate-pulse" style={{ animationDelay: '0.2s', backgroundColor: activeTheme.accentHex }} />
              <span className="w-0.5 h-3.5 bg-emerald-400 animate-pulse" style={{ animationDelay: '0.4s', backgroundColor: activeTheme.accentHex }} />
            </div>
          ) : (
            <span className="text-xs font-mono text-slate-500 group-hover:hidden">
              {index + 1}
            </span>
          )}
          <button 
            className="hidden group-hover:flex items-center justify-center text-white"
            onClick={(e) => {
              e.stopPropagation();
              onPlay(track);
            }}
          >
            {isCurrent && isPlaying ? (
              <Pause className="w-3.5 h-3.5 fill-current" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
            )}
          </button>
        </div>

        {/* Thumbnail */}
        <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-white/5 bg-slate-900">
          <img 
            src={track.coverUrl} 
            alt={track.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Title & Artist */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span 
              className={`text-xs sm:text-sm font-semibold truncate ${
                isCurrent ? 'text-emerald-400' : 'text-white'
              }`}
              style={isCurrent ? { color: activeTheme.accentHex } : {}}
            >
              {track.title}
            </span>
            {track.quality === 'lossless' && (
              <span className="hidden xs:inline text-[9px] font-mono px-1 py-0.2 rounded bg-white/10 text-slate-300">
                LOSSLESS
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 truncate mt-0.5">
            {track.artist}
          </p>
        </div>
      </div>

      {/* Center: Album & Smart Tags (Hidden on mobile) */}
      <div className="hidden md:flex items-center gap-4 text-xs text-slate-400 w-1/3 min-w-0">
        <span className="truncate flex-1">{track.album}</span>
        <div className="flex items-center gap-1 shrink-0">
          {track.tags.slice(0, 1).map((t) => (
            <span key={t} className="text-[11px] text-slate-500 hover:text-slate-300">
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* Right: Like, Download, Duration */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
        {/* Like */}
        <button
          onClick={() => onToggleLike(track.id)}
          className="p-1 rounded-full text-slate-400 hover:text-white transition-colors"
          title={isLiked ? 'Quitar de Me Gusta' : 'Guardar en Me Gusta'}
        >
          <Heart 
            className={`w-4 h-4 ${isLiked ? 'fill-emerald-400 text-emerald-400' : ''}`}
            style={isLiked ? { fill: activeTheme.accentHex, color: activeTheme.accentHex } : {}}
          />
        </button>

        {/* Download Offline */}
        <button
          onClick={() => onToggleDownload(track)}
          className="p-1 rounded-full text-slate-400 hover:text-white transition-colors"
          title={isDownloaded ? 'Descargado (Modo Offline listo)' : 'Descargar en alta calidad'}
        >
          {isDownloaded ? (
            <Check className="w-4 h-4 text-emerald-400" />
          ) : (
            <Download className="w-4 h-4" />
          )}
        </button>

        {/* Duration */}
        <span className="text-xs font-mono tabular-nums text-slate-400 w-10 text-right">
          {formatTime(track.duration)}
        </span>
      </div>
    </div>
  );
};
