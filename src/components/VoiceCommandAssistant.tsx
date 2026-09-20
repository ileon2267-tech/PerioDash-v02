import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  HelpCircle,
  X,
  CheckCircle2,
  Sparkles,
  Search,
  Users,
  Smile,
  Activity,
  Moon,
  Sun,
  Maximize2,
  Minimize2,
  Stethoscope,
  Calendar,
  CreditCard,
  Settings,
  ShieldCheck,
  ChevronRight,
  Radio
} from "lucide-react";
import { Patient, ActiveTab } from "../types";
import {
  parseVoiceCommand,
  ClinicalSubView,
  VoiceCommandResult,
} from "../services/voiceCommands";

interface VoiceCommandAssistantProps {
  handsFreeActive: boolean;
  onToggleHandsFree: (active: boolean) => void;
  isChairModeOpen: boolean;
  patients: Patient[];
  activePatientId: string;
  onSelectPatient: (patientId: string) => void;
  onClearPatient: () => void;
  activeTab: ActiveTab;
  onNavigateTab: (tab: ActiveTab, subView?: ClinicalSubView) => void;
  darkMode: boolean;
  onSetDarkMode: (isDark: boolean) => void;
  onToggleDarkMode: () => void;
  isZenMode: boolean;
  onSetZenMode: (isZen: boolean) => void;
  onSetChairMode: (open: boolean) => void;
  onOpenNewPatient: () => void;
  onOpenSearch: () => void;
  onOpenAppLauncher: () => void;
  onCloseAppLauncher: () => void;
  onOpenHipaa: () => void;
  onTogglePrivacy: () => void;
  playChime: () => void;
}

export default function VoiceCommandAssistant({
  handsFreeActive,
  onToggleHandsFree,
  isChairModeOpen,
  patients,
  activePatientId,
  onSelectPatient,
  onClearPatient,
  activeTab,
  onNavigateTab,
  darkMode,
  onSetDarkMode,
  onToggleDarkMode,
  isZenMode,
  onSetZenMode,
  onSetChairMode,
  onOpenNewPatient,
  onOpenSearch,
  onOpenAppLauncher,
  onCloseAppLauncher,
  onOpenHipaa,
  onTogglePrivacy,
  playChime,
}: VoiceCommandAssistantProps) {
  const [speechSupported, setSpeechSupported] = useState<boolean>(true);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [liveTranscript, setLiveTranscript] = useState<string>("");
  const [lastTranscript, setLastTranscript] = useState<string>("");
  const [activeFeedback, setActiveFeedback] = useState<{
    text: string;
    action: string;
    isSuccess: boolean;
  } | null>(null);
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);

  useEffect(() => {
    const handleOpenHelp = () => setShowHelpModal(true);
    window.addEventListener("periodash-open-voice-help", handleOpenHelp);
    return () => window.removeEventListener("periodash-open-voice-help", handleOpenHelp);
  }, []);

  const [soundFeedbackEnabled, setSoundFeedbackEnabled] = useState<boolean>(() => {
    return localStorage.getItem("perioVoiceSoundFeedback") !== "false";
  });
  const [searchHelpQuery, setSearchHelpQuery] = useState("");
  const [manualTestInput, setManualTestInput] = useState("");

  const activeRecRef = useRef<any>(null);
  const restartTimerRef = useRef<any>(null);
  const isListeningInternalRef = useRef<boolean>(false);
  const feedbackTimeoutRef = useRef<any>(null);
  const lastExecutedTimeRef = useRef<number>(0);
  const lastExecutedActionRef = useRef<string>("");
  const isCoolingDownRef = useRef<boolean>(false);
  const handledResultIndexSetRef = useRef<Set<number>>(new Set());
  const lastInterimExecutedPhraseRef = useRef<string>("");

  // Stop any pending speech synthesis in browser immediately
  useEffect(() => {
    try {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    } catch {}
  }, []);

  // Store latest props in a mutable ref so re-rendering App NEVER breaks or restarts the recognition loop
  const propsRef = useRef({
    patients,
    onSetDarkMode,
    onToggleDarkMode,
    onSetZenMode,
    onSetChairMode,
    onSelectPatient,
    onClearPatient,
    onNavigateTab,
    onOpenNewPatient,
    onOpenSearch,
    onOpenAppLauncher,
    onCloseAppLauncher,
    onOpenHipaa,
    onTogglePrivacy,
    onToggleHandsFree,
    playChime,
    soundFeedbackEnabled,
  });

  useEffect(() => {
    propsRef.current = {
      patients,
      onSetDarkMode,
      onToggleDarkMode,
      onSetZenMode,
      onSetChairMode,
      onSelectPatient,
      onClearPatient,
      onNavigateTab,
      onOpenNewPatient,
      onOpenSearch,
      onOpenAppLauncher,
      onCloseAppLauncher,
      onOpenHipaa,
      onTogglePrivacy,
      onToggleHandsFree,
      playChime,
      soundFeedbackEnabled,
    };
  });

  // Execute parsed voice command with duplicate-prevention
  const executeCommand = useCallback(
    (commandResult: VoiceCommandResult, rawTranscript: string) => {
      const now = Date.now();

      // Enforce intelligent cooldown: prevent repeating the exact same action within 900ms, or rapid fire within 300ms
      if (
        now - lastExecutedTimeRef.current < 900 &&
        lastExecutedActionRef.current === commandResult.action
      ) {
        return;
      }
      if (now - lastExecutedTimeRef.current < 300) {
        return;
      }

      setLastTranscript(rawTranscript);

      if (commandResult.action === "UNKNOWN") {
        setActiveFeedback({
          text: `"${rawTranscript}"`,
          action: "Comando no reconocido. Di 'comandos de voz' o abre la guía (?)",
          isSuccess: false,
        });
        if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
        feedbackTimeoutRef.current = setTimeout(() => setActiveFeedback(null), 3200);
        return;
      }

      lastExecutedTimeRef.current = now;
      lastExecutedActionRef.current = commandResult.action;
      isCoolingDownRef.current = true;
      setTimeout(() => {
        isCoolingDownRef.current = false;
      }, 350);

      // Play soft discrete chime (pure web audio, inaudible as human voice)
      if (propsRef.current.soundFeedbackEnabled) {
        propsRef.current.playChime();
      }

      // Show success feedback HUD
      setActiveFeedback({
        text: `"${rawTranscript}"`,
        action: commandResult.feedbackText,
        isSuccess: true,
      });

      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
      feedbackTimeoutRef.current = setTimeout(() => setActiveFeedback(null), 3800);

      const {
        onSetDarkMode: setDark,
        onToggleDarkMode: toggleDark,
        onSetZenMode: setZen,
        onSetChairMode: setChair,
        onSelectPatient: selectPat,
        onClearPatient: clearPat,
        onNavigateTab: navTab,
        onOpenNewPatient: newPat,
        onOpenSearch: openSearch,
        onOpenAppLauncher: openApp,
        onCloseAppLauncher: closeApp,
        onOpenHipaa: openHipaa,
        onTogglePrivacy: togglePriv,
        onToggleHandsFree: toggleHf,
      } = propsRef.current;

      // Execute specific action cleanly
      switch (commandResult.action) {
        case "SET_DARK_MODE":
          if (commandResult.boolValue !== undefined) {
            setDark(commandResult.boolValue);
          }
          break;

        case "TOGGLE_DARK_MODE":
          toggleDark();
          break;

        case "SET_ZEN_MODE":
          if (commandResult.boolValue !== undefined) {
            setZen(commandResult.boolValue);
          }
          break;

        case "SET_CHAIR_MODE":
          if (commandResult.boolValue !== undefined) {
            setChair(commandResult.boolValue);
          }
          break;

        case "SELECT_PATIENT":
          if (commandResult.patientId) {
            selectPat(commandResult.patientId);
            navTab(commandResult.tab || "clinica", commandResult.subView || "ficha");
          }
          break;

        case "CLEAR_PATIENT":
          clearPat();
          navTab("clinica", "ficha");
          break;

        case "NAVIGATE_TAB":
          if (commandResult.tab) {
            navTab(commandResult.tab, commandResult.subView);
          }
          break;

        case "NAVIGATE_CLINICAL_SUBVIEW":
          navTab("clinica", commandResult.subView || "ficha");
          break;

        case "OPEN_NEW_PATIENT":
          newPat();
          break;

        case "OPEN_SEARCH":
          openSearch();
          break;

        case "OPEN_DENTITO":
          window.dispatchEvent(new CustomEvent("periodash-open-dentito"));
          break;

        case "OPEN_APP_LAUNCHER":
          openApp();
          break;

        case "CLOSE_APP_LAUNCHER":
          closeApp();
          break;

        case "OPEN_HIPAA":
          openHipaa();
          break;

        case "TOGGLE_PRIVACY":
          togglePriv();
          break;

        case "OPEN_VOICE_HELP":
          setShowHelpModal(true);
          break;

        case "TOGGLE_HANDS_FREE":
          if (commandResult.boolValue !== undefined) {
            toggleHf(commandResult.boolValue);
          }
          break;
      }
    },
    []
  );

  // Initialize and maintain speech recognition loop forever while handsFreeActive is true
  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      setSpeechSupported(false);
      return;
    }

    // Do not run if disabled by user or if chair mode is active
    if (!handsFreeActive || isChairModeOpen) {
      setIsListening(false);
      isListeningInternalRef.current = false;
      setLiveTranscript("");
      if (restartTimerRef.current) {
        clearTimeout(restartTimerRef.current);
        restartTimerRef.current = null;
      }
      if (activeRecRef.current) {
        try {
          activeRecRef.current.abort();
        } catch {}
        activeRecRef.current = null;
      }
      return;
    }

    let isTerminated = false;

    function safeStartSession() {
      if (isTerminated || !handsFreeActive || isChairModeOpen) return;

      // Abort prior instance if any
      if (activeRecRef.current) {
        try {
          activeRecRef.current.abort();
        } catch {}
        activeRecRef.current = null;
      }

      try {
        const rec = new SpeechRecognitionClass();
        rec.continuous = true;
        rec.interimResults = true; // Realtime responsiveness
        rec.maxAlternatives = 1;
        rec.lang = typeof navigator !== "undefined" && navigator.language?.startsWith("es")
          ? navigator.language
          : "es-ES";

        rec.onstart = () => {
          if (isTerminated) return;
          setIsListening(true);
          isListeningInternalRef.current = true;
        };

        rec.onresult = (event: any) => {
          if (isTerminated) return;

          try {
            for (let i = event.resultIndex; i < event.results.length; ++i) {
              const result = event.results[i];
              const rawTranscript = result[0]?.transcript || "";
              const transcript = rawTranscript.trim();
              if (!transcript) continue;

              // If this speech utterance result was already executed, skip further interim/final events
              if (handledResultIndexSetRef.current.has(i)) {
                continue;
              }

              if (!result.isFinal) {
                // Live visual feedback: display words as they are pronounced
                setLiveTranscript(transcript);

                // High-Speed Instant Response:
                // If the phrase so far contains a recognized, unambiguous clinical or navigation command,
                // trigger it IMMEDIATELY without waiting 2 seconds for browser silence!
                if (!isCoolingDownRef.current) {
                  const parsed = parseVoiceCommand(transcript, propsRef.current.patients);
                  if (parsed.action !== "UNKNOWN") {
                    const now = Date.now();
                    const isDuplicate =
                      (now - lastExecutedTimeRef.current < 900 && lastExecutedActionRef.current === parsed.action) ||
                      (now - lastExecutedTimeRef.current < 300);

                    if (!isDuplicate) {
                      handledResultIndexSetRef.current.add(i);
                      lastInterimExecutedPhraseRef.current = transcript.toLowerCase();
                      setLiveTranscript("");
                      executeCommand(parsed, transcript);
                    }
                  }
                }
              } else {
                // Final result from browser
                setLiveTranscript("");
                const normTranscript = transcript.toLowerCase();

                // If already triggered during real-time interim streaming, do not execute twice
                if (
                  handledResultIndexSetRef.current.has(i) ||
                  lastInterimExecutedPhraseRef.current === normTranscript
                ) {
                  handledResultIndexSetRef.current.add(i);
                  continue;
                }

                handledResultIndexSetRef.current.add(i);
                const parsed = parseVoiceCommand(transcript, propsRef.current.patients);
                executeCommand(parsed, transcript);
              }
            }

            // Prune set if it grows large
            if (handledResultIndexSetRef.current.size > 50) {
              handledResultIndexSetRef.current.clear();
            }
          } catch {
            // Safe catch
          }
        };

        rec.onerror = (e: any) => {
          const errorType = e?.error || "unknown";
          if (errorType === "no-speech" || errorType === "aborted") {
            // Benign browser silence timeout or abort; onend will automatically restart fresh
            return;
          }

          if (errorType === "not-allowed" || errorType === "service-not-allowed") {
            isTerminated = true;
            setIsListening(false);
            isListeningInternalRef.current = false;
            propsRef.current.onToggleHandsFree(false);
            setActiveFeedback({
              text: "Micrófono no autorizado en este visor",
              action: "Abre la aplicación en una pestaña independiente para dictar sin restricciones, o prueba los comandos desde la guía (?).",
              isSuccess: false,
            });
            if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
            feedbackTimeoutRef.current = setTimeout(() => setActiveFeedback(null), 5000);
          }
        };

        rec.onend = () => {
          setIsListening(false);
          isListeningInternalRef.current = false;
          setLiveTranscript("");
          handledResultIndexSetRef.current.clear();
          lastInterimExecutedPhraseRef.current = "";
          activeRecRef.current = null;

          // Crucial: W3C speech spec requires a fresh SpeechRecognition instance after onend.
          // Restarting freshly ensures speech recognition NEVER expires after first command!
          if (!isTerminated && handsFreeActive && !isChairModeOpen) {
            if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
            restartTimerRef.current = setTimeout(() => {
              safeStartSession();
            }, 180);
          }
        };

        activeRecRef.current = rec;
        rec.start();
      } catch {
        // Schedule recovery if browser threw on start
        if (!isTerminated && handsFreeActive && !isChairModeOpen) {
          if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
          restartTimerRef.current = setTimeout(() => {
            safeStartSession();
          }, 600);
        }
      }
    }

    // Launch initial recognition session
    safeStartSession();

    // Active Watchdog: Reconnects automatically if browser went idle or stalled
    const watchdogInterval = setInterval(() => {
      if (!isTerminated && handsFreeActive && !isChairModeOpen && !isListeningInternalRef.current) {
        safeStartSession();
      }
    }, 3500);

    return () => {
      isTerminated = true;
      clearInterval(watchdogInterval);
      if (restartTimerRef.current) {
        clearTimeout(restartTimerRef.current);
        restartTimerRef.current = null;
      }
      setIsListening(false);
      isListeningInternalRef.current = false;
      setLiveTranscript("");
      if (activeRecRef.current) {
        try {
          activeRecRef.current.abort();
        } catch {}
        activeRecRef.current = null;
      }
    };
  }, [handsFreeActive, isChairModeOpen, executeCommand]);

  const commandCategories = [
    {
      category: "👤 Pacientes & Expedientes",
      color: "from-blue-500/10 to-indigo-500/10 border-blue-500/20 text-blue-400",
      commands: [
        { phrase: 'Ficha de [Nombre]', desc: 'Busca y abre la ficha médica del paciente en la estación clínica (Ej: "Ficha de Carlos González", "Ficha de María").' },
        { phrase: 'Buscar paciente [Nombre]', desc: 'Carga el expediente coincidente de la lista.' },
        { phrase: 'Cerrar paciente / Cambiar paciente', desc: 'Deselecciona el paciente actual y vuelve al selector de expedientes clínicos.' },
        { phrase: 'Nuevo paciente / Registrar paciente', desc: 'Abre directamente el formulario de registro de un nuevo paciente.' },
      ],
    },
    {
      category: "🩺 Clínica & Odontología",
      color: "from-teal-500/10 to-emerald-500/10 border-teal-500/20 text-teal-400",
      commands: [
        { phrase: 'Odontograma / Ver odontograma', desc: 'Abre el odontograma anatómico interactivo a 5 caras.' },
        { phrase: 'Periodontograma / Sondaje', desc: 'Abre el periodontograma paramétrico a 6 puntos con registro de bolsas.' },
        { phrase: 'Radiografías / Rayos X', desc: 'Abre la galería de radiografías digitales y visor de contraste.' },
        { phrase: 'Presupuesto / Plan de tratamiento', desc: 'Abre el cotizador y plan de tratamiento con aranceles.' },
        { phrase: 'Notas SOAP / Evolución', desc: 'Abre el historial de notas clínicas y evolución asistida por IA.' },
        { phrase: 'Índice de O\'Leary / Placa bacteriana', desc: 'Abre el control de placa bacteriana y cálculo porcentual.' },
        { phrase: 'Riesgo PRA / Evaluación PRA', desc: 'Abre la matriz de riesgo periodontal de Lang & Tonetti.' },
      ],
    },
    {
      category: "🎨 Pantalla & Entorno Visual",
      color: "from-amber-500/10 to-orange-500/10 border-amber-500/20 text-amber-400",
      commands: [
        { phrase: 'Modo oscuro / Activar modo oscuro', desc: 'Cambia la interfaz a tema oscuro de alta fidelidad Cosmic Slate.' },
        { phrase: 'Modo claro / Activar modo claro', desc: 'Cambia la interfaz al tema claro de alto contraste.' },
        { phrase: 'Modo Zen / Pantalla limpia', desc: 'Maximiza el área clínica ocultando barras y menús distractoras.' },
        { phrase: 'Salir de Zen / Desactivar Zen', desc: 'Restaura la navegación estándar y barras laterales.' },
        { phrase: 'Modo sillón / Activar sillón', desc: 'Abre la consola de sillón con botones gigantes XL y dictado clínico.' },
      ],
    },
    {
      category: "🚀 Navegación General",
      color: "from-purple-500/10 to-pink-500/10 border-purple-500/20 text-purple-400",
      commands: [
        { phrase: 'Agenda / Calendario', desc: 'Abre el calendario de citas médicas.' },
        { phrase: 'Pacientes / Expedientes', desc: 'Abre el directorio completo de pacientes.' },
        { phrase: 'Flujo / Sillones / Sala de espera', desc: 'Abre el monitor de flujo y ocupación de sillones.' },
        { phrase: 'Dashboard / Inicio', desc: 'Regresa al panel de control y resumen general.' },
        { phrase: 'Finanzas / Caja', desc: 'Abre el balance financiero y caja diaria.' },
        { phrase: 'Ajustes / Configuración', desc: 'Abre el centro de integraciones, aranceles y preferencias.' },
      ],
    },
    {
      category: "⚡ Utilidades Rápidas",
      color: "from-cyan-500/10 to-sky-500/10 border-cyan-500/20 text-cyan-400",
      commands: [
        { phrase: 'Buscar / Abrir buscador', desc: 'Abre la barra de búsqueda universal (equivalente a Ctrl+K).' },
        { phrase: 'Dentito / Copiloto', desc: 'Abre el asistente de inteligencia artificial clínica.' },
        { phrase: 'Cajón de aplicaciones / Abrir apps', desc: 'Despliega el menú rápido de utilidades clínicas.' },
        { phrase: 'Seguridad / Centro HIPAA', desc: 'Abre el panel de trazabilidad y privacidad de datos ePHI.' },
        { phrase: 'Modo privacidad', desc: 'Enmascara datos sensibles de pacientes en pantalla.' },
        { phrase: 'Silencio / Pausar voz', desc: 'Pausa el micrófono y la escucha de comandos.' },
      ],
    },
  ];

  const filteredCategories = commandCategories.map((cat) => {
    if (!searchHelpQuery.trim()) return cat;
    const q = searchHelpQuery.toLowerCase();
    const filteredCmds = cat.commands.filter(
      (c) => c.phrase.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q)
    );
    return { ...cat, commands: filteredCmds };
  }).filter((cat) => cat.commands.length > 0);

  return (
    <>
      {/* Real-time live speech transcript pill while speaking (Mobile-optimized position and width) */}
      <AnimatePresence>
        {liveTranscript && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="fixed top-16 sm:top-4 left-1/2 -translate-x-1/2 z-[1099] px-3.5 sm:px-4 py-1.5 rounded-full bg-slate-950/95 border border-teal-500/60 text-teal-300 text-xs font-mono flex items-center gap-2 shadow-2xl backdrop-blur-md pointer-events-none w-[90vw] sm:w-auto max-w-sm sm:max-w-md justify-center"
          >
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            <span className="text-slate-400 text-[10.5px] sm:text-[11px] shrink-0">Oyendo:</span>
            <span className="font-bold text-white text-[11px] sm:text-[11.5px] truncate">
              "{liveTranscript}"
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Voice Control Indicator / HUD (Floating Top Notification, Responsive for mobile screens) */}
      <AnimatePresence>
        {activeFeedback && (
          <motion.div
            initial={{ opacity: 0, y: -24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 450, damping: 30 }}
            className={`fixed top-16 sm:top-5 left-1/2 -translate-x-1/2 z-[1100] px-3.5 sm:px-6 py-2.5 sm:py-3 rounded-2xl shadow-2xl backdrop-blur-xl border flex items-center gap-3 w-[94vw] sm:w-auto max-w-lg pointer-events-auto ${
              activeFeedback.isSuccess
                ? "bg-slate-900/95 text-white border-teal-500/50 shadow-teal-950/40"
                : "bg-slate-900/95 text-slate-100 border-amber-500/40 shadow-amber-950/30"
            }`}
          >
            {/* Pulsing indicator */}
            <div className="relative flex items-center justify-center shrink-0 w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400">
              {activeFeedback.isSuccess ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <Radio className="w-5 h-5 text-amber-400 animate-pulse" />
              )}
            </div>

            <div className="min-w-0 pr-1 flex-1">
              <div className="flex items-center gap-1.5 text-[9.5px] sm:text-[10px] uppercase font-mono tracking-wider text-teal-300">
                <Mic className="w-3 h-3 text-teal-400" />
                <span>Comando de Voz</span>
              </div>
              <p className="text-xs sm:text-sm font-bold text-white truncate">
                {activeFeedback.action}
              </p>
              <p className="text-[10px] sm:text-[10.5px] text-slate-400 truncate">
                Escuchado: <span className="italic text-slate-300">{activeFeedback.text}</span>
              </p>
            </div>

            <button
              type="button"
              onClick={() => setActiveFeedback(null)}
              className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0 cursor-pointer"
              aria-label="Cerrar notificación de voz"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Interactive Voice Commands Help Modal / Bottom-Sheet on Mobile */}
      <AnimatePresence>
        {showHelpModal && (
          <div className="fixed inset-0 z-[1200] flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 30 }}
              transition={{ type: "spring", damping: 28, stiffness: 350 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-3xl max-h-[92vh] sm:max-h-[90vh] flex flex-col overflow-hidden text-slate-900 dark:text-white"
            >
              {/* Mobile Drag Handle Indicator */}
              <div className="w-10 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto my-2 sm:hidden shrink-0" />

              {/* Header */}
              <div className="px-4 py-3 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-teal-500/10 via-transparent to-transparent shrink-0">
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center border border-teal-500/30 shrink-0">
                    <Mic className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm sm:text-lg font-bold font-display flex items-center gap-1.5 sm:gap-2 truncate">
                      <span>Control por Voz</span>
                      <span className="text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-600 dark:text-teal-300 border border-teal-500/30 uppercase shrink-0">
                        Manos Libres
                      </span>
                    </h3>
                    <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">
                      Habla con naturalidad para navegar y operar PerioDash.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      const next = !soundFeedbackEnabled;
                      setSoundFeedbackEnabled(next);
                      localStorage.setItem("perioVoiceSoundFeedback", String(next));
                    }}
                    className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer min-h-[40px] min-w-[40px] justify-center ${
                      soundFeedbackEnabled
                        ? "bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700"
                    }`}
                    title={soundFeedbackEnabled ? "Tono acústico de confirmación activado" : "Tono acústico silenciado"}
                  >
                    {soundFeedbackEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    <span className="hidden md:inline text-[11px]">
                      {soundFeedbackEnabled ? "Tono Activo" : "Silencio"}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowHelpModal(false)}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                    aria-label="Cerrar modal"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Status Bar inside modal */}
              <div className="px-4 sm:px-6 py-2.5 sm:py-3 bg-slate-50 dark:bg-slate-850 border-b border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 text-xs shrink-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                      isListening ? "bg-emerald-500 animate-ping" : "bg-slate-400"
                    }`}
                  />
                  <span className="font-semibold text-slate-700 dark:text-slate-300 text-xs">
                    Estado:{" "}
                    {isListening ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                        🎙️ Micrófono activo y escuchando
                      </span>
                    ) : (
                      <span className="text-slate-500">Pausado en reposo</span>
                    )}
                  </span>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchHelpQuery}
                    onChange={(e) => setSearchHelpQuery(e.target.value)}
                    placeholder="Filtrar comandos..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg text-base sm:text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* Manual Command Tester Box (Responsive stacking on mobile) */}
              <div className="px-4 sm:px-6 py-2.5 bg-teal-500/5 border-b border-teal-500/10 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
                <span className="text-[11px] font-bold text-teal-700 dark:text-teal-400 shrink-0">
                  ⚡ Probar comando:
                </span>
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="text"
                    value={manualTestInput}
                    onChange={(e) => setManualTestInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && manualTestInput.trim()) {
                        const parsed = parseVoiceCommand(manualTestInput, patients);
                        executeCommand(parsed, manualTestInput.trim());
                        setManualTestInput("");
                      }
                    }}
                    placeholder='Ej. "modo oscuro", "odontograma", "ficha de Carlos"'
                    className="flex-1 px-3 py-1.5 text-base sm:text-xs rounded-lg bg-white dark:bg-slate-800 border border-teal-500/20 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (manualTestInput.trim()) {
                        const parsed = parseVoiceCommand(manualTestInput, patients);
                        executeCommand(parsed, manualTestInput.trim());
                        setManualTestInput("");
                      }
                    }}
                    className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 min-h-[38px] flex items-center justify-center touch-manipulation"
                  >
                    Ejecutar
                  </button>
                </div>
              </div>

              {/* Command List Body */}
              <div className="p-4 sm:p-6 overflow-y-auto space-y-5 sm:space-y-6 flex-1 overscroll-contain">
                {filteredCategories.map((cat, idx) => (
                  <div key={idx} className="space-y-2">
                    <h4 className="text-xs font-bold font-display uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                      <span>{cat.category}</span>
                      <span className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
                      {cat.commands.map((cmd, cIdx) => (
                        <div
                          key={cIdx}
                          onClick={() => {
                            // Test execute this command
                            const sampleName = patients[0]?.name || "Carlos González";
                            const testPhrase = cmd.phrase.replace(/\[.*\]/, sampleName);
                            const parsed = parseVoiceCommand(testPhrase, patients);
                            executeCommand(parsed, testPhrase);
                          }}
                          className="p-3 sm:p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 hover:border-teal-500/40 hover:bg-teal-500/5 active:scale-[0.99] transition-all cursor-pointer group flex flex-col justify-between touch-manipulation min-h-[50px]"
                          title="Toca para probar este comando inmediatamente"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-mono font-bold text-teal-700 dark:text-teal-400 group-hover:underline">
                              "{cmd.phrase}"
                            </span>
                            <span className="text-[10px] text-teal-500 font-semibold shrink-0">
                              Probar &rarr;
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                            {cmd.desc}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer (Stack buttons neatly on small screens) */}
              <div className="p-3.5 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 text-xs text-slate-500 dark:text-slate-400 shrink-0">
                <span className="text-[11px] sm:text-xs text-center sm:text-left">
                  💡 Toca cualquier tarjeta o escribe el comando para ejecutarlo al instante.
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof window !== "undefined") {
                        window.open(window.location.href, "_blank");
                      }
                    }}
                    className="flex-1 sm:flex-initial px-3 py-2 sm:py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-semibold cursor-pointer transition-colors shadow-xs text-center min-h-[42px] flex items-center justify-center touch-manipulation"
                    title="Abre la app en pestaña completa para micrófono sin restricciones"
                  >
                    Abrir en pestaña nueva ↗
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowHelpModal(false)}
                    className="flex-1 sm:flex-initial px-4 py-2 sm:py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold cursor-pointer transition-colors min-h-[42px] flex items-center justify-center touch-manipulation"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

/**
 * Direct header button for Voice Control toggling with animated audio pulse.
 */
export function VoiceHeaderControl({
  handsFreeActive,
  onToggleHandsFree,
  onOpenHelp,
}: {
  handsFreeActive: boolean;
  onToggleHandsFree: () => void;
  onOpenHelp: () => void;
}) {
  return (
    <div className="flex items-center gap-1 shrink-0">
      <button
        type="button"
        onClick={onToggleHandsFree}
        className={`flex items-center justify-center gap-1.5 px-2.5 sm:px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95 group shrink-0 min-h-[42px] sm:min-h-[38px] touch-manipulation ${
          handsFreeActive
            ? "bg-teal-600 border-teal-500 text-white shadow-teal-500/25 ring-2 ring-teal-500/30"
            : "bg-white/90 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-700"
        }`}
        title={
          handsFreeActive
            ? "Voz Manos Libres ACTIVA: Di 'Ficha de...', 'Modo oscuro', 'Odontograma', etc."
            : "Voz Manos Libres PAUSADA. Toca para activar."
        }
        aria-label={handsFreeActive ? "Voz manos libres activa. Toca para pausar" : "Voz manos libres pausada. Toca para activar"}
      >
        {handsFreeActive ? (
          <>
            <div className="relative flex items-center justify-center">
              <Mic className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-white animate-pulse" />
              <span className="w-2 h-2 rounded-full bg-emerald-300 absolute -top-1 -right-1 animate-ping" />
            </div>
            <span className="text-[11px] font-bold tracking-tight hidden sm:inline">
              Voz Activa
            </span>
          </>
        ) : (
          <>
            <MicOff className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200" />
            <span className="text-[11px] font-bold tracking-tight text-slate-500 dark:text-slate-400 hidden sm:inline">
              Voz Pausada
            </span>
          </>
        )}
      </button>

      <button
        type="button"
        onClick={onOpenHelp}
        className="p-2 sm:p-1.5 rounded-xl border border-slate-200/80 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors cursor-pointer min-h-[42px] min-w-[42px] sm:min-h-0 sm:min-w-0 flex items-center justify-center touch-manipulation"
        title="Ver y probar comandos de voz disponibles"
        aria-label="Ver comandos de voz disponibles"
      >
        <HelpCircle className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
      </button>
    </div>
  );
}
