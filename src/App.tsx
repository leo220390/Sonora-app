import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { PlayerBar } from './components/PlayerBar';
import { HomeView } from './components/HomeView';
import { ExploreView } from './components/ExploreView';
import { LibraryView } from './components/LibraryView';
import { OfflineView } from './components/OfflineView';
import { BottomNav } from './components/BottomNav';
import { QuickWidget } from './components/QuickWidget';

// Modals
import { FullscreenPlayerModal } from './components/FullscreenPlayerModal';
import { BatterySaverModal } from './components/BatterySaverModal';
import { EqualizerModal } from './components/EqualizerModal';
import { ThemeModal } from './components/ThemeModal';
import { DeviceConnectModal } from './components/DeviceConnectModal';
import { CollaborativeModal } from './components/CollaborativeModal';
import { ShareCardModal } from './components/ShareCardModal';
import { NotificationModal } from './components/NotificationModal';
import { AlbumDetailModal } from './components/AlbumDetailModal';
import { StorageLocationModal } from './components/StorageLocationModal';
import { AudioSettingsModal } from './components/AudioSettingsModal';
import { AiDjModal } from './components/AiDjModal';
import { VoiceSearchModal } from './components/VoiceSearchModal';

// Services & Config
import { Track, Playlist, Album, DarkThemeId, BatteryState, UserProfile, StorageSettings, StreamQualityLevel } from './types/music';
import { INITIAL_TRACKS, INITIAL_PLAYLISTS, INITIAL_ALBUMS } from './services/catalogService';
import { storageService } from './services/storageService';
import { audioEngine } from './services/audioEngine';
import { DARK_THEMES } from './utils/themePresets';

export default function App() {
  // Navigation & Views
  const [currentView, setCurrentView] = useState<'home' | 'explore' | 'library' | 'offline'>('home');

  // Tracks & Playlists state
  const [tracks, setTracks] = useState<Track[]>(INITIAL_TRACKS);
  const [playlists, setPlaylists] = useState<Playlist[]>(() => {
    const custom = storageService.getUserPlaylists();
    return custom.length > 0 ? [...INITIAL_PLAYLISTS, ...custom] : INITIAL_PLAYLISTS;
  });

  // User Profile & Preferences
  const [userProfile, setUserProfile] = useState<UserProfile>(() => storageService.getUserProfile());
  const [themeId, setThemeId] = useState<DarkThemeId>(() => storageService.getThemePreference());
  const [likedTrackIds, setLikedTrackIds] = useState<string[]>(() => storageService.getLikedTrackIds());
  const [downloadedTrackIds, setDownloadedTrackIds] = useState<string[]>(() => storageService.getDownloadedTrackIds());
  const [eqGains, setEqGains] = useState<number[]>(() => storageService.getEqualizerSettings());
  const [listeningHistory, setListeningHistory] = useState<Track[]>(() => storageService.getListeningHistory());

  // Storage & Offline Stats
  const [storageStats, setStorageStats] = useState({ usedMb: 31.5, totalQuotaMb: 5120, count: 3 });
  const [isAirplaneMode, setIsAirplaneMode] = useState(false);

  // Playback State
  const [currentTrack, setCurrentTrack] = useState<Track | null>(INITIAL_TRACKS[0]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(INITIAL_TRACKS[0]?.duration || 218);
  const [volume, setVolume] = useState<number>(0.85);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [shuffle, setShuffle] = useState<boolean>(false);
  const [repeat, setRepeat] = useState<'off' | 'all' | 'one'>('off');

  // Battery State
  const [batteryState, setBatteryState] = useState<BatteryState>({
    level: 0.82,
    isCharging: false,
    saverActive: false,
    oledPitchBlack: true,
    lowPowerAudio: false,
    screenWakeLock: true,
    fpsCap: 60,
    estimatedMinutesLeft: 520,
  });

  // Modals visibility
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const [isBatteryModalOpen, setIsBatteryModalOpen] = useState(false);
  const [isEqModalOpen, setIsEqModalOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);
  const [isCollabModalOpen, setIsCollabModalOpen] = useState(false);
  const [isNotifyModalOpen, setIsNotifyModalOpen] = useState(false);
  const [isStorageModalOpen, setIsStorageModalOpen] = useState(false);
  const [isAudioSettingsOpen, setIsAudioSettingsOpen] = useState(false);
  const [isAiDjOpen, setIsAiDjOpen] = useState(false);
  const [isVoiceSearchOpen, setIsVoiceSearchOpen] = useState(false);
  const [voiceSearchQuery, setVoiceSearchQuery] = useState('');
  const [streamQuality, setStreamQuality] = useState<StreamQualityLevel>(() => storageService.getAudioQuality());
  const [crossfade, setCrossfade] = useState<number>(() => storageService.getCrossfade());
  const [sleepTimerRemaining, setSleepTimerRemaining] = useState<number | null>(() => audioEngine.getSleepTimerRemaining());
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [shareTrack, setShareTrack] = useState<Track | null>(null);
  const [showVideoScreen, setShowVideoScreen] = useState(false);

  // Effective Theme Config
  const activeTheme = useMemo(() => {
    // If battery saver is active or oledPitchBlack is enabled and theme is oled, prioritize pure pitch black #000000
    if (batteryState.oledPitchBlack && themeId === 'oled') {
      return DARK_THEMES.oled;
    }
    return DARK_THEMES[themeId] || DARK_THEMES.oled;
  }, [themeId, batteryState.oledPitchBlack]);

  // Load storage stats on mount
  useEffect(() => {
    storageService.getStorageUsage().then(setStorageStats);
  }, [downloadedTrackIds]);

  // Battery API detection (if supported by modern browsers)
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        const updateBattery = () => {
          setBatteryState(prev => ({
            ...prev,
            level: battery.level,
            isCharging: battery.charging,
            estimatedMinutesLeft: battery.dischargingTime && battery.dischargingTime !== Infinity
              ? Math.round(battery.dischargingTime / 60)
              : Math.round(battery.level * 600),
          }));
        };
        updateBattery();
        battery.addEventListener('levelchange', updateBattery);
        battery.addEventListener('chargingchange', updateBattery);
      }).catch(() => {});
    }
  }, []);

  // Audio Engine Callbacks Setup & YouTube Player Mount
  useEffect(() => {
    audioEngine.setCallbacks(
      (curr, dur) => {
        setCurrentTime(curr);
        if (dur > 0) setDuration(dur);
      },
      (playing) => {
        setIsPlaying(playing);
      },
      () => {
        // Track ended -> play next
        handleNextTrack();
      }
    );

    // Initial EQ preset apply
    audioEngine.applyEqualizerPreset(eqGains);

    // Initial Quality & Crossfade
    audioEngine.setQualityLevel(streamQuality);
    audioEngine.setCrossfade(crossfade);

    // Sleep Timer countdown tick
    audioEngine.setOnSleepTimerTick((remaining) => {
      setSleepTimerRemaining(remaining);
    });

    // Mount YouTube Player
    audioEngine.mountYouTubePlayer('sonora-yt-player');
  }, []);

  // Play a specific track
  const handlePlayTrack = useCallback((track: Track) => {
    if (currentTrack?.id === track.id) {
      if (isPlaying) {
        audioEngine.pause();
      } else {
        audioEngine.resume();
      }
    } else {
      setCurrentTrack(track);
      setDuration(track.duration);
      setCurrentTime(0);
      audioEngine.playTrack(track, 0);

      // Record in recent 10-tracks listening history
      const updatedHistory = storageService.addListeningHistory(track);
      setListeningHistory(updatedHistory);

      // Increment play count & profile minutes
      setUserProfile(prev => {
        const updated = {
          ...prev,
          totalListeningMinutes: prev.totalListeningMinutes + Math.round(track.duration / 60),
        };
        storageService.saveUserProfile(updated);
        return updated;
      });
    }
  }, [currentTrack, isPlaying]);

  // Play an entire playlist
  const handlePlayPlaylist = useCallback((playlist: Playlist) => {
    const plTracks = tracks.filter(t => playlist.trackIds.includes(t.id));
    if (plTracks.length > 0) {
      handlePlayTrack(plTracks[0]);
    }
  }, [tracks, handlePlayTrack]);

  // Next track logic with shuffle support
  const handleNextTrack = useCallback(() => {
    if (!currentTrack) return;
    const availableTracks = isAirplaneMode
      ? tracks.filter(t => downloadedTrackIds.includes(t.id))
      : tracks;

    if (availableTracks.length === 0) return;

    if (repeat === 'one') {
      audioEngine.seek(0);
      audioEngine.resume();
      return;
    }

    if (shuffle) {
      const randomIndex = Math.floor(Math.random() * availableTracks.length);
      handlePlayTrack(availableTracks[randomIndex]);
      return;
    }

    const currentIndex = availableTracks.findIndex(t => t.id === currentTrack.id);
    const nextIndex = (currentIndex + 1) % availableTracks.length;
    handlePlayTrack(availableTracks[nextIndex]);
  }, [currentTrack, tracks, shuffle, repeat, isAirplaneMode, downloadedTrackIds, handlePlayTrack]);

  // Previous track logic
  const handlePrevTrack = useCallback(() => {
    if (!currentTrack) return;
    if (currentTime > 4) {
      audioEngine.seek(0);
      return;
    }
    const availableTracks = isAirplaneMode
      ? tracks.filter(t => downloadedTrackIds.includes(t.id))
      : tracks;

    if (availableTracks.length === 0) return;

    const currentIndex = availableTracks.findIndex(t => t.id === currentTrack.id);
    const prevIndex = (currentIndex - 1 + availableTracks.length) % availableTracks.length;
    handlePlayTrack(availableTracks[prevIndex]);
  }, [currentTrack, currentTime, tracks, isAirplaneMode, downloadedTrackIds, handlePlayTrack]);

  // Scrubber Seek
  const handleSeek = (time: number) => {
    setCurrentTime(time);
    audioEngine.seek(time);
  };

  // Volume
  const handleVolumeChange = (vol: number) => {
    setVolume(vol);
    setIsMuted(vol === 0);
    audioEngine.setVolume(vol);
  };

  const handleToggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    audioEngine.setVolume(nextMute ? 0 : volume);
  };

  // Like Track toggle
  const handleToggleLike = (trackId: string) => {
    setLikedTrackIds(prev => {
      const next = prev.includes(trackId)
        ? prev.filter(id => id !== trackId)
        : [...prev, trackId];
      storageService.saveLikedTrackIds(next);
      return next;
    });
  };

  // Download Offline toggle
  const handleToggleDownload = async (track: Track) => {
    const isDownloaded = downloadedTrackIds.includes(track.id);
    if (isDownloaded) {
      await storageService.removeTrackOffline(track.id);
      const next = downloadedTrackIds.filter(id => id !== track.id);
      setDownloadedTrackIds(next);
    } else {
      await storageService.saveTrackOffline(track);
      const next = [...downloadedTrackIds, track.id];
      setDownloadedTrackIds(next);

      // Notification
      storageService.sendNotification(
        'Canción lista para escuchar offline',
        `"${track.title}" de ${track.artist} guardada en alta resolución.`
      );
    }
  };

  // Download all catalog
  const handleDownloadAll = async () => {
    for (const track of tracks) {
      await storageService.saveTrackOffline(track);
    }
    setDownloadedTrackIds(tracks.map(t => t.id));
    alert('¡Todas las canciones han sido descargadas en IndexedDB para reproducción 100% sin conexión!');
  };

  // Create Playlist
  const handleCreatePlaylist = (title: string, desc: string) => {
    const newPl: Playlist = {
      id: 'pl-' + Date.now(),
      title,
      description: desc,
      coverUrl: tracks[Math.floor(Math.random() * tracks.length)].coverUrl,
      trackIds: [tracks[0].id, tracks[1].id],
      author: userProfile.name,
      updatedAt: 'Ahora',
    };
    const updated = [newPl, ...playlists];
    setPlaylists(updated);
    storageService.saveUserPlaylists(updated.filter(p => !p.id.startsWith('playlist-')));
  };

  // Change Theme
  const handleSelectTheme = (newThemeId: DarkThemeId) => {
    setThemeId(newThemeId);
    storageService.saveThemePreference(newThemeId);
  };

  // Change EQ
  const handleChangeEqGains = (newGains: number[]) => {
    setEqGains(newGains);
    storageService.saveEqualizerSettings(newGains);
  };

  // Import local audio files into user's offline library
  const handleImportLocalFiles = useCallback((newTracks: Track[]) => {
    setTracks(prev => [...newTracks, ...prev]);
    const newIds = newTracks.map(t => t.id);
    setDownloadedTrackIds(prev => Array.from(new Set([...prev, ...newIds])));
    newTracks.forEach(t => storageService.saveTrackOffline(t));
    audioEngine.playHapticTransition('success');
    storageService.sendNotification(
      'Música local importada',
      `Se han agregado ${newTracks.length} canción(es) de tu dispositivo a tu biblioteca.`
    );
  }, []);

  // Reload data from cloud sync import
  const handleReloadData = () => {
    setUserProfile(storageService.getUserProfile());
    setThemeId(storageService.getThemePreference());
    setLikedTrackIds(storageService.getLikedTrackIds());
    setDownloadedTrackIds(storageService.getDownloadedTrackIds());
    setEqGains(storageService.getEqualizerSettings());
  };

  // Filtered downloaded tracks
  const downloadedTracks = useMemo(() => {
    return tracks.filter(t => downloadedTrackIds.includes(t.id));
  }, [tracks, downloadedTrackIds]);

  return (
    <div 
      className="min-h-screen text-slate-100 flex flex-col transition-colors duration-200"
      style={{
        backgroundColor: activeTheme.bgHex,
      }}
    >
      {/* Top Navigation */}
      <Navbar
        currentView={currentView}
        onSelectView={(v) => setCurrentView(v as any)}
        activeTheme={activeTheme}
        onOpenThemeModal={() => setIsThemeModalOpen(true)}
        batteryState={batteryState}
        onOpenBatteryModal={() => setIsBatteryModalOpen(true)}
        onOpenEqModal={() => setIsEqModalOpen(true)}
        onOpenCollabModal={() => setIsCollabModalOpen(true)}
        onOpenNotifyModal={() => setIsNotifyModalOpen(true)}
        onOpenAiDj={() => setIsAiDjOpen(true)}
        onOpenVoiceSearch={() => setIsVoiceSearchOpen(true)}
        onOpenAudioSettings={() => setIsAudioSettingsOpen(true)}
        sleepTimerRemaining={sleepTimerRemaining}
        profile={userProfile}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-6">
        {currentView === 'home' && (
          <HomeView
            tracks={tracks}
            playlists={playlists}
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            likedTrackIds={likedTrackIds}
            downloadedTrackIds={downloadedTrackIds}
            activeTheme={activeTheme}
            batteryState={batteryState}
            listeningHistory={listeningHistory}
            onPlayTrack={handlePlayTrack}
            onPlayPlaylist={handlePlayPlaylist}
            onToggleLike={handleToggleLike}
            onToggleDownload={handleToggleDownload}
            onOpenBatteryModal={() => setIsBatteryModalOpen(true)}
            onOpenThemeModal={() => setIsThemeModalOpen(true)}
            onOpenEqModal={() => setIsEqModalOpen(true)}
            onOpenAiDj={() => setIsAiDjOpen(true)}
            onOpenAudioSettings={() => setIsAudioSettingsOpen(true)}
            onSelectView={(v) => setCurrentView(v as any)}
          />
        )}

        {currentView === 'explore' && (
          <ExploreView
            tracks={tracks}
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            likedTrackIds={likedTrackIds}
            downloadedTrackIds={downloadedTrackIds}
            activeTheme={activeTheme}
            onPlayTrack={handlePlayTrack}
            onToggleLike={handleToggleLike}
            onToggleDownload={handleToggleDownload}
            onSelectAlbum={(alb) => setSelectedAlbum(alb)}
            initialSearchQuery={voiceSearchQuery}
            onOpenVoiceSearch={() => setIsVoiceSearchOpen(true)}
          />
        )}

        {currentView === 'library' && (
          <LibraryView
            playlists={playlists}
            tracks={tracks}
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            likedTrackIds={likedTrackIds}
            downloadedTrackIds={downloadedTrackIds}
            activeTheme={activeTheme}
            onPlayTrack={handlePlayTrack}
            onPlayPlaylist={handlePlayPlaylist}
            onToggleLike={handleToggleLike}
            onToggleDownload={handleToggleDownload}
            onCreatePlaylist={handleCreatePlaylist}
            onOpenCollabModal={() => setIsCollabModalOpen(true)}
            onImportLocalFiles={handleImportLocalFiles}
          />
        )}

        {currentView === 'offline' && (
          <OfflineView
            downloadedTracks={downloadedTracks}
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            likedTrackIds={likedTrackIds}
            activeTheme={activeTheme}
            storageStats={storageStats}
            isAirplaneMode={isAirplaneMode}
            onToggleAirplaneMode={() => setIsAirplaneMode(!isAirplaneMode)}
            onPlayTrack={handlePlayTrack}
            onToggleLike={handleToggleLike}
            onToggleDownload={handleToggleDownload}
            onDownloadAll={handleDownloadAll}
            onOpenStorageModal={() => setIsStorageModalOpen(true)}
          />
        )}
      </main>

      {/* Floating Quick Widget Dock for desktop/mobile */}
      <QuickWidget
        track={currentTrack}
        isPlaying={isPlaying}
        onTogglePlay={() => {
          if (isPlaying) audioEngine.pause();
          else audioEngine.resume();
        }}
        onNext={handleNextTrack}
        onOpenFullscreen={() => setIsFullscreenOpen(true)}
        activeTheme={activeTheme}
      />

      {/* Mobile Bottom Navigation */}
      <BottomNav
        currentView={currentView}
        onSelectView={(v) => setCurrentView(v)}
        activeTheme={activeTheme}
        hasActiveTrack={!!currentTrack}
      />

      {/* Spotify-style Bottom Player Bar */}
      <PlayerBar
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        volume={volume}
        isMuted={isMuted}
        shuffle={shuffle}
        repeat={repeat}
        activeTheme={activeTheme}
        batteryState={batteryState}
        streamQuality={streamQuality}
        sleepTimerRemaining={sleepTimerRemaining}
        onTogglePlay={() => {
          if (isPlaying) audioEngine.pause();
          else audioEngine.resume();
        }}
        onNext={handleNextTrack}
        onPrev={handlePrevTrack}
        onSeek={handleSeek}
        onToggleShuffle={() => setShuffle(!shuffle)}
        onToggleRepeat={() => {
          if (repeat === 'off') setRepeat('all');
          else if (repeat === 'all') setRepeat('one');
          else setRepeat('off');
        }}
        onVolumeChange={handleVolumeChange}
        onToggleMute={handleToggleMute}
        onToggleLike={handleToggleLike}
        onToggleDownload={handleToggleDownload}
        onOpenEq={() => setIsEqModalOpen(true)}
        onOpenConnect={() => setIsDeviceModalOpen(true)}
        onOpenFullscreen={() => setIsFullscreenOpen(true)}
        onOpenAudioSettings={() => setIsAudioSettingsOpen(true)}
        onOpenAiDj={() => setIsAiDjOpen(true)}
        showVideoScreen={showVideoScreen}
        onToggleVideo={() => setShowVideoScreen(!showVideoScreen)}
        isLiked={currentTrack ? likedTrackIds.includes(currentTrack.id) : false}
        isDownloaded={currentTrack ? downloadedTrackIds.includes(currentTrack.id) : false}
      />

      {/* Modals */}
      <FullscreenPlayerModal
        track={currentTrack}
        isOpen={isFullscreenOpen}
        onClose={() => setIsFullscreenOpen(false)}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        activeTheme={activeTheme}
        batteryState={batteryState}
        streamQuality={streamQuality}
        sleepTimerRemaining={sleepTimerRemaining}
        isLiked={currentTrack ? likedTrackIds.includes(currentTrack.id) : false}
        isDownloaded={currentTrack ? downloadedTrackIds.includes(currentTrack.id) : false}
        shuffle={shuffle}
        repeat={repeat}
        onTogglePlay={() => {
          if (isPlaying) audioEngine.pause();
          else audioEngine.resume();
        }}
        onNext={handleNextTrack}
        onPrev={handlePrevTrack}
        onSeek={handleSeek}
        onToggleShuffle={() => setShuffle(!shuffle)}
        onToggleRepeat={() => {
          if (repeat === 'off') setRepeat('all');
          else if (repeat === 'all') setRepeat('one');
          else setRepeat('off');
        }}
        onToggleLike={handleToggleLike}
        onToggleDownload={handleToggleDownload}
        onOpenEq={() => setIsEqModalOpen(true)}
        onOpenShare={(t) => setShareTrack(t)}
        onOpenAudioSettings={() => setIsAudioSettingsOpen(true)}
        onOpenAiDj={() => setIsAiDjOpen(true)}
      />

      <BatterySaverModal
        isOpen={isBatteryModalOpen}
        onClose={() => setIsBatteryModalOpen(false)}
        batteryState={batteryState}
        onUpdateBatteryState={(updates) => setBatteryState(prev => ({ ...prev, ...updates }))}
        activeTheme={activeTheme}
      />

      <EqualizerModal
        isOpen={isEqModalOpen}
        onClose={() => setIsEqModalOpen(false)}
        gains={eqGains}
        onChangeGains={handleChangeEqGains}
        activeTheme={activeTheme}
      />

      <ThemeModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
        activeThemeId={themeId}
        onSelectTheme={handleSelectTheme}
        activeTheme={activeTheme}
      />

      <DeviceConnectModal
        isOpen={isDeviceModalOpen}
        onClose={() => setIsDeviceModalOpen(false)}
        activeTheme={activeTheme}
      />

      <CollaborativeModal
        isOpen={isCollabModalOpen}
        onClose={() => setIsCollabModalOpen(false)}
        profile={userProfile}
        onUpdateProfile={setUserProfile}
        activeTheme={activeTheme}
        playlists={playlists}
        onReloadData={handleReloadData}
      />

      <NotificationModal
        isOpen={isNotifyModalOpen}
        onClose={() => setIsNotifyModalOpen(false)}
        activeTheme={activeTheme}
      />

      <ShareCardModal
        isOpen={!!shareTrack}
        onClose={() => setShareTrack(null)}
        track={shareTrack}
        activeTheme={activeTheme}
      />

      <AlbumDetailModal
        isOpen={!!selectedAlbum}
        onClose={() => setSelectedAlbum(null)}
        album={selectedAlbum}
        tracks={tracks}
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        downloadedTrackIds={downloadedTrackIds}
        activeTheme={activeTheme}
        onPlayTrack={handlePlayTrack}
        onAlbumDownloaded={(trackIds) => {
          setDownloadedTrackIds(prev => Array.from(new Set([...prev, ...trackIds])));
        }}
      />

      <StorageLocationModal
        isOpen={isStorageModalOpen}
        onClose={() => setIsStorageModalOpen(false)}
        activeTheme={activeTheme}
        onSettingsSaved={() => {
          storageService.getStorageUsage().then(setStorageStats);
        }}
      />

      <AudioSettingsModal
        isOpen={isAudioSettingsOpen}
        onClose={() => setIsAudioSettingsOpen(false)}
        activeTheme={activeTheme}
        onQualityChange={(q) => setStreamQuality(q)}
        onCrossfadeChange={(c) => setCrossfade(c)}
        sleepTimerRemaining={sleepTimerRemaining}
      />

      <AiDjModal
        isOpen={isAiDjOpen}
        onClose={() => setIsAiDjOpen(false)}
        activeTheme={activeTheme}
        currentTrack={currentTrack}
        listeningHistory={listeningHistory}
        onPlayTrack={handlePlayTrack}
        onCreatePlaylist={(title, desc) => handleCreatePlaylist(title, desc)}
      />

      <VoiceSearchModal
        isOpen={isVoiceSearchOpen}
        onClose={() => setIsVoiceSearchOpen(false)}
        onVoiceResult={(query) => {
          setVoiceSearchQuery(query);
          setCurrentView('explore');
        }}
        activeTheme={activeTheme}
      />

      {/* YouTube Screen (Floating PiP or Active Background Stream) */}
      <div 
        className={`fixed z-50 rounded-2xl overflow-hidden border shadow-2xl transition-all duration-300 ${
          showVideoScreen 
            ? 'bottom-20 right-4 sm:right-6 w-72 sm:w-80 h-44 sm:h-48 bg-black border-white/20 z-50' 
            : 'fixed -bottom-[999px] -right-[999px] w-80 h-48 opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/90 border-b border-white/10 text-xs">
          <div className="flex items-center gap-1.5 font-medium text-white truncate max-w-[200px]">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span className="truncate">{currentTrack?.title || 'YouTube Stream'}</span>
          </div>
          <button 
            onClick={() => setShowVideoScreen(false)}
            className="text-slate-400 hover:text-white"
            title="Minimizar a modo solo audio"
          >
            ✕
          </button>
        </div>
        <div id="sonora-yt-container" className="w-full h-[calc(100%-28px)] bg-black">
          <div id="sonora-yt-player" className="w-full h-full"></div>
        </div>
      </div>
    </div>
  );
}
