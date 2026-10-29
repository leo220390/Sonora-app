import React, { useState } from 'react';
import { 
  Plus, 
  ListMusic, 
  Sparkles, 
  Users, 
  Heart, 
  DownloadCloud, 
  Play, 
  FolderDown, 
  Tag, 
  Trash2, 
  X,
  Share2
} from 'lucide-react';
import { Playlist, Track, DarkThemeConfig } from '../types/music';
import { TrackRow } from './TrackRow';
import { audioEngine } from '../services/audioEngine';

interface LibraryViewProps {
  playlists: Playlist[];
  tracks: Track[];
  currentTrack: Track | null;
  isPlaying: boolean;
  likedTrackIds: string[];
  downloadedTrackIds: string[];
  activeTheme: DarkThemeConfig;
  onPlayTrack: (track: Track) => void;
  onPlayPlaylist: (playlist: Playlist) => void;
  onToggleLike: (trackId: string) => void;
  onToggleDownload: (track: Track) => void;
  onCreatePlaylist: (title: string, desc: string) => void;
  onOpenCollabModal: () => void;
  onImportLocalFiles?: (tracks: Track[]) => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  playlists,
  tracks,
  currentTrack,
  isPlaying,
  likedTrackIds,
  downloadedTrackIds,
  activeTheme,
  onPlayTrack,
  onPlayPlaylist,
  onToggleLike,
  onToggleDownload,
  onCreatePlaylist,
  onOpenCollabModal,
  onImportLocalFiles,
}) => {
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'smart' | 'collab' | 'local'>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [isCreatingModalOpen, setIsCreatingModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Handle local audio files import (.mp3, .wav, .flac, .ogg, .m4a)
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const importedTracks: Track[] = [];
    Array.from(files).forEach((file, index) => {
      const blobUrl = URL.createObjectURL(file);
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');
      const parts = cleanName.split(' - ');
      const artist = parts.length > 1 ? parts[0].trim() : 'Archivo Local';
      const title = parts.length > 1 ? parts.slice(1).join(' - ').trim() : cleanName;

      const newTrack: Track = {
        id: `local-${Date.now()}-${index}`,
        title: title || 'Pista Local',
        artist: artist || 'Mi Dispositivo',
        album: 'Biblioteca Local',
        duration: 180,
        coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80',
        youtubeId: '',
        localAudioUrl: blobUrl,
        audioUrl: blobUrl,
        source: 'web_archive',
        genre: 'Pop',
        mood: 'Chill / Relax',
        bpm: 120,
        year: new Date().getFullYear(),
        tags: ['Local', 'Offline', 'MP3'],
        quality: '320k',
        bitrate: '320 kbps MP3',
        playCount: 1,
        isDownloaded: true,
        sizeMb: Math.round((file.size / (1024 * 1024)) * 10) / 10,
        description: `Archivo local de audio: ${file.name}`,
      };

      const tempAudio = new Audio(blobUrl);
      tempAudio.onloadedmetadata = () => {
        if (tempAudio.duration && !isNaN(tempAudio.duration)) {
          newTrack.duration = Math.round(tempAudio.duration);
        }
      };

      importedTracks.push(newTrack);
    });

    if (importedTracks.length > 0 && onImportLocalFiles) {
      onImportLocalFiles(importedTracks);
      setFilterType('local');
    }
  };

  // Collect all unique smart tags
  const allTags = Array.from(new Set(tracks.flatMap((t) => t.tags)));

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onCreatePlaylist(newTitle.trim(), newDesc.trim() || 'Lista personalizada en Sonora');
    setNewTitle('');
    setNewDesc('');
    setIsCreatingModalOpen(false);
  };

  const filteredPlaylists = playlists.filter((pl) => {
    if (filterType === 'smart') return pl.isSmart;
    if (filterType === 'collab') return pl.isCollaborative;
    return true;
  });

  // If a playlist is selected, display its detail view
  if (selectedPlaylist) {
    const playlistTracks = tracks.filter((t) => selectedPlaylist.trackIds.includes(t.id));

    return (
      <div className="space-y-6 pb-28">
        {/* Back and playlist header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSelectedPlaylist(null)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white"
          >
            ← Volver a Biblioteca
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 p-6 rounded-2xl bg-white/5 border border-white/10">
          <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-xl overflow-hidden shrink-0 shadow-2xl border border-white/10">
            <img 
              src={selectedPlaylist.coverUrl} 
              alt={selectedPlaylist.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex items-center justify-center sm:justify-start gap-2 text-xs text-slate-400">
              <span>{selectedPlaylist.isSmart ? 'Lista Inteligente Automática' : 'Lista Personal'}</span>
              {selectedPlaylist.isCollaborative && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-emerald-400 font-medium">Colaborativa</span>
                </>
              )}
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              {selectedPlaylist.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              {selectedPlaylist.description}
            </p>

            <div className="flex items-center justify-center sm:justify-start gap-3 pt-3">
              <button
                onClick={() => onPlayPlaylist(selectedPlaylist)}
                className="px-5 py-2.5 rounded-full font-bold text-xs sm:text-sm text-black flex items-center gap-2 shadow-lg transition-transform active:scale-95"
                style={{ backgroundColor: activeTheme.accentHex }}
              >
                <Play className="w-4 h-4 fill-current ml-0.5" />
                <span>Reproducir Todo</span>
              </button>

              {selectedPlaylist.isCollaborative && (
                <button
                  onClick={onOpenCollabModal}
                  className="px-4 py-2.5 rounded-full text-xs font-medium bg-white/10 hover:bg-white/15 text-white flex items-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  <span>Amigos ({selectedPlaylist.collaborators?.length || 1})</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tracks List */}
        <div className="space-y-1">
          {playlistTracks.map((track, idx) => (
            <TrackRow
              key={track.id}
              track={track}
              index={idx}
              isCurrent={currentTrack?.id === track.id}
              isPlaying={isPlaying}
              isLiked={likedTrackIds.includes(track.id)}
              isDownloaded={downloadedTrackIds.includes(track.id)}
              activeTheme={activeTheme}
              onPlay={onPlayTrack}
              onToggleLike={onToggleLike}
              onToggleDownload={onToggleDownload}
            />
          ))}
        </div>
      </div>
    );
  }

  // Tag filter active view
  const tagFilteredTracks = selectedTag
    ? tracks.filter((t) => t.tags.includes(selectedTag))
    : [];

  return (
    <div className="space-y-6 pb-28">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Tu Biblioteca Sonora
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Organización inteligente por etiquetas, listas automáticas y sesiones compartidas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input 
            type="file" 
            ref={fileInputRef} 
            accept="audio/*,.mp3,.wav,.flac,.ogg,.m4a" 
            multiple 
            onChange={handleFileSelect} 
            className="hidden" 
          />
          <button
            onClick={() => {
              audioEngine.playHapticTransition('click');
              fileInputRef.current?.click();
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-semibold bg-[#242424] hover:bg-[#2e2e2e] text-white transition-all active:scale-95 border border-white/10"
            title="Importar archivos de audio MP3, WAV, FLAC desde tu almacenamiento local"
          >
            <FolderDown className="w-4 h-4 text-[#1DB954]" />
            <span className="hidden sm:inline">Importar Música Local</span>
            <span className="sm:hidden">Importar</span>
          </button>

          <button
            onClick={() => setIsCreatingModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold text-black transition-transform active:scale-95 shadow-md bg-[#1DB954] hover:bg-[#1ed760]"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Crear Lista</span>
          </button>
        </div>
      </div>

      {/* Smart Tags Strip */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-emerald-400" />
            Etiquetas Inteligentes
          </span>
          {selectedTag && (
            <button
              onClick={() => setSelectedTag(null)}
              className="text-xs text-slate-400 hover:text-white underline"
            >
              Ver todas las listas
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
                selectedTag === tag
                  ? 'bg-[#1DB954] text-black font-bold'
                  : 'bg-white/5 hover:bg-white/10 text-slate-300'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Segmented playlist filter buttons (Spotify Pill Filter) */}
      <div className="flex items-center gap-1.5 p-1 bg-[#242424] rounded-full border border-white/5 w-fit">
        <button
          onClick={() => {
            setSelectedTag(null);
            setFilterType('all');
          }}
          className={`px-3.5 py-1.5 text-xs font-bold rounded-full transition-colors ${
            filterType === 'all' && !selectedTag ? 'bg-[#1DB954] text-black shadow-md' : 'text-[#B3B3B3] hover:text-white'
          }`}
        >
          Todas las Listas
        </button>
        <button
          onClick={() => {
            setSelectedTag(null);
            setFilterType('smart');
          }}
          className={`px-3.5 py-1.5 text-xs font-bold rounded-full transition-colors ${
            filterType === 'smart' && !selectedTag ? 'bg-[#1DB954] text-black shadow-md' : 'text-[#B3B3B3] hover:text-white'
          }`}
        >
          Listas Inteligentes
        </button>
        <button
          onClick={() => {
            setSelectedTag(null);
            setFilterType('collab');
          }}
          className={`px-3.5 py-1.5 text-xs font-bold rounded-full transition-colors ${
            filterType === 'collab' && !selectedTag ? 'bg-[#1DB954] text-black shadow-md' : 'text-[#B3B3B3] hover:text-white'
          }`}
        >
          Colaborativas
        </button>
        <button
          onClick={() => {
            setSelectedTag(null);
            setFilterType('local');
          }}
          className={`px-3.5 py-1.5 text-xs font-bold rounded-full transition-colors flex items-center gap-1.5 ${
            filterType === 'local' && !selectedTag ? 'bg-[#1DB954] text-black shadow-md' : 'text-[#B3B3B3] hover:text-white'
          }`}
        >
          <FolderDown className="w-3.5 h-3.5" />
          <span>Archivos Locales</span>
        </button>
      </div>

      {/* If tag is selected, show tracks for that tag */}
      {selectedTag ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <span className="text-sm font-semibold text-white">
              Pistas con etiqueta {selectedTag} ({tagFilteredTracks.length})
            </span>
          </div>

          <div className="space-y-1">
            {tagFilteredTracks.map((track, idx) => (
              <TrackRow
                key={track.id}
                track={track}
                index={idx}
                isCurrent={currentTrack?.id === track.id}
                isPlaying={isPlaying}
                isLiked={likedTrackIds.includes(track.id)}
                isDownloaded={downloadedTrackIds.includes(track.id)}
                activeTheme={activeTheme}
                onPlay={onPlayTrack}
                onToggleLike={onToggleLike}
                onToggleDownload={onToggleDownload}
              />
            ))}
          </div>
        </div>
      ) : filterType === 'local' ? (
        /* Local Audio Files Filter View */
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <div className="flex items-center gap-2">
              <FolderDown className="w-5 h-5 text-[#1DB954]" />
              <h3 className="text-base font-bold text-white">
                Archivos Locales Importados ({tracks.filter(t => t.localAudioUrl || t.tags.includes('Local')).length})
              </h3>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-xs text-[#1DB954] hover:underline font-semibold"
            >
              + Agregar más archivos
            </button>
          </div>

          {tracks.filter(t => t.localAudioUrl || t.tags.includes('Local')).length > 0 ? (
            <div className="space-y-1">
              {tracks.filter(t => t.localAudioUrl || t.tags.includes('Local')).map((track, idx) => (
                <TrackRow
                  key={track.id}
                  track={track}
                  index={idx}
                  isCurrent={currentTrack?.id === track.id}
                  isPlaying={isPlaying}
                  isLiked={likedTrackIds.includes(track.id)}
                  isDownloaded={downloadedTrackIds.includes(track.id)}
                  activeTheme={activeTheme}
                  onPlay={onPlayTrack}
                  onToggleLike={onToggleLike}
                  onToggleDownload={onToggleDownload}
                />
              ))}
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-white/5 border border-white/10 text-center space-y-3">
              <FolderDown className="w-10 h-10 text-neutral-500 mx-auto" />
              <h4 className="text-sm font-bold text-white">No hay archivos locales importados aún</h4>
              <p className="text-xs text-[#B3B3B3] max-w-sm mx-auto">
                Importa canciones en formato MP3, WAV, FLAC o M4A desde tu almacenamiento para reproducirlas sin internet.
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-5 py-2.5 rounded-full text-xs font-bold bg-[#1DB954] text-black hover:bg-[#1ed760] transition-all shadow-lg active:scale-95 inline-flex items-center gap-2"
              >
                <FolderDown className="w-4 h-4" />
                <span>Seleccionar canciones de mi dispositivo</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Playlists Grid */
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredPlaylists.map((pl) => (
              <div
                key={pl.id}
                onClick={() => setSelectedPlaylist(pl)}
                className="group p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/15 cursor-pointer transition-all duration-200"
              >
                <div className="relative aspect-square w-full rounded-xl overflow-hidden mb-3 bg-slate-900 border border-white/5">
                  <img 
                    src={pl.coverUrl} 
                    alt={pl.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onPlayPlaylist(pl);
                    }}
                    className="absolute bottom-2 right-2 w-10 h-10 rounded-full flex items-center justify-center text-black font-bold shadow-xl opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0"
                    style={{ backgroundColor: activeTheme.accentHex }}
                  >
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  </button>
                </div>

                <h4 className="text-xs sm:text-sm font-semibold text-white truncate">
                  {pl.title}
                </h4>
                <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">
                  {pl.description}
                </p>

                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono mt-2">
                  <span>{pl.trackIds.length} canciones</span>
                  <span aria-hidden="true">·</span>
                  <span>{pl.author}</span>
                </div>
              </div>
            ))}
          </div>
        )
      }

      {/* Modal: Create Custom Playlist */}
      {isCreatingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="w-full max-w-md rounded-2xl border shadow-2xl p-6 relative overflow-hidden text-slate-100"
            style={{
              backgroundColor: activeTheme.bgHex === '#000000' ? '#0a0a0a' : activeTheme.surfaceHex,
              borderColor: activeTheme.borderHex,
            }}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-bold text-white">Nueva Lista de Reproducción</h3>
              <button
                onClick={() => setIsCreatingModalOpen(false)}
                className="p-1 rounded-full hover:bg-white/10 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="mt-4 space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Nombre de la lista</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ej. Noche Chill & Café..."
                  className="w-full px-3 py-2 rounded-lg bg-black/40 text-xs text-white border border-white/10 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Descripción</label>
                <textarea
                  rows={2}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Notas, estado de ánimo o temática..."
                  className="w-full px-3 py-2 rounded-lg bg-black/40 text-xs text-white border border-white/10 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold text-black bg-white hover:bg-slate-200 transition-colors"
                >
                  Crear Lista
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
