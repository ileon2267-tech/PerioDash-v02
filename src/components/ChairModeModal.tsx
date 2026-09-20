import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Patient, PeriodonState, ToothState, OLearyState, PsrRecord } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Droplets,
  Activity,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  Check,
  Radio,
  Sliders,
  Maximize2,
  Minimize2,
  HelpCircle,
  AlertCircle,
  Stethoscope,
  Smile,
  ClipboardList,
  Columns,
  Layers,
  Award
} from 'lucide-react';
import { recordHipaaAudit } from '../utils/hipaaAudit';
import Odontograma from './Odontograma';
import OLearyControl from './OLearyControl';
import PSRControl from './PSRControl';

interface ChairModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient;
  onUpdatePatient: (updated: Patient) => void;
  darkMode?: boolean;
}

// All FDI adult teeth in standard probing sequence
const PROBING_SEQUENCE = [
  // Quadrant 1: Upper Right (18 to 11)
  18, 17, 16, 15, 14, 13, 12, 11,
  // Quadrant 2: Upper Left (21 to 28)
  21, 22, 23, 24, 25, 26, 27, 28,
  // Quadrant 3: Lower Left (38 to 31)
  38, 37, 36, 35, 34, 33, 32, 31,
  // Quadrant 4: Lower Right (41 to 48)
  41, 42, 43, 44, 45, 46, 47, 48
];

const TOOTH_NAMES: Record<number, string> = {
  18: "Tercer Molar Sup. Der.",
  17: "Segundo Molar Sup. Der.",
  16: "Primer Molar Sup. Der.",
  15: "Segundo Premolar Sup. Der.",
  14: "Primer Premolar Sup. Der.",
  13: "Canino Sup. Der.",
  12: "Incisivo Lateral Sup. Der.",
  11: "Incisivo Central Sup. Der.",
  21: "Incisivo Central Sup. Izq.",
  22: "Incisivo Lateral Sup. Izq.",
  23: "Canino Sup. Izq.",
  24: "Primer Premolar Sup. Izq.",
  25: "Segundo Premolar Sup. Izq.",
  26: "Primer Molar Sup. Izq.",
  27: "Segundo Molar Sup. Izq.",
  28: "Tercer Molar Sup. Izq.",
  38: "Tercer Molar Inf. Izq.",
  37: "Segundo Molar Inf. Izq.",
  36: "Primer Molar Inf. Izq.",
  35: "Segundo Premolar Inf. Izq.",
  34: "Primer Premolar Inf. Izq.",
  33: "Canino Inf. Izq.",
  32: "Incisivo Lateral Inf. Izq.",
  31: "Incisivo Central Inf. Izq.",
  41: "Incisivo Central Inf. Der.",
  42: "Incisivo Lateral Inf. Der.",
  43: "Canino Inf. Der.",
  44: "Primer Premolar Inf. Der.",
  45: "Segundo Premolar Inf. Der.",
  46: "Primer Molar Inf. Der.",
  47: "Segundo Molar Inf. Der.",
  48: "Tercer Molar Inf. Der."
};

type ArchAspect = 'vestibular' | 'palatino';
type SitePos = 'mesial' | 'central' | 'distal';
type ActiveMetric = 'pocket' | 'recess';
type ChairScreen = 'dual' | 'sondaje' | 'psr' | 'odontograma' | 'oleary';

// Spanish number words mapping for speech recognition
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

export default function ChairModeModal({
  isOpen,
  onClose,
  patient,
  onUpdatePatient,
  darkMode = true
}: ChairModeModalProps) {
  // Operational mode tabs (defaults to single-screen 'sondaje' on mobile, 'dual' on desktop)
  const [activeScreen, setActiveScreen] = useState<ChairScreen>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return 'sondaje';
    }
    return 'dual';
  });
  const [dualCompanionTab, setDualCompanionTab] = useState<'psr' | 'odontograma' | 'oleary'>('psr');
  
  // Probing cursor navigation state
  const [toothIdx, setToothIdx] = useState<number>(0);
  const [aspect, setAspect] = useState<ArchAspect>('vestibular');
  const [site, setSite] = useState<SitePos>('mesial');
  const [metric, setMetric] = useState<ActiveMetric>('pocket');
  const [audioFeedback, setAudioFeedback] = useState<boolean>(true);

  // Voice Hands-free Engine state
  const [isVoiceActive, setIsVoiceActive] = useState<boolean>(true);
  const [lastSpokenText, setLastSpokenText] = useState<string>('');
  const [voiceFeedbackBadge, setVoiceFeedbackBadge] = useState<string | null>(null);
  const [recognitionError, setRecognitionError] = useState<string | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);

  const currentToothNumber = PROBING_SEQUENCE[toothIdx] || 18;
  const currentToothName = TOOTH_NAMES[currentToothNumber] || `Diente ${currentToothNumber}`;
  const periodontogram = patient.periodontogram || {};
  const currentToothState = periodontogram[currentToothNumber] || {
    toothNumber: currentToothNumber,
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

  // Safe Web Audio API sound generator
  const playTone = useCallback((freq = 550, type: OscillatorType = 'sine', duration = 0.08) => {
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
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Audio unsupported or restricted
    }
  }, [audioFeedback]);

  // BOP blood chime
  const playBopChime = useCallback(() => {
    if (!audioFeedback) return;
    playTone(880, 'triangle', 0.06);
    setTimeout(() => playTone(1100, 'triangle', 0.08), 70);
  }, [audioFeedback, playTone]);

  // Advance site position
  const advancePosition = useCallback(() => {
    if (site === 'mesial') {
      setSite('central');
    } else if (site === 'central') {
      setSite('distal');
    } else {
      // Move to next aspect or next tooth in sequence
      setSite('mesial');
      if (aspect === 'vestibular') {
        setAspect('palatino');
      } else {
        setAspect('vestibular');
        setToothIdx(prev => (prev < PROBING_SEQUENCE.length - 1 ? prev + 1 : 0));
      }
    }
  }, [site, aspect]);

  // Retreat site position
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

  // Apply value to periodontogram
  const applyValue = useCallback((val: number, customMetric?: ActiveMetric) => {
    const toothNum = PROBING_SEQUENCE[toothIdx];
    if (!toothNum) return;

    const currentP = patient.periodontogram || {};
    const existing = currentP[toothNum] || {
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

    const targetMetric = customMetric || metric;
    const isVest = aspect === 'vestibular';

    const updatedTooth: PeriodonState = {
      ...existing,
      vestibularPocket: { ...existing.vestibularPocket },
      palatinoPocket: { ...existing.palatinoPocket },
      vestibularRecess: { ...existing.vestibularRecess },
      palatinoRecess: { ...existing.palatinoRecess }
    };

    if (targetMetric === 'pocket') {
      if (isVest) {
        updatedTooth.vestibularPocket[site] = val;
      } else {
        updatedTooth.palatinoPocket[site] = val;
      }
      // Auditory pitch feedback: Higher frequency for deep pockets (pathology alert)
      const freq = val >= 6 ? 880 : val >= 4 ? 620 : 440;
      playTone(freq, val >= 6 ? 'triangle' : 'sine', 0.08);
    } else {
      if (isVest) {
        updatedTooth.vestibularRecess[site] = val;
      } else {
        updatedTooth.palatinoRecess[site] = val;
      }
      playTone(520, 'sine', 0.07);
    }

    const updatedPeriodontogram = {
      ...currentP,
      [toothNum]: updatedTooth
    };

    onUpdatePatient({
      ...patient,
      periodontogram: updatedPeriodontogram
    });

    advancePosition();
  }, [toothIdx, metric, aspect, site, patient, onUpdatePatient, playTone, advancePosition]);

  // Toggle clinical flags: sangrado (BOP), placa, supuración
  const toggleFlag = useCallback((flagType: 'sangrado' | 'placa' | 'supuracion') => {
    const toothNum = PROBING_SEQUENCE[toothIdx];
    if (!toothNum) return;

    const currentP = patient.periodontogram || {};
    const existing = currentP[toothNum] || {
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

    const isVest = aspect === 'vestibular';
    const fieldName = `${flagType}${isVest ? 'Vestibular' : 'Palatino'}` as keyof PeriodonState;
    const flags = { ...(existing[fieldName] as any) };
    flags[site] = !flags[site];

    const updatedPeriodontogram = {
      ...currentP,
      [toothNum]: {
        ...existing,
        [fieldName]: flags
      }
    };

    onUpdatePatient({
      ...patient,
      periodontogram: updatedPeriodontogram
    });

    if (flags[site] && flagType === 'sangrado') {
      playBopChime();
    } else {
      playTone(flags[site] ? 900 : 420, 'sine', 0.06);
    }
  }, [toothIdx, aspect, site, patient, onUpdatePatient, playBopChime, playTone]);

  // Reference container for async speech recognition events
  const stateRef = useRef({
    toothIdx,
    aspect,
    site,
    metric,
    activeScreen,
    applyValue,
    toggleFlag,
    advancePosition,
    retreatPosition,
    setToothIdx,
    setAspect,
    setSite,
    setMetric,
    setActiveScreen,
    onClose
  });

  useEffect(() => {
    stateRef.current = {
      toothIdx,
      aspect,
      site,
      metric,
      activeScreen,
      applyValue,
      toggleFlag,
      advancePosition,
      retreatPosition,
      setToothIdx,
      setAspect,
      setSite,
      setMetric,
      setActiveScreen,
      onClose
    };
  });

  // Dedicated Continuous Speech Recognition Engine for Chair Mode
  useEffect(() => {
    if (!isOpen || !isVoiceActive) return;

    setRecognitionError(null);
    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      setRecognitionError("Reconocimiento de voz no soportado en este navegador. Usa Chrome o Edge.");
      setIsVoiceActive(false);
      return;
    }

    let isDestroyed = false;
    let rec: any = null;
    const executedActionsByIndex = new Map<number, Set<string>>();
    const consumedNumbersByIndex = new Map<number, number>();

    try {
      rec = new SpeechRecognitionClass();
    } catch {
      setRecognitionError("No se pudo inicializar el micrófono.");
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

          // A. Screen Switcher Voice Commands
          if (transcript.includes('psr') || transcript.includes('tamizaje') || transcript.includes('oms') || transcript.includes('sextante')) {
            if (!executedSet.has('screen_psr')) {
              executedSet.add('screen_psr');
              stateRef.current.setActiveScreen('psr');
              setVoiceFeedbackBadge('📋 Vista: Sondaje PSR (Tamizaje OMS)');
              setTimeout(() => setVoiceFeedbackBadge(null), 2500);
            }
            continue;
          }
          if (transcript.includes('odontograma') || transcript.includes('caries') || transcript.includes('dientes')) {
            if (!executedSet.has('screen_odontograma')) {
              executedSet.add('screen_odontograma');
              stateRef.current.setActiveScreen('odontograma');
              setVoiceFeedbackBadge('🦷 Vista: Odontograma');
              setTimeout(() => setVoiceFeedbackBadge(null), 2500);
            }
            continue;
          }
          if (transcript.includes('oleary') || transcript.includes("o'leary") || transcript.includes('placa bacteriana') || transcript.includes('higiene')) {
            if (!executedSet.has('screen_oleary')) {
              executedSet.add('screen_oleary');
              stateRef.current.setActiveScreen('oleary');
              setVoiceFeedbackBadge("🧼 Vista: Índice de O'Leary");
              setTimeout(() => setVoiceFeedbackBadge(null), 2500);
            }
            continue;
          }
          if (transcript.includes('dual') || transcript.includes('pantalla dual') || transcript.includes('dividida')) {
            if (!executedSet.has('screen_dual')) {
              executedSet.add('screen_dual');
              stateRef.current.setActiveScreen('dual');
              setVoiceFeedbackBadge('◫ Vista: Pantalla Dual');
              setTimeout(() => setVoiceFeedbackBadge(null), 2500);
            }
            continue;
          }
          if (transcript.includes('sondaje completo') || transcript.includes('seis puntos') || transcript.includes('periodontograma')) {
            if (!executedSet.has('screen_sondaje')) {
              executedSet.add('screen_sondaje');
              stateRef.current.setActiveScreen('sondaje');
              setVoiceFeedbackBadge('📐 Vista: Sondaje 6 Puntos');
              setTimeout(() => setVoiceFeedbackBadge(null), 2500);
            }
            continue;
          }

          // B. Exit command: "salir", "cerrar", "modo normal"
          if (transcript.includes('salir') || transcript.includes('cerrar') || transcript.includes('terminar')) {
            if (!executedSet.has('exit')) {
              executedSet.add('exit');
              setVoiceFeedbackBadge('👋 Saliendo de Modo Sillón');
              setTimeout(() => {
                stateRef.current.onClose();
              }, 400);
            }
            continue;
          }

          // C. Tooth direct jump: "pieza 16", "diente 24"
          const toothMatch = transcript.match(/(?:pieza|diente|fdi)\s*(\d{2})/);
          if (toothMatch && toothMatch[1]) {
            const parsedTooth = parseInt(toothMatch[1], 10);
            const toothActionKey = `tooth_${parsedTooth}`;
            if (!executedSet.has(toothActionKey)) {
              executedSet.add(toothActionKey);
              const idx = PROBING_SEQUENCE.indexOf(parsedTooth);
              if (idx !== -1) {
                stateRef.current.setToothIdx(idx);
                setVoiceFeedbackBadge(`🦷 Ir a Pieza ${parsedTooth}`);
                setTimeout(() => setVoiceFeedbackBadge(null), 2500);
              }
            }
            continue;
          }

          // D. Aspect change
          if (transcript.includes('vestibular') || transcript.includes('afuera') || transcript.includes('exterior')) {
            if (!executedSet.has('aspect_vestibular')) {
              executedSet.add('aspect_vestibular');
              stateRef.current.setAspect('vestibular');
              setVoiceFeedbackBadge('Cara: Vestibular');
              setTimeout(() => setVoiceFeedbackBadge(null), 2000);
            }
            continue;
          }
          if (transcript.includes('palatino') || transcript.includes('lingual') || transcript.includes('adentro') || transcript.includes('interior')) {
            if (!executedSet.has('aspect_palatino')) {
              executedSet.add('aspect_palatino');
              stateRef.current.setAspect('palatino');
              setVoiceFeedbackBadge('Cara: Palatino/Lingual');
              setTimeout(() => setVoiceFeedbackBadge(null), 2000);
            }
            continue;
          }

          // E. Site positions
          if (transcript.includes('mesial')) {
            if (!executedSet.has('site_mesial')) {
              executedSet.add('site_mesial');
              stateRef.current.setSite('mesial');
              setVoiceFeedbackBadge('Sitio: Mesial');
              setTimeout(() => setVoiceFeedbackBadge(null), 2000);
            }
            continue;
          }
          if (transcript.includes('central') || transcript.includes('medio')) {
            if (!executedSet.has('site_central')) {
              executedSet.add('site_central');
              stateRef.current.setSite('central');
              setVoiceFeedbackBadge('Sitio: Central');
              setTimeout(() => setVoiceFeedbackBadge(null), 2000);
            }
            continue;
          }
          if (transcript.includes('distal')) {
            if (!executedSet.has('site_distal')) {
              executedSet.add('site_distal');
              stateRef.current.setSite('distal');
              setVoiceFeedbackBadge('Sitio: Distal');
              setTimeout(() => setVoiceFeedbackBadge(null), 2000);
            }
            continue;
          }

          // F. Clinical toggles
          if (transcript.includes('sangrado') || transcript.includes('sangra') || transcript.includes('bop')) {
            if (!executedSet.has('flag_sangrado')) {
              executedSet.add('flag_sangrado');
              stateRef.current.toggleFlag('sangrado');
              setVoiceFeedbackBadge('🩸 Sangrado al Sondaje (BOP)');
              setTimeout(() => setVoiceFeedbackBadge(null), 2500);
            }
            continue;
          }
          if (transcript.includes('placa') || transcript.includes('sarro') || transcript.includes('bacteria')) {
            if (!executedSet.has('flag_placa')) {
              executedSet.add('flag_placa');
              stateRef.current.toggleFlag('placa');
              setVoiceFeedbackBadge('🟡 Placa Bacteriana');
              setTimeout(() => setVoiceFeedbackBadge(null), 2500);
            }
            continue;
          }
          if (transcript.includes('supuración') || transcript.includes('supuracion') || transcript.includes('pus')) {
            if (!executedSet.has('flag_supuracion')) {
              executedSet.add('flag_supuracion');
              stateRef.current.toggleFlag('supuracion');
              setVoiceFeedbackBadge('⚠️ Supuración');
              setTimeout(() => setVoiceFeedbackBadge(null), 2500);
            }
            continue;
          }

          // G. Metric mode
          if (transcript.includes('bolsa') || transcript.includes('sondaje') || transcript.includes('profundidad')) {
            if (!executedSet.has('metric_pocket')) {
              executedSet.add('metric_pocket');
              stateRef.current.setMetric('pocket');
              setVoiceFeedbackBadge('Modo: Profundidad de Bolsa');
              setTimeout(() => setVoiceFeedbackBadge(null), 2000);
            }
            continue;
          }
          if (transcript.includes('recesión') || transcript.includes('recesion') || transcript.includes('margen')) {
            if (!executedSet.has('metric_recess')) {
              executedSet.add('metric_recess');
              stateRef.current.setMetric('recess');
              setVoiceFeedbackBadge('Modo: Recesión Gingival');
              setTimeout(() => setVoiceFeedbackBadge(null), 2000);
            }
            continue;
          }

          // H. Navigation
          if (transcript.includes('siguiente') || transcript.includes('avanzar')) {
            if (!executedSet.has('nav_next')) {
              executedSet.add('nav_next');
              stateRef.current.advancePosition();
              setVoiceFeedbackBadge('⏩ Siguiente Sitio');
              setTimeout(() => setVoiceFeedbackBadge(null), 1500);
            }
            continue;
          }
          if (transcript.includes('atrás') || transcript.includes('atras') || transcript.includes('anterior')) {
            if (!executedSet.has('nav_prev')) {
              executedSet.add('nav_prev');
              stateRef.current.retreatPosition();
              setVoiceFeedbackBadge('⏪ Sitio Anterior');
              setTimeout(() => setVoiceFeedbackBadge(null), 1500);
            }
            continue;
          }

          // I. Numbers parsing (realtime streaming numbers consumer)
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
            newlyRecognized.forEach(val => {
              stateRef.current.applyValue(val);
            });
            consumedNumbersByIndex.set(i, recognizedValues.length);
            setVoiceFeedbackBadge(`Valor registrado: ${newlyRecognized.join(', ')} mm`);
            setTimeout(() => setVoiceFeedbackBadge(null), 2500);
          }

          // Clean up finished entries to avoid memory retention
          if (result.isFinal) {
            consumedNumbersByIndex.delete(i);
            executedActionsByIndex.delete(i);
          }
        }
      } catch {
        // Safe dictation handling
      }
    };

    rec.onerror = (e: any) => {
      const errorType = e?.error || 'unknown';
      if (errorType === 'no-speech' || errorType === 'aborted') return;
      if (errorType === 'not-allowed') {
        isDestroyed = true;
        setRecognitionError("Permiso de micrófono denegado.");
        setIsVoiceActive(false);
      }
    };

    rec.onend = () => {
      consumedNumbersByIndex.clear();
      executedActionsByIndex.clear();
      if (!isDestroyed && isOpen && isVoiceActive) {
        try {
          rec.start();
        } catch {
          // Restart gracefully
        }
      }
    };

    try {
      rec.start();
    } catch {
      // Ignore start collisions
    }

    return () => {
      isDestroyed = true;
      try {
        rec.stop();
      } catch {}
    };
  }, [isOpen, isVoiceActive]);

  // Keyboard navigation & numpad listeners
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      // If user is focused on an input element, do not capture
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      // Numbers 0-9
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        applyValue(parseInt(e.key, 10));
        return;
      }

      // Arrows for site navigation
      if (e.key === 'ArrowRight' || e.key === 'Tab') {
        e.preventDefault();
        advancePosition();
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        retreatPosition();
        return;
      }

      // Spacebar toggles bleeding
      if (e.key === ' ' || e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        toggleFlag('sangrado');
        return;
      }

      // P toggles plaque
      if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        toggleFlag('placa');
        return;
      }

      // S toggles suppuration
      if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        toggleFlag('supuracion');
        return;
      }

      // V toggles vestibular vs palatino
      if (e.key === 'v' || e.key === 'V') {
        e.preventDefault();
        setAspect(prev => prev === 'vestibular' ? 'palatino' : 'vestibular');
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, applyValue, advancePosition, retreatPosition, toggleFlag, onClose]);

  if (!isOpen) return null;

  // Active metrics values
  const currentVal = metric === 'pocket'
    ? (aspect === 'vestibular' ? currentToothState.vestibularPocket[site] : currentToothState.palatinoPocket[site])
    : (aspect === 'vestibular' ? currentToothState.vestibularRecess[site] : currentToothState.palatinoRecess[site]);

  const hasBleeding = aspect === 'vestibular' ? currentToothState.sangradoVestibular[site] : currentToothState.sangradoPalatino[site];
  const hasPlaque = aspect === 'vestibular' ? currentToothState.placaVestibular[site] : currentToothState.placaPalatino[site];
  const hasSuppuration = aspect === 'vestibular' ? currentToothState.supuracionVestibular[site] : currentToothState.supuracionPalatino[site];

  // Render probing controls column
  const renderSondajeColumn = (isDualMode: boolean) => (
    <div className={`${isDualMode ? 'lg:col-span-7' : 'lg:col-span-12'} flex flex-col space-y-3 sm:space-y-4`}>
      {/* CURRENT TOOTH DISPLAY BANNER */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl sm:rounded-3xl p-3 sm:p-4 md:p-6 shadow-xl flex items-center justify-between gap-2 sm:gap-4">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <div className="w-14 h-14 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-2xl md:rounded-3xl bg-gradient-to-br from-teal-600 to-emerald-700 text-white flex flex-col items-center justify-center shadow-lg shadow-teal-950/40 border border-teal-400/30 shrink-0">
            <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider text-teal-200">FDI</span>
            <span className="text-2xl sm:text-3xl md:text-4xl font-black font-mono leading-none">{currentToothNumber}</span>
          </div>
          <div className="min-w-0">
            <h2 className="text-base sm:text-xl md:text-2xl font-display font-black text-white truncate">
              {currentToothName}
            </h2>
            <div className="flex items-center gap-1.5 sm:gap-2 mt-1 flex-wrap">
              <span className="text-[10px] sm:text-xs px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg sm:rounded-xl bg-slate-800 border border-slate-700 text-teal-300 font-bold uppercase">
                {aspect === 'vestibular' ? 'Vestibular' : 'Palatino/L.'}
              </span>
              <span className="text-[10px] sm:text-xs px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg sm:rounded-xl bg-slate-800 border border-slate-700 text-amber-300 font-bold uppercase">
                {site.toUpperCase()}
              </span>
              <span className="hidden sm:inline-block text-xs px-2.5 py-1 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 font-bold uppercase">
                {metric === 'pocket' ? 'Bolsa (PD)' : 'Recesión (REC)'}
              </span>
            </div>
          </div>
        </div>

        {/* Current Value Visual Bubble */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="flex flex-col items-center justify-center p-2 sm:p-3 md:p-4 rounded-2xl sm:rounded-3xl bg-slate-950/80 border border-slate-800 text-center min-w-[65px] sm:min-w-[90px]">
            <span className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400">Actual</span>
            <span className={`text-2xl sm:text-4xl md:text-5xl font-black font-mono leading-tight ${
              currentVal >= 6 ? 'text-rose-400' : currentVal >= 4 ? 'text-amber-400' : 'text-emerald-400'
            }`}>
              {currentVal}
            </span>
            <span className="text-[9px] sm:text-[10px] text-slate-500 font-bold">mm</span>
          </div>
        </div>
      </div>

      {/* SITE SELECTOR & CLINICAL FLAGS (TOUCH TARGETS >= 48px ON MOBILE, >= 60px ON DESKTOP) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
        {/* Cara Vestibular vs Palatino */}
        <button
          onClick={() => setAspect('vestibular')}
          className={`min-h-[48px] sm:min-h-[60px] p-2 sm:p-3 rounded-xl sm:rounded-2xl border font-bold flex flex-col items-center justify-center transition-all cursor-pointer ${
            aspect === 'vestibular'
              ? 'bg-teal-600 border-teal-500 text-white shadow-lg shadow-teal-900/30 ring-2 ring-teal-400/40'
              : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850'
          }`}
        >
          <span className="text-xs sm:text-sm font-extrabold">VESTIBULAR</span>
          <span className="text-[9px] sm:text-[10px] opacity-80">Exterior</span>
        </button>

        <button
          onClick={() => setAspect('palatino')}
          className={`min-h-[48px] sm:min-h-[60px] p-2 sm:p-3 rounded-xl sm:rounded-2xl border font-bold flex flex-col items-center justify-center transition-all cursor-pointer ${
            aspect === 'palatino'
              ? 'bg-teal-600 border-teal-500 text-white shadow-lg shadow-teal-900/30 ring-2 ring-teal-400/40'
              : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850'
          }`}
        >
          <span className="text-xs sm:text-sm font-extrabold">PALATINO / L.</span>
          <span className="text-[9px] sm:text-[10px] opacity-80">Interior</span>
        </button>

        {/* 3 Probing Sites: Mesial, Central, Distal */}
        <div className="col-span-2 sm:col-span-3 grid grid-cols-3 gap-1.5 sm:gap-2">
          {(['mesial', 'central', 'distal'] as SitePos[]).map(sPos => {
            const isCurrentSite = site === sPos;
            const siteVal = metric === 'pocket'
              ? (aspect === 'vestibular' ? currentToothState.vestibularPocket[sPos] : currentToothState.palatinoPocket[sPos])
              : (aspect === 'vestibular' ? currentToothState.vestibularRecess[sPos] : currentToothState.palatinoRecess[sPos]);

            return (
              <button
                key={sPos}
                onClick={() => setSite(sPos)}
                className={`min-h-[48px] sm:min-h-[60px] p-1.5 sm:p-2 rounded-xl sm:rounded-2xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                  isCurrentSite
                    ? 'bg-amber-500 border-amber-400 text-slate-950 font-black shadow-lg shadow-amber-950/40 ring-2 ring-amber-300'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850'
                }`}
              >
                <span className="text-[10px] sm:text-xs uppercase font-extrabold">{sPos}</span>
                <span className={`text-sm sm:text-base font-black font-mono ${isCurrentSite ? 'text-slate-950' : 'text-teal-400'}`}>
                  {siteVal} mm
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TOUCH NUMPAD & RAPID METRIC SELECTOR */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl sm:rounded-3xl p-3 sm:p-4 md:p-6 shadow-xl flex flex-col space-y-3 sm:space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setMetric('pocket')}
              className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs font-bold border transition-all cursor-pointer ${
                metric === 'pocket'
                  ? 'bg-teal-600 border-teal-500 text-white shadow-md shadow-teal-900/40'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
              }`}
            >
              Bolsa (PD)
            </button>
            <button
              onClick={() => setMetric('recess')}
              className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs font-bold border transition-all cursor-pointer ${
                metric === 'recess'
                  ? 'bg-teal-600 border-teal-500 text-white shadow-md shadow-teal-900/40'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
              }`}
            >
              Recesión (REC)
            </button>
          </div>

          <div className="text-xs font-mono text-slate-400 hidden sm:block">
            Usa teclado (0-9) o voz: <strong className="text-teal-300">"tres"</strong>
          </div>
        </div>

        {/* The responsive Numpad grid */}
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 sm:gap-2.5">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(val => (
            <button
              key={val}
              onClick={() => applyValue(val)}
              className={`min-h-[48px] sm:min-h-[60px] md:min-h-[68px] rounded-xl sm:rounded-2xl border font-mono font-black text-xl sm:text-2xl flex flex-col items-center justify-center transition-all cursor-pointer active:scale-95 ${
                val === currentVal
                  ? 'bg-teal-500 border-teal-400 text-slate-950 ring-4 ring-teal-400/30'
                  : val >= 6
                  ? 'bg-rose-950/40 hover:bg-rose-900/60 border-rose-800/60 text-rose-300'
                  : val >= 4
                  ? 'bg-amber-950/40 hover:bg-amber-900/60 border-amber-800/60 text-amber-300'
                  : 'bg-slate-800/90 hover:bg-slate-750 border-slate-700 text-slate-100'
              }`}
            >
              <span>{val}</span>
              <span className="text-[8px] sm:text-[9px] uppercase font-sans font-bold opacity-60">mm</span>
            </button>
          ))}
        </div>

        {/* CLINICAL FLAGS QUICK TOGGLES */}
        <div className="grid grid-cols-3 gap-1.5 sm:gap-3 pt-1">
          <button
            onClick={() => toggleFlag('sangrado')}
            className={`min-h-[48px] sm:min-h-[60px] p-2 sm:p-3 rounded-xl sm:rounded-2xl border flex items-center justify-center gap-2 sm:gap-2.5 transition-all cursor-pointer active:scale-95 ${
              hasBleeding
                ? 'bg-rose-600 border-rose-500 text-white shadow-lg shadow-rose-950/50 ring-2 ring-rose-400'
                : 'bg-slate-800 hover:bg-slate-750 border-slate-700 text-slate-300'
            }`}
          >
            <Droplets className={`w-4 h-4 sm:w-5 sm:h-5 ${hasBleeding ? 'fill-current' : 'text-rose-400'}`} />
            <div className="text-left">
              <div className="text-[10px] sm:text-xs font-black uppercase">Sangrado</div>
              <div className="text-[8px] sm:text-[9px] opacity-80 hidden xs:block sm:block">{hasBleeding ? 'BOP Positivo' : 'Sin Sangrado'}</div>
            </div>
          </button>

          <button
            onClick={() => toggleFlag('placa')}
            className={`min-h-[48px] sm:min-h-[60px] p-2 sm:p-3 rounded-xl sm:rounded-2xl border flex items-center justify-center gap-2 sm:gap-2.5 transition-all cursor-pointer active:scale-95 ${
              hasPlaque
                ? 'bg-amber-500 border-amber-400 text-slate-950 shadow-lg shadow-amber-950/50 ring-2 ring-amber-300'
                : 'bg-slate-800 hover:bg-slate-750 border-slate-700 text-slate-300'
            }`}
          >
            <Activity className={`w-4 h-4 sm:w-5 sm:h-5 ${hasPlaque ? 'text-slate-950' : 'text-amber-400'}`} />
            <div className="text-left">
              <div className="text-[10px] sm:text-xs font-black uppercase">Placa</div>
              <div className="text-[8px] sm:text-[9px] opacity-80 hidden xs:block sm:block">{hasPlaque ? 'Presente' : 'Limpia'}</div>
            </div>
          </button>

          <button
            onClick={() => toggleFlag('supuracion')}
            className={`min-h-[48px] sm:min-h-[60px] p-2 sm:p-3 rounded-xl sm:rounded-2xl border flex items-center justify-center gap-2 sm:gap-2.5 transition-all cursor-pointer active:scale-95 ${
              hasSuppuration
                ? 'bg-yellow-500 border-yellow-400 text-slate-950 shadow-lg shadow-yellow-950/50 ring-2 ring-yellow-300'
                : 'bg-slate-800 hover:bg-slate-750 border-slate-700 text-slate-300'
            }`}
          >
            <AlertCircle className={`w-4 h-4 sm:w-5 sm:h-5 ${hasSuppuration ? 'text-slate-950' : 'text-yellow-400'}`} />
            <div className="text-left">
              <div className="text-[10px] sm:text-xs font-black uppercase">Supuración</div>
              <div className="text-[8px] sm:text-[9px] opacity-80 hidden xs:block sm:block">{hasSuppuration ? 'Exudado' : 'Sin Pus'}</div>
            </div>
          </button>
        </div>
      </div>

      {/* TOOTH CAROUSEL & NAVIGATION */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl sm:rounded-3xl p-2 sm:p-4 shadow-xl flex items-center justify-between gap-1.5 sm:gap-2">
        <button
          onClick={retreatPosition}
          className="min-w-[48px] min-h-[48px] sm:min-w-[60px] sm:min-h-[60px] w-12 h-12 sm:w-15 sm:h-15 rounded-xl sm:rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white flex items-center justify-center transition-all cursor-pointer active:scale-95 shrink-0"
          title="Sitio o diente anterior (Flecha Izquierda)"
        >
          <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
        </button>

        {/* Scrollable FDI Tooth Strip */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto py-1 px-1 sm:px-2 flex-1 justify-start md:justify-center hide-scrollbar">
          {PROBING_SEQUENCE.map((num, idx) => {
            const isSelected = idx === toothIdx;
            return (
              <button
                key={num}
                onClick={() => setToothIdx(idx)}
                className={`min-w-[40px] sm:min-w-[48px] h-10 sm:h-12 rounded-xl flex flex-col items-center justify-center font-mono font-bold transition-all cursor-pointer shrink-0 border ${
                  isSelected
                    ? 'bg-teal-600 border-teal-400 text-white ring-2 ring-teal-400 shadow-md scale-105'
                    : 'bg-slate-800 border-slate-700/80 text-slate-300 hover:bg-slate-750'
                }`}
              >
                <span className="text-xs sm:text-sm leading-none font-black">{num}</span>
                <span className="text-[7px] sm:text-[8px] font-sans opacity-60">FDI</span>
              </button>
            );
          })}
        </div>

        <button
          onClick={advancePosition}
          className="min-w-[48px] min-h-[48px] sm:min-w-[60px] sm:min-h-[60px] w-12 h-12 sm:w-15 sm:h-15 rounded-xl sm:rounded-2xl bg-teal-600 hover:bg-teal-500 border border-teal-500 text-white flex items-center justify-center transition-all cursor-pointer active:scale-95 shrink-0 shadow-lg shadow-teal-950/40"
          title="Sitio o diente siguiente (Flecha Derecha / Tab)"
        >
          <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-slate-100 flex flex-col font-sans select-none overflow-hidden">
      
      {/* TOP CLINICAL APPBAR */}
      <header className="h-16 md:h-20 bg-slate-900 border-b border-slate-800 px-3 md:px-6 flex items-center justify-between shrink-0 shadow-lg relative z-20">
        
        {/* Left: Patient Identity & Mode Indicator */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/40 shadow-inner shrink-0">
            <Activity className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-display font-bold text-sm sm:text-base md:text-xl text-white tracking-tight truncate max-w-[130px] xs:max-w-[180px] sm:max-w-[240px] md:max-w-[340px]">
                {patient.name}
              </span>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-teal-500/20 text-teal-300 border border-teal-500/40 shrink-0">
                Sillón Activo
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400 font-mono flex items-center gap-1.5 sm:gap-2 truncate">
              <span className="hidden xs:inline">RUT: {patient.rut}</span>
              <span className="text-slate-600 hidden xs:inline">•</span>
              <span className="text-teal-400 font-bold">FDI: {currentToothNumber}</span>
            </p>
          </div>
        </div>

        {/* Center / Right: Screen Selector Pills & Tools */}
        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 shrink-0">
          
          {/* Layout Mode Segmented Pill (Desktop) */}
          <div className="hidden md:flex items-center bg-slate-800/90 p-1 rounded-2xl border border-slate-700">
            <button
              onClick={() => setActiveScreen('dual')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeScreen === 'dual' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Pantalla Dual</span>
            </button>
            <button
              onClick={() => setActiveScreen('sondaje')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeScreen === 'sondaje' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Sondaje 6P</span>
            </button>
            <button
              onClick={() => setActiveScreen('psr')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeScreen === 'psr' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5" />
              <span>Sondaje PSR</span>
            </button>
            <button
              onClick={() => setActiveScreen('odontograma')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeScreen === 'odontograma' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Smile className="w-3.5 h-3.5" />
              <span>Odontograma</span>
            </button>
            <button
              onClick={() => setActiveScreen('oleary')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeScreen === 'oleary' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5" />
              <span>O'Leary</span>
            </button>
          </div>

          {/* Voice Microphone Toggle */}
          <button
            onClick={() => setIsVoiceActive(!isVoiceActive)}
            className={`w-11 h-11 sm:w-13 sm:h-13 md:w-15 md:h-15 min-w-[44px] min-h-[44px] md:min-w-[60px] md:min-h-[60px] rounded-xl sm:rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer border ${
              isVoiceActive
                ? 'bg-teal-500/20 border-teal-500/60 text-teal-300 shadow-md shadow-teal-900/30'
                : 'bg-slate-800 border-slate-700 text-slate-500'
            }`}
            title={isVoiceActive ? 'Pausar Comandos de Voz' : 'Activar Comandos de Voz'}
          >
            {isVoiceActive ? <Mic className="w-5 h-5 md:w-6 md:h-6 text-teal-400 animate-pulse" /> : <MicOff className="w-5 h-5 md:w-6 md:h-6 text-slate-400" />}
            <span className="text-[9px] font-bold uppercase mt-0.5 hidden sm:inline">Voz</span>
          </button>

          {/* Audio Beep Feedback Toggle */}
          <button
            onClick={() => setAudioFeedback(!audioFeedback)}
            className={`w-11 h-11 sm:w-13 sm:h-13 md:w-15 md:h-15 min-w-[44px] min-h-[44px] md:min-w-[60px] md:min-h-[60px] rounded-xl sm:rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer border ${
              audioFeedback
                ? 'bg-slate-800 border-slate-700 text-teal-300'
                : 'bg-slate-800/50 border-slate-700 text-slate-500'
            }`}
            title="Activar o desactivar tonos auditivos clínicos"
          >
            {audioFeedback ? <Volume2 className="w-5 h-5 md:w-6 md:h-6" /> : <VolumeX className="w-5 h-5 md:w-6 md:h-6" />}
            <span className="text-[9px] font-bold uppercase mt-0.5 hidden sm:inline">Audio</span>
          </button>

          {/* Exit Button */}
          <button
            onClick={onClose}
            className="w-11 h-11 sm:w-13 sm:h-13 md:w-15 md:h-15 min-w-[44px] min-h-[44px] md:min-w-[60px] md:min-h-[60px] rounded-xl sm:rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 flex flex-col items-center justify-center transition-all cursor-pointer active:scale-95 shadow-lg shadow-rose-950/20"
            title="Salir de Modo Sillón (Esc)"
          >
            <X className="w-5 h-5 md:w-7 md:h-7" />
            <span className="text-[9px] font-bold uppercase mt-0.5 hidden sm:inline">Salir</span>
          </button>
        </div>
      </header>

      {/* MOBILE SCREEN SELECTOR & VOICE TICKER */}
      <div className="md:hidden bg-slate-900 px-3 py-2 border-b border-slate-800 flex flex-col gap-2 text-xs">
        <div className="flex items-center gap-2 truncate text-slate-300">
          <Mic className={`w-3.5 h-3.5 shrink-0 ${isVoiceActive ? 'text-teal-400 animate-pulse' : 'text-slate-500'}`} />
          <span className="truncate text-[11px]">
            {voiceFeedbackBadge || (lastSpokenText ? `"${lastSpokenText}"` : "Comandos: 'tres', 'psr', 'sangrado', 'odontograma'")}
          </span>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 hide-scrollbar">
          {[
            { id: 'dual', label: 'Dual' },
            { id: 'sondaje', label: 'Sondaje 6P' },
            { id: 'psr', label: 'PSR OMS' },
            { id: 'odontograma', label: 'Odontograma' },
            { id: 'oleary', label: "O'Leary" }
          ].map((sc) => (
            <button
              key={sc.id}
              onClick={() => setActiveScreen(sc.id as ChairScreen)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer min-h-[36px] flex items-center justify-center ${
                activeScreen === sc.id
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {sc.label}
            </button>
          ))}
        </div>
      </div>

      {/* MAIN OPERATORY STAGE */}
      <div className="flex-1 p-3 md:p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 min-h-0">
        
        {/* CASE 1: DUAL SCREEN MODE */}
        {activeScreen === 'dual' && (
          <>
            {/* COLUMN A: SONDAJE 6 PUNTOS */}
            {renderSondajeColumn(true)}

            {/* COLUMN B: COMPANION CLINICAL PANEL (PSR OMS / ODONTOGRAMA / O'LEARY) */}
            <div className="lg:col-span-5 flex flex-col space-y-4">
              {/* COMPANION SUB-TABS */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-1.5 flex items-center justify-between gap-1 shadow-md">
                <button
                  onClick={() => setDualCompanionTab('psr')}
                  className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    dualCompanionTab === 'psr'
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Stethoscope className="w-3.5 h-3.5" />
                  <span>PSR OMS</span>
                </button>
                <button
                  onClick={() => setDualCompanionTab('odontograma')}
                  className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    dualCompanionTab === 'odontograma'
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Smile className="w-3.5 h-3.5" />
                  <span>Odontograma</span>
                </button>
                <button
                  onClick={() => setDualCompanionTab('oleary')}
                  className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    dualCompanionTab === 'oleary'
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <ClipboardList className="w-3.5 h-3.5" />
                  <span>O'Leary</span>
                </button>
              </div>

              {/* COMPANION VIEW CONTENT */}
              <div className="flex-1 overflow-y-auto">
                {dualCompanionTab === 'psr' && (
                  <PSRControl
                    patient={patient}
                    onUpdate={(updatedPsr) => {
                      onUpdatePatient({
                        ...patient,
                        psr: updatedPsr
                      });
                    }}
                    onNavigateToFullPerio={() => setActiveScreen('sondaje')}
                    isChairSide={true}
                  />
                )}

                {dualCompanionTab === 'odontograma' && (
                  <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 shadow-xl overflow-x-auto">
                    <Odontograma
                      odontogram={patient.odontogram}
                      onChange={(updated) => {
                        onUpdatePatient({
                          ...patient,
                          odontogram: updated
                        });
                      }}
                    />
                  </div>
                )}

                {dualCompanionTab === 'oleary' && (
                  <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 shadow-xl overflow-y-auto">
                    <OLearyControl
                      patient={patient}
                      onUpdate={(updated) => {
                        onUpdatePatient({
                          ...patient,
                          oLeary: updated
                        });
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* CASE 2: SINGLE SCREEN - SONDAJE 6 PUNTOS */}
        {activeScreen === 'sondaje' && renderSondajeColumn(false)}

        {/* CASE 3: SINGLE SCREEN - SONDAJE PSR (TAMIZAJE OMS) */}
        {activeScreen === 'psr' && (
          <div className="lg:col-span-12">
            <PSRControl
              patient={patient}
              onUpdate={(updatedPsr) => {
                onUpdatePatient({
                  ...patient,
                  psr: updatedPsr
                });
              }}
              onNavigateToFullPerio={() => setActiveScreen('sondaje')}
              isChairSide={true}
            />
          </div>
        )}

        {/* CASE 4: SINGLE SCREEN - ODONTOGRAMA CLÍNICO */}
        {activeScreen === 'odontograma' && (
          <div className="lg:col-span-12 bg-slate-900/90 border border-slate-800 rounded-2xl sm:rounded-3xl p-3 sm:p-6 shadow-xl overflow-x-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 sm:pb-4 mb-3 sm:mb-4 border-b border-slate-800 gap-2">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
                  <Smile className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base sm:text-lg text-white font-display">
                    Odontograma Clínico (Modo Sillón)
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-400">
                    Notación FDI 11-48 • Registro anatómico de superficies y tratamientos
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveScreen('dual')}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-xs font-bold text-teal-400 border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
              >
                <Columns className="w-3.5 h-3.5" />
                <span>Volver a Pantalla Dual</span>
              </button>
            </div>
            <Odontograma
              odontogram={patient.odontogram}
              onChange={(updated) => {
                onUpdatePatient({
                  ...patient,
                  odontogram: updated
                });
              }}
            />
          </div>
        )}

        {/* CASE 5: SINGLE SCREEN - ÍNDICE DE O'LEARY */}
        {activeScreen === 'oleary' && (
          <div className="lg:col-span-12 bg-slate-900/90 border border-slate-800 rounded-2xl sm:rounded-3xl p-3 sm:p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 sm:pb-4 mb-3 sm:mb-4 border-b border-slate-800 gap-2">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
                  <ClipboardList className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base sm:text-lg text-white font-display">
                    Índice de O'Leary (Control de Placa Bacteriana)
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-400">
                    Evaluación de 4 superficies por pieza dentaria (Mesial, Distal, Vestibular, Lingual)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveScreen('dual')}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-xs font-bold text-teal-400 border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
              >
                <Columns className="w-3.5 h-3.5" />
                <span>Volver a Pantalla Dual</span>
              </button>
            </div>
            <OLearyControl
              patient={patient}
              onUpdate={(updated) => {
                onUpdatePatient({
                  ...patient,
                  oLeary: updated
                });
              }}
            />
          </div>
        )}

      </div>

      {/* FOOTER: CLINICAL STATUS & PRIVACY AUDIT BADGE */}
      <footer className="h-14 bg-slate-950 border-t border-slate-800 px-6 flex items-center justify-between shrink-0 text-xs text-slate-400">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Audit Trail HIPAA Activo</span>
          </div>
          <span className="text-slate-600">•</span>
          <span className="hidden sm:inline">Modo Sin Distracciones • Botones Sanitarios Extragrandes</span>
        </div>

        <div className="flex items-center gap-4">
          <span className="hidden md:inline font-mono text-slate-500">
            Atajo: <kbd className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 text-slate-300">Esc</kbd> para salir
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-all cursor-pointer"
          >
            Finalizar Sesión
          </button>
        </div>
      </footer>
    </div>
  );
}
