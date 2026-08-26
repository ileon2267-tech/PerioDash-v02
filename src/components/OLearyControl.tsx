import React, { useEffect } from "react";
import { Patient, OLearyState } from "../types";
import { UPPER_TEETH, LOWER_TEETH } from "../initialData";
import { Percent, ShieldAlert, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { recordHipaaAudit } from "../utils/hipaaAudit";

interface OLearyControlProps {
  patient: Patient;
  onUpdate: (updatedIds: Record<number, OLearyState>) => void;
}

export default function OLearyControl({ patient, onUpdate }: OLearyControlProps) {
  const oLeary = patient.oLeary || {};

  useEffect(() => {
    if (patient?.id) {
      recordHipaaAudit("VIEW_OLEARY_INDEX", `Acceso a índice de higiene e índice de placa bacteriana O'Leary de ${patient.name}.`, {
        patientId: patient.id,
        patientName: patient.name,
        resource: "Índice de Higiene O'Leary ePHI",
        severity: "info"
      });
    }
  }, [patient?.id]);

  const toggleSurface = (toothNum: number, surface: keyof OLearyState) => {
    if (surface === "toothNumber") return;
    
    const currTooth = oLeary[toothNum] || { toothNumber: toothNum, mesial: false, distal: false, vestibular: false, lingual: false };
    const updated = {
      ...oLeary,
      [toothNum]: { ...currTooth, [surface]: !currTooth[surface] }
    };
    onUpdate(updated);
  };

  const calculateScore = () => {
    let totalSurfaces = 0;
    let plaqueSurfaces = 0;
    
    const allTeeth = [...Object.values(UPPER_TEETH).flat(), ...Object.values(LOWER_TEETH).flat()];

    allTeeth.forEach(toothNum => {
      const isAbsent = patient.odontogram?.[toothNum]?.condition === "ausente";
      if (!isAbsent) {
        totalSurfaces += 4;
        const t = oLeary[toothNum];
        if (t) {
          if (t.mesial) plaqueSurfaces++;
          if (t.distal) plaqueSurfaces++;
          if (t.vestibular) plaqueSurfaces++;
          if (t.lingual) plaqueSurfaces++;
        }
      }
    });

    if (totalSurfaces === 0) return 0;
    return Math.round((plaqueSurfaces / totalSurfaces) * 100);
  };

  const score = calculateScore();
  const isHighRisk = score > 20;

  const renderToothSVG = (toothNum: number) => {
    const isAbsent = patient?.odontogram?.[toothNum]?.condition === "ausente";
    if (isAbsent) return (
      <div key={toothNum} className="flex flex-col items-center gap-2 shrink-0">
        <span className="text-xs font-bold text-slate-400/50">{toothNum}</span>
        <div className="w-[52px] h-[52px] shrink-0 flex items-center justify-center text-[10px] text-slate-400 bg-slate-100/30 dark:bg-slate-800/30 rounded-full border border-slate-200/50 dark:border-slate-700/50">Aus</div>
      </div>
    );

    const t = oLeary[toothNum] || { toothNumber: toothNum, mesial: false, distal: false, vestibular: false, lingual: false };
    
    // Determine positions
    const isUpper = toothNum >= 11 && toothNum <= 28;
    const isRightQuad = (toothNum >= 11 && toothNum <= 18) || (toothNum >= 41 && toothNum <= 48); // Patient's right (our left)
    
    const topKey: keyof OLearyState = isUpper ? "vestibular" : "lingual";
    const bottomKey: keyof OLearyState = isUpper ? "lingual" : "vestibular";
    const rightKey: keyof OLearyState = isRightQuad ? "mesial" : "distal";
    const leftKey: keyof OLearyState = isRightQuad ? "distal" : "mesial";

    const getColor = (key: keyof OLearyState) => t[key] ? "#f43f5e" : "transparent";
    const getFillClass = (key: keyof OLearyState) => t[key] ? "fill-rose-500/90" : "fill-transparent hover:fill-slate-300/30 dark:hover:fill-slate-600/30";

    return (
      <div key={toothNum} className="flex flex-col items-center gap-2 shrink-0">
        <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{toothNum}</span>
        <motion.div whileHover={{ scale: 1.05 }} className="relative drop-shadow-sm cursor-pointer shrink-0">
          <svg viewBox="0 0 100 100" className="w-[52px] h-[52px] text-slate-200 dark:text-slate-700">
            <circle cx="50" cy="50" r="48" fill="rgba(255,255,255,0.02)" stroke="currentColor" strokeWidth="2" />
            
            {/* Top */}
            <path d="M 16 16 L 50 50 L 84 16 A 48 48 0 0 0 16 16 Z" className={`${getFillClass(topKey)} transition-colors duration-200`} stroke="currentColor" strokeWidth="1" onClick={() => toggleSurface(toothNum, topKey)} />
            
            {/* Right */}
            <path d="M 84 16 L 50 50 L 84 84 A 48 48 0 0 0 84 16 Z" className={`${getFillClass(rightKey)} transition-colors duration-200`} stroke="currentColor" strokeWidth="1" onClick={() => toggleSurface(toothNum, rightKey)} />
            
            {/* Bottom */}
            <path d="M 16 84 L 50 50 L 84 84 A 48 48 0 0 1 16 84 Z" className={`${getFillClass(bottomKey)} transition-colors duration-200`} stroke="currentColor" strokeWidth="1" onClick={() => toggleSurface(toothNum, bottomKey)} />
            
            {/* Left */}
            <path d="M 16 16 L 50 50 L 16 84 A 48 48 0 0 1 16 16 Z" className={`${getFillClass(leftKey)} transition-colors duration-200`} stroke="currentColor" strokeWidth="1" onClick={() => toggleSurface(toothNum, leftKey)} />
            
            {/* Inner Ring */}
            <circle cx="50" cy="50" r="18" fill="currentColor" className="text-white dark:text-slate-900 shadow-inner" stroke="currentColor" strokeWidth="2" />
            {/* Gloss highlight */}
            <path d="M 35 35 A 25 25 0 0 1 65 35" fill="transparent" stroke="rgba(255,255,255,0.4)" strokeWidth="3" strokeLinecap="round" className="pointer-events-none" />
          </svg>
        </motion.div>
      </div>
    );
  };

  return (
    <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/50 dark:border-white/5 shadow-2xl rounded-3xl p-8 relative overflow-hidden">
       {/* Glass highlight overlay */}
       <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-50" />
       <div className="absolute -top-[50%] -left-[10%] w-[50%] h-[50%] bg-teal-300/10 dark:bg-teal-900/20 blur-[80px] rounded-full pointer-events-none" />
       
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 border-b border-slate-200/50 dark:border-slate-700/50 pb-6 relative z-10 gap-6">
         <div>
           <h3 className="font-display font-bold text-2xl text-slate-800 dark:text-white flex items-center gap-2">
             <Sparkles className="w-6 h-6 text-teal-500" />
             Control de Placa O'Leary
           </h3>
           <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-lg leading-relaxed">Registro periodontológico directo de biopelícula en 4 superficies: Vestibular, Palatino/Lingual, Mesial y Distal.</p>
         </div>
         
         <div className={`flex items-center gap-5 px-6 py-4 rounded-2xl border backdrop-blur-md shadow-lg ${isHighRisk ? 'bg-rose-50/80 border-rose-200 dark:bg-rose-950/40 dark:border-rose-800/50 text-rose-600 dark:text-rose-400' : 'bg-emerald-50/80 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800/50 text-emerald-600 dark:text-emerald-400'}`}>
           <div className="flex flex-col items-end">
             <span className="text-[10px] uppercase font-bold tracking-widest opacity-80">Índice Global PCR</span>
             <div className="font-mono text-4xl font-black flex items-center tracking-tighter">
               {score}<Percent className="w-6 h-6 ml-1 opacity-80" strokeWidth={3}/>
             </div>
           </div>
           {isHighRisk && <ShieldAlert className="w-10 h-10 animate-pulse" />}
         </div>
       </div>

       {isHighRisk && (
         <motion.div 
           initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
           className="mb-8 p-5 rounded-2xl bg-rose-100/50 dark:bg-rose-900/30 text-rose-800 dark:text-rose-300 text-sm border border-rose-200/50 dark:border-rose-800/50 font-medium shadow-inner flex items-start gap-4 relative z-10"
         >
           <div className="p-2 bg-rose-200/50 dark:bg-rose-800/50 rounded-lg shrink-0">⚠️</div>
           <p className="leading-relaxed"><strong>Riesgo Inflamatorio Alto:</strong> El índice de placa supera el 20% fisiológico. Existe dificultad activa para controlar la biopelícula, indicando un factor de riesgo primario para progresión de periodontitis. Instruir técnica de BASS modificada.</p>
         </motion.div>
       )}

       <div className="space-y-12 overflow-x-auto pb-8 relative z-10 hide-scrollbar scroll-smooth">
         <div className="flex flex-col gap-10 min-w-max w-max mx-auto px-10">
           {/* Superior */}
           <div className="flex justify-center gap-3">
             {Object.values(UPPER_TEETH).flat().map(num => renderToothSVG(num))}
           </div>
           
           {/* Arch Divider */}
           <div className="flex items-center justify-center">
             <div className="h-px w-full max-w-4xl bg-gradient-to-r from-transparent via-slate-300/50 dark:via-slate-700/50 to-transparent" />
           </div>

           {/* Inferior */}
           <div className="flex justify-center gap-3">
             {Object.values(LOWER_TEETH).flat().map(num => renderToothSVG(num))}
           </div>
         </div>
       </div>
    </div>
  );
}
