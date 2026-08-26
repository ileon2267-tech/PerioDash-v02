import React, { useMemo } from "react";
import { Patient, Appointment } from "../types";
import { Users, Calendar, Activity, Droplets, TrendingUp, Sparkles, AlertCircle, ArrowRight, UserCheck, Shield, ChevronRight } from "lucide-react";
import { motion } from "motion/react";
import { ClinicalFlowTracker } from "./ClinicalFlowTracker";

interface KPIDashboardProps {
  patients: Patient[];
  appointments: Appointment[];
  onNavigateTo: (view: string) => void;
  onSelectPatient: (patientId: string) => void;
  onUpdatePatient?: (updatedPatient: Patient) => void;
}

const ALL_TEETH_LIST = [
  18, 17, 16, 15, 14, 13, 12, 11,
  21, 22, 23, 24, 25, 26, 27, 28,
  48, 47, 46, 45, 44, 43, 42, 41,
  31, 32, 33, 34, 35, 36, 37, 38
];

function KPIDashboardComponent({
  patients,
  appointments,
  onNavigateTo,
  onSelectPatient,
  onUpdatePatient
}: KPIDashboardProps) {
  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);
  
  const todayAppointments = useMemo(() => appointments.filter((app) => app.date === todayStr), [appointments, todayStr]);
  const confirmedToday = useMemo(() => todayAppointments.filter((app) => app.status === "Confirmed").length, [todayAppointments]);
  
  // Calculate clinical statistics for BOP % and Plaque % from patients with active records
  const { totalSurfacesEvaluated, bleedingSurfacesCount, plaqueSurfacesCount, deepPocketsCount } = useMemo(() => {
    let total = 0;
    let bleeding = 0;
    let plaque = 0;
    let deep = 0;

    for (let i = 0; i < patients.length; i++) {
      const p = patients[i];
      const perio = p.periodontogram;
      const odonto = p.odontogram;

      for (let j = 0; j < ALL_TEETH_LIST.length; j++) {
        const toothNumber = ALL_TEETH_LIST[j];
        if (odonto?.[toothNumber]?.condition === "ausente") continue;

        total += 6;

        const state = perio?.[toothNumber];
        if (state) {
          const sv = state.sangradoVestibular;
          if (sv?.mesial) bleeding++;
          if (sv?.central) bleeding++;
          if (sv?.distal) bleeding++;

          const pv = state.placaVestibular;
          if (pv?.mesial) plaque++;
          if (pv?.central) plaque++;
          if (pv?.distal) plaque++;

          const vp = state.vestibularPocket;
          if (vp) {
            if (vp.mesial >= 4) deep++;
            if (vp.central >= 4) deep++;
            if (vp.distal >= 4) deep++;
          }

          const sp = state.sangradoPalatino;
          if (sp?.mesial) bleeding++;
          if (sp?.central) bleeding++;
          if (sp?.distal) bleeding++;

          const pp = state.placaPalatino;
          if (pp?.mesial) plaque++;
          if (pp?.central) plaque++;
          if (pp?.distal) plaque++;

          const ppk = state.palatinoPocket;
          if (ppk) {
            if (ppk.mesial >= 4) deep++;
            if (ppk.central >= 4) deep++;
            if (ppk.distal >= 4) deep++;
          }
        }
      }
    }

    return {
      totalSurfacesEvaluated: total,
      bleedingSurfacesCount: bleeding,
      plaqueSurfacesCount: plaque,
      deepPocketsCount: deep
    };
  }, [patients]);

  const bopPercentage = totalSurfacesEvaluated > 0 
    ? Math.round((bleedingSurfacesCount / totalSurfacesEvaluated) * 100) 
    : 0;
    
  const plaquePercentage = totalSurfacesEvaluated > 0 
    ? Math.round((plaqueSurfacesCount / totalSurfacesEvaluated) * 100) 
    : 0;

  // Stagger configurations for motion
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <div className="relative rounded-[2rem] p-[4px] group w-full" id="kpi-dashboard-root">
      <div className="absolute inset-0 neon-rainbow-bg rounded-[2rem] pointer-events-none opacity-100" />
      <div className="absolute inset-0 neon-rainbow-bg rounded-[2rem] pointer-events-none blur-xl opacity-50 dark:opacity-70" />
      <div className="absolute inset-[4px] rounded-[calc(2rem-4px)] bg-[#f8fafc] dark:bg-[#09090b] z-0 pointer-events-none" />
      
      <div className="relative z-10 p-2 md:p-3 bg-transparent">
        <motion.div 
          className="space-y-6" 
          id="kpi-dashboard-panel"
          initial="hidden"
          animate="show"
          variants={containerVariants}
        >
          {/* Refined SaaS Hero Banner with Liquid Glass */}
          <motion.div 
            variants={itemVariants}
        className="relative overflow-hidden rounded-[2rem] bg-slate-900/40 backdrop-blur-2xl border border-white/10 text-white p-5 sm:p-8 md:p-10 shadow-2xl"
      >
        {/* Subtle high-tech gradient backdrop */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(45,212,191,0.2),transparent_60%)]" />
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-teal-500/10 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none hidden md:block mix-blend-screen overflow-hidden">
          <Activity className="w-56 h-56 text-teal-300 stroke-[0.5] translate-x-12 -translate-y-12" />
        </div>
 
        <div className="relative z-10 max-w-3xl space-y-4 sm:space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 sm:px-4 sm:py-1.5 bg-teal-500/10 border border-teal-400/20 text-teal-300 text-[11px] sm:text-xs font-bold rounded-full tracking-wider backdrop-blur-sm shadow-inner uppercase">
            <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>Plataforma Clínica PerioDash</span>
          </div>
          
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-display font-extrabold tracking-tight text-white drop-shadow-md pb-1">
            Panel de Diagnóstico Clínico
          </h1>
          
          <p className="text-slate-300 text-xs sm:text-sm md:text-base leading-relaxed max-w-2xl font-medium tracking-wide">
            Análisis unificado de bioindicadores, periodoncia digital, odontogramas interactivos y asistente clínico integrado <strong className="text-teal-300 font-bold">Dentito</strong> para el control y seguimiento continuo de tu consulta odontológica.
          </p>
 
          <div className="flex flex-wrap gap-3 sm:gap-4 pt-2 sm:pt-4">
            <button
              onClick={() => onNavigateTo("clinica")}
              className="px-5 py-2.5 sm:px-6 sm:py-3 bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs sm:text-sm rounded-xl shadow-[0_0_20px_rgba(45,212,191,0.3)] inline-flex items-center gap-2 transition-all cursor-pointer"
            >
              <span>Comenzar Examen</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <div className="inline-flex items-center gap-2 text-[10px] sm:text-xs text-slate-300 px-3 py-2.5 sm:px-4 sm:py-3 bg-black/20 rounded-xl backdrop-blur-md border border-white/5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono text-[9px] sm:text-[10px] tracking-wide font-bold">CONEXIÓN TLS / CIFRADO AES-256</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Smart Clinic Insights Banner */}
      <motion.div
        variants={itemVariants}
        className="bg-teal-500/5 dark:bg-teal-400/5 border border-teal-500/15 dark:border-teal-500/10 rounded-[1.5rem] p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 shrink-0 shadow-inner">
            <Sparkles className="w-4 h-4 animate-pulse text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">Sugerencia Epidemiológica (Asistente Clínico)</h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
              El {bopPercentage > 20 ? "índice de sangrado (BOP) consolidado es elevado" : "gabinete registra un índice de sangrado periodontal ideal"}. Se sugiere priorizar {bopPercentage > 20 ? "tratamientos de Raspado y Alisado Radicular (RAR) en pacientes con bolsas ≥ 4mm" : "mantenimientos periodontales semestrales periódicos"} para asegurar la estabilidad óseo-periodontal.
            </p>
          </div>
        </div>
        <button
          onClick={() => onNavigateTo("clinica")}
          className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline inline-flex items-center gap-1 shrink-0 px-3 py-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors cursor-pointer"
        >
          <span>Auditar clínica</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </motion.div>

      {/* Real-time Chair & Waiting Room Flow Tracker (Compact View) */}
      {onUpdatePatient && (
        <motion.div variants={itemVariants}>
          <ClinicalFlowTracker 
            patients={patients}
            onUpdatePatient={onUpdatePatient}
            onSelectPatient={(id) => onSelectPatient(id)}
            compact={true}
          />
        </motion.div>
      )}

      {/* Bento Grid Stats */}
      <motion.div 
        variants={containerVariants} 
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {/* Card 1 - Active Patients */}
        <motion.div 
          variants={itemVariants}
          whileHover={{ y: -4, transition: { duration: 0.15 } }}
          className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-[1.5rem] p-4 sm:p-6 border border-white/50 dark:border-white/5 shadow-xl flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-500/80 dark:text-slate-400 uppercase tracking-widest block">Expedientes Totales</span>
              <span className="text-4xl sm:text-5xl font-display font-black text-slate-900 dark:text-white block tracking-tighter">
                {patients.length}
              </span>
            </div>
            <div className="p-2.5 sm:p-3 bg-teal-100/50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 rounded-2xl shadow-inner border border-teal-200/50 dark:border-teal-500/20">
              <Users className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>
          <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-slate-200/50 dark:border-white/10 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-medium">Pacientes registrados</span>
            <span className="text-teal-600 dark:text-teal-400 font-bold cursor-pointer hover:underline" onClick={() => onNavigateTo("pacientes")}>
              Directorio
            </span>
          </div>
        </motion.div>

        {/* Card 2 - Today's appointments */}
        <motion.div 
          variants={itemVariants}
          whileHover={{ y: -4, transition: { duration: 0.15 } }}
          className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-[1.5rem] p-4 sm:p-6 border border-white/50 dark:border-white/5 shadow-xl flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-500/80 dark:text-slate-400 uppercase tracking-widest block">Citas de Hoy</span>
              <span className="text-4xl sm:text-5xl font-display font-black text-slate-900 dark:text-white block tracking-tighter">
                {todayAppointments.length}
              </span>
            </div>
            <div className="p-2.5 sm:p-3 bg-sky-100/50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 rounded-2xl shadow-inner border border-sky-200/50 dark:border-sky-500/20">
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>
          <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-slate-200/50 dark:border-white/10 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1.5 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 drop-shadow-sm" />
              {confirmedToday} confirmadas
            </span>
            <span className="text-sky-600 dark:text-sky-400 font-bold cursor-pointer hover:underline" onClick={() => onNavigateTo("agenda")}>
              Ver Agenda
            </span>
          </div>
        </motion.div>

        {/* Card 3 - Bleeding Index BOP */}
        <motion.div 
          variants={itemVariants}
          whileHover={{ y: -4, transition: { duration: 0.15 } }}
          className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-[1.5rem] p-4 sm:p-6 border border-white/50 dark:border-white/5 shadow-xl flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-500/80 dark:text-slate-400 uppercase tracking-widest block">Sangrado BOP</span>
              <span className={`text-4xl sm:text-5xl font-display font-black block tracking-tighter ${bopPercentage > 25 ? 'text-rose-500' : 'text-slate-900 dark:text-white'}`}>
                {bopPercentage}%
              </span>
            </div>
            <div className="p-2.5 sm:p-3 bg-rose-100/50 dark:bg-rose-500/10 text-rose-500 dark:text-rose-400 rounded-2xl shadow-inner border border-rose-200/50 dark:border-rose-500/20">
              <Droplets className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>
          <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-slate-200/50 dark:border-white/10 space-y-2.5">
            <div className="w-full bg-slate-200/50 dark:bg-slate-800/80 h-1.5 rounded-full overflow-hidden shadow-inner flex">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${bopPercentage > 25 ? 'bg-gradient-to-r from-rose-400 to-rose-500' : 'bg-gradient-to-r from-teal-400 to-teal-500'}`}
                style={{ width: `${Math.min(100, bopPercentage)}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[10px] font-bold tracking-wide">
              <span className="text-slate-400">SALUDABLE &lt;10%</span>
              <span className={bopPercentage > 25 ? "text-rose-500 drop-shadow-sm" : "text-emerald-500 drop-shadow-sm"}>
                {bopPercentage > 25 ? "RIESGO ACTIVO" : "BAJO CONTROL"}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Card 4 - Plaque Index PCR */}
        <motion.div 
          variants={itemVariants}
          whileHover={{ y: -4, transition: { duration: 0.15 } }}
          className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-[1.5rem] p-4 sm:p-6 border border-white/50 dark:border-white/5 shadow-xl flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-500/80 dark:text-slate-400 uppercase tracking-widest block">Biofilm PCR</span>
              <span className={`text-4xl sm:text-5xl font-display font-black block tracking-tighter ${plaquePercentage > 30 ? 'text-amber-500' : 'text-slate-900 dark:text-white'}`}>
                {plaquePercentage}%
              </span>
            </div>
            <div className="p-2.5 sm:p-3 bg-amber-100/50 dark:bg-amber-500/10 text-amber-500 dark:text-amber-400 rounded-2xl shadow-inner border border-amber-200/50 dark:border-amber-500/20">
              <Activity className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>
          <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-slate-200/50 dark:border-white/10 space-y-2.5">
            <div className="w-full bg-slate-200/50 dark:bg-slate-800/80 h-1.5 rounded-full overflow-hidden shadow-inner flex">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${plaquePercentage > 30 ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 'bg-gradient-to-r from-teal-400 to-teal-500'}`}
                style={{ width: `${Math.min(100, plaquePercentage)}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[10px] font-bold tracking-wide">
              <span className="text-slate-400">ÓPTIMO &lt;20%</span>
              <span className={plaquePercentage > 30 ? "text-amber-500 drop-shadow-sm" : "text-emerald-500 drop-shadow-sm"}>
                {plaquePercentage > 30 ? "PLACA ELEVADA" : "BUENA HIGIENE"}
              </span>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Appointments List Card (2/3 col) */}
        <motion.div 
          variants={itemVariants}
          className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-2xl sm:rounded-[2rem] border border-white/50 dark:border-white/5 shadow-xl p-4 sm:p-6 md:p-8 lg:col-span-2 space-y-6 flex flex-col"
        >
          <div className="flex items-center justify-between pb-4 border-b border-slate-200/50 dark:border-white/10">
            <div>
              <h2 className="text-xl font-display font-extrabold text-slate-800 dark:text-white inline-flex items-center gap-3">
                <Calendar className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                <span>Citas Planificadas para Hoy</span>
              </h2>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1 capitalize">
                {new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} — Programación Diaria
              </p>
            </div>
            <span className="bg-slate-200/50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 text-xs px-4 py-1.5 rounded-full font-bold border border-white/40 dark:border-white/10 shadow-sm backdrop-blur-md">
              {todayAppointments.length} Cita{todayAppointments.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="divide-y divide-slate-200/50 dark:divide-white/5 flex-1">
            {todayAppointments.length === 0 ? (
              <div className="py-16 flex flex-col items-center justify-center text-slate-400 text-sm font-medium">
                <Calendar className="w-12 h-12 mb-3 opacity-20" />
                No hay citas programadas para el día de hoy.
              </div>
            ) : (
              todayAppointments.map((app) => (
                <div key={app.id} className="py-5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-white/60 dark:bg-slate-800/60 shadow-sm flex items-center justify-center font-display font-black text-lg text-slate-600 dark:text-slate-300 group-hover:bg-teal-500 group-hover:text-white transition-all border border-white/80 dark:border-white/10 cursor-pointer">
                      {app.patientName.charAt(0)}
                    </div>
                    <div>
                      <h4 
                        className="text-base font-bold text-slate-800 dark:text-slate-100 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors cursor-pointer inline-flex items-center gap-1.5 leading-none flex-wrap"
                        onClick={() => {
                          onSelectPatient(app.patientId);
                          onNavigateTo("clinica");
                        }}
                      >
                        <span>{app.patientName}</span>
                        {(() => {
                          const patientObj = patients.find(p => p.id === app.patientId);
                          return patientObj?.rut ? (
                            <span className="px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-700 dark:text-teal-300 font-mono text-[10px] font-bold border border-teal-500/20">
                              {patientObj.rut}
                            </span>
                          ) : null;
                        })()}
                        <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all text-teal-600" />
                      </h4>
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                        Proc: <span className="text-slate-700 dark:text-slate-300">{app.treatment}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 justify-between sm:justify-end">
                    <span className="text-sm font-mono bg-white/60 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 px-4 py-1.5 rounded-xl border border-slate-200/50 dark:border-white/5 font-extrabold shadow-sm backdrop-blur-md">
                      ⏱️ {app.time}
                    </span>
                    <span className={`text-[10px] uppercase font-black tracking-widest px-3 py-1.5 rounded-full border shadow-sm ${
                      app.status === 'Confirmed' 
                        ? 'bg-emerald-100/60 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border-emerald-300/50 dark:border-emerald-500/30' 
                        : 'bg-amber-100/60 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 border-amber-300/50 dark:border-amber-500/30'
                    }`}>
                      {app.status === 'Confirmed' ? 'Confirmado' : 'Pendiente'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>

        {/* Quick Analytical Assist Box (1/3 col) */}
        <motion.div 
          variants={itemVariants}
          className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-2xl sm:rounded-[2rem] border border-white/50 dark:border-white/5 shadow-xl p-4 sm:p-6 md:p-8 space-y-6 flex flex-col justify-between"
        >
          <div className="space-y-5">
            <span className="bg-rose-100/60 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-300/50 dark:border-rose-500/30 font-bold tracking-wide text-[10px] uppercase px-3 py-1.5 rounded-full inline-flex items-center gap-1.5 self-start shadow-sm mix-blend-multiply dark:mix-blend-lighten">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Alerta Médica</span>
            </span>
            
            <div className="space-y-2">
              <h3 className="text-xl font-display font-extrabold text-slate-900 dark:text-white">Perfil de Riesgo</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                Del análisis transversal de expedientes, detectamos <strong className="text-rose-600 dark:text-rose-400 font-bold">{deepPocketsCount} bolsas periodontales profundas (≥ 4mm)</strong> que requieren intervención RAR.
              </p>
            </div>
          </div>

          <div className="bg-white/50 dark:bg-black/20 rounded-[1.5rem] p-5 space-y-4 border border-white/50 dark:border-white/5 shadow-inner font-mono text-xs font-bold">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">Total Lesiones Activas:</span>
              <span className="font-black text-rose-600 dark:text-rose-400 inline-flex items-center gap-1.5 text-sm">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse drop-shadow-md" />
                {deepPocketsCount} bolsas
              </span>
            </div>
            <div className="w-full h-px bg-slate-200/60 dark:bg-white/10" />
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">Capa Biofilm Muestra:</span>
              <span className={`font-black tracking-tight text-sm ${plaquePercentage > 30 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                {plaquePercentage}% PCR
              </span>
            </div>
          </div>

          <button
            onClick={() => onNavigateTo("clinica")}
            className="w-full bg-slate-900 hover:bg-black dark:bg-teal-500 dark:hover:bg-teal-400 text-white dark:text-slate-900 font-extrabold text-sm py-4 px-4 rounded-xl transition-all cursor-pointer shadow-lg inline-flex items-center justify-center gap-2 mt-2 border border-slate-700 dark:border-teal-300"
          >
            <Shield className="w-4 h-4" />
            <span>Auditar Expedientes</span>
          </button>
        </motion.div>

      </div>
        </motion.div>
      </div>
    </div>
  );
}

export default React.memo(KPIDashboardComponent);
