import React, { useState } from 'react';
import { 
  X, 
  Play, 
  DownloadCloud, 
  Check, 
  FileText, 
  Image as ImageIcon, 
  Radio, 
  Sparkles, 
  Clock, 
  Folder 
} from 'lucide-react';
import { Album, Track, DarkThemeConfig, StorageSettings } from '../types/music';
import { storageService } from '../services/storageService';

interface AlbumDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  album: Album | null;
  tracks: Track[];
  currentTrack: Track | null;
  isPlaying: boolean;
  downloadedTrackIds: string[];
  activeTheme: DarkThemeConfig;
  onPlayTrack: (track: Track) => void;
  onAlbumDownloaded: (trackIds: string[]) => void;
}

const formatTime = (seconds: number): string => {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

export const AlbumDetailModal: React.FC<AlbumDetailModalProps> = ({
  isOpen,
  onClose,
  album,
  tracks,
  currentTrack,
  isPlaying,
  downloadedTrackIds,
  activeTheme,
  onPlayTrack,
  onAlbumDownloaded,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadStatusText, setDownloadStatusText] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  if (!isOpen || !album) return null;

  const albumTracks = tracks.filter((t) => album.trackIds.includes(t.id));
  const isAllDownloaded = albumTracks.length > 0 && albumTracks.every(t => downloadedTrackIds.includes(t.id));

  const handleDownloadFullAlbum = async () => {
    setIsDownloading(true);
    setDownloadProgress(0);
    const settings = storageService.getStorageSettings();

    for (let i = 0; i < albumTracks.length; i++) {
      const track = albumTracks[i];
      setDownloadStatusText(`Descargando "${track.title}" desde ${album.source.toUpperCase()}...`);
      await new Promise(r => setTimeout(r, 450)); // Simulated network fetch
      await storageService.saveTrackOffline(track);

      // If user chose browser downloads or file system
      if (settings.destination === 'downloads') {
        storageService.downloadTrackAudioFile(track);
      }
      if (settings.autoDownloadLyrics) {
        storageService.downloadLyricsFile(track);
      }

      setDownloadProgress(Math.round(((i + 1) / albumTracks.length) * 100));
    }

    if (settings.autoDownloadArtwork) {
      setDownloadStatusText('Guardando carátula Ultra HD original...');
      await storageService.downloadArtworkFile(albumTracks[0]);
    }

    onAlbumDownloaded(album.trackIds);
    setIsDownloading(false);
    setIsComplete(true);
    setDownloadStatusText(`¡Álbum completo descargado en ${settings.folderName}!`);
  };

  const handleDownloadCoverArt = () => {
    if (albumTracks.length > 0) {
      storageService.downloadArtworkFile(albumTracks[0]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl rounded-3xl border shadow-2xl p-6 sm:p-8 relative overflow-hidden text-slate-100 max-h-[90vh] overflow-y-auto"
        style={{
          backgroundColor: activeTheme.bgHex === '#000000' ? '#0a0a0a' : activeTheme.surfaceHex,
          borderColor: activeTheme.borderHex,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
            <span className="uppercase">{album.source} Master</span>
            <span aria-hidden="true">·</span>
            <span>Álbum Completo</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Album Showcase Row */}
        <div className="mt-6 flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="relative w-44 h-44 sm:w-52 sm:h-52 rounded-2xl overflow-hidden shrink-0 shadow-2xl border border-white/10 group">
            <img 
              src={album.coverUrl} 
              alt={album.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <button
              onClick={handleDownloadCoverArt}
              className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/60 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80 text-xs flex items-center gap-1"
              title="Descargar carátula en Ultra HD"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Guardar Portada</span>
            </button>
          </div>

          <div className="flex-1 text-center sm:text-left space-y-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white/10 text-emerald-400">
              {album.genre}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {album.title}
            </h2>
            <p className="text-sm font-semibold text-slate-300">{album.artist}</p>
            <p className="text-xs text-slate-400 max-w-md">{album.description}</p>

            <div className="flex items-center justify-center sm:justify-start gap-2 text-xs text-slate-400 pt-1 font-mono">
              <span>{albumTracks.length} Pistas</span>
              <span aria-hidden="true">·</span>
              <span>{formatTime(album.totalDuration)}</span>
              <span aria-hidden="true">·</span>
              <span>Año {album.year}</span>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-3">
              <button
                onClick={() => albumTracks[0] && onPlayTrack(albumTracks[0])}
                className="px-5 py-2 rounded-full font-bold text-xs text-black flex items-center gap-2 shadow-lg transition-transform active:scale-95"
                style={{ backgroundColor: activeTheme.accentHex }}
              >
                <Play className="w-4 h-4 fill-current ml-0.5" />
                <span>Reproducir Álbum</span>
              </button>

              <button
                onClick={handleDownloadFullAlbum}
                disabled={isDownloading}
                className={`px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-2 border transition-all active:scale-95 ${
                  isAllDownloaded || isComplete
                    ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40'
                    : 'bg-white/10 hover:bg-white/20 text-white border-white/10'
                }`}
              >
                {isDownloading ? (
                  <>
                    <DownloadCloud className="w-4 h-4 animate-bounce" />
                    <span>Descargando ({downloadProgress}%)...</span>
                  </>
                ) : isAllDownloaded || isComplete ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Álbum Descargado</span>
                  </>
                ) : (
                  <>
                    <DownloadCloud className="w-4 h-4" />
                    <span>Descargar Álbum Completo</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Download Progress Bar */}
        {isDownloading && (
          <div className="mt-5 p-3 rounded-xl bg-white/5 border border-white/10 space-y-2 animate-in fade-in">
            <div className="flex items-center justify-between text-xs text-slate-300 font-mono">
              <span className="truncate">{downloadStatusText}</span>
              <span>{downloadProgress}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${downloadProgress}%`,
                  backgroundColor: activeTheme.accentHex,
                }}
              />
            </div>
          </div>
        )}

        {/* Tracks in Album */}
        <div className="mt-6">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Pistas del Álbum
          </h4>
          <div className="space-y-1">
            {albumTracks.map((track, idx) => (
              <div
                key={track.id}
                onClick={() => onPlayTrack(track)}
                className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-colors ${
                  currentTrack?.id === track.id ? 'bg-white/10 text-emerald-400' : 'hover:bg-white/5 text-white'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs font-mono text-slate-500 w-5 text-center">
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <span className="text-xs font-semibold truncate block">{track.title}</span>
                    <span className="text-[10px] text-slate-400">{track.artist}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0" onClick={e => e.stopPropagation()}>
                  {downloadedTrackIds.includes(track.id) && (
                    <span title="Guardada offline">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    </span>
                  )}
                  <button
                    onClick={() => storageService.downloadLyricsFile(track)}
                    className="p-1 rounded text-slate-400 hover:text-white"
                    title="Descargar letra (.LRC)"
                  >
                    <FileText className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-xs font-mono text-slate-400">
                    {formatTime(track.duration)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-black bg-white hover:bg-slate-200 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
