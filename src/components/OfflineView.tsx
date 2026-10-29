import React from 'react';
import { 
  DownloadCloud, 
  HardDrive, 
  WifiOff, 
  Trash2, 
  Play, 
  Zap, 
  Check, 
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { Track, DarkThemeConfig } from '../types/music';
import { TrackRow } from './TrackRow';

interface OfflineViewProps {
  downloadedTracks: Track[];
  currentTrack: Track | null;
  isPlaying: boolean;
  likedTrackIds: string[];
  activeTheme: DarkThemeConfig;
  storageStats: { usedMb: number; totalQuotaMb: number; count: number };
  isAirplaneMode: boolean;
  onToggleAirplaneMode: () => void;
  onPlayTrack: (track: Track) => void;
  onToggleLike: (trackId: string) => void;
  onToggleDownload: (track: Track) => void;
  onDownloadAll: () => void;
  onOpenStorageModal: () => void;
}

export const OfflineView: React.FC<OfflineViewProps> = ({
  downloadedTracks,
  currentTrack,
  isPlaying,
  likedTrackIds,
  activeTheme,
  storageStats,
  isAirplaneMode,
  onToggleAirplaneMode,
  onPlayTrack,
  onToggleLike,
  onToggleDownload,
  onDownloadAll,
  onOpenStorageModal,
}) => {
  const percentUsed = Math.min(100, Math.max(1, (storageStats.usedMb / storageStats.totalQuotaMb) * 100));

  return (
    <div className="space-y-6 pb-28">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Modo Offline & Descargas
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              ALTA RESOLUCIÓN
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Música almacenada en IndexedDB lista para reproducirse sin datos, cobertura ni conexión a internet.
          </p>
        </div>

        {/* Airplane Mode / Offline simulation toggle */}
        <button
          onClick={onToggleAirplaneMode}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
            isAirplaneMode
              ? 'bg-amber-400 text-black border-amber-400 font-bold shadow-lg shadow-amber-500/20'
              : 'bg-white/5 text-slate-300 hover:text-white border-white/10'
          }`}
          title="Fuerza a la aplicación a operar 100% desconectada de internet"
        >
          <WifiOff className="w-4 h-4" />
          <span>{isAirplaneMode ? 'Modo Sin Conexión ACTIVO' : 'Simular Sin Conexión'}</span>
        </button>
      </div>

      {/* Storage Gauge Bento Card */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        {/* Left: Storage progress */}
        <div className="md:col-span-2 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-semibold flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
              Almacenamiento Local Sonora (IndexedDB)
            </span>
            <span className="font-mono tabular-nums text-slate-400">
              {storageStats.usedMb} MB de {storageStats.totalQuotaMb} MB ({storageStats.count} canciones)
            </span>
          </div>

          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
            <div 
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.max(4, percentUsed)}%`,
                backgroundColor: activeTheme.accentHex,
              }}
            />
          </div>

          <p className="text-[11px] text-slate-400">
            Formato: FLAC Lossless / AAC 320 kbps con metadatos de estudio y letras sincronizadas integradas.
          </p>
        </div>

        {/* Right: Quick actions */}
        <div className="flex flex-col sm:flex-row md:flex-col gap-2">
          <button
            onClick={onDownloadAll}
            className="w-full py-2 px-3 rounded-lg text-xs font-semibold text-black bg-white hover:bg-slate-200 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-sm"
          >
            <DownloadCloud className="w-3.5 h-3.5" />
            <span>Descargar Todo el Catálogo</span>
          </button>

          <button
            onClick={onOpenStorageModal}
            className="w-full py-2 px-3 rounded-lg text-xs font-medium text-slate-200 bg-white/10 hover:bg-white/20 transition-all active:scale-95 flex items-center justify-center gap-2 border border-white/10"
          >
            <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
            <span>Elegir Carpeta de Destino</span>
          </button>
          
          <div className="flex items-center gap-1 text-[11px] text-emerald-400 justify-center pt-1">
            <Zap className="w-3.5 h-3.5" />
            <span>Ahorro de batería activo (~70% menos uso de CPU)</span>
          </div>
        </div>
      </div>

      {/* Downloaded Track List */}
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-2">
          <span className="text-sm font-semibold text-white">
            Canciones disponibles sin conexión ({downloadedTracks.length})
          </span>
          <span className="text-xs text-slate-500 font-mono">320kbps / FLAC</span>
        </div>

        <div className="space-y-1">
          {downloadedTracks.length > 0 ? (
            downloadedTracks.map((track, idx) => (
              <TrackRow
                key={track.id}
                track={track}
                index={idx}
                isCurrent={currentTrack?.id === track.id}
                isPlaying={isPlaying}
                isLiked={likedTrackIds.includes(track.id)}
                isDownloaded={true}
                activeTheme={activeTheme}
                onPlay={onPlayTrack}
                onToggleLike={onToggleLike}
                onToggleDownload={onToggleDownload}
              />
            ))
          ) : (
            <div className="p-12 text-center rounded-2xl bg-white/5 border border-white/5">
              <DownloadCloud className="w-8 h-8 text-slate-500 mx-auto mb-2" />
              <h4 className="text-sm font-semibold text-white">No tienes canciones descargadas</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Haz clic en el icono de descarga en cualquier canción para guardarla en tu dispositivo y escucharla sin gastar batería ni datos.
              </p>
              <button
                onClick={onDownloadAll}
                className="mt-4 px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-500 text-black hover:bg-emerald-400"
              >
                Descargar canciones recomendadas ahora
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
