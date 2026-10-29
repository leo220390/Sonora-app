import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  SlidersHorizontal, 
  DownloadCloud, 
  Sparkles, 
  Flame, 
  Check, 
  X,
  Radio,
  Music,
  Disc,
  Play,
  FileText,
  Image as ImageIcon,
  Mic
} from 'lucide-react';
import { Track, Playlist, Album, GenreType, MoodType, DarkThemeConfig, AudioQuality, AudioSource } from '../types/music';
import { GENRES, MOODS, INITIAL_ALBUMS, searchOnlineSources, fetchYouTubeSuggestions } from '../services/catalogService';
import { storageService } from '../services/storageService';
import { audioEngine } from '../services/audioEngine';
import { TrackRow } from './TrackRow';

interface ExploreViewProps {
  tracks: Track[];
  currentTrack: Track | null;
  isPlaying: boolean;
  likedTrackIds: string[];
  downloadedTrackIds: string[];
  activeTheme: DarkThemeConfig;
  onPlayTrack: (track: Track) => void;
  onToggleLike: (trackId: string) => void;
  onToggleDownload: (track: Track) => void;
  onSelectAlbum: (album: Album) => void;
  initialSearchQuery?: string;
  onOpenVoiceSearch?: () => void;
}

export const ExploreView: React.FC<ExploreViewProps> = ({
  tracks,
  currentTrack,
  isPlaying,
  likedTrackIds,
  downloadedTrackIds,
  activeTheme,
  onPlayTrack,
  onToggleLike,
  onToggleDownload,
  onSelectAlbum,
  initialSearchQuery,
  onOpenVoiceSearch,
}) => {
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery || '');

  useEffect(() => {
    if (initialSearchQuery) {
      setSearchQuery(initialSearchQuery);
    }
  }, [initialSearchQuery]);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => storageService.getRecentSearches());
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [selectedMood, setSelectedMood] = useState<string>('all');
  const [selectedQuality, setSelectedQuality] = useState<string>('all');
  const [offlineOnly, setOfflineOnly] = useState<boolean>(false);
  const [bpmFilter, setBpmFilter] = useState<number | null>(null);
  const [showFiltersDrawer, setShowFiltersDrawer] = useState<boolean>(false);
  const [onlineResults, setOnlineResults] = useState<Track[]>(tracks);
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Voice Search Handler using Web Speech API
  const handleStartVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Tu navegador no tiene activado el soporte de reconocimiento de voz. Usa Chrome, Edge o Safari.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'es-ES';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        audioEngine.playHapticTransition('click');
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript;
        if (transcript) {
          audioEngine.playHapticTransition('success');
          setSearchQuery(transcript);
          setShowSuggestions(false);
          setSuggestions([]);
          const updated = storageService.addRecentSearch(transcript);
          setRecentSearches(updated);
        }
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (e) {
      console.warn('Voice search error:', e);
      setIsListening(false);
    }
  };

  // Curated Spotify Editorial Playlists with real Spotify-style aesthetics
  const spotifyEditorialPlaylists = useMemo(() => [
    {
      id: 'sp-exitos-espana',
      title: 'Éxitos España',
      desc: 'Los temas más virales y escuchados en España y Latinoamérica.',
      followers: '3.4M guardados',
      coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
      query: 'Exitos Espana top viral',
    },
    {
      id: 'sp-todays-top-hits',
      title: "Today's Top Hits",
      desc: 'The hottest tracks in the world right now on YouTube Music.',
      followers: '34.2M guardados',
      coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80',
      query: 'Todays Top Hits global',
    },
    {
      id: 'sp-viva-latino',
      title: 'Viva Latino',
      desc: 'El pulso de la música latina: reggaetón, trap y pop.',
      followers: '14.1M guardados',
      coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
      query: 'Viva Latino reggaeton',
    },
    {
      id: 'sp-lofi-beats',
      title: 'Lo-Fi Beats',
      desc: 'Beats relajantes para estudiar, trabajar o relajarse en calma.',
      followers: '5.8M guardados',
      coverUrl: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&auto=format&fit=crop&q=80',
      query: 'Lofi hip hop beats study',
    },
    {
      id: 'sp-rock-classics',
      title: 'Rock Classics',
      desc: 'Himnos legendarios del rock de todos los tiempos.',
      followers: '11.3M guardados',
      coverUrl: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=600&auto=format&fit=crop&q=80',
      query: 'Rock classics anthems',
    },
    {
      id: 'sp-peaceful-piano',
      title: 'Peaceful Piano',
      desc: 'Piezas de piano íntimas para momentos de calma y descanso.',
      followers: '7.9M guardados',
      coverUrl: 'https://images.unsplash.com/photo-1520523839898-507125ef5381?w=600&auto=format&fit=crop&q=80',
      query: 'Peaceful piano classical',
    },
  ], []);

  // AI-powered creative query prompts for instant YouTube discovery
  const aiDiscoveryQueries = useMemo(() => [
    { label: 'Lo-Fi Chill Programación', query: 'Lofi hip hop beats study relaxing' },
    { label: 'Synthwave 80s Retro', query: 'Synthwave retrowave 80s cyberpunk drive' },
    { label: 'Acústico Íntimo Live', query: 'Acoustic live session studio unplugged' },
    { label: 'Binaural Deep Focus', query: 'Binaural beats deep focus 432Hz ambient' },
    { label: 'Hits Mundiales 2026', query: 'Top hits viral playlist global' },
    { label: 'Cyberpunk Electro Gym', query: 'Cyberpunk dark electro workout gym' },
  ], []);

  // Live Auto-complete suggestions effect
  useEffect(() => {
    let cancel = false;
    if (searchQuery.trim().length >= 2) {
      fetchYouTubeSuggestions(searchQuery.trim()).then((suggs) => {
        if (!cancel) {
          setSuggestions(suggs);
          setShowSuggestions(suggs.length > 0);
        }
      });
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
    return () => {
      cancel = true;
    };
  }, [searchQuery]);

  // Real-time search effect - strictly using YouTube backend
  useEffect(() => {
    let cancel = false;
    if (searchQuery.trim().length > 1) {
      setIsSearchingOnline(true);
      const timer = setTimeout(async () => {
        const res = await searchOnlineSources(searchQuery, 'youtube');
        if (!cancel) {
          setOnlineResults(res);
          setIsSearchingOnline(false);
          const updated = storageService.addRecentSearch(searchQuery.trim());
          setRecentSearches(updated);
        }
      }, 350);
      return () => {
        cancel = true;
        clearTimeout(timer);
      };
    } else {
      setOnlineResults(tracks);
      setIsSearchingOnline(false);
    }
  }, [searchQuery, tracks]);

  // Filtered tracks
  const filteredTracks = useMemo(() => {
    return onlineResults.filter((track) => {
      // Genre match
      if (selectedGenre !== 'all' && track.genre !== selectedGenre) {
        return false;
      }

      // Mood match
      if (selectedMood !== 'all' && track.mood !== selectedMood) {
        return false;
      }

      // Quality match
      if (selectedQuality !== 'all' && track.quality !== selectedQuality) {
        return false;
      }

      // Offline only
      if (offlineOnly && !downloadedTrackIds.includes(track.id)) {
        return false;
      }

      // BPM filter
      if (bpmFilter !== null && Math.abs(track.bpm - bpmFilter) > 25) {
        return false;
      }

      return true;
    });
  }, [onlineResults, selectedGenre, selectedMood, selectedQuality, offlineOnly, bpmFilter, downloadedTrackIds]);

  const activeFiltersCount = 
    (selectedGenre !== 'all' ? 1 : 0) + 
    (selectedMood !== 'all' ? 1 : 0) + 
    (selectedQuality !== 'all' ? 1 : 0) + 
    (offlineOnly ? 1 : 0) +
    (bpmFilter !== null ? 1 : 0);

  const clearAllFilters = () => {
    setSelectedGenre('all');
    setSelectedMood('all');
    setSelectedQuality('all');
    setOfflineOnly(false);
    setBpmFilter(null);
    setSearchQuery('');
  };

  const handleDownloadLyrics = (e: React.MouseEvent, track: Track) => {
    e.stopPropagation();
    audioEngine.playHapticTransition('download');
    storageService.downloadLyricsFile(track);
  };

  const handleDownloadCover = (e: React.MouseEvent, track: Track) => {
    e.stopPropagation();
    audioEngine.playHapticTransition('download');
    storageService.downloadArtworkFile(track);
  };

  return (
    <div className="space-y-6 pb-28">
      {/* Search Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
          <span>Explorar YouTube Music</span>
          <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-red-600/20 text-red-400 border border-red-500/30">
            YouTube Base Global
          </span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Búsqueda directa en tiempo real con motor de YouTube, sugerencias asistidas por IA y tu historial de reproducciones.
        </p>
      </div>

      {/* Main Search Input & Live Suggestions */}
      <div className="relative space-y-3">
        <div className="relative flex items-center gap-2">
          <div className="relative flex-1 flex items-center">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (suggestions.length > 0) setShowSuggestions(true);
              }}
              placeholder={isListening ? "Escuchando... Di el nombre de una canción o artista" : "Buscar en YouTube Music..."}
              className={`w-full pl-10 pr-20 py-3 rounded-full bg-[#242424] border text-white placeholder-[#727272] text-sm focus:outline-none transition-all shadow-inner ${
                isListening 
                  ? 'border-[#1DB954] ring-2 ring-[#1DB954]/30 bg-black/60' 
                  : 'border-transparent focus:border-white/30'
              }`}
            />

            {/* Actions inside Search Input */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {searchQuery && (
                <button
                  onClick={() => {
                    audioEngine.playHapticTransition('click');
                    setSearchQuery('');
                    setShowSuggestions(false);
                    setSuggestions([]);
                  }}
                  className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                  title="Borrar búsqueda"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              {/* Voice Search Button */}
              <button
                onClick={onOpenVoiceSearch || handleStartVoiceSearch}
                className={`p-2 rounded-full transition-all active:scale-90 ${
                  isListening
                    ? 'bg-[#1DB954] text-black animate-pulse shadow-lg shadow-[#1DB954]/50'
                    : 'text-[#B3B3B3] hover:text-white hover:bg-white/10'
                }`}
                title={isListening ? "Escuchando voz..." : "Búsqueda por voz"}
                aria-label="Búsqueda por voz"
              >
                <Mic className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filter Toggle Button */}
          <button
            onClick={() => {
              audioEngine.playHapticTransition('toggle');
              setShowFiltersDrawer(!showFiltersDrawer);
            }}
            className={`flex items-center gap-2 px-4 py-3 rounded-full border text-xs font-semibold transition-all active:scale-95 ${
              showFiltersDrawer || activeFiltersCount > 0
                ? 'bg-white/15 text-white border-white/30'
                : 'bg-[#242424] text-slate-300 hover:text-white border-white/5 hover:border-white/15'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">Filtros</span>
            {activeFiltersCount > 0 && (
              <span 
                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-black"
                style={{ backgroundColor: activeTheme.accentHex }}
              >
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {/* Live Auto-complete Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute left-0 right-0 top-12 mt-1.5 z-30 rounded-2xl bg-[#282828] border border-white/10 shadow-2xl overflow-hidden animate-in fade-in duration-150">
            <div className="px-3.5 py-2 bg-black/40 border-b border-white/5 text-[10px] font-mono text-[#B3B3B3] uppercase tracking-wider flex items-center justify-between">
              <span>Sugerencias de YouTube en Tiempo Real</span>
              <button
                onClick={() => {
                  setShowSuggestions(false);
                  setSuggestions([]);
                }}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>
            <div className="max-h-60 overflow-y-auto divide-y divide-white/5 no-scrollbar">
              {suggestions.map((sug, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    audioEngine.playHapticTransition('click');
                    setSearchQuery(sug);
                    setShowSuggestions(false);
                    setSuggestions([]); // Immediately close and remove all other suggestions
                    const updated = storageService.addRecentSearch(sug);
                    setRecentSearches(updated);
                  }}
                  className="px-4 py-3 text-xs text-white hover:bg-white/10 cursor-pointer flex items-center gap-3 transition-colors select-none"
                >
                  <Search className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="truncate flex-1 font-semibold">{sug}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Búsquedas Recientes */}
        {recentSearches.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-1 no-scrollbar text-xs">
            <span className="text-[11px] text-slate-500 font-mono shrink-0 flex items-center gap-1">
              <span>Recientes:</span>
            </span>
            {recentSearches.slice(0, 6).map((rec, idx) => (
              <button
                key={`${rec}-${idx}`}
                onClick={() => {
                  audioEngine.playHapticTransition('click');
                  setSearchQuery(rec);
                }}
                className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition-all active:scale-95 shrink-0 border border-white/10 flex items-center gap-1.5"
              >
                <span>{rec}</span>
              </button>
            ))}
          </div>
        )}

        {/* AI-Powered Discovery Chips */}
        {!searchQuery && (
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Exploración asistida por IA en YouTube</span>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
              {aiDiscoveryQueries.map((item) => (
                <button
                  key={item.label}
                  onClick={() => {
                    audioEngine.playHapticTransition('click');
                    setSearchQuery(item.query);
                    const updated = storageService.addRecentSearch(item.query);
                    setRecentSearches(updated);
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition-all active:scale-95 shrink-0 flex items-center gap-1.5"
                >
                  <Sparkles className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Popular YouTube music trend pills */}
        {!searchQuery && (
          <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-1 no-scrollbar text-xs">
            <span className="text-[11px] text-slate-500 font-mono shrink-0">Tendencias YouTube:</span>
            {['Bad Bunny', 'Taylor Swift', 'Coldplay', 'Daft Punk', 'Lofi Hip Hop Beats', 'Reggaeton 2026', 'Synthwave Night', 'Imagine Dragons'].map((trend) => (
              <button
                key={trend}
                onClick={() => {
                  audioEngine.playHapticTransition('click');
                  setSearchQuery(trend);
                  const updated = storageService.addRecentSearch(trend);
                  setRecentSearches(updated);
                }}
                className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all active:scale-95 shrink-0 border border-white/5"
              >
                {trend}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Spotify Real Editorial Playlists Carousel */}
      {!searchQuery && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1DB954]" />
              <span>Listas de Reproducción Oficiales (Estilo Spotify)</span>
            </h3>
            <span className="text-xs text-[#B3B3B3]">Basadas en el catálogo universal</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 sm:gap-4">
            {spotifyEditorialPlaylists.map((pl) => (
              <div
                key={pl.id}
                onClick={() => {
                  audioEngine.playHapticTransition('click');
                  setSearchQuery(pl.query);
                  const updated = storageService.addRecentSearch(pl.title);
                  setRecentSearches(updated);
                }}
                className="group p-3 rounded-2xl bg-[#181818] hover:bg-[#282828] border border-white/5 hover:border-white/10 cursor-pointer transition-all duration-300 flex flex-col justify-between active:scale-98 relative"
              >
                <div className="relative aspect-square w-full rounded-xl overflow-hidden mb-2 bg-[#282828] shadow-lg">
                  <img 
                    src={pl.coverUrl} 
                    alt={pl.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Spotify Floating Green Play Button on Hover */}
                  <div className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-[#1DB954] text-black font-bold flex items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 shadow-xl">
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  </div>
                </div>

                <div className="min-w-0">
                  <h4 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-[#1DB954] transition-colors">
                    {pl.title}
                  </h4>
                  <p className="text-[11px] text-[#B3B3B3] line-clamp-2 mt-0.5 leading-tight">
                    {pl.desc}
                  </p>
                  <span className="text-[10px] text-neutral-500 font-mono mt-1.5 block">
                    {pl.followers}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full Albums Carousel Section */}
      {!searchQuery && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Disc className="w-4 h-4 text-emerald-400" />
              <span>Álbumes Completos Disponibles para Descarga</span>
            </h3>
            <span className="text-xs text-slate-500 font-mono">Descarga 1-clic con carátula y letras</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {INITIAL_ALBUMS.map((alb) => (
              <div
                key={alb.id}
                onClick={() => {
                  audioEngine.playHapticTransition('click');
                  onSelectAlbum(alb);
                }}
                className="group p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/15 cursor-pointer transition-all duration-200 active:scale-98"
              >
                <div className="relative aspect-square w-full rounded-xl overflow-hidden mb-2 bg-slate-900 border border-white/5">
                  <img 
                    src={alb.coverUrl} 
                    alt={alb.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-sm text-[9px] font-mono text-white uppercase">
                    {alb.source}
                  </div>
                  <div className="absolute bottom-2 right-2 p-2 rounded-full bg-emerald-500 text-black font-bold opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                    <DownloadCloud className="w-4 h-4" />
                  </div>
                </div>

                <h4 className="text-xs sm:text-sm font-semibold text-white truncate">{alb.title}</h4>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">{alb.artist}</p>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono mt-1">
                  <span>{alb.trackIds.length} temas</span>
                  <span aria-hidden="true">·</span>
                  <span>{alb.genre}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Advanced Filter Drawer */}
      {showFiltersDrawer && (
        <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-white/10 text-xs">
            <span className="font-semibold text-white">Filtros Avanzados</span>
            {activeFiltersCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="text-slate-400 hover:text-white underline text-[11px]"
              >
                Limpiar todos
              </button>
            )}
          </div>

          {/* Moods */}
          <div>
            <span className="text-xs text-slate-400 block mb-2 font-medium">Estado de Ánimo:</span>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => {
                  audioEngine.playHapticTransition('click');
                  setSelectedMood('all');
                }}
                className={`px-3 py-1 text-xs rounded-lg transition-all active:scale-95 ${
                  selectedMood === 'all' ? 'bg-white text-black font-semibold' : 'bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                Todos
              </button>
              {MOODS.map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    audioEngine.playHapticTransition('click');
                    setSelectedMood(m);
                  }}
                  className={`px-3 py-1 text-xs rounded-lg transition-all active:scale-95 ${
                    selectedMood === m ? 'bg-white text-black font-semibold' : 'bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Audio Quality & Offline row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <span className="text-xs text-slate-400 block mb-2 font-medium">Calidad de Audio:</span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'all', label: 'Cualquiera' },
                  { id: 'lossless', label: 'FLAC Lossless' },
                  { id: '320k', label: '320 kbps Studio' },
                  { id: '256k', label: '256 kbps AAC' },
                ].map((q) => (
                  <button
                    key={q.id}
                    onClick={() => {
                      audioEngine.playHapticTransition('click');
                      setSelectedQuality(q.id);
                    }}
                    className={`px-2.5 py-1 text-xs rounded-lg transition-all active:scale-95 ${
                      selectedQuality === q.id ? 'bg-white text-black font-semibold' : 'bg-white/5 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="text-xs text-slate-400 block mb-2 font-medium">Disponibilidad:</span>
              <button
                onClick={() => {
                  audioEngine.playHapticTransition('toggle');
                  setOfflineOnly(!offlineOnly);
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all active:scale-95 ${
                  offlineOnly
                    ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40'
                    : 'bg-white/5 text-slate-300 border-white/10 hover:border-white/20'
                }`}
              >
                <DownloadCloud className="w-3.5 h-3.5 text-emerald-400" />
                <span>Solo descargadas offline ({downloadedTrackIds.length})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Genre Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => {
            audioEngine.playHapticTransition('click');
            setSelectedGenre('all');
          }}
          className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all active:scale-95 shrink-0 ${
            selectedGenre === 'all'
              ? 'bg-white text-black font-bold'
              : 'bg-white/5 text-slate-300 hover:bg-white/10'
          }`}
        >
          Todos los géneros
        </button>
        {GENRES.map((g) => (
          <button
            key={g}
            onClick={() => {
              audioEngine.playHapticTransition('click');
              setSelectedGenre(g);
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all active:scale-95 shrink-0 ${
              selectedGenre === g
                ? 'bg-white text-black font-bold'
                : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            {g}
          </button>
        ))}
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-white/5">
        <span className="flex items-center gap-2">
          {isSearchingOnline && <span className="animate-pulse text-emerald-400">Buscando en YouTube & SoundCloud...</span>}
          <span>{filteredTracks.length} canciones encontradas</span>
        </span>
        {searchQuery && (
          <span className="italic">Resultados para &quot;{searchQuery}&quot;</span>
        )}
      </div>

      {/* Tracks List */}
      <div className="space-y-1">
        {filteredTracks.length > 0 ? (
          filteredTracks.map((track, idx) => (
            <div key={track.id} className="relative group/row">
              <TrackRow
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
              {/* Quick LRC / Cover download buttons */}
              <div className="hidden sm:group-hover/row:flex absolute right-24 top-1/2 -translate-y-1/2 items-center gap-1.5 bg-black/80 px-2 py-1 rounded-lg border border-white/10 text-[10px] z-10 shadow-lg animate-in fade-in">
                <button
                  onClick={(e) => handleDownloadLyrics(e, track)}
                  className="flex items-center gap-1 text-slate-300 hover:text-white px-1.5 py-0.5 rounded hover:bg-white/10 transition-colors"
                  title="Descargar letra (.LRC sincronizada)"
                >
                  <FileText className="w-3 h-3 text-emerald-400" />
                  <span>Letra LRC</span>
                </button>
                <button
                  onClick={(e) => handleDownloadCover(e, track)}
                  className="flex items-center gap-1 text-slate-300 hover:text-white px-1.5 py-0.5 rounded hover:bg-white/10 transition-colors"
                  title="Descargar portada original Ultra HD"
                >
                  <ImageIcon className="w-3 h-3 text-sky-400" />
                  <span>Portada</span>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="p-12 text-center rounded-2xl bg-white/5 border border-white/5">
            <Music className="w-8 h-8 text-slate-500 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-white">No se encontraron canciones</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Prueba a buscar otro término o cambiar la fuente entre YouTube y SoundCloud.
            </p>
            <button
              onClick={clearAllFilters}
              className="mt-4 px-4 py-2 rounded-lg text-xs font-medium bg-white/10 text-white hover:bg-white/20 active:scale-95 transition-all"
            >
              Restablecer filtros
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
