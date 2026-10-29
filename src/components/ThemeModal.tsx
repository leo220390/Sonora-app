import React from 'react';
import { X, Check, Moon, Zap, Sparkles } from 'lucide-react';
import { DARK_THEMES } from '../utils/themePresets';
import { DarkThemeConfig, DarkThemeId } from '../types/music';

interface ThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeThemeId: DarkThemeId;
  onSelectTheme: (id: DarkThemeId) => void;
  activeTheme: DarkThemeConfig;
}

export const ThemeModal: React.FC<ThemeModalProps> = ({
  isOpen,
  onClose,
  activeThemeId,
  onSelectTheme,
  activeTheme,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg rounded-2xl border shadow-2xl p-6 relative overflow-hidden text-slate-100"
        style={{
          backgroundColor: activeTheme.bgHex === '#000000' ? '#0a0a0a' : activeTheme.surfaceHex,
          borderColor: activeTheme.borderHex,
        }}
      >
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white">
              <Moon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Modo Oscuro Personalizado</h3>
              <p className="text-xs text-slate-400">Optimizado para descanso visual y eficiencia energética</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Theme List */}
        <div className="mt-5 space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
          {Object.values(DARK_THEMES).map((theme) => {
            const isSelected = activeThemeId === theme.id;
            return (
              <div
                key={theme.id}
                onClick={() => onSelectTheme(theme.id)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                  isSelected ? 'border-white/40 ring-1 ring-white/30' : 'border-white/10 hover:border-white/20'
                }`}
                style={{ backgroundColor: theme.surfaceHex }}
              >
                <div className="flex items-center gap-3">
                  {/* Swatch color circles */}
                  <div className="flex items-center -space-x-1.5 shrink-0">
                    <div 
                      className="w-5 h-5 rounded-full border border-white/20"
                      style={{ backgroundColor: theme.bgHex }}
                    />
                    <div 
                      className="w-5 h-5 rounded-full border border-white/20"
                      style={{ backgroundColor: theme.accentHex }}
                    />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">{theme.name}</span>
                      {theme.id === 'oled' && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 font-mono font-medium">
                          0W Batería
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{theme.description}</p>
                  </div>
                </div>

                {isSelected && (
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center text-black font-bold shrink-0 ml-2"
                    style={{ backgroundColor: theme.accentHex }}
                  >
                    <Check className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-black bg-white hover:bg-slate-200 transition-colors"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
};
