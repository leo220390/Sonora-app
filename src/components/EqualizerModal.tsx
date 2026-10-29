import React, { useState } from 'react';
import { X, Sliders, RotateCcw, Volume2, Sparkles, Check } from 'lucide-react';
import { EQ_FREQUENCIES, EQ_PRESETS, audioEngine } from '../services/audioEngine';
import { DarkThemeConfig } from '../types/music';

interface EqualizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  gains: number[];
  onChangeGains: (gains: number[]) => void;
  activeTheme: DarkThemeConfig;
}

export const EqualizerModal: React.FC<EqualizerModalProps> = ({
  isOpen,
  onClose,
  gains,
  onChangeGains,
  activeTheme,
}) => {
  const [spatialPan, setSpatialPan] = useState(0);
  const [activePresetId, setActivePresetId] = useState<string>('bass-boost');

  if (!isOpen) return null;

  const handleBandChange = (index: number, val: number) => {
    const updated = [...gains];
    updated[index] = val;
    onChangeGains(updated);
    audioEngine.setEqualizerBand(index, val);
    setActivePresetId('custom');
  };

  const handleSelectPreset = (preset: typeof EQ_PRESETS[0]) => {
    onChangeGains(preset.gains);
    audioEngine.applyEqualizerPreset(preset.gains);
    setActivePresetId(preset.id);
  };

  const handleReset = () => {
    const flat = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    onChangeGains(flat);
    audioEngine.applyEqualizerPreset(flat);
    setActivePresetId('flat');
    setSpatialPan(0);
    audioEngine.setSpatialPanning(0);
  };

  const handlePanChange = (pan: number) => {
    setSpatialPan(pan);
    audioEngine.setSpatialPanning(pan);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl rounded-2xl border shadow-2xl p-6 relative overflow-hidden text-slate-100"
        style={{
          backgroundColor: activeTheme.bgHex === '#000000' ? '#0a0a0a' : activeTheme.surfaceHex,
          borderColor: activeTheme.borderHex,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center text-black font-bold"
              style={{ backgroundColor: activeTheme.accentHex }}
            >
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Ecualizador de Estudio (10 Bandas)</h3>
              <p className="text-xs text-slate-400">Ajuste de respuesta de frecuencia y espacialidad 3D</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors border border-white/10"
              title="Restablecer a plano"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restablecer</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Presets Row */}
        <div className="mt-4">
          <span className="text-xs text-slate-400 block mb-2 font-medium">Perfiles Predefinidos:</span>
          <div className="flex flex-wrap gap-1.5">
            {EQ_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handleSelectPreset(preset)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activePresetId === preset.id
                    ? 'text-black font-bold shadow-md'
                    : 'bg-white/5 hover:bg-white/10 text-slate-300'
                }`}
                style={activePresetId === preset.id ? { backgroundColor: activeTheme.accentHex } : {}}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        {/* 10-Band Sliders Grid */}
        <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/5">
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono mb-3">
            <span>+12 dB</span>
            <span className="text-slate-400">0 dB (Neutral)</span>
            <span>-12 dB</span>
          </div>

          <div className="grid grid-cols-10 gap-2 h-44 items-end">
            {EQ_FREQUENCIES.map((freq, index) => {
              const gain = gains[index] !== undefined ? gains[index] : 0;
              const freqLabel = freq >= 1000 ? `${freq / 1000}k` : `${freq}`;

              return (
                <div key={freq} className="flex flex-col items-center h-full justify-between">
                  {/* Gain readout */}
                  <span className="text-[10px] font-mono tabular-nums text-slate-300">
                    {gain > 0 ? `+${gain}` : `${gain}`}
                  </span>

                  {/* Vertical Slider */}
                  <div className="relative flex items-center justify-center flex-1 w-full my-2">
                    <input
                      type="range"
                      min={-12}
                      max={12}
                      step={1}
                      value={gain}
                      onChange={(e) => handleBandChange(index, parseInt(e.target.value))}
                      className="w-28 h-1 bg-slate-700/80 rounded-lg appearance-none cursor-pointer focus:outline-none -rotate-90 origin-center"
                      style={{
                        accentColor: activeTheme.accentHex,
                      }}
                    />
                  </div>

                  {/* Frequency label */}
                  <span className="text-[10px] font-mono text-slate-400 mt-1">
                    {freqLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3D Spatial Audio & Panning */}
        <div className="mt-5 p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Volume2 className="w-4 h-4 text-emerald-400" />
            <div>
              <span className="text-xs font-semibold text-white block">Posicionamiento Espacial Estéreo 3D</span>
              <span className="text-[11px] text-slate-400">Balance binaural panorámico L/R</span>
            </div>
          </div>

          <div className="flex items-center gap-2 w-40">
            <span className="text-[10px] text-slate-500 font-mono">L</span>
            <input
              type="range"
              min={-1}
              max={1}
              step={0.1}
              value={spatialPan}
              onChange={(e) => handlePanChange(parseFloat(e.target.value))}
              className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
              style={{ accentColor: activeTheme.accentHex }}
            />
            <span className="text-[10px] text-slate-500 font-mono">R</span>
          </div>
        </div>

        {/* Bottom Done */}
        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg text-xs font-semibold text-black bg-white hover:bg-slate-200 transition-colors"
          >
            Aplicar & Salir
          </button>
        </div>
      </div>
    </div>
  );
};
