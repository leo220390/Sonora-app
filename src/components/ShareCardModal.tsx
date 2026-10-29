import React, { useState } from 'react';
import { X, Share2, Copy, Check, QrCode, ExternalLink, Download } from 'lucide-react';
import { Track, DarkThemeConfig } from '../types/music';

interface ShareCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  track: Track | null;
  activeTheme: DarkThemeConfig;
}

export const ShareCardModal: React.FC<ShareCardModalProps> = ({
  isOpen,
  onClose,
  track,
  activeTheme,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !track) return null;

  const handleCopyLink = () => {
    const url = `${window.location.origin}?track=${track.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-sm rounded-2xl border shadow-2xl p-6 relative overflow-hidden text-slate-100"
        style={{
          backgroundColor: activeTheme.bgHex === '#000000' ? '#0a0a0a' : activeTheme.surfaceHex,
          borderColor: activeTheme.borderHex,
        }}
      >
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Compartir en Redes</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/10 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Story Style Social Card Preview */}
        <div className="mt-4 p-4 rounded-xl bg-gradient-to-b from-slate-900 to-black border border-white/10 flex flex-col items-center text-center shadow-inner">
          <div className="relative w-44 h-44 rounded-xl overflow-hidden shadow-2xl border border-white/10 mb-4">
            <img 
              src={track.coverUrl} 
              alt={track.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>

          <h4 className="text-base font-bold text-white truncate max-w-[240px]">{track.title}</h4>
          <p className="text-xs text-slate-400 truncate max-w-[220px] mt-0.5">{track.artist}</p>

          {/* Fake audio waveform bars */}
          <div className="flex items-center gap-1 my-3 h-5">
            {[40, 75, 100, 60, 30, 85, 95, 50, 80, 65, 45, 90, 70, 35].map((h, i) => (
              <div 
                key={i} 
                className="w-1 rounded-full"
                style={{
                  height: `${h}%`,
                  backgroundColor: activeTheme.accentHex,
                }}
              />
            ))}
          </div>

          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
            <QrCode className="w-3.5 h-3.5 text-white" />
            <span>Escúchalo en Sonora Player · 320 kbps</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 space-y-2">
          <button
            onClick={handleCopyLink}
            className="w-full py-2 px-3 rounded-lg text-xs font-semibold text-black bg-white hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? '¡Enlace Copiado!' : 'Copiar Enlace'}</span>
          </button>

          <a
            href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`¡Escucha "${track.title}" de ${track.artist} en Sonora Music Player! ` + window.location.href)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2 px-3 rounded-lg text-xs font-medium bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/50 border border-emerald-500/30 transition-colors flex items-center justify-center gap-2"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Compartir en WhatsApp</span>
          </a>
        </div>
      </div>
    </div>
  );
};
