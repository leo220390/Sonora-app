import React, { useState } from 'react';
import { 
  Play, 
  Sparkles, 
  Zap, 
  DownloadCloud, 
  Heart, 
  Flame, 
  Radio, 
  Sliders, 
  Check, 
  Users,
  Moon,
  Clock
} from 'lucide-react';
import { Track, Playlist, MoodType, DarkThemeConfig, BatteryState } from '../types/music';
import { MOODS } from '../services/catalogService';

interface HomeViewProps {
  tracks: Track[];
  playlists: Playlist[];
  currentTrack: Track | null;
  isPlaying: boolean;
  likedTrackIds: string[];
  downloadedTrackIds: string[];
  activeTheme: DarkThemeConfig;
  batteryState: BatteryState;
  listeningHistory: Track[];
  onPlayTrack: (track: Track) => void;
  onPlayPlaylist: (playlist: Playlist) => void;
  onToggleLike: (trackId: string) => void;
  onToggleDownload: (track: Track) => void;
  onOpenBatteryModal: () => void;
  onOpenThemeModal: () => void;
  onOpenEqModal: () => void;
  onOpenAiDj?: () => void;
  onOpenAudioSettings?: () => void;
  onSelectView: (view: 'home' | 'explore' | 'library' | 'offline') => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  tracks,
  playlists,
  currentTrack,
  isPlaying,
  likedTrackIds,
  downloadedTrackIds,
  activeTheme,
  batteryState,
  listeningHistory,
  onPlayTrack,
  onPlayPlaylist,
  onToggleLike,
  onToggleDownload,
  onOpenBatteryModal,
  onOpenThemeModal,
  onOpenEqModal,
  onOpenAiDj,
  onOpenAudioSettings,
  onSelectView,
}) => {
  const [selectedMood, setSelectedMood] = useState<MoodType>('Energético');

  // Featured track
  const featuredTrack = tracks[0];

  // Mood recommendations
  const moodTracks = tracks.filter((t) => t.mood === selectedMood).slice(0, 4);

  // Top trending tracks
  const trendingTracks = [...tracks].sort((a, b) => b.playCount - a.playCount).slice(0, 6);

  return (
    <div className="space-y-8 pb-28">
      {/* Hero Featured Release Bento Grid */}
      <div 
        className="relative rounded-3xl overflow-hidden border p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl"
        style={{
          backgroundColor: activeTheme.bgHex === '#000000' ? '#080808' : activeTheme.surfaceHex,
          borderColor: activeTheme.borderHex,
        }}
      >
        <div className="flex-1 space-y-3 text-center md:text-left z-10">
          <div className="flex items-center justify-center md:justify-start gap-2 text-xs text-slate-400">
            <span className="text-emerald-400 font-semibold tracking-wide uppercase">Lanzamiento Destacado</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-slate-400">FLAC 24-bit 320k</span>
            <span aria-hidden="true">·</span>
            <span>Optimizado para Ahorro</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            {featuredTrack.title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            {featuredTrack.artist} — {featuredTrack.description}
          </p>

          <div className="flex items-center justify-center md:justify-start gap-3 pt-2">
            <button
              onClick={() => onPlayTrack(featuredTrack)}
              className="px-6 py-2.5 rounded-full font-bold text-xs sm:text-sm text-black flex items-center gap-2 shadow-xl transition-transform active:scale-95"
              style={{ backgroundColor: activeTheme.accentHex }}
            >
              <Play className="w-4 h-4 fill-current ml-0.5" />
              <span>{currentTrack?.id === featuredTrack.id && isPlaying ? 'Pausar' : 'Reproducir Ahora'}</span>
            </button>

            <button
              onClick={() => onToggleDownload(featuredTrack)}
              className="px-4 py-2.5 rounded-full text-xs font-medium bg-white/10 hover:bg-white/15 text-white flex items-center gap-2 transition-colors border border-white/10"
            >
              {downloadedTrackIds.includes(featuredTrack.id) ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Disponible Offline</span>
                </>
              ) : (
                <>
                  <DownloadCloud className="w-4 h-4" />
                  <span>Descargar Offline</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Big Artwork with vinyl styling */}
        <div className="w-56 h-56 sm:w-64 sm:h-64 rounded-2xl overflow-hidden shrink-0 shadow-2xl border border-white/10 relative group">
          <img 
            src={featuredTrack.coverUrl} 
            alt={featuredTrack.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        </div>
      </div>

      {/* Sonora AI DJ Banner Card */}
      {onOpenAiDj && (
        <div 
          className="p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl transition-all"
          style={{
            background: 'linear-gradient(135deg, rgba(29, 185, 84, 0.14) 0%, rgba(18, 18, 18, 0.95) 100%)',
            borderColor: 'rgba(29, 185, 84, 0.35)',
          }}
        >
          <div className="flex items-center gap-3.5 text-center sm:text-left">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#1DB954] to-emerald-300 flex items-center justify-center text-black font-black shrink-0 shadow-lg">
              <Sparkles className="w-6 h-6 fill-current animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <h4 className="text-sm sm:text-base font-bold text-white">Sonora AI DJ & Curador Inteligente</h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#1DB954]/20 text-[#1DB954] border border-[#1DB954]/40">
                  Gemini 3.8 Flash
                </span>
              </div>
              <p className="text-xs text-neutral-300 mt-0.5">
                Pídele a la IA en lenguaje natural cualquier estado de ánimo o género para generar sesiones automáticas de YouTube Music.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenAiDj}
            className="px-5 py-2.5 rounded-full text-xs font-bold bg-[#1DB954] text-black hover:bg-[#1ed760] transition-transform active:scale-95 shrink-0 shadow-lg flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 fill-current" />
            <span>Abrir Sonora AI DJ</span>
          </button>
        </div>
      )}

      {/* Quick Access Playlist Cards (Spotify 2-column or 3-column top grid) */}
      <div>
        <h3 className="text-base sm:text-lg font-bold text-white mb-3">Tus Listas Frecuentes</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {playlists.slice(0, 6).map((pl) => (
            <div
              key={pl.id}
              onClick={() => onPlayPlaylist(pl)}
              className="group flex items-center justify-between p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/15 cursor-pointer transition-all duration-200"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-slate-900 border border-white/5">
                  <img 
                    src={pl.coverUrl} 
                    alt={pl.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs sm:text-sm font-semibold text-white truncate group-hover:text-emerald-400 transition-colors">
                    {pl.title}
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {pl.trackIds.length} canciones · {pl.author}
                  </span>
                </div>
              </div>

              <button
                className="w-8 h-8 rounded-full flex items-center justify-center text-black font-bold shrink-0 opacity-0 group-hover:opacity-100 transition-opacity shadow-md ml-2"
                style={{ backgroundColor: activeTheme.accentHex }}
              >
                <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Historial Reciente (Últimas 10 Canciones reproducidas) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            <h3 className="text-base sm:text-lg font-bold text-white">
              Historial Reciente (Últimas 10 canciones)
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-medium">Reanudación rápida con 1 toque</span>
        </div>

        {listeningHistory && listeningHistory.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {listeningHistory.slice(0, 10).map((histTrack, index) => {
              const isCurrent = currentTrack?.id === histTrack.id;
              return (
                <div
                  key={`${histTrack.id}-${index}`}
                  onClick={() => onPlayTrack(histTrack)}
                  className={`group relative p-2.5 rounded-xl border cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                    isCurrent
                      ? 'bg-white/10 border-emerald-500/50 shadow-lg shadow-emerald-500/10'
                      : 'bg-white/5 hover:bg-white/10 border-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="relative aspect-square w-full rounded-lg overflow-hidden mb-2 bg-slate-900 border border-white/5">
                    <img 
                      src={histTrack.coverUrl} 
                      alt={histTrack.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-md text-[9px] font-mono text-slate-300 font-semibold">
                      #{index + 1}
                    </div>
                    <button
                      className={`absolute bottom-2 right-2 w-8 h-8 rounded-full flex items-center justify-center text-black font-bold transition-all shadow-lg ${
                        isCurrent && isPlaying
                          ? 'opacity-100 scale-100'
                          : 'opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100'
                      }`}
                      style={{ backgroundColor: activeTheme.accentHex }}
                      aria-label="Reproducir pista"
                    >
                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    </button>
                  </div>

                  <div className="min-w-0">
                    <h4 className={`text-xs font-semibold truncate ${isCurrent ? 'text-emerald-400' : 'text-white group-hover:text-emerald-400'} transition-colors`}>
                      {histTrack.title}
                    </h4>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {histTrack.artist}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mt-1 pt-1 border-t border-white/5">
                      <span className="truncate">{histTrack.album || 'YouTube Audio'}</span>
                      <span className="shrink-0">
                        {Math.floor(histTrack.duration / 60)}:{(histTrack.duration % 60).toString().padStart(2, '0')}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-5 rounded-2xl bg-white/5 border border-white/5 text-center text-xs text-slate-400 space-y-1">
            <p className="text-slate-300 font-medium">No hay canciones recientes aún.</p>
            <p>Reproduce cualquier pista de YouTube para que aparezca aquí tu historial de las últimas 10.</p>
          </div>
        )}
      </div>

      {/* Mood Selector & Smart Mood Playlist */}
      <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Música según tu Estado de Ánimo</span>
            </h3>
            <p className="text-xs text-slate-400">
              Listas automáticas adaptadas a tus niveles de energía y concentración.
            </p>
          </div>

          {/* Mood buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {MOODS.map((m) => (
              <button
                key={m}
                onClick={() => setSelectedMood(m)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
                  selectedMood === m
                    ? 'bg-white text-black font-bold'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Mood Tracks Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
          {moodTracks.map((track) => (
            <div
              key={track.id}
              onClick={() => onPlayTrack(track)}
              className="group p-3 rounded-xl bg-black/30 hover:bg-white/10 border border-white/5 hover:border-white/15 cursor-pointer transition-all duration-200"
            >
              <div className="relative aspect-square w-full rounded-lg overflow-hidden mb-2 bg-slate-900">
                <img 
                  src={track.coverUrl} 
                  alt={track.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <button
                  className="absolute bottom-2 right-2 w-8 h-8 rounded-full flex items-center justify-center text-black font-bold opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                  style={{ backgroundColor: activeTheme.accentHex }}
                >
                  <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                </button>
              </div>

              <h4 className="text-xs font-semibold text-white truncate">{track.title}</h4>
              <p className="text-[11px] text-slate-400 truncate mt-0.5">{track.artist}</p>
              <span className="text-[10px] text-slate-500 font-mono mt-1 block">
                {track.bpm} BPM · {track.quality.toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Trending Tracks List */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-400" />
            <h3 className="text-base sm:text-lg font-bold text-white">Más Escuchadas en YouTube & Sonora</h3>
          </div>
          <button
            onClick={() => onSelectView('explore')}
            className="text-xs text-slate-400 hover:text-white underline"
          >
            Ver catálogo completo
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {trendingTracks.map((track, idx) => (
            <div
              key={track.id}
              onClick={() => onPlayTrack(track)}
              className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 cursor-pointer transition-colors border border-transparent hover:border-white/5 group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xs font-mono text-slate-500 w-4 text-center">
                  {idx + 1}
                </span>
                <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-white/5">
                  <img 
                    src={track.coverUrl} 
                    alt={track.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-semibold text-white truncate group-hover:text-emerald-400 transition-colors">
                    {track.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 truncate">{track.artist}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] text-slate-500 font-mono">
                  {track.playCount.toLocaleString()} plays
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleLike(track.id);
                  }}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <Heart 
                    className={`w-3.5 h-3.5 ${likedTrackIds.includes(track.id) ? 'fill-emerald-400 text-emerald-400' : ''}`}
                    style={likedTrackIds.includes(track.id) ? { fill: activeTheme.accentHex, color: activeTheme.accentHex } : {}}
                  />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Battery & Performance Efficiency Summary Bento */}
      <div className="p-5 rounded-2xl bg-white/5 border border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div 
          onClick={onOpenBatteryModal}
          className="p-3.5 rounded-xl bg-black/30 border border-white/5 cursor-pointer hover:border-white/15 transition-all"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-semibold text-white flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Eficiencia de Batería
            </span>
            <span className="font-mono text-emerald-400">
              {batteryState.saverActive ? 'Modo Eco' : 'Estándar'}
            </span>
          </div>
          <p className="text-slate-400 text-[11px]">
            {Math.round(batteryState.level * 100)}% restante. Hasta ~14 horas de reproducción continua.
          </p>
        </div>

        <div 
          onClick={onOpenThemeModal}
          className="p-3.5 rounded-xl bg-black/30 border border-white/5 cursor-pointer hover:border-white/15 transition-all"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-semibold text-white flex items-center gap-1.5">
              <Moon className="w-3.5 h-3.5 text-sky-400" />
              Tema Oscuro Activo
            </span>
            <span className="font-mono text-white text-[11px]">
              {activeTheme.name.split(' ')[0]}
            </span>
          </div>
          <p className="text-slate-400 text-[11px]">
            {activeTheme.description}
          </p>
        </div>

        <div 
          onClick={() => onSelectView('offline')}
          className="p-3.5 rounded-xl bg-black/30 border border-white/5 cursor-pointer hover:border-white/15 transition-all"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-semibold text-white flex items-center gap-1.5">
              <DownloadCloud className="w-3.5 h-3.5 text-emerald-400" />
              Almacenamiento Offline
            </span>
            <span className="font-mono text-emerald-400 text-[11px]">
              {downloadedTrackIds.length} Pistas
            </span>
          </div>
          <p className="text-slate-400 text-[11px]">
            Reproducción local sin conexión a internet ni consumo de datos.
          </p>
        </div>
      </div>
    </div>
  );
};
