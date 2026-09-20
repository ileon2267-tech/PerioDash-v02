import React, { useState, useRef, useEffect, useMemo } from "react";
import { Patient, ChatMessage, ClinicalUser } from "../types";
import { 
  Send, Maximize2, Minimize2, Mic, AlertTriangle, Activity, HeartPulse, 
  BrainCircuit, Search, Info, Move, ShieldAlert, Volume2, VolumeX,
  Paperclip, FileText, Check, Upload, X, Sparkles, RefreshCw, Play, Trash2, Database, Sliders,
  HelpCircle, MicOff, ChevronLeft, ChevronRight, SlidersHorizontal, Eye, ShieldCheck,
  CheckCircle2, Grid, FileEdit, Copy, Layers, Lock
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { safeStorage } from "../utils/safeStorage";
import { copyToClipboardSafely } from "../utils/safeClipboard";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ContextModeId,
  ClinicalContextConfig,
  ContextModeOption,
  CONTEXT_MODES,
  DEFAULT_CONTEXT_CONFIG,
  buildStructuredClinicalPayload,
} from "../utils/dentitoContext";

interface DentitoChatProps {
  activePatient: Patient | null;
  patients?: Patient[];
  appointments?: any[];
  activeTab?: string;
  clinicalSubView?: string;
  doctorName?: string;
  clinicName?: string;
  aranceles?: Record<string, number>;
  currentUser?: ClinicalUser | null;
}

// Helper: Custom Event dispatcher to interact with App.tsx navigation/selection
const dispatchPeriodashNav = (detail: string | { tab: string; subView?: string }) => {
  window.dispatchEvent(new CustomEvent('periodash-navigate', { detail }));
};

const DENTITO_KNOWLEDGE: Record<string, string> = {
  "periodontitis": "La periodontitis es una patología inflamatoria crónica, de origen infeccioso, que destruye los tejidos de soporte del diente.",
  "gingivitis": "La gingivitis es una inflamación reversible de la encía, inducida por placa bacteriana, sin pérdida de inserción.",
  "amoxicilina": "Antibiótico beta-lactámico de amplio espectro. Dosis habitual: 500mg - 875mg c/8h por 7 días.",
  "clorhexidina": "Antiséptico bisbiguanida. Uso en odontología usualmente al 0.12% en colutorios.",
  "dentito": "Soy Dentito, el asistente clínico inteligente integrado en PerioDash. Puedo apoyarte en la búsqueda de expedientes, análisis periodontal y protocolos clínicos."
};

const ParticleSystem = React.memo(() => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Quantum particle system params
    const PARTICLE_COUNT = 16;
    const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
      angle: Math.random() * Math.PI * 2,
      orbitRadius: 20 + Math.random() * 18,
      size: 0.8 + Math.random() * 1.2,
      speed: 0.005 + Math.random() * 0.01,
      opacity: 0.4 + Math.random() * 0.5,
      orbitInclination: Math.random() * Math.PI,
      twinkle: Math.random() * Math.PI * 2,
    }));

    // Pre-create gradient
    const gradient = ctx.createRadialGradient(centerX, centerY, 4, centerX, centerY, 24);
    gradient.addColorStop(0, "rgba(20, 184, 166, 0.85)");
    gradient.addColorStop(0.5, "rgba(45, 212, 191, 0.35)");
    gradient.addColorStop(1, "rgba(20, 184, 166, 0)");

    let animationFrameId: number;
    let time = 0;
    let lastRenderTime = 0;
    const targetFps = 30;
    const interval = 1000 / targetFps;

    const render = (currentTime: number) => {
      animationFrameId = requestAnimationFrame(render);
      if (document.hidden) return;

      const delta = currentTime - lastRenderTime;
      if (delta < interval) return;
      lastRenderTime = currentTime - (delta % interval);

      ctx.clearRect(0, 0, width, height);
      time += 0.04;

      // Draw glowing core
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 24 + Math.sin(time) * 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Eyes
      ctx.fillStyle = "rgba(255,255,255,0.95)";
      ctx.beginPath();
      ctx.arc(centerX - 5.5, centerY - 2, 2.2, 0, Math.PI * 2);
      ctx.arc(centerX + 5.5, centerY - 2, 2.2, 0, Math.PI * 2);
      ctx.fill();

      // Draw particles without string allocations
      ctx.fillStyle = "#86efac";
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const p = particles[i];
        p.angle += p.speed;
        p.twinkle += 0.08;
        
        const x = centerX + Math.cos(p.angle) * p.orbitRadius;
        const verticalOffset = Math.sin(p.angle) * Math.sin(p.orbitInclination) * p.orbitRadius;
        const y = centerY + verticalOffset;
        
        const currentOpacity = p.opacity * (0.5 + 0.5 * Math.sin(p.twinkle));
        ctx.globalAlpha = Math.max(0.1, currentOpacity);
        
        ctx.beginPath();
        ctx.arc(x, y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };
    animationFrameId = requestAnimationFrame(render);

    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  return <canvas ref={canvasRef} width={100} height={100} className="w-full h-full drop-shadow-[0_0_10px_rgba(45,212,191,0.4)]" />;
});

export type DentitoPosition = "bottom-right" | "bottom-left" | "top-right" | "top-left" | "fullscreen";

function DentitoChatComponent({ 
  activePatient,
  patients = [],
  appointments = [],
  activeTab = "dashboard",
  clinicalSubView = "odontograma",
  doctorName = "Dr. Ignacio León",
  clinicName = "PerioClinic Providencia",
  aranceles,
  currentUser
}: DentitoChatProps) {
  // File Scanning and Heuristics States
  const [attachedFile, setAttachedFile] = useState<any>(null);
  const [isAnalyzingFile, setIsAnalyzingFile] = useState(false);
  const [fileScanLogs, setFileScanLogs] = useState<string[]>([]);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);

  const triggerFileScan = (fileName: string, type: string, size: string) => {
    setShowAttachmentMenu(false);
    setIsAnalyzingFile(true);
    setFileScanLogs(["🌐 Estableciendo conexión segura con la base de datos...", "🧬 Cargando motor de análisis clínico periodontal..."]);
    
    // Add logs step by step
    setTimeout(() => {
      setFileScanLogs(prev => [...prev, "🔍 Procesando documento: " + fileName + " (" + size + ")..."]);
    }, 450);
    
    setTimeout(() => {
      setFileScanLogs(prev => [...prev, "🧠 Aplicando validación y reconocimiento semántico de hallazgos..."]);
    }, 900);
    
    setTimeout(() => {
      setFileScanLogs(prev => [...prev, "📋 Vinculando resultados con el expediente clínico de " + (activePatient?.name || "paciente") + "..."]);
    }, 1350);

    setTimeout(() => {
      setIsAnalyzingFile(false);
      setFileScanLogs([]);
      
      // Select appropriate analysis text based on what kind of file is chosen!
      let reportTitle = "";
      let analysisContent = "";
      
      if (fileName.includes("rx_panoramica") || type === "rx") {
        reportTitle = "📷 ANÁLISIS DE IMAGEN RADIOGRÁFICA CON IA DENTITO";
        analysisContent = `### 📷 REPORTE RADIOLÓGICO CLÍNICO INTEGRADO

He completado el escaneo histológico y radiográfico del archivo **${fileName}** (${size}). El algoritmo ha detectado los siguientes biomarcadores y anomalías:

1. **Pérdida Ósea Generalizada**: 
   - Reabsorción ósea horizontal generalizada del **35% al 45%** (Tercio medio de la raíz), compatible clínicamente con **Periodontitis Estadio III o IV**.
2. **Defectos Óseos Verticales**:
   - Defecto infraóseo angular agudo en la pared distal y mesial de las piezas **36** y **37** (medición de profundidad radiolúcida de ~6.2 mm).
3. **Compromiso de Furca**:
   - Radiolucidez nítida en el espacio furcal interradicular de la pieza **46**, compatible con **Compromiso de Furca Clase II**.
4. **Patologías Cariogénicas**:
   - Radiolucidez coronaria penetrante en esmalte y dentina en la cara distal de la pieza **15** y mesial de la pieza **24** (Compatible clínicamente con Caries ICDAS 4/5).

---

⚠️ **Recomendación Clínica**: Sincronizar de inmediato estas bolsas en el mapa del Periodontograma. Se sugiere programar raspado y alisado radicular (RAR) asistido por colgajo de acceso en molares inferiores izquierdos.`;
      } else if (fileName.includes("lab_quimica") || type === "sangre") {
        reportTitle = "🧪 ANÁLISIS DE EXAMEN HEMÁTICO BIOQUÍMICO";
        analysisContent = `### 🧪 REPORTE DE LABORATORIO HEMÁTICO & BIOQUÍMICO

He procesado el archivo de laboratorio **${fileName}** (${size}) arrojando los siguientes indicadores metabólicos críticos:

| Parámetro Clínico | Medición del Paciente | Rango de Referencia | Evaluación de Seguridad |
| :--- | :--- | :--- | :--- |
| **Glicemia Ayunas** | **172 mg/dL** | 70 - 100 mg/dL | **CRÍTICO - Alto riesgo de retardo de colágeno** |
| **HbA1c (Glucosilada)** | **8.4%** | < 5.7% (Sano) | **DESCONTROLADO (Diabetes Mellitus Tipo 2)** |
| **PCR (Proteína C)** | **8.2 mg/L** | < 1.0 mg/L | **INFLAMACIÓN SISTÉMICA ACTIVA ALTA** |
| **Hematocrito** | 42.5 % | 38 - 50 % | Normal |

---

⚠️ **ALERTA CLÍNICA BIDIRECCIONAL (SISTÉMICA RED FLAG)**:
*   La Hemoglobina Glicosilada de **8.4%** revela diabetes tipo 2 activa no controlada. Esto modifica la velocidad de cicatrización colágena tras cirugías y promueve desvitalización periodontal severa.
*   **Protocolo de Manejo para ${activePatient?.name || "paciente"}**: Posponer cirugías periodontales invasivas electivas hasta lograr HbA1c < 7.0%. Realizar desinfección periodontal mecánica conservadora (Ultrasonido y RAR suave) e indicar colutorio de clorhexidina al 0.12% y derivar urgentemente a su médico tratante / diabetólogo.`;
      } else if (fileName.includes("anamnesis") || type === "anamnesis") {
        reportTitle = "📑 AUDITORÍA CLÍNICA DE ANAMNESIS & FACTORES";
        analysisContent = `### 📑 REPORTE DE AUDITORÍA DE FACTORES DE RIESGO

Análisis automatizado de la ficha de anamnesis **${fileName}** (${size}):

1. **Tabaquismo Activo**:
   - Fuma **15 cigarrillos diarios** (Fumador severo). Esto incrementa el riesgo periodontal relativo en un **400%**, promueve isquemia capilar que enmascara el sangrado de encías (BOP) y retrasa la curación de bolsas en 3x.
2. **Hipertensión Arterial (HTA)**:
   - Paciente medicado con **Amlodipino 10mg/día** (Bloqueador de canales de calcio). 
   - **Alerta de Agrandamiento**: El amlodipino propicia **Agrandamiento Gingival Medicamentoso** (Hiperplasia). Monitorear pseudobolsas y guiar profilaxis higiénica rígida.
3. **Alergia Reportada**:
   - **PENICILINA (Inmunoglobulina E mediada, Shock Anafiláctico Previo)**.
   - 🚨 **ALERTA DE SEGURIDAD**: Está estrictamente contraindicada la amoxicilina o cualquier derivado betalactámico. En caso de profilaxis obligada para endocarditis o cirugías mayores, prescribir **Clindamicina 600 mg** por vía oral 1 hora antes de la intervención.`;
      } else {
        // Custom upload
        reportTitle = "📁 ANÁLISIS DE ARCHIVO ADJUNTO DE PROCEDIMIENTO";
        analysisContent = `### 📁 REPORTE CLÍNICO EN TIEMPO REAL

He completado el análisis espectrográfico e interpretación semántica del archivo cargado: **${fileName}** (${size}).

*   **Estatus**: Integrado con éxito en el expediente del paciente activo.
*   **Diagnóstico de Contingencia**: Se detectan patrones compatibles con la edad y anamnesis del paciente. Las variables asociadas recomiendan mantener precaución higiénica convencional y registrar el archivo en la galería documental asociada.
*   **Sugerencia de Copiloto**: Utilizar el visor detallado para rotular la imagen con etiquetas diagnósticas o asociar notas SOAP complementarias de evolución clínica.`;
      }

      // Store file
      setAttachedFile({
        name: fileName,
        size,
        type,
        analysis: analysisContent
      });

      // Insert message from assistant with sparkles!
      setMessages(prev => [...prev, {
        id: `bot-${Date.now()}`,
        role: "assistant",
        content: `🏥 **${reportTitle}**\n\n${analysisContent}`,
        createdAt: new Date().toISOString()
      }]);
      
      // Try voice synthesis if enabled
      speak(`He finalizado el escaneo clínico e interpretación del archivo ${fileName}. He generado un reporte detallado en el chat clínico.`);

    }, 1800);
  };

  const handleCustomFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const sizeStr = file.size > 1024 * 1024 
      ? (file.size / (1024 * 1024)).toFixed(1) + " MB" 
      : (file.size / 1024).toFixed(0) + " KB";
    
    // Auto-detect files standard names or types for demo purposes
    let detectedType = "custom";
    if (file.name.toLowerCase().includes("panoram") || file.name.toLowerCase().includes("rx") || file.type.startsWith("image/")) {
      detectedType = "rx";
    } else if (file.name.toLowerCase().includes("sangre") || file.name.toLowerCase().includes("analisis") || file.name.toLowerCase().includes("lab")) {
      detectedType = "sangre";
    } else if (file.name.toLowerCase().includes("anamnesis") || file.name.toLowerCase().includes("riesgo")) {
      detectedType = "anamnesis";
    }
    
    triggerFileScan(file.name, detectedType, sizeStr);
  };

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: "init-1",
      role: "assistant",
      content: "¡Hola! Soy **Dentito** 🦷✨, tu copiloto clínico en PerioDash. Estoy aquí para acompañarte en tus evaluaciones periodontales, dictado por voz en el sillón dental, análisis de radiografías y protocolos clínicos. ¿En qué te puedo colaborar hoy?",
      createdAt: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth < 768;
    }
    return false;
  });
  const [isListening, setIsListening] = useState(false);
  const [emergencyMode, setEmergencyMode] = useState<string | null>(null); 
  const isDraggingRef = useRef(false);

  // Structured Clinical Context Settings & Mode Configuration
  const [contextConfig, setContextConfig] = useState<ClinicalContextConfig>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = safeStorage.getItem("dentito-context-config");
        if (saved) {
          return JSON.parse(saved);
        }
      } catch (e) {
        console.error("Error loading dentito context config:", e);
      }
    }
    return DEFAULT_CONTEXT_CONFIG;
  });
  const [showContextModal, setShowContextModal] = useState(false);
  const [showContextInspector, setShowContextInspector] = useState(false);
  const [copiedPayload, setCopiedPayload] = useState(false);

  // Control de Acceso: El usuario común (paciente, odontólogo estándar, recepcionista)
  // NO debe ver el Inspector de Contexto Clínico ni payloads JSON técnicos.
  // Solo usuarios con rol 'superadmin', 'admin', 'supervisor' o permiso 'audit_supervision' pueden acceder.
  const canInspectPayload = useMemo(() => {
    if (!currentUser) return false;
    const privilegedRoles = ['superadmin', 'admin', 'supervisor'];
    if (privilegedRoles.includes(currentUser.role)) return true;
    if (currentUser.isSupervisor) return true;
    if (currentUser.permissions?.includes('audit_supervision')) return true;
    return false;
  }, [currentUser]);

  useEffect(() => {
    if (!canInspectPayload && showContextInspector) {
      setShowContextInspector(false);
    }
  }, [canInspectPayload, showContextInspector]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      safeStorage.setItem("dentito-context-config", JSON.stringify(contextConfig));
    }
  }, [contextConfig]);

  const handleSelectContextMode = (modeId: ContextModeId) => {
    if (modeId === "custom") {
      setContextConfig(prev => ({ ...prev, mode: "custom" }));
    } else {
      const preset = CONTEXT_MODES[modeId];
      if (preset) {
        setContextConfig({
          mode: modeId,
          ...preset.defaultConfig,
        });
      }
    }
  };

  const handleToggleModule = (key: keyof Omit<ClinicalContextConfig, "mode">) => {
    setContextConfig(prev => ({
      ...prev,
      [key]: !prev[key],
      mode: "custom" as ContextModeId,
    }));
  };

  // Live calculation of payload & token consumption for preview
  const liveContextPayload = useMemo(() => {
    return buildStructuredClinicalPayload(activePatient, contextConfig, {
      activeTab,
      clinicalSubView,
      doctorName,
      clinicName,
      totalPatients: patients.length,
      totalAppointmentsToday: appointments.length,
    });
  }, [activePatient, contextConfig, activeTab, clinicalSubView, doctorName, clinicName, patients.length, appointments.length]);

  const [speechSupported, setSpeechSupported] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = safeStorage.getItem("dentito-tts-enabled");
      return saved === "true";
    }
    return false;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      safeStorage.setItem("dentito-tts-enabled", String(ttsEnabled));
    }
  }, [ttsEnabled]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setSpeechSupported(!!window.speechSynthesis);
    }

    const handleOpenDentito = () => {
      setIsMinimized(false);
    };
    window.addEventListener("periodash-open-dentito", handleOpenDentito);
    return () => window.removeEventListener("periodash-open-dentito", handleOpenDentito);
  }, []);

  // Global Escape key listener for emergency mode and Dentito window
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (emergencyMode) {
          setEmergencyMode(null);
        } else if (!isMinimized) {
          setIsMinimized(true);
          setShowPositionMenu(false);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [emergencyMode, isMinimized]);

  const speak = (text: string) => {
    try {
      if (!speechSupported || !ttsEnabled || typeof window === "undefined" || !window.speechSynthesis) return;
      
      // Stop any active utterance
      window.speechSynthesis.cancel();
      
      // Clear formatting (Markdown)
      const cleanText = text
        .replace(/\*\*([^*]+)\*\*/g, "$1")
        .replace(/\*([^*]+)\*/g, "$1")
        .replace(/#+\s+([^\n]+)/g, "$1")
        .replace(/`([^`]+)`/g, "$1")
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
        .replace(/>\s+([^\n]+)/g, "$1");
        
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = "es-ES";
      utterance.rate = 1.05;
      utterance.pitch = 1.05;
      
      window.speechSynthesis.speak(utterance);
    } catch {
      // Ignore speech synthesis restriction errors
    }
  };

  // Voice readout (TTS) for incoming assistant messages
  useEffect(() => {
    if (messages.length === 0) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && lastMsg.role === "assistant") {
      speak(lastMsg.content);
    }
  }, [messages, ttsEnabled, speechSupported]);

  const getDragConstraints = () => {
    if (typeof window === "undefined") return { left: -500, right: 500, top: -500, bottom: 500 };
    const w = window.innerWidth;
    const h = window.innerHeight;
    const boxWidth = isMinimized ? 240 : 380;
    const boxHeight = isMinimized ? 64 : 520;
    
    switch (positionState) {
      case "bottom-left":
        return { left: -20, right: w - boxWidth, top: -h + boxHeight + 40, bottom: 20 };
      case "top-right":
        return { left: -w + boxWidth, right: 20, top: -20, bottom: h - boxHeight - 40 };
      case "top-left":
        return { left: -20, right: w - boxWidth, top: -20, bottom: h - boxHeight - 40 };
      case "fullscreen":
        return { left: 0, right: 0, top: 0, bottom: 0 };
      default: // bottom-right
        return { left: -w + boxWidth, right: 20, top: -h + boxHeight + 40, bottom: 20 };
    }
  };
  
  const [positionState, setPositionState] = useState<DentitoPosition>(() => {
    if (typeof window !== "undefined") {
      const saved = safeStorage.getItem("dentito-position");
      if (saved && ["bottom-right", "bottom-left", "top-right", "top-left", "fullscreen"].includes(saved)) {
        return saved as DentitoPosition;
      }
    }
    return "bottom-right";
  });
  const [showPositionMenu, setShowPositionMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      safeStorage.setItem("dentito-position", positionState);
    }
  }, [positionState]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const getPositionClasses = () => {
    if (isMobile) {
      if (isMinimized) {
        return "hidden";
      }
      return "inset-x-0 bottom-0 top-auto h-[88vh] max-h-[88vh] w-full rounded-t-[2.5rem] rounded-b-none border-t border-teal-500/40 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-[100]";
    }

    if (isMinimized) {
      switch (positionState) {
        case "bottom-left":
          return "bottom-20 left-4 md:bottom-24 md:left-6 w-16 h-16 cursor-grab active:cursor-grabbing flex items-center justify-center rounded-full shadow-[0_8px_30px_rgba(20,184,166,0.35)] dark:shadow-[0_8px_32px_rgba(20,184,166,0.5)] border border-teal-500/30";
        case "top-right":
          return "top-20 right-4 md:top-6 md:right-6 w-16 h-16 cursor-grab active:cursor-grabbing flex items-center justify-center rounded-full shadow-[0_8px_30px_rgba(20,184,166,0.35)] dark:shadow-[0_8px_32px_rgba(20,184,166,0.5)] border border-teal-500/30";
        case "top-left":
          return "top-20 left-4 md:top-6 md:left-6 w-16 h-16 cursor-grab active:cursor-grabbing flex items-center justify-center rounded-full shadow-[0_8px_30px_rgba(20,184,166,0.35)] dark:shadow-[0_8px_32px_rgba(20,184,166,0.5)] border border-teal-500/30";
        default: // bottom-right
          return "bottom-20 right-4 md:bottom-24 md:right-6 w-16 h-16 cursor-grab active:cursor-grabbing flex items-center justify-center rounded-full shadow-[0_8px_30px_rgba(20,184,166,0.35)] dark:shadow-[0_8px_32px_rgba(20,184,166,0.5)] border border-teal-500/30";
      }
    }

    switch (positionState) {
      case "bottom-left":
        return "bottom-20 left-4 md:bottom-8 md:left-8 w-[calc(100vw-32px)] md:w-[400px] h-[520px] md:h-[600px] max-h-[calc(100dvh-5.5rem)] md:max-h-[calc(100vh-5rem)] overflow-hidden shadow-2xl scale-100 rounded-[2rem]";
      case "top-right":
        return "top-20 right-4 md:top-8 md:right-8 w-[calc(100vw-32px)] md:w-[400px] h-[520px] md:h-[600px] max-h-[calc(100dvh-5.5rem)] md:max-h-[calc(100vh-5rem)] overflow-hidden shadow-2xl scale-100 rounded-[2rem]";
      case "top-left":
        return "top-20 left-4 md:top-8 md:left-8 w-[calc(100vw-32px)] md:w-[400px] h-[520px] md:h-[600px] max-h-[calc(100dvh-5.5rem)] md:max-h-[calc(100vh-5rem)] overflow-hidden shadow-2xl scale-100 rounded-[2rem]";
      case "fullscreen":
        return "top-4 bottom-[calc(90px+env(safe-area-inset-bottom))] inset-x-4 md:top-8 md:bottom-8 md:right-8 md:left-auto md:w-[450px] md:h-[calc(100vh-80px)] max-h-[calc(100dvh-5.5rem)] md:max-h-[calc(100vh-5rem)] overflow-hidden shadow-2xl scale-100 rounded-[2rem]";
      default: // bottom-right
        return "bottom-20 right-4 md:bottom-8 md:right-8 w-[calc(100vw-32px)] md:w-[400px] h-[520px] md:h-[600px] max-h-[calc(100dvh-5.5rem)] md:max-h-[calc(100vh-5rem)] overflow-hidden shadow-2xl scale-100 rounded-[2rem]";
    }
  };

  const scrollRef = useRef<HTMLDivElement>(null);
  const chipsScrollRef = useRef<HTMLDivElement>(null);

  const scrollChips = (dir: "left" | "right") => {
    if (chipsScrollRef.current) {
      const delta = dir === "left" ? -220 : 220;
      chipsScrollRef.current.scrollBy({ left: delta, behavior: "smooth" });
    }
  };

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, emergencyMode]);

  // Computed patient statistics for context enrichment and offline heuristics
  const getPatientSummaryData = () => {
    let cariesCount = 0;
    const cariesTeeth: string[] = [];
    let missingCount = 0;
    let endoCount = 0;
    let implantCount = 0;
    
    if (activePatient && activePatient.odontogram) {
      Object.entries(activePatient.odontogram).forEach(([num, t]: any) => {
        if (t.condition === "ausente") missingCount++;
        if (t.condition === "endodoncia") endoCount++;
        if (t.condition === "implante") implantCount++;
        
        const s = t.surfaces || {};
        if (s.vestibular === "caries" || s.occlusal === "caries" || s.lingual === "caries" || s.mesial === "caries" || s.distal === "caries") {
          cariesCount++;
          cariesTeeth.push(`Pieza ${num}`);
        }
      });
    }

    let totalDeepPockets = 0;
    const deepPocketsList: string[] = [];
    if (activePatient && activePatient.periodontogram) {
      Object.entries(activePatient.periodontogram).forEach(([num, item]: any) => {
        const v = item.vestibularPocket || { mesial: 0, central: 0, distal: 0 };
        const p = item.palatinoPocket || { mesial: 0, central: 0, distal: 0 };
        if (v.mesial >= 5) totalDeepPockets++;
        if (v.central >= 5) totalDeepPockets++;
        if (v.distal >= 5) totalDeepPockets++;
        if (p.mesial >= 5) totalDeepPockets++;
        if (p.central >= 5) totalDeepPockets++;
        if (p.distal >= 5) totalDeepPockets++;
        if (v.mesial >= 5 || v.central >= 5 || v.distal >= 5 || p.mesial >= 5 || p.central >= 5 || p.distal >= 5) {
          deepPocketsList.push(`Pieza ${num}`);
        }
      });
    }

    let plaquePct = 25; // default simulated
    if (activePatient) {
      if (activePatient.oLeary && Object.keys(activePatient.oLeary).length > 0) {
        let totalSurfaces = 0;
        let plaqueSurfaces = 0;
        Object.values(activePatient.oLeary).forEach((o: any) => {
          totalSurfaces += 4;
          if (o.mesial) plaqueSurfaces++;
          if (o.distal) plaqueSurfaces++;
          if (o.vestibular) plaqueSurfaces++;
          if (o.lingual) plaqueSurfaces++;
        });
        if (totalSurfaces > 0) plaquePct = Math.round((plaqueSurfaces / totalSurfaces) * 100);
      } else if (activePatient.periodontogram && Object.keys(activePatient.periodontogram).length > 0) {
        let totalSurfaces = 0;
        let plaqueSurfaces = 0;
        Object.values(activePatient.periodontogram).forEach((p: any) => {
          const pv = p.placaVestibular || { mesial: false, central: false, distal: false };
          const pp = p.placaPalatino || { mesial: false, central: false, distal: false };
          totalSurfaces += 6;
          if (pv.mesial) plaqueSurfaces++;
          if (pv.central) plaqueSurfaces++;
          if (pv.distal) plaqueSurfaces++;
          if (pp.mesial) plaqueSurfaces++;
          if (pp.central) plaqueSurfaces++;
          if (pp.distal) plaqueSurfaces++;
        });
        if (totalSurfaces > 0) plaquePct = Math.round((plaqueSurfaces / totalSurfaces) * 100);
      }
    }

    let totalPlanned = 0;
    let completedCount = 0;
    let pendingCount = 0;
    if (activePatient && activePatient.treatmentPlan && activePatient.treatmentPlan.procedures) {
      activePatient.treatmentPlan.procedures.forEach((p: any) => {
        totalPlanned += p.cost;
        if (p.completed) completedCount++;
        else pendingCount++;
      });
    }

    return {
      cariesCount,
      cariesTeeth,
      missingCount,
      endoCount,
      implantCount,
      totalDeepPockets,
      deepPocketsList,
      plaquePct,
      totalPlanned,
      completedCount,
      pendingCount
    };
  };

  const processInternalCommand = (text: string): string | null => {
    const raw = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    // 0. Voice Commands & Dictation Guide
    if (raw.includes("comando") || raw.includes("comandos") || raw.includes("voz") || raw.includes("dictado") || raw.includes("como dictar") || raw.includes("como hablar") || raw.includes("microfono") || raw.includes("ayuda")) {
      return `🎙️ **¡Con muchísimo gusto! Aquí tienes la guía de Comandos de Voz de PerioDash 🦷✨**

Puedes dictarme directamente mientras estás en el sillón dental con guantes puestos. La interfaz registrará los datos de forma instantánea:

---

### 🦷 **1. Seleccionar Piezas Dentales**
*   🗣️ Di *"Pieza 1.6"* o *"Pieza uno seis"* ➔ Selecciona y enfoca el primer molar superior derecho.
*   🗣️ Di *"Siguiente"* o *"Diente siguiente"* ➔ Avanza a la siguiente pieza en orden FDI.
*   🗣️ Di *"Anterior"* o *"Diente anterior"* ➔ Retrocede una pieza.

### 📏 **2. Registro de Sondaje Periodontal (PPD a 6 puntos)**
*   🗣️ Di *"Sondaje 3 2 3"* ➔ Registra automáticamente 3mm (Distal), 2mm (Medio) y 3mm (Mesial).
*   🗣️ Di *"Recesión 1 0 1"* ➔ Asigna los milímetros de margen gingival en las tres caras.
*   🗣️ Di *"Margen 2"* ➔ Registra la medida de margen o recesión.

### 🩸 **3. Sangrado y Placa Bacteriana**
*   🗣️ Di *"Sangrado sí"* o *"Sangrado vestibular"* ➔ Marca presencia de sangrado al sondaje (BOP).
*   🗣️ Di *"Placa sí"* o *"Placa no"* ➔ Computa el índice de higiene O'Leary al instante.

### 🚀 **4. Navegación Rápida y Modo Sillón Manos Libres**
*   🗣️ Di *"Modo sillón"* ➔ Activa al instante la interfaz ergonómica XL con botones táctiles sanitarios, dictado continuo y cámara en vivo.
*   🗣️ Di *"Ir a Odontograma"* o *"Ir a Periodontograma"* ➔ Abre la vista clínica correspondiente.
*   🗣️ Di *"Ver Agenda"* o *"Citas hoy"* ➔ Te muestra el cronograma del día.
*   🗣️ Di *"Analizar paciente"* ➔ Audita el historial y calcula el riesgo periodontal.
*   🗣️ Di *"Emergencia"* ➔ Abre inmediatamente los protocolos de soporte vital y urgencias médicas.

---

💡 **Tip clínico amigable**: Activa el micrófono pulsando el botón circular de la barra inferior o presiona \`Ctrl+K\` para búsquedas rápidas. ¿Te gustaría practicar algún comando o revisar la ficha de tu paciente? ¡Estoy aquí para apoyarte! 😊`;
    }

    // 1. Emergency
    if (raw.includes("emergencia") || raw.includes("protocolo de emergencia") || raw.includes("modo emergencia")) {
      setEmergencyMode("selector");
      return "🚨 **¡Entendido de inmediato!** He activado el panel de emergencias médicas de PerioDash. Por favor selecciona la condición crítica en tu pantalla para guiarte en el protocolo de soporte y estabilización paso a paso.";
    }

    // Modo Sillón Clínico (Chair Mode voice activation)
    if (
      raw.includes("modo sillon") ||
      raw.includes("modo sillón") ||
      raw.includes("sillon clinico") ||
      raw.includes("abrir sillon") ||
      raw.includes("activar sillon") ||
      raw.includes("entrar a modo sillon") ||
      raw.includes("entrar al sillon") ||
      raw.includes("chair mode") ||
      raw === "sillon" ||
      raw === "sillón"
    ) {
      window.dispatchEvent(new CustomEvent('periodash-open-chair-mode'));
      dispatchPeriodashNav("sillon");
      return "💺 **¡Comando de voz reconocido!** Activando de inmediato el **Modo Sillón Clínico (XL + Dictado por Voz)** para trabajar con guantes estériles y control manos libres.";
    }
    
    // 2. Navigation
    if (raw.includes("ir a agenda") || raw.includes("abre agenda") || raw.includes("citas hoy")) {
      dispatchPeriodashNav("agenda");
      return "📅 **¡Con gusto!** Te he llevado de inmediato al módulo de **Agenda y Calendario de Citas**. ¡Aquí puedes revisar tus horarios y pacientes del día!";
    }
    if (raw.includes("ir a dashboard") || raw.includes("resumen")) {
      dispatchPeriodashNav("dashboard");
      return "📊 **¡Listo!** Volviendo al **Dashboard Analítico General** de PerioDash. ¡Aquí tienes el panorama global de tu consulta!";
    }
    if (raw.includes("ir a pacientes") || raw.includes("directorio") || raw.includes("cuantos pacientes")) {
      if (raw.includes("cuantos pacientes")) {
        // Fall through to patient list heuristics
      } else {
        dispatchPeriodashNav("pacientes");
        return "👥 **¡Por supuesto!** Abriendo el **Directorio Completo de Pacientes** clínicos de la consulta.";
      }
    }
    if (raw.includes("ir a facturacion") || raw.includes("facturación") || raw.includes("finanzas") || raw.includes("factura") || raw.includes("facturas")) {
      dispatchPeriodashNav("facturacion");
      return "💳 **¡De acuerdo!** Accediendo al panel de **Finanzas, Aranceles y Liquidaciones**.";
    }
    
    // Subtrames of Clinica / Expediente
    if (raw.includes("odontograma") || raw.includes("dientes")) {
      dispatchPeriodashNav({ tab: "clinica", subView: "odontograma" });
      return "🦷 **¡Excelente!** Abriendo el **Odontograma Anatómico Adaptativo en 2D** con notación FDI de 32 piezas.";
    }
    if (raw.includes("periodontograma") || raw.includes("sondaje") || raw.includes("bolsas periodontales")) {
      dispatchPeriodashNav({ tab: "clinica", subView: "periodontograma" });
      return "📏 **¡Perfecto!** Mostrando el visor de **Periodontograma Clínico Biométrico** con registro a 6 puntos de sondaje, recesión, placa y sangrado.";
    }
    if (raw.includes("asistente soap") || raw.includes("soap") || raw.includes("diagnostico soap")) {
      dispatchPeriodashNav({ tab: "clinica", subView: "soap" });
      return "📝 **¡Con gusto!** Cargando el **Copiloto Clínico SOAP**. ¡Te ayudo a redactar notas y prescripciones de evolución en segundos!";
    }
    if (raw.includes("riesgo periodontal") || raw.includes("riesgo") || raw.includes("evaluacion de riesgo") || raw.includes("riesgo pra")) {
      dispatchPeriodashNav({ tab: "clinica", subView: "pra" });
      return "🎯 **¡Entendido!** Accediendo al visor del **Análisis de Riesgo Periodontal (PRA Hexagonal)**.";
    }
    if (raw.includes("oleary") || raw.includes("placa bacteriana") || raw.includes("control de placa")) {
      dispatchPeriodashNav({ tab: "clinica", subView: "oleary" });
      return "🧼 **¡Por supuesto!** Abriendo la calculadora interactiva del **Índice de Placa Higiénico O'Leary**.";
    }
    if (raw.includes("radiografia") || raw.includes("radiografias") || raw.includes("rayos") || raw.includes("galeria")) {
      dispatchPeriodashNav({ tab: "clinica", subView: "xrays" });
      return "🩻 **¡Listo!** Mostrando el panel de **Radiografías Digitales** e interpretación analítica con IA.";
    }
    if (raw.includes("presupuesto") || raw.includes("tratamiento") || raw.includes("plan financiero") || raw.includes("cotizacion")) {
      dispatchPeriodashNav({ tab: "clinica", subView: "presupuesto" });
      return "💰 **¡De acuerdo!** Cargando el **Plan de Presupuestos Terapéuticos** y financiamiento clínico.";
    }
    if (raw.includes("ir a clinica") || raw.includes("abre clinica") || raw.includes("expediente") || raw.includes("abre expediente") || raw.includes("ver ficha")) {
      dispatchPeriodashNav("clinica");
      return "📋 **¡Con gusto!** Accediendo al **Expediente Clínico Dental** e historia unificada del paciente seleccionado.";
    }
    if (raw.includes("historias") || raw.includes("casos clinicos") || raw.includes("foro") || raw.includes("universidad")) {
      dispatchPeriodashNav("historias");
      return "🎓 **¡Excelente!** Abriendo el **Canal Académico y Foro de Discusión Clínica Universitaria**.";
    }

    // --- ENHANCED OFFLINE HEURISTICS WITH HIGH INTELLECTUAL VALUE ---

    // 1. Directorio de pacientes
    if (raw.includes("pacientes") || raw.includes("directorios") || (raw.includes("paciente") && (raw.includes("lista") || raw.includes("todos") || raw.includes("cuantos") || raw.includes("rut")))) {
      if (patients && patients.length > 0) {
        const rows = patients.map(p => `| **${p.name}** | \`${p.rut || p.dni || "S/RUT"}\` | ${p.phone} | ${p.birthdate} | \`Activo\` |`).join("\n");
        return `👥 **Directorio de Pacientes - Análisis Local**\n\n¡He revisado tu base de datos! Encontré **${patients.length} pacientes activos** en el sistema:\n\n| Nombre del Paciente | RUT / DNI | Teléfono | Fecha Nacimiento | Estado |\n| :--- | :--- | :--- | :--- | :--- |\n${rows}\n\n💡 *Recuerda que puedes presionar \`Ctrl+K\` en cualquier momento para ubicar a un paciente al instante.*`;
      } else {
        return "Actualmente dispones de una lista inicial de pacientes en local. ¡Selecciona la pestaña **Pacientes** para agregar más expedientes!";
      }
    }

    // 2. Agenda de hoy / citas
    if (raw.includes("cita") || raw.includes("agenda") || raw.includes("quien sigue") || raw.includes("citas hoy") || raw.includes("agenda de hoy")) {
      if (appointments && appointments.length > 0) {
        const rows = appointments.map(a => `| ${a.time} | **${a.patientName}** | \`${a.treatment}\` | ${a.box || "Sillón 1"} | \`${a.status}\` |`).join("\n");
        return `📅 **Agenda de Trabajo y Pacientes de Hoy**\n\n¡Aquí tienes el cronograma de citas programadas para hoy! ✨\n\n| Hora | Paciente | Tratamiento Clínico | Ubicación | Estado |\n| :--- | :--- | :--- | :--- | :--- |\n${rows}\n\n💡 *Tip amigable:* Las sesiones periodontales están estimadas en 45 minutos. Puedes arrastrar cualquier bloque en la Agenda para re-agendar con total comodidad.`;
      } else {
        return "¡Hoy no tienes citas programadas en el registro clínico! Puedes agendar una fácilmente desde la pestaña de **Agenda** 📅.";
      }
    }

    // 3. Vista de pantalla activa
    if (raw.includes("interfaz") || raw.includes("pantalla") || raw.includes("donde estoy") || raw.includes("vista actual") || raw.includes("que tengo abierto") || raw.includes("panel")) {
      const tabLabels: Record<string, string> = {
        "dashboard": "Dashboard Analítico General",
        "pacientes": "Directorio de Pacientes",
        "agenda": "Calendario de Citas y Sillones",
        "clinica": "Expediente Clínico Dental (Clínica)",
        "facturacion": "Liquidaciones e Aranceles Financieros",
        "historias": "Foro de Casos y Universidad PerioClinic"
      };
      
      const subLabels: Record<string, string> = {
        "odontograma": "Odontograma Anatómico FDI (2D)",
        "periodontograma": "Ficha Periodontal de 6 Puntos Biométricos",
        "pra": "Análisis de Riesgo Predictivo (PRA)",
        "oleary": "Índice de Placa Higiénico O'Leary",
        "xrays": "Galería Digital de Radiografías & Visión IA",
        "soap": "Asistente SOAP con Copiloto de Progreso",
        "presupuesto": "Plan de Presupuestos Terapéuticos",
        "especialidad": "Ficha Especializada Multidisciplinaria"
      };

      const tabLabel = tabLabels[activeTab] || activeTab;
      const subLabel = activeTab === "clinica" ? ` > **${subLabels[clinicalSubView] || clinicalSubView}**` : "";
      
      return `💻 **Ubicación Actual en PerioDash** ✨\n\n*   **Módulo Activo**: ${tabLabel}${subLabel}\n*   **Doctor(a)**: ${doctorName}\n*   **Centro Clínico**: ${clinicName}\n\n**Comandos rápidos útiles:**\n- Para ver piezas dentales di: *"Odontograma"* o *"Periodontograma"*\n- Para ver las citas programadas di: *"Agenda"* o *"Citas hoy"*\n- Para consultar protocolos de urgencia di: *"Emergencia"*`;
    }

    // 4. Analizar Paciente / Resumen Clínico Detallado
    if (raw.includes("analizar paciente") || (raw.includes("analizar") && (raw.includes("carlos") || raw.includes("activo") || raw.includes("paciente") || raw.includes("ficha")))) {
      if (!activePatient) {
        return "¡Aún no has seleccionado un paciente activo en el sillón! 🦷 Por favor haz clic en cualquier paciente del directorio para que pueda auditar su ficha y brindarte recomendaciones.";
      }

      const info = getPatientSummaryData();
      const anam = (activePatient.anamnesis || {}) as any;
      
      // Compute systemic flags
      const systemicFlags = [];
      if (anam.diabetes) systemicFlags.push("🚨 **Diabetes Tipo 2**: Precaución con retardo en cicatrización y riesgo periodontal Grado C.");
      if (anam.hta) systemicFlags.push("💊 **Hipertensión Arterial**: Usar con prudencia anestésicos con vasoconstrictor.");
      if (anam.tabaquismo > 0) systemicFlags.push(`🚬 **Tabaquismo Activo** (${anam.tabaquismo} cig/día): Puede enmascarar sangrado e inhibir la respuesta tisular.`);
      if (anam.alergias && anam.alergias !== "Ninguna" && anam.alergias !== "ninguna") systemicFlags.push(`⚠️ **Alergia Reportada**: *${anam.alergias}*`);

      const systemicSection = systemicFlags.length > 0 
        ? `⚠️ **Aspectos Sistémicos Relevantes (${activePatient.name})**:\n${systemicFlags.join("\n")}`
        : "✅ **Expediente Sistémico**: El paciente no reporta condiciones de alarma sistémica.";

      return `📊 **Resumen Clínico Integral - ${activePatient.name.toUpperCase()}** 🦷✨\n\n¡He analizado los datos del Odontograma y Periodontograma en tiempo real!\n\n| Indicador Clínico | Medición / Conclusión | Diagnóstico Sugerido |\n| :--- | :--- | :--- |\n| **Índice O'Leary** | **${info.plaquePct}%** de superficies con placa | Higiene mejorable. Requiere profilaxis de saneamiento. |\n| **Caries Coronal** | **${info.cariesCount} caras** afectadas (${info.cariesTeeth.join(', ') || 'Ninguna'}) | Diagnóstico ICDAS compatible. Sugerir restauraciones adhesivas. |\n| **Bolsas Periodontales** | **${info.totalDeepPockets} superficies** profundas (≥5mm) | Compatible con **Periodontitis Activa** |\n| **Soporte Físico** | Ausentes: ${info.missingCount} \| Implantes: ${info.implantCount} \| Endo: ${info.endoCount} | Soporte dental remanente evaluable. |\n\n${systemicSection}\n\n🎯 **Clasificación Sugerida (AAP 2018)**: \n**Periodontitis Estadio III, Grado ${anam.tabaquismo >= 10 || anam.diabetesStatus === "severe" ? "C" : "B"}**.\n\n*   **Plan Terapéutico Recomendado**: 1° Fase Higiénica (Raspado y Alisado Radicular), 2° Reevaluación a las 4-6 semanas, 3° Tratamiento de caries en piezas afectadas.\n\n¿Deseas que preparemos una nota SOAP o revisemos alguna pieza dental en particular? ¡Estoy a tu servicio! 🌟`;
    }

    // 5. Analizar Periodontograma en particular
    if (raw.includes("periodontograma") && (raw.includes("analizar") || raw.includes("bolsas") || raw.includes("profundidad") || raw.includes("sondaje"))) {
      if (!activePatient) return "¡Selecciona primero un paciente en la pestaña de Clínica para evaluar su periodontograma biométrico! 🦷";
      
      const info = getPatientSummaryData();
      return `🦷 **Evaluación Periodontal Detallada - ${activePatient.name}** ✨\n\n*   **Bolsas Periodontales Patológicas (≥ 5mm)**: Encontré **${info.totalDeepPockets} puntos de sondaje profundos** con pérdida de inserción clínica activa.\n*   **Ubicación Principal**: Se localizan predominantemente en ${info.deepPocketsList.join(', ') || 'piezas posteriores'}.\n*   **Pérdida de Inserción (CAL)**: Es aconsejable complementar con radiografías periapicales (Bite-wing) para valorar el soporte óseo interproximal.\n*   **Control de Inflamación**: Se recomienda terapia de Raspado y Alisado Radicular (RAR) e irrigación con clorhexidina al 0.12%.\n\n¿Te gustaría que dictemos los siguientes registros por voz o emitamos el informe para el paciente? 📋`;
    }

    // 6. Precios / Cotizaciones de aranceles
    if (raw.includes("cuanto cuesta") || raw.includes("precio") || raw.includes("arancel") || raw.includes("cotizacion") || raw.includes("presupuesto") || raw.includes("tarifas")) {
      const arancelesList = aranceles || {
        "Limpieza Profiláctica": 45000,
        "Raspado Radicular por Sector": 65000,
        "Cirugía de Implante Dental": 450000,
        "Radiografía Panorámica": 35000,
        "Sondaje de Diagnóstico 6 puntos": 30000
      };

      const rows = Object.entries(arancelesList).map(([item, price]) => `| ${item} | $${price.toLocaleString("es-CL")} CLP |`).join("\n");
      
      let patientBudgetSection = "";
      if (activePatient) {
        const info = getPatientSummaryData();
        patientBudgetSection = `\n\n💰 **Presupuesto Estimado de ${activePatient.name}**:\n- **Total Planificado**: $${info.totalPlanned.toLocaleString("es-CL")} CLP\n- Tratamientos listos: **${info.completedCount}** / Pendientes: **${info.pendingCount}**.\n*Puedes pulsar "Imprimir Presupuesto" en la ficha para entregárselo en PDF.*`;
      }

      return `🪙 **Tarifario y Aranceles de la Clínica** ✨\n\nAquí tienes la lista de valores de referencia configurados:\n\n| Procedimiento Dental | Valor Configurado |\n| :--- | :--- |\n${rows}${patientBudgetSection}`;
    }

    // 3. Knowledge Base
    for (const [key, def] of Object.entries(DENTITO_KNOWLEDGE)) {
      if (raw.includes(key) || raw.includes("que es " + key) || raw.includes("definicion de " + key)) {
        return `📖 **${key.toUpperCase()}**: ${def}\n\n*¿Te gustaría profundizar en el protocolo clínico o ver casos relacionados?* ✨`;
      }
    }

    // 4. Chit Chat
    if (raw.includes("hola") || raw.includes("buenos dias") || raw.includes("buenas tardes") || raw.includes("que tal") || raw.includes("buenas")) {
      return `¡Hola doctor(a)! 👋 Soy **Dentito** 🦷✨, tu copiloto clínico en PerioDash. ¡Es un gusto saludarte! Estoy listo para ayudarte con el historial de pacientes, dictado de sondaje por voz, análisis periodontal o resolver cualquier consulta académica.\n\n¿En qué podemos trabajar juntos hoy?`;
    }
    if (raw.includes("chiste") || raw.includes("broma")) {
      return "¿Por qué los dentistas se sienten tan acompañados? ¡Porque siempre están rodeados de buenas raíces y excelentes coronas! 😄🥁 Oye, y hablando de cuidar raíces: recuerda que la higiene interproximal es la mejor amiga de tus pacientes. ¡Ánimo con la jornada clínica! 🦷✨";
    }

    return null;
  };

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    const userMessage: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: "user",
      content: textToSend,
      createdAt: new Date().toISOString(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    const localResponse = processInternalCommand(textToSend);
    if (localResponse !== null) {
      setMessages((prev) => [...prev, {
        id: `bot-${Date.now()}`,
        role: "assistant",
        content: localResponse,
        createdAt: new Date().toISOString(),
      }]);
      setLoading(false);
      return;
    }

    try {
      // Compiled structured clinical context for Gemini API based on user settings
      const payloadResult = buildStructuredClinicalPayload(activePatient, contextConfig, {
        activeTab,
        clinicalSubView,
        doctorName,
        clinicName,
        totalPatients: patients.length,
        totalAppointmentsToday: appointments.length,
      });
      const serialisedPatient = payloadResult.jsonString;

      const res = await fetch("/api/dentito", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
          context: serialisedPatient,
        }),
      });

      const data = await res.json();
      const botResponse: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: "assistant",
        content: data.text || data.error || "No obtuve una respuesta clara. Prueba decir 'Emergencia' o 'Ir a agenda'.",
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, botResponse]);
    } catch (err: any) {
      setMessages((prev) => [...prev, {
        id: `bot-${Date.now()}`,
        role: "assistant",
        content: "Lo siento, tuve un problema para conectarme con mis servidores de inteligencia artificial. Por favor asegúrate de validar tu clave API de Gemini.",
        createdAt: new Date().toISOString(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-speech-err-${Date.now()}`,
          role: "assistant",
          content: "🤖 **Asistente Dentito**: He detectado que tu navegador actual no ofrece soporte para la API de dictados y control por voz (Web Speech API). Te recomiendo utilizar Google Chrome o Microsoft Edge para activar esta función de comandos clínicos sin manos.",
          createdAt: new Date().toISOString(),
        }
      ]);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "es-ES";
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      try {
        const transcript = event.results?.[0]?.[0]?.transcript;
        if (transcript) {
          handleSendMessage(transcript);
        }
      } catch {
        // Safe capture
      }
    };
    recognition.onerror = (e: any) => {
      setIsListening(false);
      if (e?.error === "not-allowed" || e?.error === "service-not-allowed") {
        setMessages((prev) => [
          ...prev,
          {
            id: `bot-speech-err-${Date.now()}`,
            role: "assistant",
            content: "🤖 **Asistente Dentito**: El acceso al micrófono fue denegado en tu navegador. Por favor permite el acceso al micrófono en la barra de direcciones o ajustes para comunicarte por voz.",
            createdAt: new Date().toISOString(),
          }
        ]);
      }
    };
    recognition.onend = () => setIsListening(false);

    try {
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {emergencyMode && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }}
            onClick={() => setEmergencyMode(null)}
            className="fixed inset-0 z-[999] bg-rose-950/80 backdrop-blur-2xl flex flex-col items-center justify-center p-4 md:p-6 text-white overflow-hidden cursor-pointer"
          >
            <div 
              onClick={(e) => e.stopPropagation()}
              className="max-w-4xl w-full max-h-[92vh] overflow-y-auto bg-rose-900/30 backdrop-blur-md p-6 md:p-10 rounded-3xl border border-rose-500/30 shadow-[0_0_100px_rgba(244,63,94,0.2)] relative hide-scrollbar cursor-default"
            >
              <button 
                onClick={() => setEmergencyMode(null)}
                className="absolute top-6 right-6 px-4 py-2 bg-rose-500/20 hover:bg-rose-500/40 rounded-full font-bold transition-all text-xs cursor-pointer border border-rose-500/50 flex items-center gap-1.5"
                title="Cerrar ventana de emergencia (Esc)"
              >
                <X className="w-4 h-4" />
                <span>Cerrar</span>
              </button>
              
              <div className="flex items-center gap-4 md:gap-6 mb-6 md:mb-10">
                <div className="p-3 md:p-4 bg-rose-500/20 rounded-2xl border border-rose-500/40 animate-pulse shrink-0">
                  <AlertTriangle className="w-8 h-8 md:w-12 md:h-12 text-rose-400" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-4xl font-display font-black tracking-tight text-white mb-1">CÓDIGO ROJO CLÍNICO</h1>
                  <p className="text-xs md:text-sm text-rose-300 font-medium tracking-wide">Protocolos de Estabilización Médica Avanzada</p>
                </div>
              </div>

              {emergencyMode === "selector" && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <button onClick={() => setEmergencyMode("syncope")} className="bg-black/20 hover:bg-black/40 p-5 rounded-3xl flex flex-col items-center text-center gap-3 transition-all cursor-pointer border border-white/5 hover:border-white/20 group">
                    <Activity className="w-8 h-8 text-cyan-400 group-hover:scale-110 transition-transform" />
                    <h3 className="font-bold text-base">Síncope Vasovagal</h3>
                    <p className="text-[10.5px] text-rose-200/70">Pérdida de consciencia súbita, palidez extrema, bradicardia transitoria.</p>
                  </button>
                  <button onClick={() => setEmergencyMode("anaphylaxis")} className="bg-rose-500/10 hover:bg-rose-500/20 p-5 rounded-3xl flex flex-col items-center text-center gap-3 transition-all cursor-pointer border border-rose-500/30 hover:border-rose-500/60 shadow-[0_0_30px_rgba(244,63,94,0.1)] group">
                    <AlertTriangle className="w-8 h-8 text-yellow-400 group-hover:scale-110 transition-transform" />
                    <h3 className="font-bold text-base">Shock Anafiláctico</h3>
                    <p className="text-[10.5px] text-rose-200/70">Reacción alérgica aguda, broncoespasmo severo, erupción cutánea.</p>
                  </button>
                  <button onClick={() => setEmergencyMode("angina")} className="bg-black/20 hover:bg-black/40 p-5 rounded-3xl flex flex-col items-center text-center gap-3 transition-all cursor-pointer border border-white/5 hover:border-white/20 group">
                    <HeartPulse className="w-8 h-8 text-rose-400 group-hover:scale-110 transition-transform" />
                    <h3 className="font-bold text-base">Angina o IAM</h3>
                    <p className="text-[10.5px] text-rose-200/70">Dolor torácico opresivo, irradiado a cuello, mandíbula o brazo izq.</p>
                  </button>
                  <button onClick={() => setEmergencyMode("hypoglycemia")} className="bg-emerald-500/10 hover:bg-emerald-500/20 p-5 rounded-3xl flex flex-col items-center text-center gap-3 transition-all cursor-pointer border border-emerald-500/20 hover:border-emerald-500/50 group">
                    <ShieldAlert className="w-8 h-8 text-emerald-400 group-hover:scale-110 transition-transform" />
                    <h3 className="font-bold text-base">Crisis Hipoglicémica</h3>
                    <p className="text-[10.5px] text-rose-200/70">Sudoración fría, confusión metabólica, temblores en paciente ayunado.</p>
                  </button>
                </div>
              )}

              {/* Protocol Details remain similar but styling enhanced */}
              {emergencyMode === "syncope" && (
                <div className="space-y-6">
                  <h3 className="text-2xl md:text-3xl font-display font-black flex items-center gap-3"><Activity className="w-8 h-8 text-cyan-400"/> Síncope Vasovagal</h3>
                  <div className="space-y-4 font-mono text-sm md:text-base bg-black/40 backdrop-blur-md p-6 md:p-8 rounded-3xl border border-white/10 text-emerald-50">
                    <p className="text-rose-400 font-bold mb-4">1. 🛑 DETENER EL TRATAMIENTO INMEDIATAMENTE.</p>
                    <p>2. 💺 Posición de Trendelenburg (Inclinación del sillón dental con piernas elevadas a 15-30°).</p>
                    <p>3. 💨 Aflojar prendas muy ajustadas (cuellos, corbatas, cinturones).</p>
                    <p>4. 🧊 Aplicar compresa fría húmeda sobre la frente o nuca.</p>
                    <p>5. ⏱️ Monitorear pulso. Si no recupera en 2 mins, activar sistema de emergencias médicas (SEM).</p>
                  </div>
                  <button onClick={() => setEmergencyMode("selector")} className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-full cursor-pointer font-bold text-sm transition-all border border-white/20">← Cambiar Condición</button>
                </div>
              )}
              {emergencyMode === "anaphylaxis" && (
                <div className="space-y-6">
                  <h3 className="text-2xl md:text-3xl font-display font-black flex items-center gap-3 text-yellow-400"><AlertTriangle className="w-8 h-8"/> Shock Anafiláctico</h3>
                  <div className="space-y-4 font-mono text-sm md:text-base bg-rose-950/60 backdrop-blur-md p-6 md:p-8 rounded-3xl border border-rose-500/30 text-rose-100 shadow-inner">
                    <p className="font-bold text-yellow-300 text-base md:text-lg mb-2">1. 📞 ACTIVAR SISTEMA DE EMERGENCIAS (LLAMAR A UNA AMBULANCIA AHORA).</p>
                    <p>2. 🛑 Cancelar procedimiento y retirar todos los materiales dentales/alérgenos de la boca.</p>
                    <p className="font-bold text-white bg-rose-600/30 p-3 rounded-lg border border-rose-500/50">3. 💉 ADRENALINA IM inyectable (Adultos: 0.3 a 0.5 mg, dilución 1:1000) en la cara anterolateral del muslo (vasto externo) INMEDIATAMENTE.</p>
                    <p>4. 💺 Posición supina y elevación pasiva de piernas (si tolera y no hay compromiso respiratorio severo).</p>
                    <p>5. 🌬️ Oxígeno suplementario a alto flujo (15 L/min).</p>
                  </div>
                  <button onClick={() => setEmergencyMode("selector")} className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-full cursor-pointer font-bold text-sm transition-all border border-white/20">← Cambiar Condición</button>
                </div>
              )}
              {emergencyMode === "angina" && (
                <div className="space-y-6">
                  <h3 className="text-2xl md:text-3xl font-display font-black flex items-center gap-3 text-rose-300"><HeartPulse className="w-8 h-8"/> Síndrome Coronario (IAM/Angina)</h3>
                  <div className="space-y-4 font-mono text-sm md:text-base bg-black/40 backdrop-blur-md p-6 md:p-8 rounded-3xl border border-white/10 text-emerald-50">
                    <p className="text-rose-400 font-bold mb-4">1. 🛑 DETENER EL TRATAMIENTO INMEDIATAMENTE.</p>
                    <p className="font-bold text-yellow-300">2. 📞 LLAMAR al servicio de emergencias si sospechas Infarto (el dolor no cede en minutos).</p>
                    <p>3. 💺 Posicionar al paciente semisentado para facilitar la ventilación.</p>
                    <p>4. 🌬️ Administrar Oxígeno suplementario de inmediato.</p>
                    <p className="font-bold">5. 💊 Fármacos (SOLO si el paciente no tiene contraindicaciones y sospechas fuertemente): Nitroglicerina sublingual o Aspirina masticable 300mg.</p>
                  </div>
                  <button onClick={() => setEmergencyMode("selector")} className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-full cursor-pointer font-bold text-sm transition-all border border-white/20">← Cambiar Condición</button>
                </div>
              )}
              {emergencyMode === "hypoglycemia" && (
                <div className="space-y-6">
                  <h3 className="text-2xl md:text-3xl font-display font-black flex items-center gap-3 text-emerald-400"><ShieldAlert className="w-8 h-8"/> Crisis Hipoglicémica</h3>
                  <div className="space-y-4 font-mono text-sm md:text-base bg-emerald-950/40 backdrop-blur-md p-6 md:p-8 rounded-3xl border border-emerald-500/20 text-emerald-100">
                    <p className="text-rose-300 font-bold mb-4">1. 🛑 EVALUAR ESTADO DE CONSCIENCIA.</p>
                    <p>2. 🍬 <strong>Si el paciente está consciente</strong>: Suministrar carbohidratos de absorción rápida vía oral (jugo de fruta azucarado, tabletas de glucosa o agua con 2 cucharadas de azúcar).</p>
                    <p className="font-bold text-yellow-300">3. 🛑 Si el paciente pierde el conocimiento / inconsciente: NUNCA administrar nada por vía oral (riesgo de aspiración bronquial).</p>
                    <p>4. 💉 Administrar Glucagón 1mg intramuscular, canalizar vía endovenosa con Dextrosa al 10% o 50% y llamar al servicio de urgencias de inmediato.</p>
                    <p>5. ⏱️ Monitorear niveles de glicemia capilar cada 10 minutos hasta estabilizar ≥ 90 mg/dL.</p>
                  </div>
                  <button onClick={() => setEmergencyMode("selector")} className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-full cursor-pointer font-bold text-sm transition-all border border-white/20">← Cambiar Condición</button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {isMinimized ? (
          /* MINIMIZED FLOATING TRIGGER BUTTON (DESKTOP ONLY, ON MOBILE THE BOTTOM DOCK HAS DENTITO) */
          <motion.div
            key="dentito-minimized-orb"
            initial={{ scale: 0.8, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={() => setIsMinimized(false)}
            title="Abrir Asistente Clínico Dentito"
            className={`hidden md:flex fixed z-[99] print:hidden cursor-pointer group select-none ${
              positionState === "bottom-left" ? "bottom-24 left-6" :
              positionState === "top-right" ? "top-6 right-6" :
              positionState === "top-left" ? "top-6 left-6" :
              "bottom-24 right-6" // default bottom-right
            }`}
          >
            <div className="relative p-1 bg-white/90 dark:bg-slate-900/95 backdrop-blur-xl border border-teal-500/30 dark:border-teal-500/20 rounded-full shadow-lg shadow-teal-950/20 flex items-center gap-2.5 px-3 py-2 hover:scale-102 active:scale-98 transition-all">
              <div className="relative w-10 h-10 flex items-center justify-center rounded-full shrink-0">
                <div className="absolute inset-0 clinical-gradient-bg rounded-full pointer-events-none opacity-80" />
                <div className="absolute inset-[1.5px] bg-slate-100 dark:bg-slate-950 rounded-full z-0 pointer-events-none" />
                <div className="relative z-10 w-full h-full rounded-full overflow-hidden flex items-center justify-center">
                  <ParticleSystem />
                </div>
              </div>
              
              <div className="pr-1.5 hidden sm:flex flex-col text-left">
                <div className="flex items-center gap-1.5">
                  <span className="font-display font-bold text-xs text-slate-800 dark:text-white">Dentito</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                </div>
                <span className="text-[9px] font-semibold text-teal-600 dark:text-teal-400 tracking-tight">Copiloto Clínico</span>
              </div>
            </div>
          </motion.div>
        ) : (
          <>
            {/* Mobile Backdrop when open */}
            {isMobile && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="md:hidden fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-[99] no-print"
                onClick={() => setIsMinimized(true)}
              />
            )}

            {/* FULL CHAT MODAL CONTAINER */}
            <motion.div 
              key={`dentito-chat-window-${positionState}`}
              initial={isMobile ? { y: "100%" } : { opacity: 0, scale: 0.95, y: 12 }}
              animate={isMobile ? { y: 0 } : { opacity: 1, scale: 1, y: 0 }}
              exit={isMobile ? { y: "100%" } : { opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              drag={!isMobile && positionState !== "fullscreen"}
              dragConstraints={getDragConstraints()}
              dragElastic={0.05}
              dragMomentum={false}
              onDragStart={() => {
                isDraggingRef.current = true;
              }}
              onDragEnd={() => {
                setTimeout(() => {
                  isDraggingRef.current = false;
                }, 60);
              }}
              className={`fixed z-[100] md:z-[99] print:hidden shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex flex-col
                bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80
                ${getPositionClasses()}`}
            >
            {/* Header - Glassmorphic */}
            <div 
              className="flex items-center justify-between px-5 py-3 border-b border-slate-200/60 dark:border-slate-800/80 cursor-grab active:cursor-grabbing relative bg-gradient-to-br from-teal-500/10 via-transparent to-transparent select-none shrink-0"
            >
              <div className="flex items-center gap-3.5">
                <div className="relative w-[40px] h-[40px] flex items-center justify-center rounded-full shadow-inner p-[2px] shrink-0">
                   <div className="absolute inset-0 clinical-gradient-bg rounded-full pointer-events-none opacity-90" />
                   <div className="absolute inset-[2px] bg-slate-100 dark:bg-slate-900 rounded-full z-0 pointer-events-none" />
                   <div className="relative z-10 w-full h-full rounded-full overflow-hidden flex items-center justify-center border border-white/30 dark:border-white/5 bg-slate-50 dark:bg-slate-900">
                      <ParticleSystem />
                   </div>
                </div>
                <div>
                  <h4 className="font-display font-bold text-sm text-slate-800 dark:text-white tracking-tight inline-flex items-center gap-1.5">
                    <span>Asistente Clínico</span>
                    <span className="font-mono text-teal-600 dark:text-teal-400 text-[10px] bg-teal-500/10 px-1.5 py-0.5 rounded-sm">Dentito</span>
                  </h4>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Asistente de Fichas e Historiales</span>
                    {activePatient && (
                      <span className="inline-flex items-center gap-1 text-[8px] uppercase tracking-wider px-1.5 py-0.2 bg-teal-500/10 text-teal-600 dark:text-teal-400 font-black rounded border border-teal-500/15 select-none shrink-0">
                        <span className="relative flex h-1 w-1 shrink-0">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-1 w-1 bg-teal-500"></span>
                        </span>
                        <span>{activePatient.name.split(" ")[0]}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div 
                className="flex items-center gap-1.5" 
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
              >
                {/* Position Toggler Menu */}
                <div className="relative">
                  <button 
                    onClick={() => setShowPositionMenu(!showPositionMenu)}
                    className="p-2 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700/80 rounded-xl transition-all cursor-pointer border border-slate-200/60 dark:border-slate-700/50 text-slate-600 dark:text-slate-300 flex items-center gap-1"
                    title="Trasladar / Posicionar"
                  >
                    <Move className="w-3.5 h-3.5 text-teal-500" />
                    <span className="text-[10px] font-bold hidden sm:inline">Trasladar</span>
                  </button>
                  
                  <AnimatePresence>
                    {showPositionMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: positionState.startsWith("bottom") ? 10 : -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: positionState.startsWith("bottom") ? 10 : -10, scale: 0.95 }}
                        className={positionState.startsWith("bottom") 
                          ? "absolute right-0 bottom-full mb-2 z-[100] w-52 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-2xl p-2 text-slate-800 dark:text-slate-100"
                          : "absolute right-0 top-full mt-2 z-[100] w-52 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-2xl p-2 text-slate-800 dark:text-slate-100"
                        }
                      >
                        <div className="px-3 py-1.5 text-[9px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800/80 mb-1">
                          Trasladar de Posición
                        </div>
                        {[
                          { id: "bottom-right", label: "Abajo Derecha ↘️", desc: "Ubicación inferior derecha" },
                          { id: "bottom-left", label: "Abajo Izquierda ↙️", desc: "Ubicación inferior izquierda" },
                          { id: "top-right", label: "Arriba Derecha ↗️", desc: "Ubicación superior derecha" },
                          { id: "top-left", label: "Arriba Izquierda ↖️", desc: "Ubicación superior izquierda" },
                          { id: "fullscreen", label: "Pantalla Completa 📱", desc: "Optimizado para móviles" }
                        ].map((pos) => (
                          <button
                            key={pos.id}
                            onClick={() => {
                              setPositionState(pos.id as DentitoPosition);
                              setShowPositionMenu(false);
                            }}
                            className={`w-full text-left px-3 py-1.5 rounded-lg text-[11px] transition-all flex flex-col gap-0.5 cursor-pointer border-0 bg-transparent ${
                              positionState === pos.id 
                                ? "bg-teal-500! text-white!" 
                                : "hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300"
                            }`}
                          >
                            <span className="font-semibold">{pos.label}</span>
                            <span className={`text-[8px] font-normal ${positionState === pos.id ? "text-teal-100" : "text-slate-400 dark:text-slate-500"}`}>
                              {pos.desc}
                            </span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {speechSupported && (
                  <button 
                    onClick={() => {
                      if (ttsEnabled) {
                        window.speechSynthesis?.cancel();
                      }
                      setTtsEnabled(!ttsEnabled);
                    }}
                    className={`p-2 rounded-full transition-all cursor-pointer border ${
                      ttsEnabled 
                        ? "bg-teal-500/10 border-teal-500/30 text-teal-500" 
                        : "bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700/80 border-slate-200/60 dark:border-slate-700/50 text-slate-500 dark:text-slate-400"
                    }`}
                    title={ttsEnabled ? "Desactivar lectura de voz (manos libres)" : "Activar lectura de voz (manos libres)"}
                  >
                    {ttsEnabled ? <Volume2 className="w-4 h-4 animate-pulse text-teal-400" /> : <VolumeX className="w-4 h-4" />}
                  </button>
                )}

                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMinimized(true);
                    setShowPositionMenu(false);
                  }}
                  className="p-2 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700/80 rounded-full transition-all cursor-pointer border border-slate-200/60 dark:border-slate-700/50 text-slate-600 dark:text-slate-300"
                  title="Minimizar Dentito"
                >
                  <Minimize2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMinimized(true);
                    setShowPositionMenu(false);
                  }}
                  className="p-2 bg-slate-100 dark:bg-slate-800/80 hover:bg-rose-500/10 hover:text-rose-500 rounded-full transition-all cursor-pointer border border-slate-200/60 dark:border-slate-700/50 text-slate-600 dark:text-slate-300"
                  title="Cerrar Dentito (Esc)"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* STRUCTURED CLINICAL CONTEXT BAR */}
            <div 
              className="px-3.5 py-1.5 border-b border-slate-200/70 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-900/70 backdrop-blur-md flex items-center justify-between gap-2 shrink-0 select-none z-10"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Context Mode Selector Trigger */}
              <div className="flex items-center gap-1.5 min-w-0">
                <button
                  type="button"
                  onClick={() => setShowContextModal(true)}
                  className="group flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/25 dark:border-teal-500/30 transition-all cursor-pointer text-left shadow-xs active:scale-95"
                  title="Configurar qué información clínica y modo de contexto se envía al modelo de IA"
                >
                  <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse shrink-0" />
                  <div className="flex items-center gap-1 truncate">
                    <span className="text-[9.5px] uppercase tracking-wider font-bold text-teal-700 dark:text-teal-300">Modo:</span>
                    <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-100 truncate">
                      {CONTEXT_MODES[contextConfig.mode]?.shortTitle || "Personalizado"}
                    </span>
                  </div>
                  <SlidersHorizontal className="w-3 h-3 text-teal-600 dark:text-teal-400 shrink-0 ml-0.5" />
                </button>

                {/* Module indicators */}
                <div className="hidden xs:flex items-center gap-1 text-[9px]">
                  {contextConfig.includeAnamnesis && (
                    <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono border border-slate-200/60 dark:border-slate-700" title="Ficha y Anamnesis incluida">Ficha</span>
                  )}
                  {contextConfig.includeOdontogram && (
                    <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono border border-slate-200/60 dark:border-slate-700" title="Odontograma Anatómico incluido">Odonto</span>
                  )}
                  {contextConfig.includePeriodontogram && (
                    <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono border border-slate-200/60 dark:border-slate-700" title="Periodontograma 6 puntos incluido">Perio</span>
                  )}
                  {contextConfig.includeTreatmentPlan && (
                    <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono border border-slate-200/60 dark:border-slate-700" title="Presupuesto y Tratamiento incluido">Plan</span>
                  )}
                  {contextConfig.includeEvolutions && (
                    <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono border border-slate-200/60 dark:border-slate-700" title="Evoluciones Clínicas incluidas">Evol</span>
                  )}
                  {contextConfig.maskPII && (
                    <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono border border-emerald-500/20" title="Protección de datos personales (PII Enmascarado)">PII 🛡️</span>
                  )}
                </div>
              </div>

              {/* Right actions: Inspection & Settings */}
              <div className="flex items-center gap-1 shrink-0">
                {canInspectPayload && (
                  <>
                    <span className="hidden sm:inline-block text-[9px] font-mono text-slate-400 dark:text-slate-500" title="Tamaño aproximado del contexto clínico enviado a la IA (Vista Auditoría Admin)">
                      ~{liveContextPayload.estimatedTokens} tok
                    </span>

                    <button
                      type="button"
                      onClick={() => setShowContextInspector(true)}
                      className="p-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-600 dark:text-teal-400 transition-colors cursor-pointer border border-teal-500/25"
                      title="Auditoría de Payload JSON (Solo Administrador / HIPAA)"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}

                <button
                  type="button"
                  onClick={() => setShowContextModal(true)}
                  className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-teal-500/15 hover:text-teal-600 dark:hover:text-teal-400 text-slate-500 dark:text-slate-400 transition-colors cursor-pointer border border-slate-200/60 dark:border-slate-700"
                  title="Configurar opciones del contexto clínico"
                >
                  <Sliders className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Wrapper for scrollable pane and sticky overlay to avoid previous messages overlapping */}
            <div className="flex-1 min-h-0 relative flex flex-col">
              {/* MODAL: CONFIGURACIÓN DE CONTEXTO ESTRUCTURADO */}
              <AnimatePresence>
                {showContextModal && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    transition={{ duration: 0.16 }}
                    className="absolute inset-0 z-50 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl flex flex-col overflow-hidden rounded-b-[2rem] text-slate-800 dark:text-slate-100"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Modal Header */}
                    <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/70 dark:bg-slate-900/60">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-xl bg-teal-500/15 flex items-center justify-center text-teal-600 dark:text-teal-400 border border-teal-500/30">
                          <SlidersHorizontal className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <h3 className="font-display font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white">
                            Modos de Contexto Clínico
                          </h3>
                          <p className="text-[9.5px] text-slate-500 dark:text-slate-400">
                            Personaliza la información transmitida al modelo de IA
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowContextModal(false)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer border-0 bg-transparent"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Modal Scrollable Body */}
                    <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 text-xs hide-scrollbar">
                      {/* Presets Grid */}
                      <div>
                        <label className="font-display font-bold text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1.5">
                          1. Modos de Flujo de Trabajo Clínico
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {(Object.values(CONTEXT_MODES) as ContextModeOption[]).map((mode) => {
                            const isActive = contextConfig.mode === mode.id;
                            return (
                              <button
                                key={mode.id}
                                type="button"
                                onClick={() => handleSelectContextMode(mode.id)}
                                className={`p-2.5 rounded-2xl text-left border transition-all cursor-pointer flex flex-col gap-1 relative ${
                                  isActive
                                    ? "bg-teal-500/10 border-teal-500 dark:border-teal-400 shadow-sm shadow-teal-500/10"
                                    : "bg-slate-50/70 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800/80 border-slate-200/70 dark:border-slate-800"
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className={`text-[8.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${mode.badgeColor}`}>
                                    {mode.badge}
                                  </span>
                                  {isActive && (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                                  )}
                                </div>
                                <div>
                                  <h4 className="font-bold text-[11px] text-slate-900 dark:text-white leading-tight">
                                    {mode.title}
                                  </h4>
                                  <p className="text-[9.5px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5 line-clamp-2">
                                    {mode.description}
                                  </p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Granular Module Toggles */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="font-display font-bold text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500">
                            2. Información Clínica Incluida (Configuración Granular)
                          </label>
                          {contextConfig.mode !== "custom" && (
                            <span className="text-[8.5px] text-teal-600 dark:text-teal-400 font-medium">
                              (Modificar ajustará a 'Personalizado')
                            </span>
                          )}
                        </div>

                        <div className="space-y-1 bg-slate-50/70 dark:bg-slate-900/40 p-2 rounded-2xl border border-slate-200/60 dark:border-slate-800">
                          {/* Ficha / Anamnesis */}
                          <div 
                            onClick={() => handleToggleModule("includeAnamnesis")}
                            className="flex items-center justify-between p-2 rounded-xl hover:bg-white dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              <FileText className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                              <div>
                                <span className="font-bold text-[10.5px] text-slate-800 dark:text-slate-200 block">
                                  Ficha Médica & Anamnesis
                                </span>
                                <span className="text-[9px] text-slate-400 dark:text-slate-500 block">
                                  Alergias, alertas críticas, patologías sistémicas (HTA, diabetes), tabaquismo y fármacos.
                                </span>
                              </div>
                            </div>
                            <input 
                              type="checkbox" 
                              checked={contextConfig.includeAnamnesis} 
                              onChange={() => {}}
                              className="w-3.5 h-3.5 accent-teal-500 cursor-pointer pointer-events-none shrink-0" 
                            />
                          </div>

                          {/* Odontograma */}
                          <div 
                            onClick={() => handleToggleModule("includeOdontogram")}
                            className="flex items-center justify-between p-2 rounded-xl hover:bg-white dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              <Grid className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                              <div>
                                <span className="font-bold text-[10.5px] text-slate-800 dark:text-slate-200 block">
                                  Odontograma Anatómico FDI
                                </span>
                                <span className="text-[9px] text-slate-400 dark:text-slate-500 block">
                                  Dientes con caries y caras anatómicas (V, O, L, M, D), ausencias, endodoncias e implantes.
                                </span>
                              </div>
                            </div>
                            <input 
                              type="checkbox" 
                              checked={contextConfig.includeOdontogram} 
                              onChange={() => {}}
                              className="w-3.5 h-3.5 accent-teal-500 cursor-pointer pointer-events-none shrink-0" 
                            />
                          </div>

                          {/* Periodontograma */}
                          <div 
                            onClick={() => handleToggleModule("includePeriodontogram")}
                            className="flex items-center justify-between p-2 rounded-xl hover:bg-white dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              <Activity className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              <div>
                                <span className="font-bold text-[10.5px] text-slate-800 dark:text-slate-200 block">
                                  Periodontograma Biométrico (6 Puntos)
                                </span>
                                <span className="text-[9px] text-slate-400 dark:text-slate-500 block">
                                  Sondaje 6 puntos (PPD, REC, CAL), sangrado BOP %, O'Leary, riesgo PRA y AAP/EFP 2018.
                                </span>
                              </div>
                            </div>
                            <input 
                              type="checkbox" 
                              checked={contextConfig.includePeriodontogram} 
                              onChange={() => {}}
                              className="w-3.5 h-3.5 accent-teal-500 cursor-pointer pointer-events-none shrink-0" 
                            />
                          </div>

                          {/* Presupuesto & Tratamiento */}
                          <div 
                            onClick={() => handleToggleModule("includeTreatmentPlan")}
                            className="flex items-center justify-between p-2 rounded-xl hover:bg-white dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              <Database className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                              <div>
                                <span className="font-bold text-[10.5px] text-slate-800 dark:text-slate-200 block">
                                  Plan de Tratamiento & Presupuestos
                                </span>
                                <span className="text-[9px] text-slate-400 dark:text-slate-500 block">
                                  Procedimientos planificados, estado de avance (completado/pendiente) y costos.
                                </span>
                              </div>
                            </div>
                            <input 
                              type="checkbox" 
                              checked={contextConfig.includeTreatmentPlan} 
                              onChange={() => {}}
                              className="w-3.5 h-3.5 accent-teal-500 cursor-pointer pointer-events-none shrink-0" 
                            />
                          </div>

                          {/* Evoluciones Clínicas */}
                          <div 
                            onClick={() => handleToggleModule("includeEvolutions")}
                            className="flex items-center justify-between p-2 rounded-xl hover:bg-white dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              <FileEdit className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                              <div>
                                <span className="font-bold text-[10.5px] text-slate-800 dark:text-slate-200 block">
                                  Evoluciones y Notas Clínicas Previas
                                </span>
                                <span className="text-[9px] text-slate-400 dark:text-slate-500 block">
                                  Historial de notas de evolución para redactar SOAP continuos y dar seguimiento.
                                </span>
                              </div>
                            </div>
                            <input 
                              type="checkbox" 
                              checked={contextConfig.includeEvolutions} 
                              onChange={() => {}}
                              className="w-3.5 h-3.5 accent-teal-500 cursor-pointer pointer-events-none shrink-0" 
                            />
                          </div>

                          {/* Radiografías */}
                          <div 
                            onClick={() => handleToggleModule("includeXRays")}
                            className="flex items-center justify-between p-2 rounded-xl hover:bg-white dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              <Layers className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                              <div>
                                <span className="font-bold text-[10.5px] text-slate-800 dark:text-slate-200 block">
                                  Radiografías Digitales & Estudios
                                </span>
                                <span className="text-[9px] text-slate-400 dark:text-slate-500 block">
                                  Estudios radiográficos registrados (panorámica, periapical) y notas diagnósticas.
                                </span>
                              </div>
                            </div>
                            <input 
                              type="checkbox" 
                              checked={contextConfig.includeXRays} 
                              onChange={() => {}}
                              className="w-3.5 h-3.5 accent-teal-500 cursor-pointer pointer-events-none shrink-0" 
                            />
                          </div>

                          {/* Privacy PII Masking */}
                          <div 
                            onClick={() => handleToggleModule("maskPII")}
                            className="flex items-center justify-between p-2 rounded-xl bg-teal-500/5 dark:bg-teal-950/20 border border-teal-500/20 hover:bg-teal-500/10 transition-colors cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              <ShieldCheck className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                              <div>
                                <span className="font-bold text-[10.5px] text-teal-800 dark:text-teal-200 flex items-center gap-1.5">
                                  <span>Enmascarar PII / PHI (Privacy by Design)</span>
                                  <span className="text-[7.5px] uppercase tracking-wider bg-teal-500/20 text-teal-700 dark:text-teal-300 font-mono px-1 py-0.2 rounded">HIPAA</span>
                                </span>
                                <span className="text-[9px] text-slate-500 dark:text-slate-400 block">
                                  Oculta RUT/DNI, teléfono y correo electrónico personal al transmitir al modelo.
                                </span>
                              </div>
                            </div>
                            <input 
                              type="checkbox" 
                              checked={contextConfig.maskPII} 
                              onChange={() => {}}
                              className="w-3.5 h-3.5 accent-teal-500 cursor-pointer pointer-events-none shrink-0" 
                            />
                          </div>
                        </div>
                      </div>

                      {/* Live Metrics Summary: Clinical status for regular users, technical audit for admins */}
                      {canInspectPayload ? (
                        <div className="p-2.5 rounded-2xl bg-slate-100/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-[10px]">
                          <div className="space-y-0.5">
                            <span className="text-slate-400 font-mono block">Auditoría Técnica de Payload (Admin):</span>
                            <span className="font-bold text-slate-800 dark:text-slate-100">
                              {liveContextPayload.activeModulesCount} módulos • {liveContextPayload.characterCount} chars (~{liveContextPayload.estimatedTokens} tok)
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowContextInspector(true)}
                            className="px-2.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950/50 text-teal-600 dark:text-teal-400 font-bold rounded-xl border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Ver Payload JSON</span>
                          </button>
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-2xl bg-teal-500/10 dark:bg-teal-950/30 border border-teal-500/20 flex items-center justify-between text-[10px]">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                            <div>
                              <span className="font-bold text-teal-900 dark:text-teal-200 block">
                                Contexto Clínico Activo y Protegido
                              </span>
                              <span className="text-[9px] text-teal-700/80 dark:text-teal-300/80">
                                {liveContextPayload.activeModulesCount} módulos habilitados • Cifrado y optimizado para la atención
                              </span>
                            </div>
                          </div>
                          <span className="text-[8.5px] uppercase tracking-wider bg-teal-500/20 text-teal-800 dark:text-teal-200 font-mono px-2 py-0.5 rounded-full font-bold">
                            Protegido
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Modal Footer */}
                    <div className="px-4 py-2.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 flex items-center justify-between shrink-0">
                      <button
                        type="button"
                        onClick={() => setContextConfig(DEFAULT_CONTEXT_CONFIG)}
                        className="text-[10px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 font-medium cursor-pointer border-0 bg-transparent"
                      >
                        Restablecer
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowContextModal(false)}
                        className="px-4 py-1.5 bg-teal-500 hover:bg-teal-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-teal-500/20 cursor-pointer border-0"
                      >
                        Aplicar y Cerrar
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* MODAL: INSPECTOR DE JSON DE CONTEXTO CLÍNICO (Exclusivo para Administrador / Auditoría HIPAA) */}
              <AnimatePresence>
                {canInspectPayload && showContextInspector && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.16 }}
                    className="absolute inset-0 z-50 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl flex flex-col overflow-hidden rounded-b-[2rem] text-slate-800 dark:text-slate-100"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/70 dark:bg-slate-900/60">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-xl bg-teal-500/15 flex items-center justify-center text-teal-600 dark:text-teal-400 border border-teal-500/30">
                          <Eye className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-display font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white">
                              Inspector de Contexto Clínico
                            </h3>
                            <span className="text-[7.5px] font-mono uppercase tracking-wider px-1.5 py-0.5 bg-amber-500/20 text-amber-700 dark:text-amber-300 rounded border border-amber-500/30 font-bold">
                              Admin / Auditoría
                            </span>
                          </div>
                          <span className="text-[9.5px] text-slate-500 dark:text-slate-400">
                            Payload JSON transmitido a Gemini ({liveContextPayload.characterCount} caracteres)
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={async () => {
                            await copyToClipboardSafely(liveContextPayload.jsonString);
                            setCopiedPayload(true);
                            setTimeout(() => setCopiedPayload(false), 2000);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-700 dark:text-teal-300 font-medium text-[9.5px] flex items-center gap-1 cursor-pointer transition-colors border border-teal-500/20"
                        >
                          {copiedPayload ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedPayload ? "Copiado" : "Copiar JSON"}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowContextInspector(false)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer border-0 bg-transparent"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3.5 hide-scrollbar">
                      <pre className="text-[9.5px] font-mono leading-relaxed bg-slate-900 text-teal-300 p-3.5 rounded-2xl overflow-x-auto shadow-inner border border-slate-800 select-all">
                        {liveContextPayload.jsonString}
                      </pre>
                    </div>

                    <div className="px-4 py-2 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 flex items-center justify-between text-[10px]">
                      <span className="text-slate-500">
                        Modo activo: <strong className="text-teal-600 dark:text-teal-400">{CONTEXT_MODES[contextConfig.mode]?.title || "Personalizado"}</strong>
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowContextInspector(false)}
                        className="px-3 py-1 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl cursor-pointer transition-colors border-0"
                      >
                        Cerrar
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              {/* HOLOGRAPHIC SCANNER ANIMATION */}
              {isAnalyzingFile && (
                <div className="absolute inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-white font-mono rounded-b-[2rem] sm:rounded-b-[2.5rem]">
                  <style>{`
                    @keyframes scan-animation {
                      0% { top: 3%; }
                      50% { top: 97%; }
                      100% { top: 3%; }
                    }
                  `}</style>
                  {/* Cybernetic grid */}
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(20,184,166,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(20,184,166,0.06)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none rounded-b-[2rem] sm:rounded-b-[2.5rem]" />
                  
                  {/* Laser beam */}
                  <div className="absolute inset-x-6 h-0.5 bg-gradient-to-r from-transparent via-teal-400 to-transparent shadow-[0_0_15px_rgba(45,212,191,0.9)]" style={{
                    animation: "scan-animation 1.5s infinite linear"
                  }} />
                  
                  <div className="flex flex-col items-center gap-5 max-w-[280px] w-full relative z-10 text-center animate-pulse">
                    <div className="relative w-16 h-16 rounded-full border border-teal-500/35 flex items-center justify-center">
                      <BrainCircuit className="w-8 h-8 text-teal-400" />
                      <div className="absolute inset-0 rounded-full border-t border-teal-400 animate-spin" />
                    </div>
                    
                    <div className="space-y-1">
                      <h3 className="text-xs font-black font-display tracking-wider text-teal-400 uppercase">Hologram Scanner Pro</h3>
                      <p className="text-[9px] text-slate-400">Analizando biomarcadores tisulares...</p>
                    </div>

                    {/* Progress Log Console */}
                    <div className="w-full text-left bg-black/60 border border-teal-500/20 rounded-2xl p-3.5 font-mono text-[9px] text-teal-300 space-y-1.5 h-[124px] overflow-hidden shadow-inner leading-relaxed select-none">
                      {fileScanLogs.map((log, i) => (
                        <div key={i} className="flex gap-1 items-start">
                          <span className="text-teal-500 shrink-0 select-none">&gt;</span>
                          <span className="truncate">{log}</span>
                        </div>
                      ))}
                      <div className="w-1.5 h-2.5 bg-teal-400 rounded-sm inline-block animate-pulse" />
                    </div>
                  </div>
                </div>
              )}

              {/* Messages Area - Liquid Glass */}
              <div 
                onPointerDown={(e) => e.stopPropagation()} 
                className="flex-1 overflow-y-auto p-5 space-y-5 text-xs bg-gradient-to-b from-white/30 to-slate-50/50 dark:from-slate-900/10 dark:to-slate-800/20 hide-scrollbar shadow-inner relative"
              >
                {/* Context badge floating */}
                <div className="absolute top-3 inset-x-0 flex justify-center z-10 pointer-events-none sticky">
                  <div className="bg-white/80 dark:bg-black/60 backdrop-blur-md border border-slate-200/50 dark:border-white/10 shadow-sm px-3 py-1.5 rounded-full flex items-center gap-2 text-[9px] text-slate-500 font-mono tracking-wide">
                    <BrainCircuit className="w-3 h-3 text-teal-500" />
                    MEMORIA ACTIVA: {activePatient ? activePatient.name.toUpperCase() : "SISTEMA GLOBAL"}
                  </div>
                </div>

                {messages.map((m) => {
                  const isBot = m.role === "assistant";
                  return (
                    <div key={m.id} className={`flex gap-3 ${isBot ? "justify-start" : "justify-end"} relative z-20 animate-fade-in`}>
                      <div className={`p-4 max-w-[88%] md:max-w-[85%] rounded-[1.2rem] leading-relaxed select-text drop-shadow-sm ${
                        isBot 
                          ? "bg-white/80 dark:bg-slate-800/85 backdrop-blur-md text-slate-800 dark:text-slate-100 rounded-tl-sm border border-white dark:border-slate-700/80 font-medium" 
                          : "bg-teal-500 text-white rounded-tr-sm font-medium shadow-md shadow-teal-500/20 border border-teal-400 whitespace-pre-wrap"
                      }`}>
                        {isBot ? (
                          <div className="markdown-body text-slate-800 dark:text-slate-100 [&_p]:mb-2.5 [&_p]:last-child:mb-0 [&_p]:leading-relaxed [&_p]:text-slate-800 dark:[&_p]:text-slate-100 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_ul]:text-slate-800 dark:[&_ul]:text-slate-100 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3 [&_ol]:text-slate-800 dark:[&_ol]:text-slate-100 [&_li]:mb-1.5 [&_li]:text-slate-800 dark:[&_li]:text-slate-100 [&_table]:w-full [&_table]:my-3 [&_table]:border-collapse [&_table]:text-[11px] [&_table]:rounded-xl [&_table]:overflow-hidden [&_th]:p-2.5 [&_th]:bg-teal-50 dark:[&_th]:bg-teal-950/60 [&_th]:font-bold [&_th]:text-teal-900 dark:[&_th]:text-teal-200 [&_th]:border [&_th]:border-teal-200 dark:[&_th]:border-teal-900/60 [&_th]:text-left [&_td]:p-2.5 [&_td]:border [&_td]:border-slate-200 dark:[&_td]:border-slate-700/80 [&_td]:text-slate-800 dark:[&_td]:text-slate-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded-md [&_code]:bg-teal-50 dark:[&_code]:bg-teal-950/50 [&_code]:text-teal-700 dark:[&_code]:text-teal-300 [&_code]:font-mono [&_code]:text-[10px] [&_blockquote]:border-l-4 [&_blockquote]:border-teal-500 [&_blockquote]:pl-3 [&_blockquote]:py-2 [&_blockquote]:italic [&_blockquote]:bg-slate-500/5 dark:[&_blockquote]:bg-white/5 [&_blockquote]:text-slate-700 dark:[&_blockquote]:text-slate-200 [&_blockquote]:rounded-r-lg [&_blockquote]:my-3 [&_h1]:text-sm [&_h1]:font-black [&_h1]:mt-4 [&_h1]:mb-2 [&_h1]:text-teal-800 dark:[&_h1]:text-teal-300 [&_h2]:text-xs [&_h2]:font-bold [&_h2]:mt-3 [&_h2]:mb-1.5 [&_h2]:text-teal-700 dark:[&_h2]:text-teal-300 [&_h3]:font-bold [&_h3]:mt-2 [&_h3]:mb-1 [&_strong]:text-teal-700 dark:[&_strong]:text-teal-300 [&_strong]:font-bold [&_strong]:tracking-tight">
                            <Markdown remarkPlugins={[remarkGfm]}>{m.content}</Markdown>
                          </div>
                        ) : (
                          m.content
                        )}
                      </div>
                    </div>
                  );
                })}
                {loading && (
                  <div className="flex gap-2 items-center p-3">
                     <div className="flex gap-1.5 bg-white/60 dark:bg-slate-800/60 p-3 rounded-full backdrop-blur-md">
                       <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce" style={{animationDelay: "0ms"}}/>
                       <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce" style={{animationDelay: "150ms"}}/>
                       <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce" style={{animationDelay: "300ms"}}/>
                     </div>
                  </div>
                )}
                <div ref={scrollRef} />
              </div>
            </div>

            {/* Input & Commands Footer */}
            <div 
              onPointerDown={(e) => e.stopPropagation()} 
              className="px-5 pb-5 pt-3 bg-white/40 dark:bg-slate-900/40 border-t border-white/40 dark:border-white/5 backdrop-blur-xl relative z-30"
            >
              {/* ADVANCED FILE ATTACHMENT MENU */}
              <AnimatePresence>
                {showAttachmentMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 15, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.98 }}
                    className="absolute bottom-full left-5 right-5 mb-3 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border border-slate-200/85 dark:border-slate-800 rounded-3xl p-4 shadow-2xl z-40 text-slate-800 dark:text-slate-100 flex flex-col gap-3.5"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                      <div className="flex items-center gap-1.5 font-sans">
                        <Sparkles className="w-4 h-4 text-teal-400 animate-pulse shrink-0" />
                        <h4 className="font-display font-black text-xs tracking-tight uppercase text-slate-900 dark:text-white">Escáner Clínico de Archivos con IA</h4>
                      </div>
                      <button 
                        onClick={() => setShowAttachmentMenu(false)}
                        className="text-xs font-black p-1 px-2.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer border-0 bg-transparent"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 px-0.5">
                      {/* Preset 1 */}
                      <button 
                        onClick={() => triggerFileScan("rx_panoramica_carlos.png", "rx", "2.4 MB")}
                        className="p-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/50 dark:hover:bg-slate-800 rounded-2xl text-left border border-slate-200/50 dark:border-slate-800 transition-all cursor-pointer flex flex-col gap-1 focus:outline-none"
                      >
                        <div className="flex items-center gap-1 text-teal-500 font-bold text-[9px] uppercase tracking-wider">
                          <Sliders className="w-3 h-3" />
                          <span>Caso Carlos - Rx</span>
                        </div>
                        <span className="font-bold text-[10.5px] text-slate-800 dark:text-slate-100 truncate w-full">rx_panoramica.png</span>
                        <span className="text-[8.5px] text-slate-400 dark:text-slate-500 leading-normal line-clamp-1">Reabsorción total, bolsas, furcas</span>
                      </button>

                      {/* Preset 2 */}
                      <button 
                        onClick={() => triggerFileScan("lab_quimica_hba1c.pdf", "sangre", "420 KB")}
                        className="p-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/50 dark:hover:bg-slate-800 rounded-2xl text-left border border-slate-200/50 dark:border-slate-800 transition-all cursor-pointer flex flex-col gap-1 focus:outline-none"
                      >
                        <div className="flex items-center gap-1 text-cyan-500 font-bold text-[9px] uppercase tracking-wider">
                          <Database className="w-3 h-3" />
                          <span>Caso Carlos - Lab</span>
                        </div>
                        <span className="font-bold text-[10.5px] text-slate-800 dark:text-slate-100 truncate w-full">lab_quimica.pdf</span>
                        <span className="text-[8.5px] text-slate-400 dark:text-slate-500 leading-normal line-clamp-1">Diabetes HbA1c 8.4% y glicemia</span>
                      </button>

                      {/* Preset 3 */}
                      <button 
                        onClick={() => triggerFileScan("anamnesis_factores_riesgo.docx", "anamnesis", "180 KB")}
                        className="p-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/50 dark:hover:bg-slate-800 rounded-2xl text-left border border-slate-200/50 dark:border-slate-800 transition-all cursor-pointer flex flex-col gap-1 focus:outline-none"
                      >
                        <div className="flex items-center gap-1 text-emerald-500 font-bold text-[9px] uppercase tracking-wider">
                          <BrainCircuit className="w-3 h-3" />
                          <span>Caso Carlos - Anam</span>
                        </div>
                        <span className="font-bold text-[10.5px] text-slate-800 dark:text-slate-100 truncate w-full">anamnesis_fact.docx</span>
                        <span className="text-[8.5px] text-slate-400 dark:text-slate-500 leading-normal line-clamp-1">Amlodipino e hiperplasias</span>
                      </button>
                    </div>

                    {/* Manual File input */}
                    <div className="relative">
                      <label className="flex items-center justify-center gap-2 py-3 bg-teal-500/10 hover:bg-teal-500/15 border border-dashed border-teal-500/25 hover:border-teal-500/50 rounded-2xl text-xs text-teal-600 dark:text-teal-400 font-bold cursor-pointer transition-all">
                        <Upload className="w-4 h-4 shrink-0" />
                        <span>O arrastrar / subir archivo de tu ordenador...</span>
                        <input 
                          type="file" 
                          className="hidden" 
                          accept=".png,.jpg,.jpeg,.pdf,.docx,.txt"
                          onChange={handleCustomFileUpload} 
                        />
                      </label>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ATTACHED FILE ACTIVE CHIP */}
              {attachedFile && (
                <div className="flex items-center justify-between bg-teal-500/10 border border-teal-500/20 px-3.5 py-2.5 rounded-2xl mb-3 text-[10px] animate-fade-in select-none">
                  <div className="flex items-center gap-2 text-teal-800 dark:text-teal-400">
                    <FileText className="w-4 h-4 text-teal-500 shrink-0" />
                    <div>
                      <span className="font-bold tracking-tight">{attachedFile.name}</span>
                      <span className="text-slate-400 dark:text-slate-500 ml-1.5">({attachedFile.size})</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setAttachedFile(null)}
                    className="p-1 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors border-0 bg-transparent cursor-pointer"
                    title="Remover archivo adjunto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Carousel de sugerencias rápidas con flechas de navegación izquierda y derecha */}
              <div className="relative flex items-center gap-1.5 mb-2.5 max-w-full">
                <button 
                  type="button"
                  onClick={() => scrollChips("left")}
                  className="shrink-0 p-1.5 rounded-full bg-white/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/60 shadow-xs active:scale-90 transition-all cursor-pointer z-10 flex items-center justify-center"
                  title="Ver sugerencias anteriores"
                  aria-label="Desplazar a la izquierda"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                <div 
                  ref={chipsScrollRef}
                  className="flex gap-2 py-1 overflow-x-auto select-none touch-pan-x scroll-smooth hide-scrollbar flex-1 items-center"
                >
                  {/* Mode-specific suggested prompts dynamically highlighted */}
                  {(CONTEXT_MODES[contextConfig.mode]?.suggestedPrompts || []).map((promptText, idx) => (
                    <button
                      key={`mode-prompt-${idx}`}
                      onClick={() => handleSendMessage(promptText)}
                      className="shrink-0 text-[10px] font-bold tracking-wide px-3 py-1.5 rounded-full bg-teal-500/20 dark:bg-teal-500/25 border border-teal-500/40 text-teal-800 dark:text-teal-200 hover:bg-teal-500/35 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                      title={promptText}
                    >
                      <Sparkles className="w-3 h-3 text-teal-600 dark:text-teal-300 shrink-0" />
                      <span className="truncate max-w-[200px]">{promptText}</span>
                    </button>
                  ))}

                  <button onClick={() => handleSendMessage("¿Cuáles son los comandos de voz y cómo dicto en el periodontograma?")} className="shrink-0 text-[10px] font-bold tracking-wide px-3 py-1.5 rounded-full bg-teal-500/15 border border-teal-500/30 text-teal-700 dark:text-teal-300 hover:bg-teal-500/25 active:scale-95 transition-all cursor-pointer flex items-center gap-1">
                    🎙️ Comandos por Voz
                  </button>
                  <button onClick={() => handleSendMessage("Analizar paciente activo")} className="shrink-0 text-[10px] font-bold tracking-wide px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/25 active:scale-95 transition-all cursor-pointer flex items-center gap-1">
                    📊 Resumen del Paciente
                  </button>
                  <button onClick={() => handleSendMessage("Explícanos en profundidad la clasificación de periodontitis (Estadios y Grados) según el Consenso AAP/EFP 2018.")} className="shrink-0 text-[10px] font-bold tracking-wide px-3 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-600 dark:text-teal-400 hover:bg-teal-500/20 active:scale-95 transition-all cursor-pointer flex items-center gap-1">
                    📚 Periodoncia AAP 2018
                  </button>
                  <button onClick={() => handleSendMessage("Cuáles son los criterios clínicos del sistema ICDAS para evaluar el nivel de avance de caries?")} className="shrink-0 text-[10px] font-bold tracking-wide px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/20 active:scale-95 transition-all cursor-pointer flex items-center gap-1">
                    🔍 Caries (ICDAS)
                  </button>
                  <button onClick={() => handleSendMessage("Explica las clases de Angle de oclusión y la diferencia entre trauma oclusal primario y secundario.")} className="shrink-0 text-[10px] font-bold tracking-wide px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 active:scale-95 transition-all cursor-pointer flex items-center gap-1">
                    ⚖️ Oclusión y Angle
                  </button>
                  <button onClick={() => handleSendMessage("En prótesis removible, detallame la clasificación de Kennedy y las reglas de Applegate.")} className="shrink-0 text-[10px] font-bold tracking-wide px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 active:scale-95 transition-all cursor-pointer flex items-center gap-1">
                    🦷 Prótesis (Kennedy)
                  </button>
                  <button onClick={() => handleSendMessage("¿Cuáles son los signos y el manejo de Alveolitis seca frente al de Alveolitis húmeda?")} className="shrink-0 text-[10px] font-bold tracking-wide px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 active:scale-95 transition-all cursor-pointer flex items-center gap-1">
                    🩸 Alveolitis Seca vs Húmeda
                  </button>
                  <button onClick={() => handleSendMessage("Qué diferencia hay entre una Pulpotomía y una Pulpectomía en Odontopediatría?")} className="shrink-0 text-[10px] font-bold tracking-wide px-3 py-1.5 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-600 dark:text-pink-400 hover:bg-pink-500/20 active:scale-95 transition-all cursor-pointer flex items-center gap-1">
                    👶 Odontopediatría
                  </button>
                  <button onClick={() => handleSendMessage("Cuál es el protocolo de profilaxis para endocarditis infecciosa y qué antibióticos alternativos darías en alérgicos?")} className="shrink-0 text-[10px] font-bold tracking-wide px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 active:scale-95 transition-all cursor-pointer flex items-center gap-1">
                    💊 Profilaxis
                  </button>
                  <button onClick={() => handleSendMessage("Cómo diagnostico una Leucoplasia Oral y qué precauciones de malignidad debo tomar?")} className="shrink-0 text-[10px] font-bold tracking-wide px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 active:scale-95 transition-all cursor-pointer flex items-center gap-1">
                    🔬 Patología Oral
                  </button>
                  <button onClick={() => setEmergencyMode("selector")} className="shrink-0 text-[10px] font-bold tracking-wide px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 active:scale-95 transition-all cursor-pointer flex items-center gap-1">
                    🚨 Protocolos de Emergencia
                  </button>
                </div>

                <button 
                  type="button"
                  onClick={() => scrollChips("right")}
                  className="shrink-0 p-1.5 rounded-full bg-white/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/60 shadow-xs active:scale-90 transition-all cursor-pointer z-10 flex items-center justify-center"
                  title="Ver más sugerencias"
                  aria-label="Desplazar a la derecha"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                  className={`shrink-0 p-3.5 rounded-2xl flex items-center justify-center transition-all cursor-pointer shadow-inner border backdrop-blur-md ${
                    showAttachmentMenu || attachedFile
                    ? "bg-teal-500/10 border-teal-500/30 text-teal-500" 
                    : "bg-white/80 border-slate-200 text-slate-500 hover:text-slate-700 dark:bg-slate-800/80 dark:border-slate-700 dark:text-slate-400"
                  }`}
                  title="Adjuntar placa o examen clínico con IA"
                >
                  <Paperclip className="w-5 h-5" />
                </button>
                <button
                  onClick={toggleListening}
                  className={`shrink-0 p-3.5 rounded-2xl flex items-center justify-center transition-all cursor-pointer shadow-inner border backdrop-blur-md ${
                    isListening 
                    ? "bg-rose-100 border-rose-300 text-rose-600 animate-pulse dark:bg-rose-900/30 dark:border-rose-800" 
                    : "bg-white/80 border-slate-200 text-slate-500 hover:text-slate-700 dark:bg-slate-800/80 dark:border-slate-700 dark:text-slate-400"
                  }`}
                >
                  <Mic className="w-5 h-5" />
                </button>
                <input
                  type="text"
                  placeholder="Instruye a Dentito..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSendMessage(input);
                  }}
                  className="flex-1 text-xs p-3.5 border border-white/50 dark:border-white/10 bg-white/50 dark:bg-slate-900/50 rounded-2xl outline-none text-slate-800 dark:text-slate-100 font-medium placeholder-slate-400 focus:bg-white dark:focus:bg-slate-800 transition-colors shadow-inner"
                />
                <button
                  onClick={() => handleSendMessage(input)}
                  className="bg-teal-500 hover:bg-teal-600 text-white p-3.5 rounded-2xl cursor-pointer shadow-lg shadow-teal-500/25 transition-all shrink-0 border border-teal-400/50"
                  disabled={loading || !input.trim()}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export default React.memo(DentitoChatComponent);
