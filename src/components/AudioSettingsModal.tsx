import React, { useState, useEffect } from 'react';
import { 
  X, 
  Moon, 
  Clock, 
  Gauge, 
  Radio, 
  Sparkles, 
  Check, 
  Sliders, 
  Zap,
  Volume2,
  Info
} from 'lucide-react';
import { DarkThemeConfig, StreamQualityLevel, SleepTimerOption } from '../types/music';
import { audioEngine } from '../services/audioEngine';
import { storageService } from '../services/storageService';

interface AudioSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTheme: DarkThemeConfig;
  onQualityChange?: (quality: StreamQualityLevel) => void;
  onCrossfadeChange?: (seconds: number) => void;
  sleepTimerRemaining: number | null;
}

export const AudioSettingsModal: React.FC<AudioSettingsModalProps> = ({
  isOpen,
  onClose,
  activeTheme,
  onQualityChange,
  onCrossfadeChange,
  sleepTimerRemaining,
}) => {
  const [crossfade, setCrossfade] = useState<number>(() => storageService.getCrossfade());
  const [quality, setQuality] = useState<StreamQualityLevel>(() => storageService.getAudioQuality());
  const [sleepOption, setSleepOption] = useState<SleepTimerOption>(() => storageService.getSleepTimerOption());
  const [activeTab, setActiveTab] = useState<'all' | 'crossfade' | 'timer' | 'quality'>('all');

  useEffect(() => {
    setCrossfade(storageService.getCrossfade());
    setQuality(storageService.getAudioQuality());
    setSleepOption(storageService.getSleepTimerOption());
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCrossfadeChange = (val: number) => {
    setCrossfade(val);
    audioEngine.setCrossfade(val);
    storageService.saveCrossfade(val);
    onCrossfadeChange?.(val);
  };

  const handleQualityChange = (q: StreamQualityLevel) => {
    audioEngine.playHapticTransition('toggle');
    setQuality(q);
    audioEngine.setQualityLevel(q);
    storageService.saveAudioQuality(q);
    onQualityChange?.(q);
  };

  const handleSelectSleepTimer = (option: SleepTimerOption) => {
    audioEngine.playHapticTransition('click');
    setSleepOption(option);
    storageService.saveSleepTimerOption(option);
    audioEngine.setSleepTimer(option, () => {
      storageService.sendNotification(
        'Apagado programado activado',
        'La música se ha pausado suavemente según tu temporizador de apagado.'
      );
    });
  };

  const formatTimerRemaining = (seconds: number | null): string => {
    if (seconds === null || seconds <= 0) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const timerOptions: { id: SleepTimerOption; label: string; desc: string }[] = [
    { id: 'off', label: 'Desactivado', desc: 'La música continuará sonando de forma ininterrumpida' },
    { id: '5', label: '5 minutos', desc: 'Ideal para una pequeña pausa' },
    { id: '15', label: '15 minutos', desc: 'Recomendado para siestas cortas' },
    { id: '30', label: '30 minutos', desc: 'Tiempo óptimo antes de dormir' },
    { id: '45', label: '45 minutos', desc: 'Relajación nocturna profunda' },
    { id: '60', label: '1 hora', desc: 'Sesión extendida para descansar' },
    { id: 'end_of_track', label: 'Al terminar la canción', desc: 'Pausa suave al finalizar la pista actual' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-xl rounded-3xl border shadow-2xl p-5 sm:p-7 relative overflow-hidden text-slate-100 max-h-[90vh] flex flex-col"
        style={{
          backgroundColor: '#121212',
          borderColor: 'rgba(255, 255, 255, 0.12)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div 
              className="w-9 h-9 rounded-xl flex items-center justify-center text-black font-bold shadow-lg"
              style={{ backgroundColor: activeTheme.accentHex }}
            >
              <Sliders className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Ajustes de Audio & Reproducción
              </h3>
              <p className="text-[11px] text-neutral-400">
                Crossfade, temporizador de apagado y calidad de sonido
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

        {/* Content scroll area */}
        <div className="flex-1 overflow-y-auto py-5 space-y-6 no-scrollbar">

          {/* SECTION 1: CALIDAD DE AUDIO (Alto, Medio, Bajo) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gauge className="w-4 h-4 text-[#1DB954]" />
                <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white">
                  Calidad de Audio Streaming
                </h4>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#1DB954]/10 text-[#1DB954] border border-[#1DB954]/30 font-bold">
                {quality === 'high' ? '320 kbps (HD)' : quality === 'medium' ? '192 kbps (Estándar)' : '96 kbps (Eco)'}
              </span>
            </div>

            <p className="text-xs text-neutral-400">
              Personaliza el nivel de resolución con el que se procesa el audio. El modo bajo reduce al máximo el consumo de batería y datos móviles.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              {/* ALTA */}
              <button
                type="button"
                onClick={() => handleQualityChange('high')}
                className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden group ${
                  quality === 'high'
                    ? 'bg-[#1DB954]/10 border-[#1DB954] text-white shadow-lg'
                    : 'bg-[#181818] border-white/5 hover:border-white/15 text-neutral-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-white">Alta Fidelidad</span>
                  {quality === 'high' && <Check className="w-4 h-4 text-[#1DB954]" />}
                </div>
                <div className="text-[11px] font-mono font-bold text-[#1DB954]">320 kbps · HD</div>
                <p className="text-[10px] text-neutral-400 mt-1 leading-tight">
                  Sonido de estudio nítido, graves profundos y respuesta completa.
                </p>
              </button>

              {/* MEDIA */}
              <button
                type="button"
                onClick={() => handleQualityChange('medium')}
                className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden group ${
                  quality === 'medium'
                    ? 'bg-[#1DB954]/10 border-[#1DB954] text-white shadow-lg'
                    : 'bg-[#181818] border-white/5 hover:border-white/15 text-neutral-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-white">Equilibrada</span>
                  {quality === 'medium' && <Check className="w-4 h-4 text-[#1DB954]" />}
                </div>
                <div className="text-[11px] font-mono font-bold text-sky-400">192 kbps · Óptima</div>
                <p className="text-[10px] text-neutral-400 mt-1 leading-tight">
                  Excelente claridad auditiva con streaming veloz y fluido.
                </p>
              </button>

              {/* BAJA */}
              <button
                type="button"
                onClick={() => handleQualityChange('low')}
                className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden group ${
                  quality === 'low'
                    ? 'bg-[#1DB954]/10 border-[#1DB954] text-white shadow-lg'
                    : 'bg-[#181818] border-white/5 hover:border-white/15 text-neutral-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-white">Ahorro Extremo</span>
                  {quality === 'low' && <Check className="w-4 h-4 text-[#1DB954]" />}
                </div>
                <div className="text-[11px] font-mono font-bold text-amber-400">96 kbps · Eco</div>
                <p className="text-[10px] text-neutral-400 mt-1 leading-tight">
                  Mínimo consumo de batería y datos móviles para conexión lenta.
                </p>
              </button>
            </div>
          </div>

          {/* SECTION 2: CROSSFADE (Transición Suave entre Canciones) */}
          <div className="space-y-3 p-4 rounded-2xl bg-[#181818] border border-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-[#1DB954]" />
                <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white">
                  Transición Crossfade
                </h4>
              </div>
              <span className="text-xs font-mono font-bold text-white px-2 py-0.5 rounded bg-white/10">
                {crossfade === 0 ? 'Desactivado' : `${crossfade} segundos`}
              </span>
            </div>

            <p className="text-xs text-neutral-400">
              Permite que las canciones se fundan entre sí sin silencios, desvaneciendo suavemente el final de la canción actual con el inicio de la siguiente.
            </p>

            <div className="space-y-2 pt-2">
              <input
                type="range"
                min={0}
                max={12}
                step={1}
                value={crossfade}
                onChange={(e) => handleCrossfadeChange(parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer focus:outline-none accent-[#1DB954]"
                style={{
                  background: `linear-gradient(to right, #1DB954 0%, #1DB954 ${(crossfade / 12) * 100}%, rgba(255,255,255,0.15) ${(crossfade / 12) * 100}%, rgba(255,255,255,0.15) 100%)`,
                }}
              />

              <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400">
                <span>0s (Corte limpio)</span>
                <span>3s</span>
                <span>6s (Recomendado)</span>
                <span>9s</span>
                <span>12s (Mezcla DJ)</span>
              </div>
            </div>
          </div>

          {/* SECTION 3: APAGADO PROGRAMADO (Sleep Timer) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Moon className="w-4 h-4 text-[#1DB954]" />
                <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white">
                  Temporizador de Apagado (Sleep Timer)
                </h4>
              </div>

              {sleepTimerRemaining !== null && sleepTimerRemaining > 0 && (
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-mono font-bold animate-pulse">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{formatTimerRemaining(sleepTimerRemaining)}</span>
                </div>
              )}
            </div>

            <p className="text-xs text-neutral-400">
              Detiene la reproducción de música automáticamente con un suave fundido de salida (fade-out) para que te duermas tranquilamente sin gastar batería.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
              {timerOptions.map((opt) => {
                const isSelected = sleepOption === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectSleepTimer(opt.id)}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'bg-[#1DB954]/15 border-[#1DB954] text-white shadow-md'
                        : 'bg-[#181818] border-white/5 hover:border-white/15 text-neutral-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-bold text-white">{opt.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#1DB954]" />}
                    </div>
                    <p className="text-[10px] text-neutral-400 line-clamp-1">{opt.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 text-[11px] text-neutral-400">
            <Zap className="w-3.5 h-3.5 text-[#1DB954]" />
            <span>Configuración sincronizada con tu dispositivo</span>
          </div>

          <button
            onClick={() => {
              audioEngine.playHapticTransition('success');
              onClose();
            }}
            className="px-5 py-2 rounded-full text-xs font-bold bg-[#1DB954] text-black hover:bg-[#1ed760] transition-transform active:scale-95 shadow-lg"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
};
