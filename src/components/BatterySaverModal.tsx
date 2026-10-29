import React from 'react';
import { 
  X, 
  Zap, 
  BatteryCharging, 
  Battery, 
  ShieldCheck, 
  Monitor, 
  Activity, 
  Check, 
  Sparkles, 
  Clock 
} from 'lucide-react';
import { BatteryState, DarkThemeConfig } from '../types/music';

interface BatterySaverModalProps {
  isOpen: boolean;
  onClose: () => void;
  batteryState: BatteryState;
  onUpdateBatteryState: (updates: Partial<BatteryState>) => void;
  activeTheme: DarkThemeConfig;
}

export const BatterySaverModal: React.FC<BatterySaverModalProps> = ({
  isOpen,
  onClose,
  batteryState,
  onUpdateBatteryState,
  activeTheme,
}) => {
  if (!isOpen) return null;

  const pct = Math.round(batteryState.level * 100);
  const estimatedHours = batteryState.saverActive
    ? Math.round((batteryState.level * 14) * 10) / 10
    : Math.round((batteryState.level * 6) * 10) / 10;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg rounded-2xl border shadow-2xl p-6 relative overflow-hidden text-slate-100"
        style={{
          backgroundColor: activeTheme.bgHex === '#000000' ? '#0a0a0a' : activeTheme.surfaceHex,
          borderColor: activeTheme.borderHex,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Centro de Optimización de Batería</h3>
              <p className="text-xs text-slate-400">Diseñado para sesiones de reproducción prolongadas</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Battery Status Gauge Card */}
        <div className="mt-5 p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl font-bold font-mono text-white flex items-center gap-2">
              {batteryState.isCharging ? (
                <BatteryCharging className="w-7 h-7 text-emerald-400 animate-pulse" />
              ) : (
                <Battery className="w-7 h-7 text-amber-400" />
              )}
              <span>{pct}%</span>
            </div>
            <div className="text-xs text-slate-400">
              <span className="block text-slate-200 font-medium">
                {batteryState.isCharging ? 'Cargando dispositivo' : 'Uso de batería'}
              </span>
              <span className="flex items-center gap-1 text-[11px] font-mono">
                <Clock className="w-3 h-3 text-slate-500" />
                ~{estimatedHours} horas de música estimadas
              </span>
            </div>
          </div>

          <button
            onClick={() => onUpdateBatteryState({ saverActive: !batteryState.saverActive })}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              batteryState.saverActive
                ? 'bg-amber-400 text-black shadow-lg shadow-amber-500/20 font-bold'
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
          >
            {batteryState.saverActive ? 'Ahorro Activado' : 'Activar Ahorro'}
          </button>
        </div>

        {/* Modular Toggles */}
        <div className="mt-5 space-y-3">
          {/* OLED Pitch Black Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
            <div className="flex items-start gap-2.5">
              <Monitor className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              <div>
                <span className="text-xs font-medium text-white block">Negro Puro OLED (#000000)</span>
                <span className="text-[11px] text-slate-400">Apaga los píxeles físicamente en pantallas OLED para ahorrar hasta un 60%</span>
              </div>
            </div>
            <button
              onClick={() => onUpdateBatteryState({ oledPitchBlack: !batteryState.oledPitchBlack })}
              className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${
                batteryState.oledPitchBlack ? 'bg-emerald-500' : 'bg-slate-700'
              }`}
            >
              <div 
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  batteryState.oledPitchBlack ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Low Power Audio DSP & Throttled Visualizer */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
            <div className="flex items-start gap-2.5">
              <Activity className="w-4 h-4 text-sky-400 mt-0.5 shrink-0" />
              <div>
                <span className="text-xs font-medium text-white block">Visualizador a 15 FPS / Modo Eco</span>
                <span className="text-[11px] text-slate-400">Reduce drásticamente el uso de CPU y aceleración gráfica</span>
              </div>
            </div>
            <button
              onClick={() => onUpdateBatteryState({ saverActive: !batteryState.saverActive })}
              className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${
                batteryState.saverActive ? 'bg-emerald-500' : 'bg-slate-700'
              }`}
            >
              <div 
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  batteryState.saverActive ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Wake Lock */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
              <div>
                <span className="text-xs font-medium text-white block">WakeLock de Audio en Segundo Plano</span>
                <span className="text-[11px] text-slate-400">Mantiene la música sonando sin interrupciones del sistema operativo</span>
              </div>
            </div>
            <button
              onClick={() => onUpdateBatteryState({ screenWakeLock: !batteryState.screenWakeLock })}
              className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${
                batteryState.screenWakeLock ? 'bg-emerald-500' : 'bg-slate-700'
              }`}
            >
              <div 
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  batteryState.screenWakeLock ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Energy saving tip */}
        <div className="mt-4 p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/20 text-xs text-emerald-300 flex items-start gap-2">
          <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            <strong>Consejo Pro:</strong> Reproducir canciones descargadas en modo Offline consume hasta un <strong>70% menos batería</strong> que hacer streaming por 4G/5G.
          </span>
        </div>

        {/* Footer */}
        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium text-black bg-white hover:bg-slate-200 transition-colors"
          >
            Guardar & Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
