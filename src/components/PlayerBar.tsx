import React from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Shuffle, 
  Repeat, 
  Repeat1, 
  Volume2, 
  VolumeX, 
  Heart, 
  Download, 
  Check, 
  Sliders, 
  Cast, 
  Maximize2, 
  Radio,
  Tv,
  Moon,
  Sparkles,
  Gauge
} from 'lucide-react';
import { Track, DarkThemeConfig, BatteryState, StreamQualityLevel } from '../types/music';

interface PlayerBarProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  shuffle: boolean;
  repeat: 'off' | 'all' | 'one';
  activeTheme: DarkThemeConfig;
  batteryState: BatteryState;
  streamQuality?: StreamQualityLevel;
  sleepTimerRemaining?: number | null;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (time: number) => void;
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
  onVolumeChange: (vol: number) => void;
  onToggleMute: () => void;
  onToggleLike: (trackId: string) => void;
  onToggleDownload: (track: Track) => void;
  onOpenEq: () => void;
  onOpenConnect: () => void;
  onOpenFullscreen: () => void;
  onOpenAudioSettings?: () => void;
  onOpenAiDj?: () => void;
  showVideoScreen: boolean;
  onToggleVideo: () => void;
  isLiked: boolean;
  isDownloaded: boolean;
}

const formatTime = (seconds: number): string => {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

export const PlayerBar: React.FC<PlayerBarProps> = ({
  currentTrack,
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  shuffle,
  repeat,
  activeTheme,
  batteryState,
  streamQuality = 'high',
  sleepTimerRemaining = null,
  onTogglePlay,
  onNext,
  onPrev,
  onSeek,
  onToggleShuffle,
  onToggleRepeat,
  onVolumeChange,
  onToggleMute,
  onToggleLike,
  onToggleDownload,
  onOpenEq,
  onOpenConnect,
  onOpenFullscreen,
  onOpenAudioSettings,
  onOpenAiDj,
  showVideoScreen,
  onToggleVideo,
  isLiked,
  isDownloaded,
}) => {
  if (!currentTrack) {
    return null;
  }

  const effectiveDuration = duration || currentTrack.duration || 180;
  const progressPercent = Math.min(100, Math.max(0, (currentTime / effectiveDuration) * 100));

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 z-50 border-t transition-colors duration-200 select-none bg-[#181818]"
      style={{
        borderColor: 'rgba(255, 255, 255, 0.08)',
      }}
    >
      {/* Mobile Top Progress Indicator (Spotify Mobile Style) */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-white/10 sm:hidden">
        <div className="h-full bg-[#1DB954] transition-all" style={{ width: `${progressPercent}%` }} />
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2 sm:gap-6">
        
        {/* Left Track Info */}
        <div className="flex items-center gap-3 min-w-0 w-1/4 sm:w-1/3">
          <div 
            onClick={onOpenFullscreen}
            className="relative group w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden shrink-0 cursor-pointer shadow-md bg-slate-900 border border-white/5"
          >
            <img 
              src={currentTrack.coverUrl} 
              alt={currentTrack.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <Maximize2 className="w-4 h-4 text-white" />
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h4 
                onClick={onOpenFullscreen}
                className="text-xs sm:text-sm font-semibold text-white truncate cursor-pointer hover:underline"
              >
                {currentTrack.title}
              </h4>
              {isPlaying && (
                <span className="hidden md:inline-flex items-end gap-0.5 h-3 shrink-0">
                  <span className="w-0.5 h-2 bg-[#1DB954] animate-bounce [animation-delay:0.1s]" />
                  <span className="w-0.5 h-3 bg-[#1DB954] animate-bounce [animation-delay:0.25s]" />
                  <span className="w-0.5 h-1.5 bg-[#1DB954] animate-bounce [animation-delay:0.15s]" />
                </span>
              )}
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400 truncate mt-0.5">
              {currentTrack.artist}
            </p>
          </div>

          {/* Action buttons */}
          <div className="hidden xs:flex items-center gap-1 shrink-0">
            <button
              onClick={() => onToggleLike(currentTrack.id)}
              className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              title={isLiked ? 'Eliminar de Me Gusta' : 'Guardar en Me Gusta'}
            >
              <Heart 
                className={`w-4 h-4 transition-colors ${isLiked ? 'fill-emerald-400 text-emerald-400' : ''}`}
                style={isLiked ? { fill: activeTheme.accentHex, color: activeTheme.accentHex } : {}}
              />
            </button>

            <button
              onClick={() => onToggleDownload(currentTrack)}
              className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              title={isDownloaded ? 'Descargada (Disponible offline)' : 'Descargar para escuchar sin conexión'}
            >
              {isDownloaded ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Download className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Center Controls & Scrubber */}
        <div className="flex flex-col items-center flex-1 max-w-xl">
          <div className="flex items-center gap-3 sm:gap-5 mb-1">
            <button
              onClick={onToggleShuffle}
              className={`p-1.5 rounded-full hover:bg-white/10 transition-colors ${
                shuffle ? 'text-emerald-400' : 'text-slate-400 hover:text-white'
              }`}
              style={shuffle ? { color: activeTheme.accentHex } : {}}
              title="Reproducción aleatoria"
            >
              <Shuffle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            <button
              onClick={onPrev}
              className="p-1.5 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
              title="Anterior"
            >
              <SkipBack className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
            </button>

            <button
              onClick={onTogglePlay}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-black font-bold transition-transform active:scale-95 shadow-lg"
              style={{ backgroundColor: activeTheme.accentHex }}
              title={isPlaying ? 'Pausar' : 'Reproducir'}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
              ) : (
                <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current ml-0.5" />
              )}
            </button>

            <button
              onClick={onNext}
              className="p-1.5 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
              title="Siguiente"
            >
              <SkipForward className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
            </button>

            <button
              onClick={onToggleRepeat}
              className={`p-1.5 rounded-full hover:bg-white/10 transition-colors ${
                repeat !== 'off' ? 'text-emerald-400' : 'text-slate-400 hover:text-white'
              }`}
              style={repeat !== 'off' ? { color: activeTheme.accentHex } : {}}
              title={`Repetir: ${repeat}`}
            >
              {repeat === 'one' ? (
                <Repeat1 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              ) : (
                <Repeat className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              )}
            </button>
          </div>

          {/* Scrubber timeline */}
          <div className="w-full flex items-center gap-2">
            <span className="text-[11px] font-mono tabular-nums text-slate-400 w-9 text-right">
              {formatTime(currentTime)}
            </span>

            <div className="relative flex-1 flex items-center group py-1">
              <input
                type="range"
                min={0}
                max={effectiveDuration}
                step={0.5}
                value={currentTime}
                onChange={(e) => onSeek(parseFloat(e.target.value))}
                className="w-full h-1 bg-slate-700/80 rounded-lg appearance-none cursor-pointer focus:outline-none"
                style={{
                  background: `linear-gradient(to right, ${activeTheme.accentHex} 0%, ${activeTheme.accentHex} ${progressPercent}%, rgba(255,255,255,0.15) ${progressPercent}%, rgba(255,255,255,0.15) 100%)`,
                }}
              />
            </div>

            <span className="text-[11px] font-mono tabular-nums text-slate-400 w-9 text-left">
              {formatTime(effectiveDuration)}
            </span>
          </div>
        </div>

        {/* Right Tools (Quality, Sleep Timer, AI DJ, EQ, Devices, Volume, Expand) */}
        <div className="flex items-center justify-end gap-1.5 sm:gap-2.5 w-1/4 sm:w-1/3">
          {/* Quality Indicator Pill */}
          <button 
            type="button"
            onClick={onOpenAudioSettings || onOpenEq}
            className="hidden md:flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold transition-all border active:scale-95"
            style={{
              backgroundColor: streamQuality === 'high' ? 'rgba(29, 185, 84, 0.12)' : streamQuality === 'medium' ? 'rgba(56, 189, 248, 0.12)' : 'rgba(245, 158, 11, 0.12)',
              borderColor: streamQuality === 'high' ? 'rgba(29, 185, 84, 0.35)' : streamQuality === 'medium' ? 'rgba(56, 189, 248, 0.35)' : 'rgba(245, 158, 11, 0.35)',
              color: streamQuality === 'high' ? '#1DB954' : streamQuality === 'medium' ? '#38bdf8' : '#f59e0b',
            }}
            title="Calidad de audio: Clic para cambiar (Alta 320k / Media 192k / Baja 96k)"
          >
            <Gauge className="w-3 h-3" />
            <span>{streamQuality === 'high' ? 'HQ 320K' : streamQuality === 'medium' ? 'EQ 192K' : 'ECO 96K'}</span>
          </button>

          {/* Sleep Timer Indicator Pill (if active) */}
          {sleepTimerRemaining !== null && sleepTimerRemaining > 0 && (
            <button
              type="button"
              onClick={onOpenAudioSettings}
              className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-950/70 text-indigo-300 border border-indigo-500/40 animate-pulse active:scale-95 transition-all"
              title="Temporizador de apagado activo - Clic para ajustar"
            >
              <Moon className="w-3 h-3" />
              <span>{Math.ceil(sleepTimerRemaining / 60)}m</span>
            </button>
          )}

          {/* Sonora AI DJ Quick Button */}
          {onOpenAiDj && (
            <button
              type="button"
              onClick={onOpenAiDj}
              className="p-1.5 rounded-full hover:bg-white/10 text-emerald-400 hover:text-white transition-all active:scale-95"
              title="Sonora AI DJ - Curador Inteligente"
            >
              <Sparkles className="w-4 h-4 fill-emerald-400/20" />
            </button>
          )}

          {/* Equalizer */}
          <button
            onClick={onOpenEq}
            className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            title="Ecualizador de audio de 10 bandas"
          >
            <Sliders className="w-4 h-4" />
          </button>

          {/* Smart Home / Aura Connect */}
          <button
            onClick={onOpenConnect}
            className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            title="Conectar a altavoces y Smart TVs (Aura Connect)"
          >
            <Cast className="w-4 h-4" />
          </button>

          {/* YouTube Video Screen Toggle */}
          <button
            onClick={onToggleVideo}
            className={`p-1.5 rounded-full hover:bg-white/10 transition-colors ${
              showVideoScreen ? 'text-rose-400 bg-rose-500/20 ring-1 ring-rose-500/40' : 'text-slate-400 hover:text-white'
            }`}
            title={showVideoScreen ? 'Ocultar Pantalla de Video' : 'Ver Video Oficial de YouTube'}
          >
            <Tv className="w-4 h-4" />
          </button>

          {/* Volume Control */}
          <div className="hidden sm:flex items-center gap-1.5 w-24">
            <button
              onClick={onToggleMute}
              className="text-slate-400 hover:text-white transition-colors"
              title={isMuted ? 'Activar sonido' : 'Silenciar'}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-slate-500" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={isMuted ? 0 : volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              className="w-full h-1 bg-slate-700/80 rounded-lg appearance-none cursor-pointer focus:outline-none"
              style={{
                background: `linear-gradient(to right, ${activeTheme.accentHex} 0%, ${activeTheme.accentHex} ${(isMuted ? 0 : volume) * 100}%, rgba(255,255,255,0.15) ${(isMuted ? 0 : volume) * 100}%, rgba(255,255,255,0.15) 100%)`,
              }}
            />
          </div>

          {/* Fullscreen / Lyrics */}
          <button
            onClick={onOpenFullscreen}
            className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            title="Vista inmersiva / Letras sincronizadas"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
