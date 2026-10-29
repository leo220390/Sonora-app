import React, { useState } from 'react';
import { 
  Sparkles, 
  X, 
  Play, 
  Plus, 
  Flame, 
  Moon, 
  Zap, 
  Compass, 
  Coffee, 
  Send, 
  Radio, 
  Check, 
  Music,
  ArrowRight
} from 'lucide-react';
import { Track, Playlist, DarkThemeConfig, AiSessionResponse, AiRecommendedTrack } from '../types/music';
import { audioEngine } from '../services/audioEngine';
import { storageService } from '../services/storageService';
import { searchOnlineSources } from '../services/catalogService';

interface AiDjModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTheme: DarkThemeConfig;
  currentTrack: Track | null;
  listeningHistory: Track[];
  onPlayTrack: (track: Track) => void;
  onCreatePlaylist: (title: string, desc: string, trackIds: string[]) => void;
}

export const AiDjModal: React.FC<AiDjModalProps> = ({
  isOpen,
  onClose,
  activeTheme,
  currentTrack,
  listeningHistory,
  onPlayTrack,
  onCreatePlaylist,
}) => {
  const [customPrompt, setCustomPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [aiSession, setAiSession] = useState<AiSessionResponse | null>(null);
  const [isSavedAsPlaylist, setIsSavedAsPlaylist] = useState(false);

  if (!isOpen) return null;

  const quickVibes = [
    { label: 'Máxima energía para entrenar', icon: Flame, prompt: 'Música de alta energía, BPM elevado y beats potentes para entrenar en el gimnasio' },
    { label: 'Concentración profunda & Lo-Fi', icon: Moon, prompt: 'Música instrumental relajante, Lo-Fi y piano suave para estudiar y concentrarse sin distraerse' },
    { label: 'Fiesta y ritmo urbano latino', icon: Zap, prompt: 'Éxitos de reggaeton y pop urbano latino modernos para bailar y animar una fiesta con amigos' },
    { label: 'Descubrimiento basado en mi historial', icon: Compass, prompt: 'Recomiéndame canciones similares al estilo de lo que he estado escuchando recientemente en Sonora' },
    { label: 'Vibra acústica y café', icon: Coffee, prompt: 'Música acústica indie suave, guitarras cálidas y voces dulces para relajarse en una tarde de café' },
  ];

  const handleGenerate = async (promptText: string) => {
    if (!promptText.trim()) return;
    setIsLoading(true);
    setIsSavedAsPlaylist(false);
    audioEngine.playHapticTransition('click');

    try {
      const response = await fetch('/api/ai/dj', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptText,
          vibe: promptText,
          currentTrack: currentTrack ? { title: currentTrack.title, artist: currentTrack.artist } : null,
          history: listeningHistory.slice(0, 5).map(t => ({ title: t.title, artist: t.artist })),
        }),
      });

      if (!response.ok) {
        throw new Error('Error al conectar con Sonora AI');
      }

      const data: AiSessionResponse = await response.json();
      setAiSession(data);
      audioEngine.playHapticTransition('success');
    } catch (err) {
      console.warn('Error en AI DJ:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayAiTrack = async (item: AiRecommendedTrack) => {
    audioEngine.playHapticTransition('click');
    // Search online YouTube source for this track
    try {
      const results = await searchOnlineSources(`${item.artist} ${item.title}`);
      if (results.length > 0) {
        onPlayTrack(results[0]);
        return;
      }
    } catch {}

    // Fallback pseudo track
    const fallbackTrack: Track = {
      id: `ai-yt-${Date.now()}`,
      title: item.title,
      artist: item.artist,
      album: 'Sonora AI DJ Mix',
      duration: 210,
      coverUrl: `https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80`,
      youtubeId: '4xDzrJKXOOY',
      source: 'youtube',
      genre: (item.genre as any) || 'Pop',
      mood: (item.mood as any) || 'Energético',
      bpm: item.bpm || 120,
      year: 2026,
      tags: ['#ai', '#gemini', '#curated'],
      quality: '320k',
      bitrate: '320 kbps Sonora AI Stream',
      playCount: 18000,
      sizeMb: 8.4,
      description: item.why,
    };
    onPlayTrack(fallbackTrack);
  };

  const handlePlayEntireMix = async () => {
    if (!aiSession || !aiSession.recommendedTracks || aiSession.recommendedTracks.length === 0) return;
    const first = aiSession.recommendedTracks[0];
    await handlePlayAiTrack(first);
  };

  const handleSaveMixAsPlaylist = () => {
    if (!aiSession) return;
    audioEngine.playHapticTransition('download');
    onCreatePlaylist(
      aiSession.playlistTitle,
      `Curada por Sonora AI: ${aiSession.vibeDescription}`,
      []
    );
    setIsSavedAsPlaylist(true);
    storageService.sendNotification(
      'Playlist IA Guardada',
      `"${aiSession.playlistTitle}" añadida a tu biblioteca.`
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl rounded-3xl border shadow-2xl p-5 sm:p-8 relative overflow-hidden text-slate-100 max-h-[92vh] flex flex-col"
        style={{
          backgroundColor: '#121212',
          backgroundImage: 'radial-gradient(circle at 10% 10%, rgba(29, 185, 84, 0.15), transparent 45%), radial-gradient(circle at 90% 90%, rgba(59, 130, 246, 0.12), transparent 45%)',
          borderColor: 'rgba(255, 255, 255, 0.15)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-gradient-to-tr from-[#1DB954] to-emerald-400 text-black font-black shadow-lg">
              <Sparkles className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  Sonora AI DJ & Curador
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-emerald-300 border border-emerald-400/30">
                  Gemini Flash 3.8
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Pídele cualquier vibra en lenguaje natural y la IA creará tu sesión al instante
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              audioEngine.playHapticTransition('click');
              onClose();
            }}
            className="p-2 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto py-5 space-y-6 no-scrollbar">

          {/* Prompt Input Form */}
          <div className="space-y-3">
            <div className="relative flex items-center">
              <input
                type="text"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleGenerate(customPrompt);
                }}
                placeholder="¿Qué te gustaría escuchar hoy? Ej. 'Synthwave retro para conducir de noche'..."
                className="w-full pl-4 pr-12 py-3.5 rounded-2xl bg-[#181818] border border-white/10 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#1DB954] shadow-inner"
              />
              <button
                type="button"
                onClick={() => handleGenerate(customPrompt)}
                disabled={isLoading || !customPrompt.trim()}
                className="absolute right-2 p-2 rounded-xl bg-[#1DB954] text-black font-bold hover:bg-[#1ed760] transition-transform active:scale-95 disabled:opacity-40 disabled:hover:bg-[#1DB954]"
                title="Generar recomendación con IA"
              >
                <Send className="w-4 h-4 fill-current" />
              </button>
            </div>

            {/* Quick Vibe Chips */}
            <div className="flex flex-wrap gap-2 pt-1">
              {quickVibes.map((vibe, idx) => {
                const Icon = vibe.icon;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setCustomPrompt(vibe.prompt);
                      handleGenerate(vibe.prompt);
                    }}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/15 text-neutral-300 hover:text-white transition-all flex items-center gap-1.5 active:scale-95"
                  >
                    <Icon className="w-3.5 h-3.5 text-[#1DB954]" />
                    <span>{vibe.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="py-12 flex flex-col items-center justify-center space-y-4">
              <div className="relative w-14 h-14">
                <div className="absolute inset-0 rounded-full border-4 border-[#1DB954]/20 animate-ping" />
                <div className="w-14 h-14 rounded-full border-4 border-[#1DB954] border-t-transparent animate-spin" />
              </div>
              <p className="text-sm font-semibold text-white">Sonora AI DJ está mezclando tu sesión...</p>
              <p className="text-xs text-neutral-400">Analizando el ritmo, armonía y gustos para la mejor experiencia.</p>
            </div>
          )}

          {/* AI Result Card */}
          {!isLoading && aiSession && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* Header Box */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/40 to-slate-900/60 border border-emerald-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 animate-pulse" />
                    Sesión Generada por IA
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePlayEntireMix}
                      className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#1DB954] text-black hover:bg-[#1ed760] transition-all flex items-center gap-1.5 active:scale-95 shadow-md"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Reproducir Mix</span>
                    </button>

                    <button
                      onClick={handleSaveMixAsPlaylist}
                      disabled={isSavedAsPlaylist}
                      className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-all flex items-center gap-1.5 border border-white/10 active:scale-95"
                    >
                      {isSavedAsPlaylist ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-[#1DB954]" />
                          <span>Guardada</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>Guardar Playlist</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <h4 className="text-xl font-black text-white">{aiSession.playlistTitle}</h4>
                <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                  {aiSession.vibeDescription}
                </p>
              </div>

              {/* Recommended Tracks List */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  Pistas seleccionadas para ti ({aiSession.recommendedTracks.length})
                </span>

                <div className="space-y-1.5">
                  {aiSession.recommendedTracks.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-2xl bg-[#181818] hover:bg-white/10 border border-white/5 transition-all group"
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-3">
                        <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center shrink-0 font-mono text-xs font-bold text-neutral-400 group-hover:text-white">
                          {idx + 1}
                        </div>
                        <div className="min-w-0">
                          <h5 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-[#1DB954] transition-colors">
                            {item.title}
                          </h5>
                          <p className="text-[11px] text-neutral-400 truncate">
                            {item.artist} · <span className="text-neutral-500">{item.genre}</span>
                          </p>
                          <p className="text-[10px] text-emerald-400/90 mt-0.5 line-clamp-1 italic">
                            💡 {item.why}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handlePlayAiTrack(item)}
                        className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#1DB954] hover:text-black text-white flex items-center justify-center shrink-0 transition-all active:scale-95 shadow"
                        title={`Reproducir ${item.title}`}
                      >
                        <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Initial State / Intro if no session yet */}
          {!isLoading && !aiSession && (
            <div className="p-8 rounded-3xl bg-[#181818]/70 border border-white/5 text-center space-y-3">
              <Sparkles className="w-12 h-12 text-[#1DB954] mx-auto animate-pulse" />
              <h4 className="text-base font-bold text-white">Tu Curador Musical Personal</h4>
              <p className="text-xs text-neutral-400 max-w-md mx-auto leading-relaxed">
                Selecciona uno de los atajos superiores o escribe con tus propias palabras qué vibra deseas. Sonora AI DJ encontrará los mejores temas en la inmensa biblioteca de YouTube Music para ti.
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
