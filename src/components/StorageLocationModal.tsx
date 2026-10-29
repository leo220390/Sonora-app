import React, { useState } from 'react';
import { 
  X, 
  Folder, 
  HardDrive, 
  DownloadCloud, 
  Check, 
  FileText, 
  Image as ImageIcon, 
  Sparkles,
  Settings
} from 'lucide-react';
import { StorageSettings, StorageDestination, DarkThemeConfig } from '../types/music';
import { storageService } from '../services/storageService';

interface StorageLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTheme: DarkThemeConfig;
  onSettingsSaved: (settings: StorageSettings) => void;
}

export const StorageLocationModal: React.FC<StorageLocationModalProps> = ({
  isOpen,
  onClose,
  activeTheme,
  onSettingsSaved,
}) => {
  const [settings, setSettings] = useState<StorageSettings>(() => storageService.getStorageSettings());
  const [isPickingDir, setIsPickingDir] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSelectFolder = async () => {
    setIsPickingDir(true);
    const chosenName = await storageService.pickCustomDirectory();
    setIsPickingDir(false);
    if (chosenName) {
      setSettings(prev => ({
        ...prev,
        destination: 'filesystem',
        folderName: chosenName,
      }));
    }
  };

  const handleSave = () => {
    storageService.saveStorageSettings(settings);
    onSettingsSaved(settings);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
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
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center text-black font-bold"
              style={{ backgroundColor: activeTheme.accentHex }}
            >
              <Folder className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Destino de Almacenamiento de Canciones</h3>
              <p className="text-xs text-slate-400">Elige dónde guardar tus canciones, álbumes y letras</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options */}
        <div className="mt-5 space-y-3">
          {/* Option 1: IndexedDB App Cache */}
          <div 
            onClick={() => setSettings(prev => ({ ...prev, destination: 'indexeddb' }))}
            className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
              settings.destination === 'indexeddb'
                ? 'border-emerald-500/50 bg-emerald-950/20'
                : 'border-white/5 hover:border-white/15 bg-white/5'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-black/40 text-emerald-400">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-semibold text-white block">Memoria Interna de Sonora (IndexedDB)</span>
                <span className="text-[11px] text-slate-400">
                  Ideal para teléfonos y modo offline. Carga ultra-rápida sin permisos de archivos.
                </span>
              </div>
            </div>
            {settings.destination === 'indexeddb' && (
              <div 
                className="w-6 h-6 rounded-full flex items-center justify-center text-black font-bold"
                style={{ backgroundColor: activeTheme.accentHex }}
              >
                <Check className="w-3.5 h-3.5" />
              </div>
            )}
          </div>

          {/* Option 2: Local Directory / SD Card */}
          <div 
            onClick={() => setSettings(prev => ({ ...prev, destination: 'filesystem' }))}
            className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
              settings.destination === 'filesystem'
                ? 'border-emerald-500/50 bg-emerald-950/20'
                : 'border-white/5 hover:border-white/15 bg-white/5'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-black/40 text-sky-400">
                <Folder className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-semibold text-white block">Carpeta de Disco / Tarjeta SD</span>
                <span className="text-[11px] text-slate-400">
                  Ubicación actual: <strong className="text-white font-mono">{settings.folderName}</strong>
                </span>
              </div>
            </div>
            {settings.destination === 'filesystem' && (
              <div 
                className="w-6 h-6 rounded-full flex items-center justify-center text-black font-bold"
                style={{ backgroundColor: activeTheme.accentHex }}
              >
                <Check className="w-3.5 h-3.5" />
              </div>
            )}
          </div>

          {settings.destination === 'filesystem' && (
            <div className="pl-4">
              <button
                type="button"
                onClick={handleSelectFolder}
                disabled={isPickingDir}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-white flex items-center gap-2 border border-white/10"
              >
                <Folder className="w-3.5 h-3.5 text-amber-400" />
                <span>{isPickingDir ? 'Seleccionando...' : 'Cambiar Carpeta de Destino...'}</span>
              </button>
            </div>
          )}

          {/* Option 3: Direct Downloads Folder */}
          <div 
            onClick={() => setSettings(prev => ({ ...prev, destination: 'downloads' }))}
            className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
              settings.destination === 'downloads'
                ? 'border-emerald-500/50 bg-emerald-950/20'
                : 'border-white/5 hover:border-white/15 bg-white/5'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-black/40 text-purple-400">
                <DownloadCloud className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-semibold text-white block">Descargas Directas del Navegador</span>
                <span className="text-[11px] text-slate-400">
                  Guarda archivos de música individuales y listas directamente en la carpeta Descargas.
                </span>
              </div>
            </div>
            {settings.destination === 'downloads' && (
              <div 
                className="w-6 h-6 rounded-full flex items-center justify-center text-black font-bold"
                style={{ backgroundColor: activeTheme.accentHex }}
              >
                <Check className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
        </div>

        {/* Toggles for Lyrics and Cover Art */}
        <div className="mt-5 p-3.5 rounded-xl bg-white/5 border border-white/5 space-y-3">
          <span className="text-xs font-semibold text-white block">Opciones Adicionales de Descarga:</span>

          <label className="flex items-center justify-between text-xs cursor-pointer">
            <span className="flex items-center gap-2 text-slate-300">
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              Descargar letras sincronizadas (.LRC) de fuentes verificadas
            </span>
            <input
              type="checkbox"
              checked={settings.autoDownloadLyrics}
              onChange={(e) => setSettings(prev => ({ ...prev, autoDownloadLyrics: e.target.checked }))}
              className="rounded accent-emerald-500 w-4 h-4 cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between text-xs cursor-pointer">
            <span className="flex items-center gap-2 text-slate-300">
              <ImageIcon className="w-3.5 h-3.5 text-sky-400" />
              Guardar carátulas en Ultra HD / Portadas originales (.JPG)
            </span>
            <input
              type="checkbox"
              checked={settings.autoDownloadArtwork}
              onChange={(e) => setSettings(prev => ({ ...prev, autoDownloadArtwork: e.target.checked }))}
              className="rounded accent-emerald-500 w-4 h-4 cursor-pointer"
            />
          </label>
        </div>

        {/* Footer */}
        <div className="mt-5 flex items-center justify-between">
          <span className="text-xs text-emerald-400 font-medium">
            {savedSuccess ? '¡Preferencias de almacenamiento guardadas!' : ''}
          </span>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-lg text-xs font-semibold text-black bg-white hover:bg-slate-200 transition-colors shadow-lg active:scale-95"
          >
            Guardar Configuración
          </button>
        </div>
      </div>
    </div>
  );
};
