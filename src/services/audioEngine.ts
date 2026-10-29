import { Track } from '../types/music';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export const EQ_FREQUENCIES = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

export const EQ_PRESETS = [
  { id: 'flat', name: 'Plano (Neutral)', description: 'Respuesta limpia y balanceada de estudio', gains: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { id: 'bass-boost', name: 'Bass Boost (Graves Profundos)', description: 'Realce en sub-bajos y frecuencias de impacto', gains: [7, 6, 4, 2, 0, 0, 1, 2, 3, 2] },
  { id: 'lofi', name: 'Lo-Fi Chill & Vinyl', description: 'Cálido recorte de agudos y medios resonantes', gains: [4, 3, 2, 2, 1, 0, -2, -3, -5, -6] },
  { id: 'electronic', name: 'Club / Electrónica', description: 'Curva en V con graves contundentes y agudos brillantes', gains: [6, 5, 2, 0, -1, 1, 3, 5, 6, 5] },
  { id: 'vocal', name: 'Realce Vocal & Acústico', description: 'Claridad en voces e instrumentos solistas', gains: [-2, -1, 0, 2, 4, 5, 4, 2, 1, 0] },
  { id: 'battery-saver', name: 'Ahorro de Batería (DSP Mínimo)', description: 'DSP optimizado con mínima carga de procesamiento', gains: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
];

class AudioEngine {
  private audioCtx: AudioContext | null = null;
  private eqFilters: BiquadFilterNode[] = [];
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private spatialPanner: StereoPannerNode | null = null;
  private isSynthesizing = false;
  private synthInterval: any = null;
  private wakeLockSentinel: any = null;

  // YouTube IFrame Player instance
  private ytPlayer: any = null;
  private ytReady = false;
  private activeTrack: Track | null = null;

  // Listeners for UI state sync
  private onTimeUpdateCallback: ((current: number, duration: number) => void) | null = null;
  private onStateChangeCallback: ((isPlaying: boolean) => void) | null = null;
  private onTrackEndedCallback: (() => void) | null = null;

  private isPlaying = false;
  private currentTime = 0;
  private duration = 0;
  private timer: any = null;

  // Crossfade & Audio Quality
  private crossfadeSeconds = 4;
  private qualityLevel: 'high' | 'medium' | 'low' = 'high';
  private sleepTimerSecondsRemaining: number | null = null;
  private sleepTimerInterval: any = null;
  private onSleepTimerTickCallback: ((remaining: number | null) => void) | null = null;
  private sleepTimerMode: 'off' | 'time' | 'end_of_track' = 'off';
  private isCrossfading = false;

  constructor() {
    this.initYouTubeAPI();
    try {
      const savedCrossfade = localStorage.getItem('sonora_crossfade_sec');
      if (savedCrossfade) this.crossfadeSeconds = parseInt(savedCrossfade, 10) || 4;
      const savedQuality = localStorage.getItem('sonora_stream_quality') as any;
      if (savedQuality) this.qualityLevel = savedQuality;
    } catch {}
  }

  private initAudioContext() {
    if (this.audioCtx) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      this.audioCtx = new AudioContextClass();

      // Create 10-band equalizer
      this.eqFilters = EQ_FREQUENCIES.map((freq) => {
        const filter = this.audioCtx!.createBiquadFilter();
        if (freq <= 64) {
          filter.type = 'lowshelf';
        } else if (freq >= 8000) {
          filter.type = 'highshelf';
        } else {
          filter.type = 'peaking';
          filter.Q.value = 1.4;
        }
        filter.frequency.value = freq;
        filter.gain.value = 0;
        return filter;
      });

      // Connect filter chain
      for (let i = 0; i < this.eqFilters.length - 1; i++) {
        this.eqFilters[i].connect(this.eqFilters[i + 1]);
      }

      // Analyser for visualizer
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 64; // Low-power lightweight FFT
      this.analyser.smoothingTimeConstant = 0.8;

      // Spatial Panner
      if (this.audioCtx.createStereoPanner) {
        this.spatialPanner = this.audioCtx.createStereoPanner();
      }

      // Master Gain
      this.masterGain = this.audioCtx.createGain();
      this.masterGain.gain.value = 0.9;

      // Final chain
      const lastFilter = this.eqFilters[this.eqFilters.length - 1];
      if (this.spatialPanner) {
        lastFilter.connect(this.spatialPanner);
        this.spatialPanner.connect(this.masterGain);
      } else {
        lastFilter.connect(this.masterGain);
      }

      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.audioCtx.destination);
    } catch (e) {
      console.warn('AudioContext no inicializado:', e);
    }
  }

  // Tactile button transition effect (subtle sound wave click)
  public playHapticTransition(type: 'click' | 'toggle' | 'download' | 'success' = 'click') {
    try {
      this.initAudioContext();
      if (!this.audioCtx || this.audioCtx.state === 'suspended') return;
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      if (type === 'download' || type === 'success') {
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.15);
      } else {
        osc.frequency.setValueAtTime(type === 'toggle' ? 440 : 800, now);
        osc.frequency.exponentialRampToValueAtTime(type === 'toggle' ? 660 : 200, now + 0.04);
        gain.gain.setValueAtTime(0.02, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.055);
      }
    } catch {
      // Audio click fallback
    }
  }

  // --- YouTube IFrame API Integration ---

  private pendingTrack: Track | null = null;
  private volumeLevel = 0.85;

  public mountYouTubePlayer(elementId = 'sonora-yt-player') {
    if (typeof window === 'undefined') return;

    const createPlayer = () => {
      const el = document.getElementById(elementId);
      if (!el || !window.YT || !window.YT.Player) {
        return;
      }

      // If already created, return
      if (this.ytPlayer) return;

      try {
        this.ytPlayer = new window.YT.Player(elementId, {
          height: '100%',
          width: '100%',
          videoId: this.activeTrack?.youtubeId || '4xDzrJKXOOY',
          playerVars: {
            autoplay: 1,
            controls: 1,
            disablekb: 0,
            enablejsapi: 1,
            fs: 1,
            modestbranding: 1,
            playsinline: 1,
            rel: 0,
            origin: window.location.origin,
          },
          events: {
            onReady: (event: any) => {
              this.ytReady = true;
              event.target.unMute();
              event.target.setVolume(Math.round(this.volumeLevel * 100));

              // If a track was waiting to be played
              if (this.pendingTrack) {
                const trk = this.pendingTrack;
                this.pendingTrack = null;
                this.playTrack(trk, 0);
              }
            },
            onStateChange: (event: any) => {
              // 1 = playing, 2 = paused, 0 = ended, 3 = buffering
              if (event.data === 1) {
                this.isPlaying = true;
                this.startProgressTicker();
                this.onStateChangeCallback?.(true);
              } else if (event.data === 2) {
                this.isPlaying = false;
                this.stopProgressTicker();
                this.onStateChangeCallback?.(false);
              } else if (event.data === 0) {
                this.isPlaying = false;
                this.stopProgressTicker();
                this.onStateChangeCallback?.(false);
                this.onTrackEndedCallback?.();
              }
            },
            onError: (err: any) => {
              console.warn('YouTube Stream error (code:', err?.data, '), usando fallback de audio:', err);
              this.fallbackToSynthesizer();
            },
          },
        });
      } catch (err) {
        console.warn('Error montando reproductor de YouTube:', err);
      }
    };

    if (window.YT && window.YT.Player) {
      createPlayer();
    } else {
      const prevReady = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (prevReady) prevReady();
        createPlayer();
      };
    }
  }

  private initYouTubeAPI() {
    this.mountYouTubePlayer();
  }

  public setCallbacks(
    onTimeUpdate: (current: number, duration: number) => void,
    onStateChange: (isPlaying: boolean) => void,
    onTrackEnded: () => void
  ) {
    this.onTimeUpdateCallback = onTimeUpdate;
    this.onStateChangeCallback = onStateChange;
    this.onTrackEndedCallback = onTrackEnded;
  }

  private localAudio: HTMLAudioElement | null = null;

  public async playTrack(track: Track, startTime = 0) {
    this.initAudioContext();
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      await this.audioCtx.resume();
    }

    this.activeTrack = track;
    this.duration = track.duration;
    this.currentTime = startTime;

    this.updateMediaSession(track);
    this.requestWakeLock();

    // Check if track has a local audio file or blob URL
    const localUrl = track.localAudioUrl || track.audioUrl;
    if (localUrl) {
      this.stopSynthesizer();
      if (this.ytReady && this.ytPlayer && this.ytPlayer.pauseVideo) {
        try { this.ytPlayer.pauseVideo(); } catch {}
      }

      if (!this.localAudio) {
        this.localAudio = new Audio();
      }

      this.localAudio.src = localUrl;
      this.localAudio.currentTime = startTime;
      this.localAudio.volume = this.volumeLevel;

      this.localAudio.ontimeupdate = () => {
        if (this.localAudio) {
          this.currentTime = this.localAudio.currentTime;
          if (this.localAudio.duration && !isNaN(this.localAudio.duration)) {
            this.duration = this.localAudio.duration;
          }
          this.onTimeUpdateCallback?.(this.currentTime, this.duration);
        }
      };

      this.localAudio.onended = () => {
        this.isPlaying = false;
        this.onStateChangeCallback?.(false);
        this.onTrackEndedCallback?.();
      };

      this.localAudio.play()
        .then(() => {
          this.isPlaying = true;
          this.onStateChangeCallback?.(true);
        })
        .catch((err) => {
          console.warn('Error reproduciendo archivo local:', err);
          this.fallbackToSynthesizer();
        });
      return;
    }

    // Stop local audio if switching to YouTube
    if (this.localAudio) {
      this.localAudio.pause();
    }

    // Check if YouTube Player is ready and track has a valid youtubeId
    if (this.ytReady && this.ytPlayer && this.ytPlayer.loadVideoById && track.youtubeId) {
      try {
        this.stopSynthesizer();
        this.ytPlayer.unMute();
        this.ytPlayer.setVolume(Math.round(this.volumeLevel * 100));
        this.ytPlayer.loadVideoById({
          videoId: track.youtubeId,
          startSeconds: startTime,
        });
        this.ytPlayer.playVideo();
        this.isPlaying = true;
        this.startProgressTicker();
        this.onStateChangeCallback?.(true);
        return;
      } catch (e) {
        console.warn('YouTube playback error, fallback al motor Web Audio:', e);
      }
    } else if (!this.ytReady) {
      // Queue it up and initialize player
      this.pendingTrack = track;
      this.mountYouTubePlayer();
    }

    // High fidelity Web Audio synth fallback (100% offline & seamless)
    this.fallbackToSynthesizer();
  }

  private fallbackToSynthesizer() {
    this.stopSynthesizer();
    this.isPlaying = true;
    this.startProgressTicker();
    this.startSynthesizer();
    this.onStateChangeCallback?.(true);
  }

  private startSynthesizer() {
    if (!this.audioCtx || this.isSynthesizing || !this.activeTrack) return;
    this.isSynthesizing = true;

    const bpm = this.activeTrack.bpm || 100;
    const intervalMs = (60 / bpm) * 1000;

    // Musical scale frequencies based on mood
    const baseFreq = this.activeTrack.genre === 'Synthwave' ? 110 : this.activeTrack.genre === 'Lo-Fi' ? 130.81 : 164.81;
    const chords = [
      [baseFreq, baseFreq * 1.25, baseFreq * 1.5],
      [baseFreq * 0.75, baseFreq * 0.9375, baseFreq * 1.125],
      [baseFreq * 0.888, baseFreq * 1.11, baseFreq * 1.33],
      [baseFreq * 0.666, baseFreq * 0.833, baseFreq * 1.0],
    ];
    let step = 0;

    this.synthInterval = setInterval(() => {
      if (!this.isPlaying || !this.audioCtx || this.audioCtx.state !== 'running') return;
      try {
        const chord = chords[Math.floor(step / 4) % chords.length];
        const now = this.audioCtx.currentTime;

        // Bass Kick or Sub pulse on beat 0 and 2
        if (step % 2 === 0) {
          const osc = this.audioCtx.createOscillator();
          const gain = this.audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(80, now);
          osc.frequency.exponentialRampToValueAtTime(35, now + 0.15);
          gain.gain.setValueAtTime(0.3, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
          osc.connect(gain);
          gain.connect(this.eqFilters[0]);
          osc.start(now);
          osc.stop(now + 0.22);
        }

        // Melodic notes
        const noteFreq = chord[step % chord.length];
        const melOsc = this.audioCtx.createOscillator();
        const melGain = this.audioCtx.createGain();
        melOsc.type = this.activeTrack?.genre === 'Synthwave' ? 'sawtooth' : 'triangle';
        melOsc.frequency.setValueAtTime(noteFreq * (step % 3 === 0 ? 2 : 1), now);

        melGain.gain.setValueAtTime(0.08, now);
        melGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        melOsc.connect(melGain);
        melGain.connect(this.eqFilters[0]);
        melOsc.start(now);
        melOsc.stop(now + 0.38);

        step++;
      } catch {
        // Audio node transient catch
      }
    }, intervalMs / 2);
  }

  private stopSynthesizer() {
    this.isSynthesizing = false;
    if (this.synthInterval) {
      clearInterval(this.synthInterval);
      this.synthInterval = null;
    }
  }

  public pause() {
    this.isPlaying = false;
    this.stopProgressTicker();
    this.stopSynthesizer();

    if (this.localAudio) {
      try { this.localAudio.pause(); } catch {}
    }

    if (this.ytReady && this.ytPlayer && this.ytPlayer.pauseVideo) {
      try {
        this.ytPlayer.pauseVideo();
      } catch {
        // ignore
      }
    }

    this.onStateChangeCallback?.(false);
  }

  public resume() {
    if (!this.activeTrack) return;
    this.isPlaying = true;
    this.startProgressTicker();

    if (this.localAudio && (this.activeTrack.localAudioUrl || this.activeTrack.audioUrl)) {
      this.localAudio.play()
        .then(() => this.onStateChangeCallback?.(true))
        .catch(() => this.fallbackToSynthesizer());
      return;
    }

    if (this.ytReady && this.ytPlayer && this.ytPlayer.playVideo) {
      try {
        this.ytPlayer.playVideo();
        this.onStateChangeCallback?.(true);
        return;
      } catch {
        // fallback
      }
    }

    this.startSynthesizer();
    this.onStateChangeCallback?.(true);
  }

  public seek(seconds: number) {
    this.currentTime = Math.max(0, Math.min(seconds, this.duration));

    if (this.localAudio) {
      try { this.localAudio.currentTime = this.currentTime; } catch {}
    }

    if (this.ytReady && this.ytPlayer && this.ytPlayer.seekTo) {
      try {
        this.ytPlayer.seekTo(seconds, true);
      } catch {
        // ignore
      }
    }
    this.onTimeUpdateCallback?.(this.currentTime, this.duration);
  }

  public setVolume(volume: number) {
    // 0 to 1
    this.volumeLevel = volume;
    if (this.localAudio) {
      this.localAudio.volume = Math.max(0, Math.min(1, volume));
    }
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
    }
    if (this.ytReady && this.ytPlayer && this.ytPlayer.setVolume) {
      try {
        this.ytPlayer.setVolume(Math.round(volume * 100));
      } catch {
        // ignore
      }
    }
  }

  public setSpatialPanning(pan: number) {
    // -1 (left) to 1 (right)
    if (this.spatialPanner) {
      this.spatialPanner.pan.value = Math.max(-1, Math.min(1, pan));
    }
  }

  public setEqualizerBand(index: number, gain: number) {
    if (this.eqFilters[index]) {
      this.eqFilters[index].gain.value = gain;
    }
  }

  public applyEqualizerPreset(gains: number[]) {
    gains.forEach((gain, index) => {
      this.setEqualizerBand(index, gain);
    });
  }

  // --- Visualizer Data ---

  public getVisualizerData(): Uint8Array {
    if (!this.analyser) {
      return new Uint8Array(32);
    }
    const data = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(data);
    return data;
  }

  // --- Crossfade, Audio Quality & Sleep Timer API ---

  public setCrossfade(seconds: number) {
    this.crossfadeSeconds = Math.max(0, Math.min(12, seconds));
    try {
      localStorage.setItem('sonora_crossfade_sec', this.crossfadeSeconds.toString());
    } catch {}
  }

  public getCrossfade(): number {
    return this.crossfadeSeconds;
  }

  public setQualityLevel(quality: 'high' | 'medium' | 'low') {
    this.qualityLevel = quality;
    try {
      localStorage.setItem('sonora_stream_quality', quality);
    } catch {}

    // Subtle acoustic filtering based on streaming quality:
    if (this.eqFilters.length >= 10) {
      if (quality === 'low') {
        // 96k mode: roll-off ultra high frequencies (>12kHz) to simulate bandwidth & reduce DSP load
        this.eqFilters[8].gain.value = -3;
        this.eqFilters[9].gain.value = -6;
      } else if (quality === 'medium') {
        // 192k mode: balanced
        this.eqFilters[8].gain.value = 0;
        this.eqFilters[9].gain.value = 0;
      } else {
        // 320k mode: clean pristine high resolution
        this.eqFilters[8].gain.value = 1;
        this.eqFilters[9].gain.value = 1;
      }
    }
  }

  public getQualityLevel(): 'high' | 'medium' | 'low' {
    return this.qualityLevel;
  }

  public setSleepTimer(option: 'off' | '5' | '15' | '30' | '45' | '60' | 'end_of_track', onFinish?: () => void) {
    if (this.sleepTimerInterval) {
      clearInterval(this.sleepTimerInterval);
      this.sleepTimerInterval = null;
    }

    if (option === 'off') {
      this.sleepTimerMode = 'off';
      this.sleepTimerSecondsRemaining = null;
      this.onSleepTimerTickCallback?.(null);
      return;
    }

    if (option === 'end_of_track') {
      this.sleepTimerMode = 'end_of_track';
      const remainingSec = Math.max(0, Math.round(this.duration - this.currentTime));
      this.sleepTimerSecondsRemaining = remainingSec;
      this.onSleepTimerTickCallback?.(remainingSec);
      return;
    }

    const minutes = parseInt(option, 10);
    this.sleepTimerMode = 'time';
    this.sleepTimerSecondsRemaining = minutes * 60;
    this.onSleepTimerTickCallback?.(this.sleepTimerSecondsRemaining);

    this.sleepTimerInterval = setInterval(() => {
      if (this.sleepTimerSecondsRemaining !== null) {
        this.sleepTimerSecondsRemaining -= 1;
        this.onSleepTimerTickCallback?.(this.sleepTimerSecondsRemaining);

        if (this.sleepTimerSecondsRemaining <= 0) {
          clearInterval(this.sleepTimerInterval);
          this.sleepTimerInterval = null;
          this.sleepTimerSecondsRemaining = null;
          this.sleepTimerMode = 'off';
          this.onSleepTimerTickCallback?.(null);
          this.fadeOutAndPause(3000);
          onFinish?.();
        }
      }
    }, 1000);
  }

  public getSleepTimerRemaining(): number | null {
    return this.sleepTimerSecondsRemaining;
  }

  public getSleepTimerMode(): 'off' | 'time' | 'end_of_track' {
    return this.sleepTimerMode;
  }

  public setOnSleepTimerTick(callback: (remaining: number | null) => void) {
    this.onSleepTimerTickCallback = callback;
  }

  public async fadeOutAndPause(durationMs = 2500) {
    const originalVol = this.volumeLevel;
    const steps = 15;
    const intervalTime = durationMs / steps;
    let step = 0;

    const fadeTimer = setInterval(() => {
      step++;
      const factor = Math.max(0, 1 - step / steps);
      const currentVol = originalVol * factor;

      if (this.localAudio) {
        try { this.localAudio.volume = currentVol; } catch {}
      }
      if (this.masterGain) {
        try { this.masterGain.gain.value = currentVol; } catch {}
      }
      if (this.ytReady && this.ytPlayer && this.ytPlayer.setVolume) {
        try { this.ytPlayer.setVolume(Math.round(currentVol * 100)); } catch {}
      }

      if (step >= steps) {
        clearInterval(fadeTimer);
        this.pause();
        setTimeout(() => {
          this.setVolume(originalVol);
        }, 200);
      }
    }, intervalTime);
  }

  // --- Progress Ticker ---

  private startProgressTicker() {
    this.stopProgressTicker();
    this.timer = setInterval(() => {
      if (!this.isPlaying) return;

      if (this.ytReady && this.ytPlayer && this.ytPlayer.getCurrentTime) {
        try {
          const ytTime = this.ytPlayer.getCurrentTime();
          const ytDur = this.ytPlayer.getDuration();
          if (ytTime && ytTime > 0) {
            this.currentTime = ytTime;
            if (ytDur && ytDur > 0) this.duration = ytDur;
          } else {
            this.currentTime += 0.5;
          }
        } catch {
          this.currentTime += 0.5;
        }
      } else {
        this.currentTime += 0.5;
      }

      // Update remaining time for end_of_track sleep timer
      if (this.sleepTimerMode === 'end_of_track') {
        const left = Math.max(0, Math.round(this.duration - this.currentTime));
        this.sleepTimerSecondsRemaining = left;
        this.onSleepTimerTickCallback?.(left);
      }

      if (this.currentTime >= this.duration && this.duration > 0) {
        this.currentTime = this.duration;
        this.stopProgressTicker();
        this.isPlaying = false;
        this.onStateChangeCallback?.(false);

        if (this.sleepTimerMode === 'end_of_track') {
          this.sleepTimerMode = 'off';
          this.sleepTimerSecondsRemaining = null;
          this.onSleepTimerTickCallback?.(null);
          this.pause();
        } else {
          this.onTrackEndedCallback?.();
        }
      }

      this.onTimeUpdateCallback?.(this.currentTime, this.duration);
    }, 500);
  }

  private stopProgressTicker() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  // --- MediaSession API (Background audio & lockscreen controls) ---

  private updateMediaSession(track: Track) {
    if ('mediaSession' in navigator) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: track.title,
          artist: track.artist,
          album: track.album,
          artwork: [
            { src: track.coverUrl, sizes: '512x512', type: 'image/jpeg' },
            { src: track.coverUrl, sizes: '256x256', type: 'image/jpeg' },
          ],
        });

        navigator.mediaSession.setActionHandler('play', () => this.resume());
        navigator.mediaSession.setActionHandler('pause', () => this.pause());
        navigator.mediaSession.setActionHandler('seekto', (details) => {
          if (details.seekTime !== undefined) this.seek(details.seekTime);
        });
        navigator.mediaSession.setActionHandler('seekbackward', (details) => {
          this.seek(this.currentTime - (details.seekOffset || 10));
        });
        navigator.mediaSession.setActionHandler('seekforward', (details) => {
          this.seek(this.currentTime + (details.seekOffset || 10));
        });
      } catch (err) {
        console.warn('MediaSession handler error:', err);
      }
    }
  }

  // --- WakeLock API for battery-efficient sleep prevention ---

  private async requestWakeLock() {
    if ('wakeLock' in navigator) {
      try {
        if (!this.wakeLockSentinel) {
          this.wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
          this.wakeLockSentinel.addEventListener('release', () => {
            this.wakeLockSentinel = null;
          });
        }
      } catch {
        // WakeLock unsupported or rejected
      }
    }
  }

  public releaseWakeLock() {
    if (this.wakeLockSentinel) {
      this.wakeLockSentinel.release().catch(() => {});
      this.wakeLockSentinel = null;
    }
  }
}

export const audioEngine = new AudioEngine();
