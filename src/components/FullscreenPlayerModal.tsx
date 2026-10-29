import React, { useEffect, useRef, useState, useMemo } from 'react';
import { 
  ChevronDown, 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Shuffle, 
  Repeat, 
  Heart, 
  Download, 
  Check, 
  Share2, 
  Sliders, 
  Mic2, 
  BadgeCheck, 
  Disc, 
  Maximize2, 
  Minimize2,
  FileText,
  Sparkles,
  Moon,
  Gauge
} from 'lucide-react';
import { Track, DarkThemeConfig, BatteryState, StreamQualityLevel } from '../types/music';
import { audioEngine } from '../services/audioEngine';
import { storageService } from '../services/storageService';

interface FullscreenPlayerModalProps {
  track: Track | null;
  isOpen: boolean;
  onClose: () => void;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  activeTheme: DarkThemeConfig;
  batteryState: BatteryState;
  streamQuality?: StreamQualityLevel;
  sleepTimerRemaining?: number | null;
  isLiked: boolean;
  isDownloaded: boolean;
  shuffle: boolean;
  repeat: 'off' | 'all' | 'one';
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (time: number) => void;
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
  onToggleLike: (trackId: string) => void;
  onToggleDownload: (track: Track) => void;
  onOpenEq: () => void;
  onOpenShare: (track: Track) => void;
  onOpenAudioSettings?: () => void;
  onOpenAiDj?: () => void;
}

interface SyncedLyricLine {
  time: number;
  text: string;
}

const formatTime = (seconds: number): string => {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

function parseLrc(lrcText: string): SyncedLyricLine[] {
  if (!lrcText) return [];
  const lines = lrcText.split('\n');
  const result: SyncedLyricLine[] = [];
  const regex = /\[(\d{2}):(\d{2}(?:\.\d{1,3})?)\](.*)/;

  for (const rawLine of lines) {
    const match = rawLine.match(regex);
    if (match) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseFloat(match[2]);
      const text = match[3].trim();
      if (text) {
        result.push({ time: minutes * 60 + seconds, text });
      }
    }
  }
  return result.sort((a, b) => a.time - b.time);
}

export const FullscreenPlayerModal: React.FC<FullscreenPlayerModalProps> = ({
  track,
  isOpen,
  onClose,
  isPlaying,
  currentTime,
  duration,
  activeTheme,
  batteryState,
  streamQuality = 'high',
  sleepTimerRemaining = null,
  isLiked,
  isDownloaded,
  shuffle,
  repeat,
  onTogglePlay,
  onNext,
  onPrev,
  onSeek,
  onToggleShuffle,
  onToggleRepeat,
  onToggleLike,
  onToggleDownload,
  onOpenEq,
  onOpenShare,
  onOpenAudioSettings,
  onOpenAiDj,
}) => {
  const lyricsContainerRef = useRef<HTMLDivElement | null>(null);
  const fullLyricsContainerRef = useRef<HTMLDivElement | null>(null);
  const [activeTab, setActiveTab] = useState<'standard' | 'fullLyrics' | 'artist'>('standard');
  const [syncedLyrics, setSyncedLyrics] = useState<SyncedLyricLine[]>([]);
  const [isLoadingLyrics, setIsLoadingLyrics] = useState<boolean>(false);

  // Fetch real-time synced lyrics from LRCLib / Web search
  useEffect(() => {
    if (!track) return;
    let cancel = false;
    setIsLoadingLyrics(true);

    fetch(`/api/lyrics?title=${encodeURIComponent(track.title)}&artist=${encodeURIComponent(track.artist)}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancel) return;
        if (data.syncedLyrics) {
          const parsed = parseLrc(data.syncedLyrics);
          if (parsed.length > 0) {
            setSyncedLyrics(parsed);
            setIsLoadingLyrics(false);
            return;
          }
        }

        if (data.plainLyrics) {
          const plainLines = data.plainLyrics
            .split('\n')
            .map((l: string) => l.trim())
            .filter(Boolean);
          const step = Math.max(3, (track.duration || 180) / Math.max(1, plainLines.length));
          setSyncedLyrics(plainLines.map((text: string, i: number) => ({ time: i * step, text })));
        } else if (track.lyrics && track.lyrics.length > 0) {
          const step = Math.max(3, (track.duration || 180) / track.lyrics.length);
          setSyncedLyrics(track.lyrics.map((text, i) => ({ time: i * step, text })));
        } else {
          setSyncedLyrics([]);
        }
        setIsLoadingLyrics(false);
      })
      .catch(() => {
        if (cancel) return;
        if (track.lyrics && track.lyrics.length > 0) {
          const step = Math.max(3, (track.duration || 180) / track.lyrics.length);
          setSyncedLyrics(track.lyrics.map((text, i) => ({ time: i * step, text })));
        } else {
          setSyncedLyrics([]);
        }
        setIsLoadingLyrics(false);
      });

    return () => {
      cancel = true;
    };
  }, [track?.id]);

  // Determine current active lyric line based on currentTime
  const currentLyricIndex = useMemo(() => {
    if (!syncedLyrics || syncedLyrics.length === 0) return -1;
    for (let i = syncedLyrics.length - 1; i >= 0; i--) {
      if (currentTime >= syncedLyrics[i].time - 0.25) {
        return i;
      }
    }
    return 0;
  }, [currentTime, syncedLyrics]);

  // Auto-scroll lyrics smoothly into center view
  useEffect(() => {
    if (currentLyricIndex >= 0) {
      // Small container scroll
      const activeEl = document.getElementById(`lyric-line-${currentLyricIndex}`);
      if (activeEl && lyricsContainerRef.current) {
        activeEl.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }

      // Fullscreen lyrics container scroll
      const activeFullEl = document.getElementById(`full-lyric-line-${currentLyricIndex}`);
      if (activeFullEl && fullLyricsContainerRef.current) {
        activeFullEl.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    }
  }, [currentLyricIndex, activeTab]);

  if (!isOpen || !track) return null;

  const effectiveDuration = duration || track.duration || 180;
  const progressPercent = Math.min(100, Math.max(0, (currentTime / effectiveDuration) * 100));
  const remainingTime = Math.max(0, effectiveDuration - currentTime);
  const monthlyListeners = (Math.abs(track.playCount * 47 + 148200)).toLocaleString('es-ES');

  return (
    <div 
      className="fixed inset-0 z-50 flex flex-col justify-between p-4 sm:p-6 md:p-8 animate-in fade-in duration-200 overflow-y-auto no-scrollbar"
      style={{
        backgroundColor: '#121212',
        backgroundImage: 'radial-gradient(ellipse at 50% 20%, rgba(29, 185, 84, 0.12), transparent 75%)',
      }}
    >
      {/* Top Header - Authentic Spotify Style */}
      <div className="flex items-center justify-between max-w-4xl mx-auto w-full shrink-0 mb-4 sm:mb-6">
        <button
          onClick={onClose}
          className="p-2 -ml-2 rounded-full hover:bg-white/10 text-white transition-colors active:scale-95"
          aria-label="Cerrar reproductor"
        >
          <ChevronDown className="w-7 h-7" />
        </button>

        <div className="flex flex-col items-center text-center px-4 min-w-0">
          <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-[#B3B3B3]">
            Reproduciendo desde álbum
          </span>
          <span className="text-xs sm:text-sm font-bold text-white truncate max-w-[240px] sm:max-w-md">
            {track.album}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Sleep Timer Indicator */}
          {onOpenAudioSettings && (
            <button
              onClick={() => {
                audioEngine.playHapticTransition('click');
                onOpenAudioSettings();
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono font-semibold transition-all ${
                sleepTimerRemaining !== null && sleepTimerRemaining > 0
                  ? 'bg-indigo-950/80 text-indigo-300 border border-indigo-500/50 animate-pulse'
                  : 'text-[#B3B3B3] hover:text-white hover:bg-white/10'
              }`}
              title="Temporizador de apagado"
            >
              <Moon className="w-4 h-4 text-indigo-400" />
              {sleepTimerRemaining !== null && sleepTimerRemaining > 0 && (
                <span>{Math.ceil(sleepTimerRemaining / 60)}m</span>
              )}
            </button>
          )}

          {/* AI DJ Button */}
          {onOpenAiDj && (
            <button
              onClick={() => {
                audioEngine.playHapticTransition('click');
                onOpenAiDj();
              }}
              className="p-2 rounded-full hover:bg-white/10 text-[#1DB954] hover:text-white transition-colors"
              title="Sonora AI DJ - Curador Musical"
            >
              <Sparkles className="w-5 h-5 fill-[#1DB954]/20" />
            </button>
          )}

          {/* Share */}
          <button
            onClick={() => onOpenShare(track)}
            className="p-2 rounded-full hover:bg-white/10 text-[#B3B3B3] hover:text-white transition-colors"
            title="Compartir"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content Area: Responsive Adaptable Layout */}
      <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col justify-center items-center my-auto py-2">
        {activeTab === 'standard' && (
          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10 items-center">
            {/* Left: Spotify Square Artwork with soft vinyl shadow */}
            <div className="flex flex-col items-center justify-center w-full">
              <div className="relative aspect-square w-52 sm:w-72 md:w-80 lg:w-96 rounded-xl overflow-hidden shadow-2xl bg-[#181818] border border-white/5 transition-transform duration-300">
                <img 
                  src={track.coverUrl} 
                  alt={track.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />

                {/* Spotify Quality Chip (Clickable to change audio quality) */}
                <button
                  type="button"
                  onClick={() => onOpenAudioSettings?.()}
                  className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/85 backdrop-blur-md text-[10px] font-mono font-bold flex items-center gap-1.5 border shadow-lg hover:scale-105 active:scale-95 transition-all"
                  style={{
                    color: streamQuality === 'high' ? '#1DB954' : streamQuality === 'medium' ? '#38bdf8' : '#f59e0b',
                    borderColor: streamQuality === 'high' ? 'rgba(29, 185, 84, 0.4)' : streamQuality === 'medium' ? 'rgba(56, 189, 248, 0.4)' : 'rgba(245, 158, 11, 0.4)',
                  }}
                  title="Cambiar calidad de audio (Alto 320k / Medio 192k / Bajo 96k)"
                >
                  <Gauge className="w-3 h-3" />
                  <span>
                    {streamQuality === 'high' ? '320 kbps · ALTA' : streamQuality === 'medium' ? '192 kbps · MEDIA' : '96 kbps · BAJA'}
                  </span>
                </button>
              </div>
            </div>

            {/* Right: Embedded Synchronized Lyrics Card (Spotify Signature Feature) */}
            <div className="w-full flex flex-col justify-between h-72 sm:h-80 md:h-96 rounded-2xl bg-[#181818]/90 border border-white/10 p-5 shadow-xl relative overflow-hidden backdrop-blur-md">
              <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <Mic2 className="w-4 h-4 text-[#1DB954]" />
                  <span>Letras en tiempo real</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      audioEngine.playHapticTransition('click');
                      setActiveTab('fullLyrics');
                    }}
                    className="p-1 rounded text-[#B3B3B3] hover:text-white hover:bg-white/10 transition-colors"
                    title="Pantalla completa de letras"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      audioEngine.playHapticTransition('download');
                      storageService.downloadLyricsFile(track);
                    }}
                    className="px-2 py-0.5 rounded text-[11px] font-semibold text-[#1DB954] bg-[#1DB954]/10 hover:bg-[#1DB954]/20 border border-[#1DB954]/30 transition-all"
                    title="Descargar archivo sincronizado .LRC"
                  >
                    .LRC
                  </button>
                </div>
              </div>

              {/* Synchronized Lyrics Container */}
              <div 
                ref={lyricsContainerRef}
                className="flex-1 overflow-y-auto py-3 space-y-3.5 no-scrollbar scroll-smooth"
              >
                {isLoadingLyrics ? (
                  <div className="flex flex-col items-center justify-center h-full text-[#B3B3B3] space-y-2">
                    <div className="w-5 h-5 border-2 border-[#1DB954] border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs">Sincronizando letra con la música...</p>
                  </div>
                ) : syncedLyrics.length > 0 ? (
                  syncedLyrics.map((line, idx) => {
                    const isActive = idx === currentLyricIndex;
                    return (
                      <p
                        id={`lyric-line-${idx}`}
                        key={idx}
                        onClick={() => {
                          audioEngine.playHapticTransition('click');
                          onSeek(line.time);
                        }}
                        className={`text-base sm:text-xl font-bold cursor-pointer transition-all duration-200 select-none leading-relaxed ${
                          isActive
                            ? 'text-white scale-102 opacity-100 font-black'
                            : 'text-[#B3B3B3]/40 hover:text-white hover:opacity-90'
                        }`}
                        style={isActive ? { color: '#FFFFFF' } : {}}
                      >
                        {line.text}
                      </p>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center text-[#B3B3B3] space-y-2">
                    <FileText className="w-8 h-8 text-neutral-600" />
                    <p className="text-sm font-semibold text-white">Letra no disponible</p>
                    <p className="text-xs text-[#B3B3B3]">Disfruta de la pista instrumental en alta fidelidad.</p>
                  </div>
                )}
              </div>

              {/* Bottom Quick Switch to Artist Bio */}
              <button
                onClick={() => {
                  audioEngine.playHapticTransition('click');
                  setActiveTab('artist');
                }}
                className="pt-2 text-xs text-[#B3B3B3] hover:text-white flex items-center justify-between border-t border-white/5 transition-colors"
              >
                <span>Acerca de {track.artist}</span>
                <span className="text-[#1DB954] font-medium">Ver créditos →</span>
              </button>
            </div>
          </div>
        )}

        {/* FULLSCREEN KARAOKE LYRICS TAB */}
        {activeTab === 'fullLyrics' && (
          <div className="w-full max-w-2xl h-[420px] sm:h-[480px] flex flex-col justify-between rounded-3xl bg-[#181818]/95 border border-white/10 p-6 shadow-2xl relative backdrop-blur-xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-2">
                <Mic2 className="w-5 h-5 text-[#1DB954]" />
                <span className="text-sm font-bold text-white uppercase tracking-wider">Letra en Vivo (Karaoke)</span>
              </div>
              <button
                onClick={() => {
                  audioEngine.playHapticTransition('click');
                  setActiveTab('standard');
                }}
                className="p-1.5 rounded-full hover:bg-white/10 text-white transition-colors"
                title="Minimizar vista de letras"
              >
                <Minimize2 className="w-5 h-5" />
              </button>
            </div>

            <div 
              ref={fullLyricsContainerRef}
              className="flex-1 overflow-y-auto py-8 space-y-6 no-scrollbar scroll-smooth text-center"
            >
              {syncedLyrics.length > 0 ? (
                syncedLyrics.map((line, idx) => {
                  const isActive = idx === currentLyricIndex;
                  return (
                    <p
                      id={`full-lyric-line-${idx}`}
                      key={idx}
                      onClick={() => {
                        audioEngine.playHapticTransition('click');
                        onSeek(line.time);
                      }}
                      className={`text-xl sm:text-3xl font-extrabold cursor-pointer transition-all duration-300 select-none leading-relaxed ${
                        isActive
                          ? 'text-[#1DB954] scale-105 opacity-100 font-black drop-shadow-md'
                          : 'text-neutral-500 hover:text-neutral-300 opacity-50'
                      }`}
                    >
                      {line.text}
                    </p>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-neutral-400">
                  <p>Sin letras sincronizadas disponibles para esta pista.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ARTIST INFO TAB */}
        {activeTab === 'artist' && (
          <div className="w-full max-w-2xl h-[420px] sm:h-[480px] overflow-y-auto rounded-3xl bg-[#181818]/95 border border-white/10 p-6 space-y-4 no-scrollbar backdrop-blur-xl text-left">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Disc className="w-5 h-5 text-[#1DB954]" />
                <span>Acerca del Artista</span>
              </div>
              <button
                onClick={() => setActiveTab('standard')}
                className="text-xs text-[#B3B3B3] hover:text-white"
              >
                ← Volver al reproductor
              </button>
            </div>

            {/* Artist Hero Card */}
            <div className="p-5 rounded-2xl bg-black/40 border border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-sky-400 font-semibold">
                  <BadgeCheck className="w-4 h-4 fill-sky-400 text-black" />
                  <span>Artista Verificado en Sonora</span>
                </div>
                <span className="text-xs font-mono text-[#B3B3B3]">{monthlyListeners} oyentes mensuales</span>
              </div>
              <h3 className="text-2xl font-black text-white">{track.artist}</h3>
              <p className="text-xs text-[#B3B3B3] leading-relaxed">
                {track.description || `Artista de renombre en el catálogo universal de YouTube Music y Sonora. Destacado en el género ${track.genre}.`}
              </p>
            </div>

            {/* Credits Grid */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#B3B3B3]">Créditos de Producción</span>
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="p-3 rounded-xl bg-black/30 border border-white/5">
                  <span className="text-neutral-500 block text-[10px]">Intérprete Principal</span>
                  <span className="text-white font-semibold truncate block mt-0.5">{track.artist}</span>
                </div>
                <div className="p-3 rounded-xl bg-black/30 border border-white/5">
                  <span className="text-neutral-500 block text-[10px]">Sello Discográfico</span>
                  <span className="text-white font-semibold truncate block mt-0.5">{track.album} Records</span>
                </div>
                <div className="p-3 rounded-xl bg-black/30 border border-white/5">
                  <span className="text-neutral-500 block text-[10px]">Formato de Audio</span>
                  <span className="text-[#1DB954] font-mono font-semibold block mt-0.5">{track.bitrate}</span>
                </div>
                <div className="p-3 rounded-xl bg-black/30 border border-white/5">
                  <span className="text-neutral-500 block text-[10px]">Año & Catálogo</span>
                  <span className="text-white font-mono font-semibold block mt-0.5">{track.year} · YouTube</span>
                </div>
              </div>
            </div>

            {/* Download MP3 and Artwork Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => {
                  audioEngine.playHapticTransition('download');
                  storageService.downloadTrackAudioFile(track);
                }}
                className="px-4 py-2 rounded-full text-xs font-bold bg-[#1DB954] text-black hover:bg-[#1ed760] transition-all flex items-center gap-2 active:scale-95 shadow-lg"
              >
                <Download className="w-4 h-4" />
                <span>Descargar en formato MP3</span>
              </button>
              <button
                onClick={() => {
                  audioEngine.playHapticTransition('download');
                  storageService.downloadArtworkFile(track);
                }}
                className="px-4 py-2 rounded-full text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-all flex items-center gap-2 border border-white/10 active:scale-95"
              >
                <span>Guardar Carátula HD</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Spotify Bottom Controls Section - EXACT Spotify Proportions & Icons */}
      <div className="max-w-2xl mx-auto w-full pt-4 shrink-0">
        {/* Title, Artist and Heart Icon Row */}
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="min-w-0 pr-4">
            <h2 className="text-lg sm:text-2xl font-black text-white truncate tracking-tight">
              {track.title}
            </h2>
            <p className="text-xs sm:text-sm font-medium text-[#B3B3B3] truncate hover:text-white cursor-pointer transition-colors mt-0.5">
              {track.artist}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onToggleLike(track.id)}
              className="p-2.5 rounded-full hover:scale-105 active:scale-95 transition-all text-[#B3B3B3] hover:text-white"
              aria-label="Guardar en tu biblioteca"
            >
              <Heart 
                className={`w-6 h-6 transition-colors ${isLiked ? 'fill-[#1DB954] text-[#1DB954]' : ''}`}
              />
            </button>

            <button
              onClick={() => onToggleDownload(track)}
              className="p-2.5 rounded-full hover:scale-105 active:scale-95 transition-all text-[#B3B3B3] hover:text-white"
              title="Descargar para escuchar offline"
              aria-label="Descargar canción"
            >
              {isDownloaded ? (
                <Check className="w-5 h-5 text-[#1DB954]" />
              ) : (
                <Download className="w-5 h-5" />
              )}
            </button>

            <button
              onClick={onOpenEq}
              className="p-2.5 rounded-full hover:scale-105 active:scale-95 transition-all text-[#B3B3B3] hover:text-white"
              title="Ecualizador"
              aria-label="Ecualizador"
            >
              <Sliders className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Spotify Timeline Scrubber */}
        <div className="w-full flex items-center gap-2.5 mb-2 group">
          <span className="text-[11px] font-mono tabular-nums text-[#B3B3B3] w-10 text-right">
            {formatTime(currentTime)}
          </span>

          <div className="relative flex-1 flex items-center py-2">
            <input
              type="range"
              min={0}
              max={effectiveDuration}
              step={0.5}
              value={currentTime}
              onChange={(e) => onSeek(parseFloat(e.target.value))}
              className="w-full h-1 bg-[#4d4d4d] rounded-lg appearance-none cursor-pointer focus:outline-none accent-white group-hover:accent-[#1DB954] transition-all"
              style={{
                background: `linear-gradient(to right, #1DB954 0%, #1DB954 ${progressPercent}%, #4d4d4d ${progressPercent}%, #4d4d4d 100%)`,
              }}
            />
          </div>

          <span className="text-[11px] font-mono tabular-nums text-[#B3B3B3] w-10 text-left">
            -{formatTime(remainingTime)}
          </span>
        </div>

        {/* Spotify Playback Buttons Row */}
        <div className="flex items-center justify-between sm:justify-center sm:gap-10 pb-4 px-2">
          {/* Shuffle */}
          <button
            onClick={onToggleShuffle}
            className={`p-2 transition-transform active:scale-90 relative ${
              shuffle ? 'text-[#1DB954]' : 'text-[#B3B3B3] hover:text-white'
            }`}
            aria-label="Aleatorio"
          >
            <Shuffle className="w-5 h-5" />
            {shuffle && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#1DB954]" />}
          </button>

          {/* Previous */}
          <button
            onClick={onPrev}
            className="p-2 text-[#B3B3B3] hover:text-white transition-transform active:scale-90"
            aria-label="Canción anterior"
          >
            <SkipBack className="w-7 h-7 fill-current" />
          </button>

          {/* Large Spotify Play/Pause Button (56px) */}
          <button
            onClick={onTogglePlay}
            className="w-14 h-14 rounded-full bg-[#1DB954] hover:bg-[#1ed760] hover:scale-105 active:scale-95 text-black font-bold flex items-center justify-center transition-all shadow-xl"
            aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 fill-current" />
            ) : (
              <Play className="w-6 h-6 fill-current ml-0.5" />
            )}
          </button>

          {/* Next */}
          <button
            onClick={onNext}
            className="p-2 text-[#B3B3B3] hover:text-white transition-transform active:scale-90"
            aria-label="Siguiente canción"
          >
            <SkipForward className="w-7 h-7 fill-current" />
          </button>

          {/* Repeat */}
          <button
            onClick={onToggleRepeat}
            className={`p-2 transition-transform active:scale-90 relative ${
              repeat !== 'off' ? 'text-[#1DB954]' : 'text-[#B3B3B3] hover:text-white'
            }`}
            aria-label="Repetir"
          >
            <Repeat className="w-5 h-5" />
            {repeat !== 'off' && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#1DB954]" />}
          </button>
        </div>
      </div>
    </div>
  );
};
