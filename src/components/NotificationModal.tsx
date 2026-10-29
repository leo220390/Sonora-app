import React, { useState } from 'react';
import { X, Bell, Clock, Sparkles, Check, Send } from 'lucide-react';
import { DarkThemeConfig } from '../types/music';
import { storageService } from '../services/storageService';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTheme: DarkThemeConfig;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  activeTheme,
}) => {
  const [permissionGranted, setPermissionGranted] = useState(
    typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted'
  );
  const [dailyReminderEnabled, setDailyReminderEnabled] = useState(true);
  const [reminderTime, setReminderTime] = useState('09:00');
  const [sentTest, setSentTest] = useState(false);

  if (!isOpen) return null;

  const handleRequestPermission = async () => {
    const granted = await storageService.requestNotificationPermission();
    setPermissionGranted(granted);
    if (granted) {
      storageService.sendNotification(
        '¡Notificaciones activadas en Sonora!',
        'Recibirás recomendaciones diarias basadas en tu estado de ánimo y avisos de descargas offline.'
      );
    }
  };

  const handleSendTest = () => {
    storageService.sendNotification(
      'Sonora: Tu Momento Musical del Día',
      'Tienes 3 nuevas pistas Lo-Fi listas para tu sesión de concentración sin conexión.'
    );
    setSentTest(true);
    setTimeout(() => setSentTest(false), 2500);
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
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Recordatorios Diarios</h3>
              <p className="text-xs text-slate-400">Notificaciones push personalizadas</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Permission Request Banner */}
        {!permissionGranted ? (
          <div className="mt-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200">
            <p className="font-semibold text-white mb-1">Permiso del navegador requerido</p>
            <p className="text-slate-300 mb-3">
              Activa las notificaciones para que Sonora te recuerde tu dosis diaria de música y te avise cuando tus descargas offline estén listas.
            </p>
            <button
              onClick={handleRequestPermission}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-400 text-black hover:bg-amber-300 transition-colors"
            >
              Permitir Notificaciones
            </button>
          </div>
        ) : (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Notificaciones activas y autorizadas por el navegador.</span>
          </div>
        )}

        {/* Daily Schedule */}
        <div className="mt-4 space-y-3">
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-sky-400" />
              <div>
                <span className="text-xs font-semibold text-white block">Resumen Musical Diario</span>
                <span className="text-[11px] text-slate-400">Recomendaciones matutinas para arrancar el día</span>
              </div>
            </div>
            <button
              onClick={() => setDailyReminderEnabled(!dailyReminderEnabled)}
              className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${
                dailyReminderEnabled ? 'bg-emerald-500' : 'bg-slate-700'
              }`}
            >
              <div 
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  dailyReminderEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
            <span className="text-xs text-slate-300">Hora del recordatorio:</span>
            <input
              type="time"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
              className="px-2.5 py-1 rounded bg-black/40 text-xs text-white border border-white/10 font-mono focus:outline-none"
            />
          </div>
        </div>

        {/* Test Notification Trigger */}
        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={handleSendTest}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{sentTest ? '¡Notificación de prueba enviada!' : 'Probar notificación ahora'}</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-black bg-white hover:bg-slate-200 transition-colors"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
};
