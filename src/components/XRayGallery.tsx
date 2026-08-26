import React, { useState, useEffect } from "react";
import { Patient, XRayImage } from "../types";
import { Upload, Sun, Contrast, Droplets, Maximize, Trash2, BrainCircuit, ScanSearch, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { recordHipaaAudit } from "../utils/hipaaAudit";

interface XRayGalleryProps {
  patient: Patient;
  onUpdate: (xrays: XRayImage[]) => void;
}

export default function XRayGallery({ patient, onUpdate }: XRayGalleryProps) {
  const xrays = patient.xRays || [];
  
  const [selectedImg, setSelectedImg] = useState<XRayImage | null>(null);

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
  
  // Real-time CSS Filter states
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [invert, setInvert] = useState(0);

  // AI Vision state
  const [aiActive, setAiActive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleUploadFake = () => {
    // In a real app we'd open a file picker and upload to cloud storage.
    const newRay: XRayImage = {
      id: `rx-${Date.now()}`,
      url: "https://images.unsplash.com/photo-1627958448821-2f3bdf081fc3?q=80&w=2070&auto=format&fit=crop", // generic xray like image
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
    setAiActive(false);
  };

  const runAIAssistant = () => {
    if (aiActive) {
      setAiActive(false);
      return;
    }
    
    setIsAnalyzing(true);
    // AI Vision processing & audit
    setTimeout(() => {
      setIsAnalyzing(false);
      setAiActive(true);
      recordHipaaAudit("AI_XRAY_ANALYSIS", `Análisis asistido por IA de radiografía de ${patient.name}.`, {
        patientId: patient.id,
        patientName: patient.name,
        resource: "Diagnóstico por Imágenes Asistido por IA",
        severity: "info"
      });
    }, 1500);
  };

  return (
    <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/50 dark:border-white/5 shadow-2xl rounded-3xl p-8 relative overflow-hidden">
       {/* Glass highlight overlay */}
       <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-50" />
       
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-slate-200/50 dark:border-slate-700/50 pb-6 relative z-10 gap-6">
         <div>
           <h3 className="font-display font-bold text-2xl text-slate-800 dark:text-white flex items-center gap-2">
             Radiología Digital & IA
           </h3>
           <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-lg leading-relaxed">Detección de defectos óseos y caries asistida por redes neuronales (Visión Artificial) integrada directamente en el visor.</p>
         </div>
         <button 
           onClick={handleUploadFake}
           className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 px-6 rounded-2xl flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/25 cursor-pointer border border-indigo-400"
         >
           <Upload className="w-5 h-5"/>
           <span className="text-sm">Adjuntar Digitalización</span>
         </button>
       </div>

       {xrays.length === 0 ? (
         <div className="flex flex-col items-center justify-center p-16 text-slate-400 bg-white/40 dark:bg-slate-800/20 rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-700 backdrop-blur-md shadow-inner">
            <ScanSearch className="w-16 h-16 mb-4 opacity-30"/>
            <p className="text-lg font-bold text-slate-500 dark:text-slate-400">Sin imágenes radiográficas</p>
            <p className="text-sm font-medium text-slate-400 mt-2">Carga una panorámica o periapical para habilitar el motor de IA.</p>
         </div>
       ) : (
         <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
           {xrays.map(x => (
             <div 
               key={x.id} 
               onClick={() => { setSelectedImg(x); resetFilters(); }}
               className="group relative rounded-2xl border border-white/40 dark:border-white/10 overflow-hidden cursor-pointer aspect-video bg-black shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all"
             >
                <img src={x.url} alt={x.type} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4">
                  <p className="text-white font-bold text-sm capitalize">{x.type}</p>
                  <p className="text-indigo-300 font-mono text-[10px] mt-1">{x.date}</p>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); removeXRay(x.id); }}
                  className="absolute top-3 right-3 p-2 bg-rose-500/80 hover:bg-rose-500 text-white rounded-xl opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-md cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
             </div>
           ))}
         </div>
       )}

       {/* Full screen modal for focused XRay */}
       <AnimatePresence>
         {selectedImg && (
           <motion.div 
             initial={{ opacity: 0, backdropFilter: "blur(0px)" }} 
             animate={{ opacity: 1, backdropFilter: "blur(12px)" }} 
             exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
             className="fixed inset-0 z-[500] bg-black/95 flex flex-col md:flex-row overflow-y-auto md:overflow-hidden"
           >
             {/* Main Image View */}
             <div className="flex-1 relative flex items-center justify-center p-4 min-h-[350px] md:min-h-full overflow-hidden">
               <button 
                 onClick={() => setSelectedImg(null)}
                 className="absolute top-6 left-6 text-white font-bold px-5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full transition-all z-50 cursor-pointer backdrop-blur-md text-xs sm:text-sm"
               >
                 ← Volver al Expediente
               </button>
               
               <div className="relative inline-block max-w-full max-h-full transition-transform duration-300">
                 <img 
                   src={selectedImg.url} 
                   alt={selectedImg.type}
                   style={{ 
                     filter: `brightness(${brightness}%) contrast(${contrast}%) invert(${invert}%)`
                   }}
                   className="max-w-full max-h-[70vh] md:max-h-[90vh] object-contain transition-all duration-75 rounded-lg shadow-2xl"
                 />
                 
                 {/* AI Overlay (Simulated Bounding Boxes) */}
                 <AnimatePresence>
                   {isAnalyzing && (
                     <motion.div 
                       initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                       className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-indigo-900/40 backdrop-blur-sm rounded-lg"
                     >
                       <ScanSearch className="w-16 h-16 text-indigo-400 animate-ping mb-4" />
                       <div className="text-white font-mono font-bold tracking-widest text-sm animate-pulse">ANALIZANDO DENSIDADES...</div>
                     </motion.div>
                   )}
                   {aiActive && (
                     <motion.div 
                       initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                       className="absolute inset-0 z-20 pointer-events-none"
                     >
                        <div className="absolute top-[30%] left-[45%] w-[12%] h-[15%] border-2 border-rose-500 bg-rose-500/20 rounded-lg shadow-[0_0_15px_rgba(244,63,94,0.5)] flex items-end">
                           <span className="bg-rose-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-tr-md rounded-bl-md">Caries 92%</span>
                        </div>
                        <div className="absolute top-[60%] left-[65%] w-[8%] h-[10%] border-2 border-amber-500 bg-amber-500/20 rounded-lg shadow-[0_0_15px_rgba(245,158,11,0.5)] flex items-end">
                           <span className="bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-tr-md rounded-bl-md">Posible Pérdida 78%</span>
                        </div>
                     </motion.div>
                   )}
                 </AnimatePresence>
               </div>
             </div>

             {/* Right Panel Filters & AI */}
             <div className="w-full md:w-96 bg-zinc-950 border-t md:border-t-0 md:border-l border-white/10 p-6 md:p-8 flex flex-col text-white z-40 shadow-[-20px_0_50px_rgba(0,0,0,0.5)] overflow-y-auto shrink-0">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="font-display font-extrabold text-xl md:text-2xl tracking-tight">Estación de Trabajo</h4>
                  <button
                    onClick={() => setSelectedImg(null)}
                    className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                    title="Cerrar (Esc)"
                    aria-label="Cerrar"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="mb-8">
                  <button 
                    onClick={runAIAssistant}
                    className={`w-full py-4 px-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all border cursor-pointer ${
                      aiActive 
                        ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-300 shadow-[0_0_20px_rgba(99,102,241,0.2)]" 
                        : "bg-indigo-600 hover:bg-indigo-500 border-indigo-400 text-white shadow-lg shadow-indigo-500/25"
                    }`}
                  >
                    <BrainCircuit className={`w-5 h-5 ${aiActive ? "text-indigo-400" : ""}`} />
                    {aiActive ? "Visión Artificial Activa" : "Activar Visión IA"}
                  </button>
                  {aiActive && (
                    <p className="text-xs text-indigo-300/70 mt-3 font-medium leading-relaxed">
                      El modelo ha detectado 2 áreas de interés clínico. Revisa los recuadros marcados para evaluación detallada.
                    </p>
                  )}
                </div>

                <div className="space-y-6 flex-1">
                  <div className="bg-zinc-900/50 p-5 rounded-2xl border border-white/5 space-y-5">
                    <h5 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Ajustes Radiométricos</h5>
                    
                    <div>
                      <div className="flex justify-between text-xs mb-2 text-zinc-300 font-bold">
                        <span className="flex items-center gap-2"><Sun className="w-4 h-4 text-amber-100"/> Brillo</span>
                        <span className="font-mono bg-zinc-800 px-2 py-0.5 rounded">{brightness}%</span>
                      </div>
                      <input type="range" min="0" max="300" value={brightness} onChange={e => setBrightness(Number(e.target.value))} className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-xs mb-2 text-zinc-300 font-bold">
                        <span className="flex items-center gap-2"><Contrast className="w-4 h-4 text-sky-100"/> Contraste</span>
                        <span className="font-mono bg-zinc-800 px-2 py-0.5 rounded">{contrast}%</span>
                      </div>
                      <input type="range" min="0" max="300" value={contrast} onChange={e => setContrast(Number(e.target.value))} className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-2 text-zinc-300 font-bold">
                        <span className="flex items-center gap-2"><Droplets className="w-4 h-4 text-purple-100"/> Inversión (Ósea)</span>
                        <span className="font-mono bg-zinc-800 px-2 py-0.5 rounded">{invert}%</span>
                      </div>
                      <input type="range" min="0" max="100" value={invert} onChange={e => setInvert(Number(e.target.value))} className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500" />
                    </div>
                  </div>

                  <button 
                    onClick={resetFilters}
                    className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 font-bold rounded-xl transition-colors cursor-pointer border border-zinc-700"
                  >
                    Restaurar Filtros Originales
                  </button>
                </div>
                
                {selectedImg.notes && (
                  <div className="mt-6 pt-4 border-t border-white/10">
                    <p className="font-bold text-xs uppercase tracking-widest text-zinc-500 mb-2">Anotaciones clínicas</p>
                    <p className="text-sm text-zinc-300 leading-relaxed font-medium bg-zinc-900/50 p-4 rounded-xl border border-white/5">{selectedImg.notes}</p>
                  </div>
                )}
             </div>
           </motion.div>
         )}
       </AnimatePresence>
    </div>
  );
}
