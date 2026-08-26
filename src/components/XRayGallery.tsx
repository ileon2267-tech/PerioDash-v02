import React, { useState, useEffect, useRef } from "react";
import { Patient, XRayImage } from "../types";
import { 
  Upload, 
  Sun, 
  Contrast, 
  Droplets, 
  Maximize, 
  Trash2, 
  BrainCircuit, 
  ScanSearch, 
  X, 
  Ruler, 
  Tag, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  CheckCircle2,
  Sparkles,
  MousePointer2,
  Plus
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { recordHipaaAudit } from "../utils/hipaaAudit";

interface XRayGalleryProps {
  patient: Patient;
  onUpdate: (xrays: XRayImage[]) => void;
}

interface AnnotationMarker {
  id: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  text: string;
  type: 'caries' | 'osea' | 'apical' | 'implante' | 'otro';
}

interface MeasurementLine {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  lengthMm: number;
}

export default function XRayGallery({ patient, onUpdate }: XRayGalleryProps) {
  const xrays = patient.xRays || [];
  
  const [selectedImg, setSelectedImg] = useState<XRayImage | null>(null);

  // Real-time CSS Filter states
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [invert, setInvert] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Tool Modes: 'inspect' | 'ruler' | 'annotate'
  const [activeTool, setActiveTool] = useState<'inspect' | 'ruler' | 'annotate'>('inspect');
  const [selectedAnnotationCategory, setSelectedAnnotationCategory] = useState<AnnotationMarker['type']>('caries');
  const [annotationText, setAnnotationText] = useState("Caries interproximal");

  // Calibrator: mm per 100% canvas width (default ~ 120mm for panoramic, 40mm for periapical)
  const [calibrationMm, setCalibrationMm] = useState(120);

  // Active Annotations and Measurements
  const [annotations, setAnnotations] = useState<AnnotationMarker[]>([
    { id: 'ann-1', x: 45, y: 35, text: 'Caries Ocluso-distal P.16', type: 'caries' },
    { id: 'ann-2', x: 65, y: 62, text: 'Pérdida ósea horizontal moderada (4.2mm)', type: 'osea' }
  ]);
  const [measurements, setMeasurements] = useState<MeasurementLine[]>([
    { id: 'meas-1', x1: 62, y1: 58, x2: 62, y2: 68, lengthMm: 4.2 }
  ]);

  // Drawing measurement states
  const [drawingStart, setDrawingStart] = useState<{ x: number; y: number } | null>(null);
  const [currentMousePos, setCurrentMousePos] = useState<{ x: number; y: number } | null>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  // AI Vision state
  const [aiActive, setAiActive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Escape key handler for full screen modal
  useEffect(() => {
    if (!selectedImg) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedImg(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedImg]);

  // Log HIPAA audit when full screen or image inspected
  useEffect(() => {
    if (selectedImg) {
      recordHipaaAudit("VIEW_XRAY_IMAGE", `Inspección diagnóstica de radiografía (${selectedImg.type}) de ${patient.name}.`, {
        patientId: patient.id,
        patientName: patient.name,
        resource: "Galería Radiológica & Visor ePHI",
        severity: "info"
      });
    }
  }, [selectedImg?.id]);

  const handleUploadFake = () => {
    const newRay: XRayImage = {
      id: `rx-${Date.now()}`,
      url: "https://images.unsplash.com/photo-1627958448821-2f3bdf081fc3?q=80&w=2070&auto=format&fit=crop",
      date: new Date().toISOString().split('T')[0],
      type: "panoramica",
      notes: "Radiografía panorámica de control inicial."
    };
    onUpdate([...xrays, newRay]);

    recordHipaaAudit("UPLOAD_XRAY_IMAGE", `Carga de nueva radiografía panorámica para paciente ${patient.name}.`, {
      patientId: patient.id,
      patientName: patient.name,
      resource: "Radiografías ePHI",
      severity: "info"
    });
  };

  const removeXRay = (id: string) => {
    onUpdate(xrays.filter(x => x.id !== id));
    recordHipaaAudit("DELETE_XRAY_IMAGE", `Eliminación de radiografía (ID: ${id}) de ${patient.name}.`, {
      patientId: patient.id,
      patientName: patient.name,
      resource: "Radiografías ePHI",
      severity: "warning"
    });
  };

  const resetFilters = () => {
    setBrightness(100);
    setContrast(100);
    setInvert(0);
    setZoomLevel(1);
    setAiActive(false);
    setActiveTool('inspect');
  };

  const runAIAssistant = () => {
    if (aiActive) {
      setAiActive(false);
      return;
    }
    
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      setAiActive(true);
      recordHipaaAudit("AI_XRAY_ANALYSIS", `Análisis asistido por IA de radiografía de ${patient.name}.`, {
        patientId: patient.id,
        patientName: patient.name,
        resource: "Diagnóstico por Imágenes Asistido por IA",
        severity: "info"
      });
    }, 1200);
  };

  // Canvas click handler for tools
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageContainerRef.current) return;
    const rect = imageContainerRef.current.getBoundingClientRect();
    const xPct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const yPct = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));

    if (activeTool === 'annotate') {
      const newAnn: AnnotationMarker = {
        id: `ann-${Date.now()}`,
        x: Number(xPct.toFixed(1)),
        y: Number(yPct.toFixed(1)),
        text: annotationText,
        type: selectedAnnotationCategory
      };
      setAnnotations([...annotations, newAnn]);
    } else if (activeTool === 'ruler') {
      if (!drawingStart) {
        setDrawingStart({ x: xPct, y: yPct });
      } else {
        const dx = (xPct - drawingStart.x) * (calibrationMm / 100);
        const dy = (yPct - drawingStart.y) * (calibrationMm / 100);
        const distanceMm = Math.sqrt(dx * dx + dy * dy);

        const newMeas: MeasurementLine = {
          id: `meas-${Date.now()}`,
          x1: drawingStart.x,
          y1: drawingStart.y,
          x2: xPct,
          y2: yPct,
          lengthMm: Number(distanceMm.toFixed(1))
        };
        setMeasurements([...measurements, newMeas]);
        setDrawingStart(null);
        setCurrentMousePos(null);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (activeTool === 'ruler' && drawingStart && imageContainerRef.current) {
      const rect = imageContainerRef.current.getBoundingClientRect();
      const xPct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      const yPct = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
      setCurrentMousePos({ x: xPct, y: yPct });
    }
  };

  const removeAnnotation = (id: string) => {
    setAnnotations(annotations.filter(a => a.id !== id));
  };

  const removeMeasurement = (id: string) => {
    setMeasurements(measurements.filter(m => m.id !== id));
  };

  return (
    <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/50 dark:border-white/5 shadow-2xl rounded-3xl p-6 sm:p-8 relative overflow-hidden">
       {/* Glass highlight overlay */}
       <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-50" />
       
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-slate-200/50 dark:border-slate-700/50 pb-6 relative z-10 gap-6">
         <div>
           <h3 className="font-display font-bold text-2xl text-slate-800 dark:text-white flex items-center gap-2">
             <span>Radiología Digital, Mediciones & IA</span>
           </h3>
           <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-lg leading-relaxed">
             Regla de calibración milimétrica, marcado de patologías y detección de pérdida ósea mediante Visión Artificial.
           </p>
         </div>
         <button 
           onClick={handleUploadFake}
           className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-6 rounded-2xl flex items-center gap-2 transition-all shadow-lg shadow-teal-500/25 cursor-pointer"
         >
           <Upload className="w-5 h-5"/>
           <span className="text-sm">Adjuntar Radiografía Digital</span>
         </button>
       </div>

       {xrays.length === 0 ? (
         <div className="flex flex-col items-center justify-center p-16 text-slate-400 bg-white/40 dark:bg-slate-800/20 rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-700 backdrop-blur-md shadow-inner">
            <ScanSearch className="w-16 h-16 mb-4 opacity-30"/>
            <p className="text-lg font-bold text-slate-500 dark:text-slate-400">Sin imágenes radiográficas</p>
            <p className="text-sm font-medium text-slate-400 mt-2">Carga una panorámica o periapical para habilitar el motor de calibración y mediciones.</p>
         </div>
       ) : (
         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
           {xrays.map(x => (
             <div 
               key={x.id} 
               onClick={() => { setSelectedImg(x); resetFilters(); }}
               className="group relative rounded-2xl border border-white/40 dark:border-white/10 overflow-hidden cursor-pointer aspect-video bg-black shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all"
             >
                <img src={x.url} alt={x.type} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 flex items-center justify-between">
                  <div>
                    <p className="text-white font-bold text-sm capitalize">{x.type}</p>
                    <p className="text-teal-300 font-mono text-[10px] mt-0.5">{x.date}</p>
                  </div>
                  <span className="px-2 py-0.5 bg-teal-500/30 border border-teal-400/40 text-teal-200 text-[10px] font-bold rounded-lg backdrop-blur-xs">
                    Abrir Visor
                  </span>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); removeXRay(x.id); }}
                  className="absolute top-3 right-3 p-2 bg-rose-500/80 hover:bg-rose-500 text-white rounded-xl opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-md cursor-pointer"
                  title="Eliminar radiografía"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
             </div>
           ))}
         </div>
       )}

       {/* Full screen modal for focused XRay & Annotation Workstation */}
       <AnimatePresence>
         {selectedImg && (
           <motion.div 
             initial={{ opacity: 0, backdropFilter: "blur(0px)" }} 
             animate={{ opacity: 1, backdropFilter: "blur(12px)" }} 
             exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
             className="fixed inset-0 z-[500] bg-slate-950/95 flex flex-col xl:flex-row overflow-y-auto xl:overflow-hidden select-none"
           >
             {/* Main Image View & Interactive Canvas */}
             <div className="flex-1 relative flex flex-col items-center justify-center p-4 sm:p-6 min-h-[420px] xl:min-h-full overflow-hidden">
               
               {/* Top Bar Floating Controls */}
               <div className="absolute top-5 inset-x-5 flex flex-wrap items-center justify-between gap-3 z-50 pointer-events-auto">
                 <button 
                   onClick={() => setSelectedImg(null)}
                   className="text-white font-bold px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full transition-all cursor-pointer backdrop-blur-md text-xs flex items-center gap-1.5 shadow-lg"
                 >
                   ← Volver al Expediente
                 </button>

                 {/* Tool Mode Pill Selector */}
                 <div className="flex items-center gap-1 bg-black/70 backdrop-blur-md p-1 rounded-2xl border border-white/20 shadow-2xl">
                   <button
                     onClick={() => { setActiveTool('inspect'); setDrawingStart(null); }}
                     className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                       activeTool === 'inspect'
                         ? "bg-teal-500 text-white shadow-xs"
                         : "text-slate-300 hover:text-white"
                     }`}
                   >
                     <MousePointer2 className="w-3.5 h-3.5" />
                     <span>Explorar</span>
                   </button>

                   <button
                     onClick={() => { setActiveTool('ruler'); setDrawingStart(null); }}
                     className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                       activeTool === 'ruler'
                         ? "bg-teal-500 text-white shadow-xs"
                         : "text-slate-300 hover:text-white"
                     }`}
                   >
                     <Ruler className="w-3.5 h-3.5" />
                     <span>Regla Calibrada (mm)</span>
                   </button>

                   <button
                     onClick={() => { setActiveTool('annotate'); setDrawingStart(null); }}
                     className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                       activeTool === 'annotate'
                         ? "bg-teal-500 text-white shadow-xs"
                         : "text-slate-300 hover:text-white"
                     }`}
                   >
                     <Tag className="w-3.5 h-3.5" />
                     <span>Anotar Patología</span>
                   </button>
                 </div>

                 {/* Zoom Controls */}
                 <div className="flex items-center gap-1 bg-black/70 backdrop-blur-md p-1 rounded-2xl border border-white/20">
                   <button
                     onClick={() => setZoomLevel(Math.max(0.7, zoomLevel - 0.2))}
                     className="p-1.5 text-slate-300 hover:text-white rounded-xl hover:bg-white/10"
                     title="Reducir Zoom"
                   >
                     <ZoomOut className="w-4 h-4" />
                   </button>
                   <span className="text-xs font-mono font-bold text-teal-300 px-2">
                     {Math.round(zoomLevel * 100)}%
                   </span>
                   <button
                     onClick={() => setZoomLevel(Math.min(3.0, zoomLevel + 0.2))}
                     className="p-1.5 text-slate-300 hover:text-white rounded-xl hover:bg-white/10"
                     title="Aumentar Zoom"
                   >
                     <ZoomIn className="w-4 h-4" />
                   </button>
                 </div>
               </div>

               {/* Central Active Image Container */}
               <div 
                 ref={imageContainerRef}
                 onClick={handleCanvasClick}
                 onMouseMove={handleMouseMove}
                 style={{ transform: `scale(${zoomLevel})` }}
                 className={`relative inline-block max-w-full max-h-[75vh] transition-transform duration-150 rounded-2xl shadow-2xl overflow-hidden border border-white/20 ${
                   activeTool === 'ruler' ? 'cursor-crosshair' : activeTool === 'annotate' ? 'cursor-cell' : 'cursor-default'
                 }`}
               >
                 <img 
                   src={selectedImg.url} 
                   alt={selectedImg.type}
                   style={{ 
                     filter: `brightness(${brightness}%) contrast(${contrast}%) invert(${invert}%)`
                   }}
                   className="max-w-full max-h-[70vh] md:max-h-[80vh] object-contain transition-all duration-75 block select-none pointer-events-none"
                 />
                 
                 {/* SVG Measurement Overlay Lines */}
                 <svg className="absolute inset-0 w-full h-full pointer-events-none z-30">
                   {measurements.map((m) => (
                     <g key={m.id}>
                       <line 
                         x1={`${m.x1}%`} 
                         y1={`${m.y1}%`} 
                         x2={`${m.x2}%`} 
                         y2={`${m.y2}%`} 
                         stroke="#14b8a6" 
                         strokeWidth="2.5" 
                         strokeDasharray="4 2"
                       />
                       <circle cx={`${m.x1}%`} cy={`${m.y1}%`} r="4" fill="#0d9488" />
                       <circle cx={`${m.x2}%`} cy={`${m.y2}%`} r="4" fill="#0d9488" />
                       <rect 
                         x={`${(m.x1 + m.x2) / 2 - 3}%`} 
                         y={`${(m.y1 + m.y2) / 2 - 2.5}%`} 
                         width="6.5%" 
                         height="4%" 
                         rx="4" 
                         fill="#0f172a" 
                         stroke="#14b8a6" 
                       />
                       <text 
                         x={`${(m.x1 + m.x2) / 2}%`} 
                         y={`${(m.y1 + m.y2) / 2}%`} 
                         fill="#ffffff" 
                         fontSize="10" 
                         fontWeight="bold" 
                         textAnchor="middle" 
                         alignmentBaseline="middle"
                       >
                         {m.lengthMm} mm
                       </text>
                     </g>
                   ))}

                   {/* Active line while drawing */}
                   {drawingStart && currentMousePos && (
                     <line 
                       x1={`${drawingStart.x}%`} 
                       y1={`${drawingStart.y}%`} 
                       x2={`${currentMousePos.x}%`} 
                       y2={`${currentMousePos.y}%`} 
                       stroke="#f59e0b" 
                       strokeWidth="2" 
                       strokeDasharray="3 3"
                     />
                   )}
                 </svg>

                 {/* Interactive Marker Pins */}
                 {annotations.map((ann) => (
                   <div 
                     key={ann.id}
                     style={{ top: `${ann.y}%`, left: `${ann.x}%` }}
                     className="absolute z-40 -translate-x-1/2 -translate-y-1/2 group/pin"
                   >
                     <div className={`w-5 h-5 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-[10px] font-extrabold text-white animate-pulse ${
                       ann.type === 'caries' ? 'bg-red-500' : ann.type === 'osea' ? 'bg-amber-500' : 'bg-teal-500'
                     }`}>
                       •
                     </div>
                     {/* Marker Tooltip */}
                     <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 px-2.5 py-1 bg-slate-900/95 text-white text-[10px] font-bold rounded-lg whitespace-nowrap shadow-xl border border-white/20 pointer-events-auto flex items-center gap-1.5">
                       <span>{ann.text}</span>
                       <button
                         onClick={(e) => { e.stopPropagation(); removeAnnotation(ann.id); }}
                         className="hover:text-red-400 cursor-pointer"
                         title="Eliminar anotación"
                       >
                         ×
                       </button>
                     </div>
                   </div>
                 ))}

                 {/* AI Overlay Bounding Boxes */}
                 <AnimatePresence>
                   {isAnalyzing && (
                     <motion.div 
                       initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                       className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-teal-950/60 backdrop-blur-xs rounded-lg"
                     >
                       <ScanSearch className="w-16 h-16 text-teal-400 animate-ping mb-4" />
                       <div className="text-white font-mono font-bold tracking-widest text-sm animate-pulse">ANALIZANDO DENSIDADES ÓSEAS...</div>
                     </motion.div>
                   )}
                   {aiActive && (
                     <motion.div 
                       initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                       className="absolute inset-0 z-20 pointer-events-none"
                     >
                        <div className="absolute top-[30%] left-[45%] w-[12%] h-[15%] border-2 border-rose-500 bg-rose-500/20 rounded-lg shadow-[0_0_15px_rgba(244,63,94,0.5)] flex items-end">
                           <span className="bg-rose-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-tr-md rounded-bl-md">Caries Oclusal 92%</span>
                        </div>
                        <div className="absolute top-[60%] left-[65%] w-[10%] h-[12%] border-2 border-amber-500 bg-amber-500/20 rounded-lg shadow-[0_0_15px_rgba(245,158,11,0.5)] flex items-end">
                           <span className="bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-tr-md rounded-bl-md">Defecto Óseo 78%</span>
                        </div>
                     </motion.div>
                   )}
                 </AnimatePresence>
               </div>
             </div>

             {/* Right Panel Workstation & Adjustments */}
             <div className="w-full xl:w-96 bg-slate-900 border-t xl:border-t-0 xl:border-l border-white/10 p-6 flex flex-col text-white z-40 shadow-2xl overflow-y-auto shrink-0 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                  <div>
                    <h4 className="font-display font-bold text-lg">Estación de Trabajo RX</h4>
                    <p className="text-xs text-slate-400">Calibración & Patologías</p>
                  </div>
                  <button
                    onClick={() => setSelectedImg(null)}
                    className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                    title="Cerrar (Esc)"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* AI Assistant Button */}
                <div>
                  <button 
                    onClick={runAIAssistant}
                    className={`w-full py-3 px-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all border cursor-pointer ${
                      aiActive 
                        ? "bg-teal-500/20 border-teal-500/50 text-teal-300 shadow-[0_0_20px_rgba(20,184,166,0.2)]" 
                        : "bg-teal-600 hover:bg-teal-500 border-teal-400 text-white shadow-lg shadow-teal-500/25"
                    }`}
                  >
                    <BrainCircuit className={`w-4 h-4 ${aiActive ? "text-teal-400" : ""}`} />
                    <span className="text-xs">{aiActive ? "Visión IA Activada" : "Detección Asistida por IA"}</span>
                  </button>
                </div>

                {/* Active Tool Config Box */}
                {activeTool === 'annotate' && (
                  <div className="bg-slate-800/80 p-4 rounded-2xl border border-teal-500/30 space-y-3">
                    <h5 className="text-xs font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5" />
                      Marcador de Patología:
                    </h5>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { id: "caries", label: "Caries", text: "Caries interproximal" },
                        { id: "osea", label: "Pérdida Ósea", text: "Pérdida ósea vertical" },
                        { id: "apical", label: "Lesión Apical", text: "Radiolucidez periapical" },
                        { id: "implante", label: "Plan Implante", text: "Lecho para implante" }
                      ].map((item) => (
                        <button
                          key={item.id}
                          onClick={() => {
                            setSelectedAnnotationCategory(item.id as any);
                            setAnnotationText(item.text);
                          }}
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                            selectedAnnotationCategory === item.id
                              ? "bg-teal-600 text-white border-teal-400"
                              : "bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      value={annotationText}
                      onChange={(e) => setAnnotationText(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white focus:ring-2 focus:ring-teal-500"
                      placeholder="Texto del marcador..."
                    />
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      * Haz clic en la radiografía para colocar la etiqueta en esa coordenada exacta.
                    </p>
                  </div>
                )}

                {activeTool === 'ruler' && (
                  <div className="bg-slate-800/80 p-4 rounded-2xl border border-teal-500/30 space-y-3">
                    <h5 className="text-xs font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Ruler className="w-3.5 h-3.5" />
                      Calibración Milimétrica:
                    </h5>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-300">
                        <span>Ancho Referencial Arcada:</span>
                        <span className="font-mono font-bold text-teal-300">{calibrationMm} mm</span>
                      </div>
                      <input 
                        type="range" 
                        min="30" 
                        max="200" 
                        value={calibrationMm} 
                        onChange={(e) => setCalibrationMm(Number(e.target.value))} 
                        className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-teal-500" 
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      * Haz clic en el punto de inicio y luego en el punto final sobre la radiografía para medir la pérdida ósea o longitud de raíz.
                    </p>
                  </div>
                )}

                {/* Radiometric Adjustments */}
                <div className="bg-slate-800/50 p-4 rounded-2xl border border-white/5 space-y-4">
                  <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ajustes Radiográficos</h5>
                  
                  <div>
                    <div className="flex justify-between text-xs mb-1.5 text-slate-300 font-bold">
                      <span className="flex items-center gap-1.5"><Sun className="w-3.5 h-3.5 text-amber-300"/> Brillo</span>
                      <span className="font-mono bg-slate-950 px-2 py-0.5 rounded text-[11px]">{brightness}%</span>
                    </div>
                    <input type="range" min="0" max="300" value={brightness} onChange={e => setBrightness(Number(e.target.value))} className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-teal-500" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-xs mb-1.5 text-slate-300 font-bold">
                      <span className="flex items-center gap-1.5"><Contrast className="w-3.5 h-3.5 text-sky-300"/> Contraste</span>
                      <span className="font-mono bg-slate-950 px-2 py-0.5 rounded text-[11px]">{contrast}%</span>
                    </div>
                    <input type="range" min="0" max="300" value={contrast} onChange={e => setContrast(Number(e.target.value))} className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-teal-500" />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1.5 text-slate-300 font-bold">
                      <span className="flex items-center gap-1.5"><Droplets className="w-3.5 h-3.5 text-purple-300"/> Inversión Ósea</span>
                      <span className="font-mono bg-slate-950 px-2 py-0.5 rounded text-[11px]">{invert}%</span>
                    </div>
                    <input type="range" min="0" max="100" value={invert} onChange={e => setInvert(Number(e.target.value))} className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-purple-500" />
                  </div>
                </div>

                <button 
                  onClick={resetFilters}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-bold rounded-xl transition-colors cursor-pointer border border-slate-700 flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restaurar Imagen Original</span>
                </button>
             </div>
           </motion.div>
         )}
       </AnimatePresence>
    </div>
  );
}

