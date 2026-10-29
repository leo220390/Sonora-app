import React, { useState, useEffect } from 'react';
import { Mic, MicOff, X, Sparkles, Radio, ArrowRight } from 'lucide-react';
import { DarkThemeConfig } from '../types/music';
import { audioEngine } from '../services/audioEngine';

interface VoiceSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVoiceResult: (query: string) => void;
  activeTheme: DarkThemeConfig;
}

export const VoiceSearchModal: React.FC<VoiceSearchModalProps> = ({
  isOpen,
  onClose,
  onVoiceResult,
  activeTheme,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recognitionInstance, setRecognitionInstance] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      if (recognitionInstance) {
        try { recognitionInstance.stop(); } catch {}
      }
      setIsListening(false);
      setTranscript('');
      setErrorMessage(null);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setErrorMessage('El reconocimiento de voz no está habilitado en este navegador. Te recomendamos usar Google Chrome, Edge o Safari.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'es-ES';
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
        setErrorMessage(null);
        audioEngine.playHapticTransition('click');
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);

        if (event.results[0].isFinal) {
          audioEngine.playHapticTransition('success');
          setTimeout(() => {
            onVoiceResult(currentTranscript);
            onClose();
          }, 600);
        }
      };

      recognition.onerror = (err: any) => {
        console.warn('Voice recognition error:', err);
        setIsListening(false);
        if (err.error === 'not-allowed') {
          setErrorMessage('Permiso de micrófono denegado. Concede acceso al micrófono en tu navegador para buscar por voz.');
        } else {
          setErrorMessage('No pudimos escucharte con claridad. Toca el micrófono para intentar de nuevo.');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      setRecognitionInstance(recognition);
      recognition.start();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error inicializando micrófono');
      setIsListening(false);
    }

    return () => {
      if (recognitionInstance) {
        try { recognitionInstance.stop(); } catch {}
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRestartListening = () => {
    if (recognitionInstance) {
      try {
        setTranscript('');
        setErrorMessage(null);
        recognitionInstance.start();
      } catch {
        // restart
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md rounded-3xl border shadow-2xl p-6 sm:p-8 relative overflow-hidden text-center text-slate-100 flex flex-col items-center"
        style={{
          backgroundColor: '#121212',
          backgroundImage: 'radial-gradient(circle at 50% 20%, rgba(29, 185, 84, 0.2), transparent 70%)',
          borderColor: 'rgba(255, 255, 255, 0.15)',
        }}
      >
        {/* Close Button */}
        <button
          onClick={() => {
            audioEngine.playHapticTransition('click');
            onClose();
          }}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Pulsing Mic Circle */}
        <div className="relative my-6 flex items-center justify-center">
          {isListening && (
            <>
              <div className="absolute w-32 h-32 rounded-full bg-[#1DB954]/20 animate-ping" />
              <div className="absolute w-28 h-28 rounded-full bg-[#1DB954]/30 animate-pulse" />
            </>
          )}

          <button
            onClick={handleRestartListening}
            className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl ${
              isListening 
                ? 'bg-[#1DB954] text-black scale-105 shadow-[#1DB954]/40' 
                : 'bg-neutral-800 text-neutral-400 hover:text-white border border-white/10'
            }`}
          >
            {isListening ? (
              <Mic className="w-9 h-9 fill-current" />
            ) : (
              <MicOff className="w-9 h-9" />
            )}
          </button>
        </div>

        {/* State Label */}
        <h3 className="text-xl font-black text-white mb-1">
          {isListening ? 'Escuchando...' : transcript ? 'Buscando canción' : 'Toca para hablar'}
        </h3>

        {/* Transcript or Suggestion */}
        <div className="min-h-[50px] flex items-center justify-center px-4 mb-4">
          {transcript ? (
            <p className="text-base font-bold text-[#1DB954] bg-[#1DB954]/10 px-4 py-1.5 rounded-full border border-[#1DB954]/30">
              "{transcript}"
            </p>
          ) : errorMessage ? (
            <p className="text-xs text-rose-400 leading-relaxed max-w-xs">{errorMessage}</p>
          ) : (
            <p className="text-xs text-neutral-400 max-w-xs">
              Di el nombre de una canción, artista, género o vibra musical. Ej: <span className="text-neutral-200">"The Weeknd"</span> o <span className="text-neutral-200">"Música para dormir"</span>.
            </p>
          )}
        </div>

        {/* Soundwave animation bars */}
        {isListening && (
          <div className="flex items-center gap-1.5 h-8 mb-6">
            <span className="w-1.5 h-3 bg-[#1DB954] rounded-full animate-bounce [animation-delay:0.1s]" />
            <span className="w-1.5 h-7 bg-[#1DB954] rounded-full animate-bounce [animation-delay:0.2s]" />
            <span className="w-1.5 h-5 bg-[#1DB954] rounded-full animate-bounce [animation-delay:0.3s]" />
            <span className="w-1.5 h-8 bg-[#1DB954] rounded-full animate-bounce [animation-delay:0.15s]" />
            <span className="w-1.5 h-4 bg-[#1DB954] rounded-full animate-bounce [animation-delay:0.25s]" />
          </div>
        )}

        {/* Quick Suggestion Pills */}
        <div className="w-full pt-4 border-t border-white/10 space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block">
            Búsquedas populares sugeridas
          </span>
          <div className="flex flex-wrap justify-center gap-1.5">
            {['Bad Bunny', 'Queen', 'Lo-Fi Chill', 'Coldplay', 'Dua Lipa'].map((tag) => (
              <button
                key={tag}
                onClick={() => {
                  audioEngine.playHapticTransition('click');
                  onVoiceResult(tag);
                  onClose();
                }}
                className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white border border-white/5 transition-all"
              >
                "{tag}"
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
