import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PeriodonState } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, 
  X, 
  Volume2, 
  VolumeX, 
  ChevronRight, 
  ChevronLeft, 
  RotateCcw,
  Sparkles,
  Mic,
  MicOff,
  Radio,
  Keyboard
} from 'lucide-react';

interface FastProbingBarProps {
  isActive: boolean;
  onClose: () => void;
  periodontogram: Record<number, PeriodonState>;
  onUpdatePeriodontogram: (updated: Record<number, PeriodonState>) => void;
}

// All FDI adult teeth in standard probing sequence
const PROBING_SEQUENCE = [
  // Upper Right (18 to 11)
  18, 17, 16, 15, 14, 13, 12, 11,
  // Upper Left (21 to 28)
  21, 22, 23, 24, 25, 26, 27, 28,
  // Lower Left (38 to 31)
  38, 37, 36, 35, 34, 33, 32, 31,
  // Lower Right (41 to 48)
  41, 42, 43, 44, 45, 46, 47, 48
];

type ArchAspect = 'vestibular' | 'palatino';
type SitePos = 'mesial' | 'central' | 'distal';
type ActiveMetric = 'pocket' | 'recess';

// Spanish number words mapping for high robustness
const SPANISH_NUM_MAP: Record<string, number> = {
  'cero': 0, '0': 0, 'nulo': 0, 'nada': 0,
  'uno': 1, 'una': 1, 'un': 1, '1': 1,
  'dos': 2, '2': 2,
  'tres': 3, '3': 3, 'tre': 3,
  'cuatro': 4, '4': 4,
  'cinco': 5, '5': 5,
  'seis': 6, '6': 6,
  'siete': 7, '7': 7,
  'ocho': 8, '8': 8,
  'nueve': 9, '9': 9,
  'diez': 10, '10': 10,
  'once': 11, '11': 11,
  'doce': 12, '12': 12,
  'trece': 13, '13': 13,
  'catorce': 14, '14': 14,
  'quince': 15, '15': 15
};

export default function FastProbingBar({
  isActive,
  onClose,
  periodontogram,
  onUpdatePeriodontogram
}: FastProbingBarProps) {
  const [toothIdx, setToothIdx] = useState<number>(0);
  const [aspect, setAspect] = useState<ArchAspect>('vestibular');
  const [site, setSite] = useState<SitePos>('mesial');
  const [metric, setMetric] = useState<ActiveMetric>('pocket');
  const [audioFeedback, setAudioFeedback] = useState<boolean>(true);

  // Voice Hands-free dictation state
  const [isVoiceActive, setIsVoiceActive] = useState<boolean>(false);
  const [lastSpokenText, setLastSpokenText] = useState<string>('');
  const [recognitionError, setRecognitionError] = useState<string | null>(null);

  const currentToothNumber = PROBING_SEQUENCE[toothIdx] || 18;

  const audioCtxRef = useRef<AudioContext | null>(null);

  // Sound generator using Web Audio API
  const playBeep = useCallback((freq = 600, duration = 0.08) => {
    if (!audioFeedback) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Audio not supported or blocked
    }
  }, [audioFeedback]);

  // Advance site position
  const advancePosition = useCallback(() => {
    if (site === 'mesial') {
      setSite('central');
    } else if (site === 'central') {
      setSite('distal');
    } else {
      // Move to next aspect or next tooth
      setSite('mesial');
      if (aspect === 'vestibular') {
        setAspect('palatino');
      } else {
        setAspect('vestibular');
        setToothIdx(prev => (prev < PROBING_SEQUENCE.length - 1 ? prev + 1 : 0));
      }
    }
  }, [site, aspect]);

  // Go back one position
  const retreatPosition = useCallback(() => {
    if (site === 'distal') {
      setSite('central');
    } else if (site === 'central') {
      setSite('mesial');
    } else {
      setSite('distal');
      if (aspect === 'palatino') {
        setAspect('vestibular');
      } else {
        setAspect('palatino');
        setToothIdx(prev => Math.max(0, prev - 1));
      }
    }
  }, [site, aspect]);

  // Apply a pocket depth or recession value to current position
  const applyValue = useCallback((val: number, customMetric?: ActiveMetric) => {
    const toothNum = PROBING_SEQUENCE[toothIdx];
    if (!toothNum) return;

    const currentToothState = periodontogram[toothNum] || {
      toothNumber: toothNum,
      vestibularPocket: { mesial: 2, central: 2, distal: 2 },
      palatinoPocket: { mesial: 2, central: 2, distal: 2 },
      vestibularRecess: { mesial: 0, central: 0, distal: 0 },
      palatinoRecess: { mesial: 0, central: 0, distal: 0 },
      sangradoVestibular: { mesial: false, central: false, distal: false },
      sangradoPalatino: { mesial: false, central: false, distal: false },
      supuracionVestibular: { mesial: false, central: false, distal: false },
      supuracionPalatino: { mesial: false, central: false, distal: false },
      placaVestibular: { mesial: false, central: false, distal: false },
      placaPalatino: { mesial: false, central: false, distal: false },
      movilidad: 0,
      furca: 0
    };

    const updatedTooth = { ...currentToothState };
    const targetMetric = customMetric || metric;

    if (targetMetric === 'pocket') {
      if (aspect === 'vestibular') {
        updatedTooth.vestibularPocket = {
          ...updatedTooth.vestibularPocket,
          [site]: val
        };
      } else {
        updatedTooth.palatinoPocket = {
          ...updatedTooth.palatinoPocket,
          [site]: val
        };
      }
    } else {
      if (aspect === 'vestibular') {
        updatedTooth.vestibularRecess = {
          ...updatedTooth.vestibularRecess,
          [site]: val
        };
      } else {
        updatedTooth.palatinoRecess = {
          ...updatedTooth.palatinoRecess,
          [site]: val
        };
      }
    }

    onUpdatePeriodontogram({
      ...periodontogram,
      [toothNum]: updatedTooth
    });

    // High pitch for deep pockets (>=4mm) to give immediate clinical alert
    playBeep(val >= 4 ? 850 : 550, 0.08);
    advancePosition();
  }, [toothIdx, aspect, site, metric, periodontogram, onUpdatePeriodontogram, playBeep, advancePosition]);

  // Toggle clinical flags (bleeding, plaque, suppuration)
  const toggleFlag = useCallback((flagType: 'sangrado' | 'placa' | 'supuracion') => {
    const toothNum = PROBING_SEQUENCE[toothIdx];
    if (!toothNum) return;

    const currentToothState = periodontogram[toothNum] || {
      toothNumber: toothNum,
      vestibularPocket: { mesial: 2, central: 2, distal: 2 },
      palatinoPocket: { mesial: 2, central: 2, distal: 2 },
      vestibularRecess: { mesial: 0, central: 0, distal: 0 },
      palatinoRecess: { mesial: 0, central: 0, distal: 0 },
      sangradoVestibular: { mesial: false, central: false, distal: false },
      sangradoPalatino: { mesial: false, central: false, distal: false },
      supuracionVestibular: { mesial: false, central: false, distal: false },
      supuracionPalatino: { mesial: false, central: false, distal: false },
      placaVestibular: { mesial: false, central: false, distal: false },
      placaPalatino: { mesial: false, central: false, distal: false },
      movilidad: 0,
      furca: 0
    };

    const updatedTooth = { ...currentToothState };
    const fieldKey = flagType === 'sangrado'
      ? (aspect === 'vestibular' ? 'sangradoVestibular' : 'sangradoPalatino')
      : flagType === 'placa'
      ? (aspect === 'vestibular' ? 'placaVestibular' : 'placaPalatino')
      : (aspect === 'vestibular' ? 'supuracionVestibular' : 'supuracionPalatino');

    const flags = { ...(updatedTooth as any)[fieldKey] };
    flags[site] = !flags[site];
    (updatedTooth as any)[fieldKey] = flags;

    onUpdatePeriodontogram({
      ...periodontogram,
      [toothNum]: updatedTooth
    });

    playBeep(flags[site] ? 900 : 400, 0.05);
  }, [toothIdx, aspect, site, periodontogram, onUpdatePeriodontogram, playBeep]);

  // Keep state refs updated for asynchronous speech recognition events
  const stateRef = useRef({
    toothIdx,
    aspect,
    site,
    metric,
    periodontogram,
    applyValue,
    toggleFlag,
    advancePosition,
    retreatPosition
  });

  useEffect(() => {
    stateRef.current = {
      toothIdx,
      aspect,
      site,
      metric,
      periodontogram,
      applyValue,
      toggleFlag,
      advancePosition,
      retreatPosition
    };
  });

  // Dedicated Continuous Speech Recognition Engine for Hands-Free Probing
  useEffect(() => {
    if (!isActive || !isVoiceActive) return;

    setRecognitionError(null);

    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      setRecognitionError("Tu navegador no soporta reconocimiento de voz continuo. Usa Google Chrome o Microsoft Edge.");
      setIsVoiceActive(false);
      return;
    }

    let isTerminated = false;
    let rec: any = null;
    const executedActionsByIndex = new Map<number, Set<string>>();
    const consumedNumbersByIndex = new Map<number, number>();

    try {
      rec = new SpeechRecognitionClass();
    } catch {
      setRecognitionError("No se pudo inicializar el servicio de reconocimiento de voz.");
      setIsVoiceActive(false);
      return;
    }

    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = typeof navigator !== "undefined" && navigator.language?.startsWith("es")
      ? navigator.language
      : "es-ES";

    rec.onresult = (event: any) => {
      try {
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const result = event.results[i];
          const rawTranscript = result[0]?.transcript;
          if (!rawTranscript) continue;

          const transcript = rawTranscript.toLowerCase().trim();
          setLastSpokenText(rawTranscript);

          let executedSet = executedActionsByIndex.get(i);
          if (!executedSet) {
            executedSet = new Set<string>();
            executedActionsByIndex.set(i, executedSet);
          }

          // 0. Chair mode jump
          if (
            transcript.includes('modo sillon') ||
            transcript.includes('modo sillón') ||
            transcript.includes('abrir sillon') ||
            transcript.includes('activar sillon') ||
            transcript.includes('entrar a modo sillon') ||
            transcript.includes('sillon clinico') ||
            transcript === 'sillon' ||
            transcript === 'sillón'
          ) {
            if (!executedSet.has('chair_mode')) {
              executedSet.add('chair_mode');
              window.dispatchEvent(new CustomEvent('periodash-open-chair-mode'));
            }
            continue;
          }

          // 1. Tooth direct jump: "pieza 16" or "diente 24"
          const toothMatch = transcript.match(/(?:pieza|diente|fdi)\s*(\d{2})/);
          if (toothMatch && toothMatch[1]) {
            const parsedTooth = parseInt(toothMatch[1], 10);
            const toothKey = `tooth_${parsedTooth}`;
            if (!executedSet.has(toothKey)) {
              executedSet.add(toothKey);
              const idx = PROBING_SEQUENCE.indexOf(parsedTooth);
              if (idx !== -1) {
                setToothIdx(idx);
              }
            }
            continue;
          }

          // 2. Aspect changes
          if (transcript.includes('vestibular') || transcript.includes('afuera') || transcript.includes('exterior')) {
            if (!executedSet.has('aspect_vestibular')) {
              executedSet.add('aspect_vestibular');
              setAspect('vestibular');
            }
            continue;
          }
          if (transcript.includes('palatino') || transcript.includes('lingual') || transcript.includes('adentro') || transcript.includes('interior')) {
            if (!executedSet.has('aspect_palatino')) {
              executedSet.add('aspect_palatino');
              setAspect('palatino');
            }
            continue;
          }

          // 3. Site positions
          if (transcript.includes('mesial')) {
            if (!executedSet.has('site_mesial')) {
              executedSet.add('site_mesial');
              setSite('mesial');
            }
            continue;
          }
          if (transcript.includes('central') || transcript.includes('medio')) {
            if (!executedSet.has('site_central')) {
              executedSet.add('site_central');
              setSite('central');
            }
            continue;
          }
          if (transcript.includes('distal')) {
            if (!executedSet.has('site_distal')) {
              executedSet.add('site_distal');
              setSite('distal');
            }
            continue;
          }

          // 4. Metric toggle
          if (transcript.includes('bolsa') || transcript.includes('sondaje') || transcript.includes('profundidad')) {
            if (!executedSet.has('metric_pocket')) {
              executedSet.add('metric_pocket');
              setMetric('pocket');
            }
            continue;
          }
          if (transcript.includes('recesión') || transcript.includes('recesion') || transcript.includes('margen')) {
            if (!executedSet.has('metric_recess')) {
              executedSet.add('metric_recess');
              setMetric('recess');
            }
            continue;
          }

          // 5. Clinical flags
          if (transcript.includes('sangrado') || transcript.includes('sangra') || transcript.includes('bop')) {
            if (!executedSet.has('flag_sangrado')) {
              executedSet.add('flag_sangrado');
              stateRef.current.toggleFlag('sangrado');
            }
            continue;
          }
          if (transcript.includes('placa') || transcript.includes('sarro') || transcript.includes('bacteria')) {
            if (!executedSet.has('flag_placa')) {
              executedSet.add('flag_placa');
              stateRef.current.toggleFlag('placa');
            }
            continue;
          }
          if (transcript.includes('supuración') || transcript.includes('supuracion') || transcript.includes('pus')) {
            if (!executedSet.has('flag_supuracion')) {
              executedSet.add('flag_supuracion');
              stateRef.current.toggleFlag('supuracion');
            }
            continue;
          }

          // 6. Navigation
          if (transcript.includes('siguiente') || transcript.includes('avanzar') || transcript.includes('saltar')) {
            if (!executedSet.has('nav_next')) {
              executedSet.add('nav_next');
              stateRef.current.advancePosition();
            }
            continue;
          }
          if (transcript.includes('atrás') || transcript.includes('atras') || transcript.includes('anterior')) {
            if (!executedSet.has('nav_prev')) {
              executedSet.add('nav_prev');
              stateRef.current.retreatPosition();
            }
            continue;
          }

          // 7. Check for spoken numbers with streaming consumption
          const words = transcript.split(/\s+/);
          const recognizedValues: number[] = [];

          for (const word of words) {
            if (SPANISH_NUM_MAP[word] !== undefined) {
              recognizedValues.push(SPANISH_NUM_MAP[word]);
            } else {
              const parsed = parseInt(word, 10);
              if (!isNaN(parsed) && parsed >= 0 && parsed <= 15) {
                recognizedValues.push(parsed);
              }
            }
          }

          const appliedCount = consumedNumbersByIndex.get(i) || 0;
          const newlyRecognized = recognizedValues.slice(appliedCount);

          if (newlyRecognized.length > 0) {
            newlyRecognized.forEach((val) => {
              stateRef.current.applyValue(val);
            });
            consumedNumbersByIndex.set(i, recognizedValues.length);
          }

          // Clean up completed entries
          if (result.isFinal) {
            consumedNumbersByIndex.delete(i);
            executedActionsByIndex.delete(i);
          }
        }
      } catch {
        // Safe command parsing
      }
    };

    rec.onerror = (e: any) => {
      const errorType = e?.error || 'unknown';

      // Benign speech recognition events (silence or stopped)
      if (errorType === 'no-speech' || errorType === 'aborted') {
        return;
      }

      if (errorType === 'not-allowed' || errorType === 'service-not-allowed') {
        isTerminated = true;
        setRecognitionError("Acceso al micrófono denegado. Permite el micrófono en los ajustes de tu navegador.");
        setIsVoiceActive(false);
        return;
      }

      if (errorType === 'audio-capture') {
        isTerminated = true;
        setRecognitionError("No se detectó un micrófono disponible.");
        setIsVoiceActive(false);
        return;
      }

      if (errorType === 'network') {
        isTerminated = true;
        setRecognitionError("Error de conexión con el servicio de reconocimiento.");
        setIsVoiceActive(false);
        return;
      }

      isTerminated = true;
      setRecognitionError("El dictado se detuvo temporalmente.");
      setIsVoiceActive(false);
    };

    rec.onend = () => {
      consumedNumbersByIndex.clear();
      executedActionsByIndex.clear();
      // Keep listening while modal and voice are active and no fatal termination
      if (!isTerminated && isVoiceActive && isActive) {
        try {
          rec.start();
        } catch {
          isTerminated = true;
        }
      }
    };

    try {
      rec.start();
    } catch {
      setRecognitionError("No se pudo activar el micrófono. Verifica los permisos de tu navegador.");
      setIsVoiceActive(false);
    }

    return () => {
      isTerminated = true;
      if (rec) {
        try {
          rec.stop();
        } catch {
          // safe teardown
        }
      }
    };
  }, [isActive, isVoiceActive]);

  // Physical Keyboard listener
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Quick numeric entry
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        applyValue(parseInt(e.key, 10));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        advancePosition();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        retreatPosition();
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        setMetric(prev => prev === 'pocket' ? 'recess' : 'pocket');
      } else if (e.key.toLowerCase() === 's' || e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleFlag('sangrado');
      } else if (e.key.toLowerCase() === 'p' || e.key.toLowerCase() === 'l') {
        e.preventDefault();
        toggleFlag('placa');
      } else if (e.key.toLowerCase() === 'u' || e.key.toLowerCase() === 'd') {
        e.preventDefault();
        toggleFlag('supuracion');
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, applyValue, advancePosition, retreatPosition, toggleFlag, onClose]);

  if (!isActive) return null;

  // Extract current values for visual feedback
  const currentTooth = periodontogram[currentToothNumber];
  const pocketVal = currentTooth
    ? (aspect === 'vestibular' ? currentTooth.vestibularPocket?.[site] : currentTooth.palatinoPocket?.[site]) ?? 2
    : 2;
  const recessVal = currentTooth
    ? (aspect === 'vestibular' ? currentTooth.vestibularRecess?.[site] : currentTooth.palatinoRecess?.[site]) ?? 0
    : 0;

  const isBleeding = currentTooth
    ? (aspect === 'vestibular' ? currentTooth.sangradoVestibular?.[site] : currentTooth.sangradoPalatino?.[site]) ?? false
    : false;
  const isPlaque = currentTooth
    ? (aspect === 'vestibular' ? currentTooth.placaVestibular?.[site] : currentTooth.placaPalatino?.[site]) ?? false
    : false;
  const isSuppurating = currentTooth
    ? (aspect === 'vestibular' ? currentTooth.supuracionVestibular?.[site] : currentTooth.supuracionPalatino?.[site]) ?? false
    : false;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.98 }}
        className="fixed bottom-[calc(env(safe-area-inset-bottom)+72px)] md:bottom-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-3xl bg-slate-900/98 border border-slate-700/80 text-white rounded-2xl p-3.5 sm:p-4 shadow-2xl backdrop-blur-xl no-print font-sans"
      >
        {/* Top Header & Toggles */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
          <div className="flex items-center gap-2">
            <span className="p-1 bg-teal-500/10 text-teal-400 rounded-lg border border-teal-500/20">
              <Zap className="w-3.5 h-3.5" />
            </span>
            <div>
              <span className="text-xs font-bold text-slate-100">Sondaje Continuo Asistido</span>
              <span className="text-[10px] text-slate-400 ml-1.5 hidden sm:inline">(Protocolo 6 Sitios FDI)</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Metric Mode Switcher */}
            <div className="bg-slate-950 p-0.5 rounded-xl flex border border-slate-800 text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => setMetric('pocket')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  metric === 'pocket'
                    ? 'bg-teal-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Bolsa (Sondaje)
              </button>
              <button
                type="button"
                onClick={() => setMetric('recess')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  metric === 'recess'
                    ? 'bg-amber-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Recesión
              </button>
            </div>

            {/* Voice Dictation Switch */}
            <button
              type="button"
              onClick={() => {
                if (!isVoiceActive) {
                  setRecognitionError(null);
                  setIsVoiceActive(true);
                } else {
                  setIsVoiceActive(false);
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all border ${
                isVoiceActive
                  ? 'bg-red-500/20 text-red-300 border-red-500/40 shadow-sm shadow-red-950/20 animate-pulse'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
              title="Dictado por voz continuo en español"
            >
              {isVoiceActive ? (
                <>
                  <Radio className="w-3.5 h-3.5 text-red-400 animate-spin" />
                  <span>Voz Activa</span>
                </>
              ) : (
                <>
                  <Mic className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Dictar por Voz</span>
                </>
              )}
            </button>

            {/* Audio Beeper */}
            <button
              type="button"
              onClick={() => setAudioFeedback(!audioFeedback)}
              className={`p-1.5 rounded-xl text-xs transition-colors border ${
                audioFeedback ? 'bg-teal-500/20 border-teal-500/30 text-teal-300' : 'bg-slate-800 border-slate-700 text-slate-500'
              }`}
              title="Sonido de confirmación sonora"
            >
              {audioFeedback ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white border border-transparent"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Voice Feedback Toast */}
        {isVoiceActive && (
          <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-2 mb-3 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-emerald-300 font-semibold">Dicta números de corrido:</span>
              <span className="font-mono text-white bg-black/40 px-2 py-0.5 rounded text-[10px]">
                {lastSpokenText ? `"${lastSpokenText}"` : 'Ej: "4 3 4 sangrado" o "pieza 21"'}
              </span>
            </div>
            <span className="text-[10px] text-emerald-400/80 font-mono hidden sm:inline">Reconocimiento Activo</span>
          </div>
        )}

        {/* Voice Error Notice */}
        {recognitionError && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-2.5 mb-3 flex items-center justify-between text-xs text-amber-200">
            <div className="flex items-center gap-2">
              <span className="text-amber-400 font-bold">⚠️ Micrófono:</span>
              <span>{recognitionError}</span>
            </div>
            <button
              type="button"
              onClick={() => setRecognitionError(null)}
              className="text-[11px] font-bold text-amber-400 hover:underline cursor-pointer shrink-0"
            >
              Cerrar
            </button>
          </div>
        )}

        {/* Current Target Visualizer Grid */}
        <div className="grid grid-cols-4 gap-2 bg-slate-950/80 p-3 rounded-2xl border border-slate-800 mb-3 text-center items-center">
          <div>
            <div className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider">Pieza FDI</div>
            <div className="text-2xl font-black text-teal-400 font-mono">Diente {currentToothNumber}</div>
          </div>

          <div>
            <div className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider">Cara Activa</div>
            <div className="text-xs font-bold text-amber-300 capitalize mt-1">
              {aspect} — <span className="underline uppercase font-mono">{site}</span>
            </div>
          </div>

          <div>
            <div className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider">
              {metric === 'pocket' ? 'Bolsa Actual' : 'Recesión Actual'}
            </div>
            <div className={`text-2xl font-black font-mono ${
              metric === 'pocket'
                ? (pocketVal >= 4 ? 'text-red-400' : 'text-emerald-400')
                : (recessVal > 0 ? 'text-amber-400' : 'text-slate-300')
            }`}>
              {metric === 'pocket' ? `${pocketVal} mm` : `${recessVal} mm`}
            </div>
          </div>

          {/* Quick Flag Badges for the site */}
          <div className="flex flex-col gap-1">
            <div className="text-[9px] uppercase text-slate-400 font-semibold">Marcadores</div>
            <div className="flex justify-center gap-1.5">
              <button
                type="button"
                onClick={() => toggleFlag('sangrado')}
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition-all ${
                  isBleeding ? 'bg-red-500 border-red-400 text-white' : 'bg-slate-900 border-slate-700 text-slate-500'
                }`}
                title="Sangrado (S o BOP)"
              >
                BOP
              </button>
              <button
                type="button"
                onClick={() => toggleFlag('placa')}
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition-all ${
                  isPlaque ? 'bg-amber-500 border-amber-400 text-black' : 'bg-slate-900 border-slate-700 text-slate-500'
                }`}
                title="Placa Bacteriana (P)"
              >
                PCR
              </button>
              <button
                type="button"
                onClick={() => toggleFlag('supuracion')}
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition-all ${
                  isSuppurating ? 'bg-cyan-400 border-cyan-300 text-black' : 'bg-slate-900 border-slate-700 text-slate-500'
                }`}
                title="Supuración (U)"
              >
                SUP
              </button>
            </div>
          </div>
        </div>

        {/* Quick Number Pad Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-1.5">
          <button
            type="button"
            onClick={retreatPosition}
            className="px-2.5 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1 text-slate-300"
            title="Posición anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12].map(num => (
            <button
              type="button"
              key={num}
              onClick={() => applyValue(num)}
              className={`flex-1 min-w-[34px] py-2.5 rounded-xl font-mono text-sm sm:text-base font-bold shadow-xs transition-all active:scale-95 ${
                num >= 4
                  ? 'bg-red-950/80 hover:bg-red-800 border border-red-700/60 text-red-200'
                  : 'bg-teal-950/80 hover:bg-teal-800 border border-teal-700/60 text-teal-200'
              }`}
            >
              {num}
            </button>
          ))}
          
          <button
            type="button"
            onClick={advancePosition}
            className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1 text-slate-300"
            title="Siguiente posición"
          >
            Saltar <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
