import React, { useState } from 'react';
import { X, Cast, Tv, Laptop, Radio, Headphones, Check, Sparkles, Volume2 } from 'lucide-react';
import { SmartDevice, DarkThemeConfig } from '../types/music';

interface DeviceConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTheme: DarkThemeConfig;
}

const INITIAL_DEVICES: SmartDevice[] = [
  {
    id: 'dev-1',
    name: 'Este Navegador (Sonora Web Engine)',
    type: 'browser',
    isConnected: true,
    status: 'Reproduciendo en calidad FLAC / 320k',
    latencyMs: 12,
    iconName: 'Laptop',
  },
  {
    id: 'dev-2',
    name: 'Smart TV Salón (Chromecast Ultra)',
    type: 'tv',
    isConnected: false,
    status: 'Disponible en red Wi-Fi 5GHz',
    latencyMs: 45,
    iconName: 'Tv',
  },
  {
    id: 'dev-3',
    name: 'Altavoz Inteligente (Nest Audio Studio)',
    type: 'speaker',
    isConnected: false,
    status: 'En reposo · Control por voz listo',
    latencyMs: 28,
    iconName: 'Radio',
  },
  {
    id: 'dev-4',
    name: 'Auriculares Hi-Fi Bluetooth (LDAC)',
    type: 'headphones',
    isConnected: false,
    status: 'Emparejado · Batería 88%',
    latencyMs: 35,
    iconName: 'Headphones',
  },
];

export const DeviceConnectModal: React.FC<DeviceConnectModalProps> = ({
  isOpen,
  onClose,
  activeTheme,
}) => {
  const [devices, setDevices] = useState<SmartDevice[]>(INITIAL_DEVICES);
  const [switchingId, setSwitchingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectDevice = (id: string) => {
    setSwitchingId(id);
    setTimeout(() => {
      setDevices(prev =>
        prev.map(d => ({
          ...d,
          isConnected: d.id === id,
          status: d.id === id ? 'Reproduciendo audio sincronizado' : 'Conectado · Listo',
        }))
      );
      setSwitchingId(null);
    }, 600);
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'tv': return <Tv className="w-5 h-5 text-sky-400" />;
      case 'speaker': return <Radio className="w-5 h-5 text-amber-400" />;
      case 'headphones': return <Headphones className="w-5 h-5 text-purple-400" />;
      default: return <Laptop className="w-5 h-5 text-emerald-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md rounded-2xl border shadow-2xl p-6 relative overflow-hidden text-slate-100"
        style={{
          backgroundColor: activeTheme.bgHex === '#000000' ? '#0a0a0a' : activeTheme.surfaceHex,
          borderColor: activeTheme.borderHex,
        }}
      >
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center text-black font-bold"
              style={{ backgroundColor: activeTheme.accentHex }}
            >
              <Cast className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Aura Connect</h3>
              <p className="text-xs text-slate-400">Transmite a dispositivos inteligentes de tu hogar</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Devices List */}
        <div className="mt-5 space-y-2.5">
          {devices.map((device) => {
            const isSwitching = switchingId === device.id;

            return (
              <div
                key={device.id}
                onClick={() => handleSelectDevice(device.id)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                  device.isConnected 
                    ? 'border-emerald-500/40 bg-emerald-950/20' 
                    : 'border-white/5 hover:border-white/15 bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-black/30 border border-white/5">
                    {getDeviceIcon(device.type)}
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-white block">{device.name}</span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      {isSwitching ? 'Transfiriendo señal de audio...' : device.status}
                    </span>
                  </div>
                </div>

                <div>
                  {device.isConnected ? (
                    <div 
                      className="w-6 h-6 rounded-full flex items-center justify-center text-black font-bold"
                      style={{ backgroundColor: activeTheme.accentHex }}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-500 font-mono">
                      {device.latencyMs}ms
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Info */}
        <div className="mt-4 p-3 rounded-lg bg-white/5 text-xs text-slate-400 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Soporta protocolos Google Cast, AirPlay 2, Spotify Connect y Bluetooth LDAC sin pérdida.</span>
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
