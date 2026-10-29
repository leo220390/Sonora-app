import React, { useState } from 'react';
import { 
  X, 
  Cloud, 
  Share2, 
  Users, 
  Copy, 
  Check, 
  DownloadCloud, 
  UploadCloud, 
  User, 
  Key, 
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { UserProfile, DarkThemeConfig, Playlist } from '../types/music';
import { storageService } from '../services/storageService';

interface CollaborativeModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
  activeTheme: DarkThemeConfig;
  playlists: Playlist[];
  onReloadData: () => void;
}

export const CollaborativeModal: React.FC<CollaborativeModalProps> = ({
  isOpen,
  onClose,
  profile,
  onUpdateProfile,
  activeTheme,
  playlists,
  onReloadData,
}) => {
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [importToken, setImportToken] = useState('');
  const [importSuccess, setImportSuccess] = useState<boolean | null>(null);
  const [guestName, setGuestName] = useState(profile.name);
  const [isEditingName, setIsEditingName] = useState(false);

  if (!isOpen) return null;

  const handleCopyKey = () => {
    navigator.clipboard.writeText(profile.cloudSyncKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}?sync=${profile.cloudSyncKey}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSaveName = () => {
    const updated = { ...profile, name: guestName.trim() || 'Invitado Sonora' };
    storageService.saveUserProfile(updated);
    onUpdateProfile(updated);
    setIsEditingName(false);
  };

  const handleImportBundle = () => {
    if (!importToken.trim()) return;
    const ok = storageService.importCloudSyncBundle(importToken.trim());
    if (ok) {
      setImportSuccess(true);
      onReloadData();
      setTimeout(() => {
        setImportSuccess(null);
        setImportToken('');
      }, 2500);
    } else {
      setImportSuccess(false);
    }
  };

  const handleExportBundle = () => {
    const bundle = storageService.exportCloudSyncBundle();
    navigator.clipboard.writeText(bundle);
    alert('¡Copia de respaldo en la nube copiada al portapapeles! Puedes pegarla en cualquier otro dispositivo para sincronizar al instante.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg rounded-2xl border shadow-2xl p-6 relative overflow-hidden text-slate-100 max-h-[90vh] overflow-y-auto"
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
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Sincronización en la Nube & Amigos</h3>
              <p className="text-xs text-slate-400">Modo Invitado sin registro obligatorio</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Card */}
        <div className="mt-5 p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="w-11 h-11 rounded-full flex items-center justify-center text-base font-bold text-black shrink-0"
              style={{ backgroundColor: activeTheme.accentHex }}
            >
              {profile.name.charAt(0).toUpperCase()}
            </div>
            <div>
              {isEditingName ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="px-2 py-0.5 rounded bg-black/40 text-xs text-white border border-white/20 focus:outline-none"
                    placeholder="Tu alias musical"
                  />
                  <button
                    onClick={handleSaveName}
                    className="px-2 py-0.5 rounded bg-emerald-500 text-black text-xs font-semibold"
                  >
                    Guardar
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold text-white">{profile.name}</span>
                  <button 
                    onClick={() => setIsEditingName(true)}
                    className="text-[11px] text-slate-400 hover:text-white underline ml-1"
                  >
                    Editar
                  </button>
                </div>
              )}
              <span className="text-[11px] text-slate-400 block mt-0.5">
                Sesión Invitada Activa · {profile.totalListeningMinutes} min reproducidos
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Nube Lista</span>
          </div>
        </div>

        {/* Cloud Sync Key Card */}
        <div className="mt-5 space-y-3">
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-white flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-400" />
                Tu Código de Sincronización Personal
              </span>
              <button
                onClick={handleCopyKey}
                className="flex items-center gap-1 text-xs text-slate-300 hover:text-white"
              >
                {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey ? 'Copiado' : 'Copiar clave'}</span>
              </button>
            </div>
            <div className="p-2 rounded bg-black/50 font-mono text-center text-sm font-bold text-emerald-400 tracking-widest border border-white/5">
              {profile.cloudSyncKey}
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Ingresa este código en cualquier otro teléfono o navegador para vincular automáticamente tus listas, temas y pistas favoritas.
            </p>
          </div>

          {/* Quick link */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="flex-1 py-2 px-3 rounded-lg text-xs font-medium bg-white/10 hover:bg-white/15 text-white flex items-center justify-center gap-2 transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{copiedLink ? '¡Enlace directo copiado!' : 'Copiar enlace rápido para compartir'}</span>
            </button>

            <button
              onClick={handleExportBundle}
              className="py-2 px-3 rounded-lg text-xs font-medium bg-white/10 hover:bg-white/15 text-white flex items-center gap-1.5 transition-colors"
              title="Descargar respaldo completo"
            >
              <DownloadCloud className="w-3.5 h-3.5" />
              <span>Exportar</span>
            </button>
          </div>
        </div>

        {/* Collaborative Playlist Friends */}
        <div className="mt-5 p-3.5 rounded-xl bg-white/5 border border-white/5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-white flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-sky-400" />
              Listas Colaborativas con Amigos
            </span>
            <span className="text-[11px] text-slate-400">Sala en Vivo</span>
          </div>

          <div className="space-y-2 mt-2">
            <div className="flex items-center justify-between text-xs p-2 rounded bg-black/30 border border-white/5">
              <span className="text-white font-medium">Sesión Compartida: Amigos Sonora</span>
              <span className="text-[11px] text-emerald-400 font-mono">4 Colaboradores</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <div className="flex -space-x-2">
                <div className="w-6 h-6 rounded-full bg-emerald-500 text-black font-bold flex items-center justify-center text-[10px]">T</div>
                <div className="w-6 h-6 rounded-full bg-sky-500 text-black font-bold flex items-center justify-center text-[10px]">C</div>
                <div className="w-6 h-6 rounded-full bg-amber-500 text-black font-bold flex items-center justify-center text-[10px]">S</div>
                <div className="w-6 h-6 rounded-full bg-purple-500 text-black font-bold flex items-center justify-center text-[10px]">L</div>
              </div>
              <span className="text-[11px]">Cualquiera con el código puede añadir y ordenar canciones.</span>
            </div>
          </div>
        </div>

        {/* Restore from Another Device */}
        <div className="mt-5 p-3.5 rounded-xl bg-white/5 border border-white/5">
          <span className="text-xs font-semibold text-white block mb-2 flex items-center gap-1.5">
            <UploadCloud className="w-3.5 h-3.5 text-emerald-400" />
            Restaurar o Importar desde Otro Dispositivo
          </span>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={importToken}
              onChange={(e) => setImportToken(e.target.value)}
              placeholder="Pega aquí el código o respaldo..."
              className="flex-1 px-3 py-1.5 rounded-lg bg-black/40 text-xs text-white border border-white/10 focus:outline-none focus:border-emerald-500"
            />
            <button
              onClick={handleImportBundle}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-black bg-white hover:bg-slate-200 transition-colors"
            >
              Importar
            </button>
          </div>
          {importSuccess === true && (
            <p className="text-xs text-emerald-400 mt-1.5">¡Biblioteca sincronizada con éxito!</p>
          )}
          {importSuccess === false && (
            <p className="text-xs text-rose-400 mt-1.5">Código no válido o dañado.</p>
          )}
        </div>

        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-black bg-white hover:bg-slate-200 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
