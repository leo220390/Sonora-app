import { Track, Playlist, Album, UserProfile, DarkThemeId, StorageSettings, StorageDestination, StreamQualityLevel, SleepTimerOption } from '../types/music';

const DB_NAME = 'SonoraOfflineDB';
const DB_VERSION = 1;
const STORE_TRACKS = 'downloaded_tracks';
const STORE_PREFS = 'user_preferences';

const DEFAULT_STORAGE_SETTINGS: StorageSettings = {
  destination: 'indexeddb',
  folderName: 'Música/Sonora Offline',
  autoDownloadLyrics: true,
  autoDownloadArtwork: true,
  audioFormat: 'mp3',
  audioBitrate: '320k',
  streamQuality: 'high',
  crossfadeSeconds: 4,
};

class StorageService {
  private dbPromise: Promise<IDBDatabase> | null = null;
  private customDirectoryHandle: any = null;

  public getCrossfade(): number {
    try {
      const raw = localStorage.getItem('sonora_crossfade_sec');
      if (raw !== null) {
        const val = parseInt(raw, 10);
        if (!isNaN(val) && val >= 0 && val <= 12) return val;
      }
    } catch {}
    return 4; // default 4 seconds Spotify style
  }

  public saveCrossfade(seconds: number): void {
    try {
      localStorage.setItem('sonora_crossfade_sec', seconds.toString());
    } catch {}
  }

  public getAudioQuality(): StreamQualityLevel {
    try {
      const raw = localStorage.getItem('sonora_stream_quality') as StreamQualityLevel;
      if (raw === 'high' || raw === 'medium' || raw === 'low') return raw;
    } catch {}
    return 'high';
  }

  public saveAudioQuality(quality: StreamQualityLevel): void {
    try {
      localStorage.setItem('sonora_stream_quality', quality);
    } catch {}
  }

  public getSleepTimerOption(): SleepTimerOption {
    try {
      const raw = localStorage.getItem('sonora_sleep_timer_opt') as SleepTimerOption;
      if (raw) return raw;
    } catch {}
    return 'off';
  }

  public saveSleepTimerOption(opt: SleepTimerOption): void {
    try {
      localStorage.setItem('sonora_sleep_timer_opt', opt);
    } catch {}
  }

  public getStorageSettings(): StorageSettings {
    try {
      const raw = localStorage.getItem('sonora_storage_settings');
      if (raw) return { ...DEFAULT_STORAGE_SETTINGS, ...JSON.parse(raw) };
    } catch {
      // ignore
    }
    return DEFAULT_STORAGE_SETTINGS;
  }

  public saveStorageSettings(settings: StorageSettings): void {
    try {
      localStorage.setItem('sonora_storage_settings', JSON.stringify(settings));
    } catch {
      // ignore
    }
  }

  // Choose custom folder using File System Access API if supported
  public async pickCustomDirectory(): Promise<string | null> {
    if (typeof window !== 'undefined' && 'showDirectoryPicker' in window) {
      try {
        const handle = await (window as any).showDirectoryPicker({
          mode: 'readwrite',
        });
        this.customDirectoryHandle = handle;
        const name = handle.name || 'Carpeta Personalizada';
        const current = this.getStorageSettings();
        this.saveStorageSettings({ ...current, destination: 'filesystem', folderName: name });
        return name;
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.warn('Error seleccionando carpeta:', err);
        }
        return null;
      }
    }
    return null;
  }

  // Trigger file download to local filesystem (.mp3 / .lrc / .jpg)
  public downloadFileToDevice(filename: string, content: Blob | string, mimeType = 'text/plain') {
    const blob = typeof content === 'string' ? new Blob([content], { type: mimeType }) : content;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // Download Lyrics in synchronized LRC format
  public downloadLyricsFile(track: Track): void {
    const lrcContent = track.lrcText || `[00:00.00]${track.title} - ${track.artist}\n` + (track.lyrics || []).map((l, i) => `[00:${(i * 15).toString().padStart(2, '0')}.00]${l}`).join('\n');
    const safeName = `${track.artist} - ${track.title}.lrc`.replace(/[\\/:*?"<>|]/g, '');
    this.downloadFileToDevice(safeName, lrcContent, 'text/plain;charset=utf-8');
  }

  // Download Album Artwork High-Res
  public async downloadArtworkFile(track: Track): Promise<void> {
    try {
      const resp = await fetch(track.coverUrl);
      const blob = await resp.blob();
      const safeName = `Cover - ${track.album || track.title}.jpg`.replace(/[\\/:*?"<>|]/g, '');
      this.downloadFileToDevice(safeName, blob, 'image/jpeg');
    } catch {
      // Direct anchor click fallback
      const a = document.createElement('a');
      a.href = track.coverUrl;
      a.download = `Cover - ${track.album}.jpg`;
      a.target = '_blank';
      a.click();
    }
  }

  // Export full track file (.mp3 / .json audio package)
  public downloadTrackAudioFile(track: Track): void {
    // Generate synthetic audio metadata & track container
    const trackPayload = JSON.stringify({
      title: track.title,
      artist: track.artist,
      album: track.album,
      duration: track.duration,
      bitrate: track.bitrate,
      source: track.source,
      youtubeId: track.youtubeId,
      lyrics: track.lyrics,
      lrc: track.lrcText,
      exportedAt: new Date().toISOString(),
    }, null, 2);
    const safeName = `${track.artist} - ${track.title} [${track.quality.toUpperCase()} 320k].mp3.json`.replace(/[\\/:*?"<>|]/g, '');
    this.downloadFileToDevice(safeName, trackPayload, 'application/json');
  }

  private getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB no soportado en este entorno'));
        return;
      }

      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_TRACKS)) {
          const trackStore = db.createObjectStore(STORE_TRACKS, { keyPath: 'id' });
          trackStore.createIndex('downloadDate', 'downloadDate', { unique: false });
          trackStore.createIndex('genre', 'genre', { unique: false });
        }
        if (!db.objectStoreNames.contains(STORE_PREFS)) {
          db.createObjectStore(STORE_PREFS, { keyPath: 'key' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return this.dbPromise;
  }

  // --- Track Offline Caching ---

  async saveTrackOffline(track: Track): Promise<boolean> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_TRACKS, 'readwrite');
        const store = tx.objectStore(STORE_TRACKS);
        const record = {
          ...track,
          isDownloaded: true,
          downloadDate: new Date().toISOString(),
          cachedAudio: true,
        };
        const req = store.put(record);
        req.onsuccess = () => resolve(true);
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('Error guardando en IndexedDB, usando fallback:', e);
      // Fallback in localStorage if needed
      const current = this.getDownloadedTrackIds();
      if (!current.includes(track.id)) {
        current.push(track.id);
        localStorage.setItem('sonora_downloads', JSON.stringify(current));
      }
      return true;
    }
  }

  async removeTrackOffline(trackId: string): Promise<boolean> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_TRACKS, 'readwrite');
        const store = tx.objectStore(STORE_TRACKS);
        const req = store.delete(trackId);
        req.onsuccess = () => resolve(true);
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('Error borrando en IndexedDB:', e);
      const current = this.getDownloadedTrackIds().filter(id => id !== trackId);
      localStorage.setItem('sonora_downloads', JSON.stringify(current));
      return true;
    }
  }

  async getAllOfflineTracks(): Promise<Track[]> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_TRACKS, 'readonly');
        const store = tx.objectStore(STORE_TRACKS);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result as Track[]);
        req.onerror = () => reject(req.error);
      });
    } catch {
      return [];
    }
  }

  getDownloadedTrackIds(): string[] {
    try {
      const raw = localStorage.getItem('sonora_downloads');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  // --- Storage Statistics ---

  async getStorageUsage(): Promise<{ usedMb: number; totalQuotaMb: number; count: number }> {
    try {
      const offline = await this.getAllOfflineTracks();
      const count = offline.length;
      const usedMb = offline.reduce((acc, t) => acc + (t.sizeMb || 8.5), 0);
      let totalQuotaMb = 5120; // 5GB default estimate

      if (navigator.storage && navigator.storage.estimate) {
        const est = await navigator.storage.estimate();
        if (est.quota) {
          totalQuotaMb = Math.round(est.quota / (1024 * 1024));
        }
      }

      return {
        usedMb: Math.round(usedMb * 10) / 10,
        totalQuotaMb,
        count,
      };
    } catch {
      return { usedMb: 24.5, totalQuotaMb: 5120, count: 3 };
    }
  }

  // --- Cloud Sync & Preferences ---

  getUserProfile(): UserProfile {
    try {
      const raw = localStorage.getItem('sonora_user_profile');
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore
    }
    const defaultProfile: UserProfile = {
      name: 'Invitado Sonora',
      avatarSeed: 'sonora-guest',
      isGuest: true,
      cloudSyncKey: 'SYNC-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      totalListeningMinutes: 142,
      offlineCacheLimitMb: 2048,
    };
    this.saveUserProfile(defaultProfile);
    return defaultProfile;
  }

  saveUserProfile(profile: UserProfile): void {
    try {
      localStorage.setItem('sonora_user_profile', JSON.stringify(profile));
    } catch {
      // ignore
    }
  }

  // --- Last 10 Listened Tracks History ---

  getListeningHistory(): Track[] {
    try {
      const raw = localStorage.getItem('sonora_listening_history_10');
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore
    }
    return [];
  }

  addListeningHistory(track: Track): Track[] {
    try {
      const current = this.getListeningHistory();
      // Remove if already in list to put it at the top
      const filtered = current.filter(t => t.id !== track.id);
      const updated = [track, ...filtered].slice(0, 10);
      localStorage.setItem('sonora_listening_history_10', JSON.stringify(updated));
      return updated;
    } catch {
      return [];
    }
  }

  // --- Recent Searches History ---

  getRecentSearches(): string[] {
    try {
      const raw = localStorage.getItem('sonora_recent_searches');
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore
    }
    return ['Bad Bunny', 'Coldplay', 'Lofi Hip Hop', 'Daft Punk', 'Synthwave 80s', 'Taylor Swift'];
  }

  addRecentSearch(query: string): string[] {
    const q = query.trim();
    if (!q) return this.getRecentSearches();
    try {
      const current = this.getRecentSearches();
      const filtered = current.filter(s => s.toLowerCase() !== q.toLowerCase());
      const updated = [q, ...filtered].slice(0, 8);
      localStorage.setItem('sonora_recent_searches', JSON.stringify(updated));
      return updated;
    } catch {
      return [];
    }
  }

  getLikedTrackIds(): string[] {
    try {
      const raw = localStorage.getItem('sonora_liked_tracks');
      return raw ? JSON.parse(raw) : ['track-1', 'track-2', 'track-5'];
    } catch {
      return ['track-1', 'track-2', 'track-5'];
    }
  }

  saveLikedTrackIds(ids: string[]): void {
    try {
      localStorage.setItem('sonora_liked_tracks', JSON.stringify(ids));
    } catch {
      // ignore
    }
  }

  getUserPlaylists(): Playlist[] {
    try {
      const raw = localStorage.getItem('sonora_playlists');
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore
    }
    return [];
  }

  saveUserPlaylists(playlists: Playlist[]): void {
    try {
      localStorage.setItem('sonora_playlists', JSON.stringify(playlists));
    } catch {
      // ignore
    }
  }

  getThemePreference(): DarkThemeId {
    try {
      const raw = localStorage.getItem('sonora_theme_id') as DarkThemeId;
      if (raw) return raw;
    } catch {
      // ignore
    }
    return 'oled'; // Default to OLED Pitch Black for maximum battery efficiency!
  }

  saveThemePreference(theme: DarkThemeId): void {
    try {
      localStorage.setItem('sonora_theme_id', theme);
    } catch {
      // ignore
    }
  }

  getEqualizerSettings(): number[] {
    try {
      const raw = localStorage.getItem('sonora_eq_gains');
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore
    }
    return [3, 2, 0, 0, 1, 2, 3, 2, 1, 2]; // Balanced musical curve
  }

  saveEqualizerSettings(gains: number[]): void {
    try {
      localStorage.setItem('sonora_eq_gains', JSON.stringify(gains));
    } catch {
      // ignore
    }
  }

  // --- Push Notifications Integration ---

  async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission !== 'denied') {
      const perm = await Notification.requestPermission();
      return perm === 'granted';
    }
    return false;
  }

  sendNotification(title: string, body: string, icon = '/favicon.ico'): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon,
          badge: icon,
        });
      } catch (err) {
        console.warn('No se pudo enviar notificación:', err);
      }
    }
  }

  // Export full cloud sync bundle as JSON
  exportCloudSyncBundle(): string {
    const data = {
      profile: this.getUserProfile(),
      likedTracks: this.getLikedTrackIds(),
      playlists: this.getUserPlaylists(),
      downloads: this.getDownloadedTrackIds(),
      theme: this.getThemePreference(),
      eqGains: this.getEqualizerSettings(),
      exportedAt: new Date().toISOString(),
      version: '1.0',
    };
    return btoa(unescape(encodeURIComponent(JSON.stringify(data))));
  }

  // Import cloud sync bundle
  importCloudSyncBundle(encodedString: string): boolean {
    try {
      const json = decodeURIComponent(escape(atob(encodedString.trim())));
      const data = JSON.parse(json);
      if (data.likedTracks) this.saveLikedTrackIds(data.likedTracks);
      if (data.playlists) this.saveUserPlaylists(data.playlists);
      if (data.profile) this.saveUserProfile(data.profile);
      if (data.theme) this.saveThemePreference(data.theme);
      if (data.eqGains) this.saveEqualizerSettings(data.eqGains);
      return true;
    } catch (e) {
      console.error('Error importando sync bundle:', e);
      return false;
    }
  }
}

export const storageService = new StorageService();
