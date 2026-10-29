export type AudioQuality = 'lossless' | '320k' | '256k' | '128k';

export type StreamQualityLevel = 'high' | 'medium' | 'low';

export type SleepTimerOption = 'off' | '5' | '15' | '30' | '45' | '60' | 'end_of_track';

export interface AiRecommendedTrack {
  title: string;
  artist: string;
  genre: string;
  mood: string;
  bpm: number;
  why: string;
  searchQuery: string;
}

export interface AiSessionResponse {
  playlistTitle: string;
  vibeDescription: string;
  recommendedTracks: AiRecommendedTrack[];
}

export type AudioSource = 'youtube' | 'soundcloud' | 'web_archive';

export type StorageDestination = 'indexeddb' | 'filesystem' | 'downloads';

export interface StorageSettings {
  destination: StorageDestination;
  folderName: string;
  autoDownloadLyrics: boolean;
  autoDownloadArtwork: boolean;
  audioFormat: 'mp3' | 'opus' | 'flac';
  audioBitrate: '320k' | '256k' | '128k';
  streamQuality: StreamQualityLevel;
  crossfadeSeconds: number;
}

export type MoodType = 'Energético' | 'Concentración' | 'Chill / Relax' | 'Fiesta' | 'Melancólico' | 'Noche';

export type GenreType = 
  | 'Synthwave'
  | 'Lo-Fi'
  | 'Workout / Tech'
  | 'Urbano / Reggaeton'
  | 'Pop'
  | 'Rock / Indie'
  | 'Ambient'
  | 'Clásica';

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  albumId?: string;
  duration: number; // in seconds
  coverUrl: string;
  youtubeId: string;
  soundcloudUrl?: string;
  source: AudioSource;
  genre: GenreType;
  mood: MoodType;
  bpm: number;
  year: number;
  tags: string[];
  quality: AudioQuality;
  bitrate: string;
  playCount: number;
  isLiked?: boolean;
  isDownloaded?: boolean;
  downloadDate?: string;
  downloadPath?: string;
  sizeMb: number;
  lyrics?: string[];
  lrcText?: string;
  lyricsSource?: string;
  description?: string;
  localAudioUrl?: string;
  audioUrl?: string;
}

export interface Album {
  id: string;
  title: string;
  artist: string;
  year: number;
  coverUrl: string;
  genre: GenreType;
  source: AudioSource;
  totalDuration: number;
  trackIds: string[];
  description: string;
}

export interface Playlist {
  id: string;
  title: string;
  description: string;
  coverUrl: string;
  trackIds: string[];
  isCollaborative?: boolean;
  isSmart?: boolean;
  smartType?: 'mood' | 'genre' | 'top' | 'offline';
  smartValue?: string;
  shareCode?: string;
  collaborators?: string[];
  updatedAt: string;
  author: string;
}

export type DarkThemeId = 'oled' | 'midnight' | 'obsidian' | 'crimson' | 'cyber' | 'spotify';

export interface DarkThemeConfig {
  id: DarkThemeId;
  name: string;
  description: string;
  bgHex: string;
  surfaceHex: string;
  accentHex: string;
  accentClass: string;
  borderHex: string;
  cardHex: string;
  glowHex: string;
}

export interface EqualizerBand {
  label: string;
  freq: number;
  gain: number; // -12 to +12 dB
}

export interface EqualizerPreset {
  id: string;
  name: string;
  description: string;
  gains: number[];
}

export interface BatteryState {
  level: number; // 0 to 1
  isCharging: boolean;
  saverActive: boolean;
  oledPitchBlack: boolean;
  lowPowerAudio: boolean;
  screenWakeLock: boolean;
  fpsCap: number; // 60 or 15 or 0
  estimatedMinutesLeft: number;
}

export interface SmartDevice {
  id: string;
  name: string;
  type: 'browser' | 'tv' | 'speaker' | 'headphones';
  isConnected: boolean;
  status: string;
  latencyMs: number;
  iconName: string;
}

export interface UserProfile {
  name: string;
  avatarSeed: string;
  isGuest: boolean;
  cloudSyncKey: string;
  lastSyncedAt?: string;
  totalListeningMinutes: number;
  offlineCacheLimitMb: number;
}

export interface PlaybackState {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  shuffle: boolean;
  repeat: 'off' | 'all' | 'one';
  playbackRate: number; // 0.75, 1.0, 1.25, 1.5, 2.0
}
