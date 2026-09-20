import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  LayoutGrid, 
  X, 
  Stethoscope, 
  Search, 
  Mail, 
  Bell, 
  Sparkles, 
  Compass, 
  Mic, 
  MicOff, 
  Sun, 
  Moon, 
  ShieldCheck, 
  Smile, 
  Activity, 
  Eye, 
  Calendar, 
  Users,
  Command
} from "lucide-react";
import { Patient, ActiveTab } from "../types";
import ClinicalNotificationCenter from "./ClinicalNotificationCenter";

interface AppLauncherDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenChairMode: () => void;
  onOpenSearch: () => void;
  onOpenGmail: () => void;
  isGmailConnected: boolean;
  patients: Patient[];
  onSelectPatient: (id: string) => void;
  onNavigateTab: (tab: ActiveTab, subView?: string) => void;
  onOpenHelp: () => void;
  learningMode: boolean;
  onOpenTour: () => void;
  speechSupported: boolean;
  handsFreeVoiceActive: boolean;
  onToggleHandsFreeVoice: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenHipaa: () => void;
}

export default function AppLauncherDrawer({
  isOpen,
  onClose,
  onOpenChairMode,
  onOpenSearch,
  onOpenGmail,
  isGmailConnected,
  patients,
  onSelectPatient,
  onNavigateTab,
  onOpenHelp,
  learningMode,
  onOpenTour,
  speechSupported,
  handsFreeVoiceActive,
  onToggleHandsFreeVoice,
  darkMode,
  onToggleDarkMode,
  onOpenHipaa
}: AppLauncherDrawerProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Mobile backdrop to close on outside touch */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-40 md:hidden"
            aria-hidden="true"
          />

          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            id="cajon-de-aplicaciones-popover"
            className="fixed left-2.5 right-2.5 top-15 md:left-auto md:right-8 md:top-[68px] w-auto md:w-[440px] max-w-[calc(100vw-1.25rem)] md:max-w-[440px] max-h-[calc(100dvh-4.75rem)] md:max-h-[min(88vh,680px)] overflow-y-auto overscroll-contain p-3.5 sm:p-5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-2xl shadow-2xl shadow-slate-900/20 dark:shadow-black/70 border border-slate-200/90 dark:border-slate-800/90 z-50 ring-1 ring-black/5 dark:ring-white/10 space-y-3.5 sm:space-y-4"
          >
          {/* Encabezado del Cajón */}
          <div className="flex items-center justify-between pb-2.5 sm:pb-3 border-b border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 shadow-2xs">
                <LayoutGrid className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs sm:text-[13px] font-bold text-slate-800 dark:text-slate-100 leading-tight">
                  Cajón de Aplicaciones
                </h4>
                <p className="text-[10px] sm:text-[10.5px] text-slate-400 dark:text-slate-500 leading-tight mt-0.5">
                  Herramientas clínicas y accesos directos
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer active:scale-95"
              title="Cerrar cajón"
              aria-label="Cerrar cajón"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* MODO SILLÓN CLÍNICO - Tarjeta destacada de máxima prioridad */}
          <div>
            <button
              type="button"
              onClick={() => {
                onOpenChairMode();
                onClose();
              }}
              className="w-full p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-teal-600 via-teal-700 to-emerald-700 hover:from-teal-500 hover:via-teal-600 hover:to-emerald-600 text-white flex items-center justify-between shadow-md shadow-teal-900/10 active:scale-[0.99] transition-all cursor-pointer group text-left border border-teal-500/30"
            >
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center group-hover:scale-105 transition-transform shrink-0 shadow-2xs">
                  <Stethoscope className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-[13px] font-bold leading-tight truncate">
                      Modo Sillón Clínico
                    </span>
                    <span className="text-[9px] bg-white/20 px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider text-white shadow-2xs shrink-0">
                      Alt+S
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-[10.5px] text-teal-100/90 leading-tight mt-0.5 truncate">
                    Botones XL, manos libres por voz, sondaje 6P, PSR, Odontograma y O'Leary
                  </p>
                </div>
              </div>
            </button>
          </div>

          {/* SECCIÓN 1: HERRAMIENTAS & ASISTENCIA */}
          <div>
            <div className="flex items-center justify-between px-0.5 mb-2">
              <span className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-slate-400 dark:text-slate-500">
                Herramientas & Asistencia
              </span>
              <span className="text-[9px] sm:text-[9.5px] font-medium text-slate-400 dark:text-slate-500">
                8 accesos
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1.5 sm:gap-2.5">
              {/* Buscador Rápido */}
              <button
                type="button"
                onClick={() => {
                  onOpenSearch();
                  onClose();
                }}
                className="p-2 sm:p-2.5 rounded-xl min-w-0 flex flex-col items-center justify-center text-center gap-1 sm:gap-1.5 bg-slate-50/60 dark:bg-slate-800/30 hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-slate-200/60 dark:border-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer group active:scale-95"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform shrink-0">
                  <Search className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                </div>
                <span className="text-[10px] sm:text-[11px] font-semibold text-slate-700 dark:text-slate-200 leading-tight truncate w-full text-center">
                  Buscador
                </span>
                <span className="text-[8.5px] sm:text-[9px] font-mono text-slate-400 dark:text-slate-500 leading-none truncate w-full text-center">
                  Ctrl+K
                </span>
              </button>

              {/* Correo Gmail Oficial */}
              <button
                type="button"
                onClick={() => {
                  onOpenGmail();
                  onClose();
                }}
                className="p-2 sm:p-2.5 rounded-xl min-w-0 flex flex-col items-center justify-center text-center gap-1 sm:gap-1.5 bg-slate-50/60 dark:bg-slate-800/30 hover:bg-red-50/80 dark:hover:bg-red-950/30 border border-slate-200/60 dark:border-slate-800/60 hover:border-red-500/25 transition-all cursor-pointer group active:scale-95"
              >
                <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform shrink-0">
                  <Mail className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                  {isGmailConnected && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500 ring-1.5 ring-white dark:ring-slate-900" />
                  )}
                </div>
                <span className="text-[10px] sm:text-[11px] font-semibold text-slate-700 dark:text-slate-200 leading-tight truncate w-full text-center">
                  Gmail
                </span>
                <span className="text-[8.5px] sm:text-[9px] text-slate-400 dark:text-slate-500 font-medium leading-none truncate w-full text-center">
                  {isGmailConnected ? "Conectado" : "Oficial"}
                </span>
              </button>

              {/* Centro de Notificaciones & Alertas */}
              <ClinicalNotificationCenter
                patients={patients}
                onSelectPatient={(id) => {
                  onSelectPatient(id);
                  onClose();
                }}
                onNavigateTab={(tab, subView) => {
                  onNavigateTab(tab as ActiveTab, subView);
                  onClose();
                }}
                renderTrigger={(unreadCount, toggle) => (
                  <button
                    type="button"
                    onClick={toggle}
                    className="p-2 sm:p-2.5 rounded-xl min-w-0 flex flex-col items-center justify-center text-center gap-1 sm:gap-1.5 bg-slate-50/60 dark:bg-slate-800/30 hover:bg-amber-50/80 dark:hover:bg-amber-950/30 border border-slate-200/60 dark:border-slate-800/60 hover:border-amber-500/25 transition-all cursor-pointer group active:scale-95 w-full"
                  >
                    <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform shrink-0">
                      <Bell className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white font-mono font-bold text-[9px] flex items-center justify-center ring-1 ring-white dark:ring-slate-900 shadow-2xs">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] sm:text-[11px] font-semibold text-slate-700 dark:text-slate-200 leading-tight truncate w-full text-center">
                      Alertas
                    </span>
                    <span className="text-[8.5px] sm:text-[9px] text-slate-400 dark:text-slate-500 font-medium leading-none truncate w-full text-center">
                      {unreadCount > 0 ? `${unreadCount} nuevas` : "Al día"}
                    </span>
                  </button>
                )}
              />

              {/* Guía Clínica / Centro de Éxito */}
              <button
                type="button"
                onClick={() => {
                  onOpenHelp();
                  onClose();
                }}
                className="p-2 sm:p-2.5 rounded-xl min-w-0 flex flex-col items-center justify-center text-center gap-1 sm:gap-1.5 bg-slate-50/60 dark:bg-slate-800/30 hover:bg-teal-50/80 dark:hover:bg-teal-950/40 border border-slate-200/60 dark:border-slate-800/60 hover:border-teal-500/25 transition-all cursor-pointer group active:scale-95"
              >
                <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform shrink-0">
                  <Sparkles className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                  {learningMode && (
                    <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-teal-500 animate-ping" />
                  )}
                </div>
                <span className="text-[10px] sm:text-[11px] font-semibold text-slate-700 dark:text-slate-200 leading-tight truncate w-full text-center">
                  Guía Éxito
                </span>
                <span className="text-[8.5px] sm:text-[9px] text-slate-400 dark:text-slate-500 font-medium leading-none truncate w-full text-center">
                  Clínica
                </span>
              </button>

              {/* Tour Guiado */}
              <button
                type="button"
                onClick={() => {
                  onOpenTour();
                  onClose();
                }}
                className="p-2 sm:p-2.5 rounded-xl min-w-0 flex flex-col items-center justify-center text-center gap-1 sm:gap-1.5 bg-slate-50/60 dark:bg-slate-800/30 hover:bg-indigo-50/80 dark:hover:bg-indigo-950/30 border border-slate-200/60 dark:border-slate-800/60 hover:border-indigo-500/25 transition-all cursor-pointer group active:scale-95"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform shrink-0">
                  <Compass className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                </div>
                <span className="text-[10px] sm:text-[11px] font-semibold text-slate-700 dark:text-slate-200 leading-tight truncate w-full text-center">
                  Tour Guiado
                </span>
                <span className="text-[8.5px] sm:text-[9px] text-slate-400 dark:text-slate-500 font-medium leading-none truncate w-full text-center">
                  Paso a paso
                </span>
              </button>

              {/* Escucha por Voz Manos Libres */}
              {speechSupported && (
                <button
                  type="button"
                  onClick={onToggleHandsFreeVoice}
                  className={`p-2 sm:p-2.5 rounded-xl min-w-0 flex flex-col items-center justify-center text-center gap-1 sm:gap-1.5 border transition-all cursor-pointer group active:scale-95 ${
                    handsFreeVoiceActive
                      ? "bg-teal-500/10 border-teal-500/30 text-teal-700 dark:text-teal-300"
                      : "bg-slate-50/60 dark:bg-slate-800/30 hover:bg-slate-100 dark:hover:bg-slate-800/80 border-slate-200/60 dark:border-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700"
                  }`}
                >
                  <div className={`relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform shrink-0 ${
                    handsFreeVoiceActive
                      ? "bg-teal-600 text-white"
                      : "bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                  }`}>
                    {handsFreeVoiceActive ? (
                      <Mic className="w-4 h-4 sm:w-[18px] sm:h-[18px] animate-pulse" />
                    ) : (
                      <MicOff className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                    )}
                    {handsFreeVoiceActive && (
                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    )}
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-semibold text-slate-700 dark:text-slate-200 leading-tight truncate w-full text-center">
                    Control de Voz
                  </span>
                  <span className="text-[8.5px] sm:text-[9px] font-mono leading-none text-slate-400 dark:text-slate-500 truncate w-full text-center">
                    {handsFreeVoiceActive ? "Escuchando" : "Pausada"}
                  </span>
                </button>
              )}

              {/* Apariencia / Modo Oscuro & Claro */}
              <button
                type="button"
                onClick={onToggleDarkMode}
                className="p-2 sm:p-2.5 rounded-xl min-w-0 flex flex-col items-center justify-center text-center gap-1 sm:gap-1.5 bg-slate-50/60 dark:bg-slate-800/30 hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-slate-200/60 dark:border-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer group active:scale-95"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-500/10 dark:bg-indigo-500/10 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform shrink-0">
                  {darkMode ? (
                    <Sun className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-amber-500" />
                  ) : (
                    <Moon className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-indigo-400" />
                  )}
                </div>
                <span className="text-[10px] sm:text-[11px] font-semibold text-slate-700 dark:text-slate-200 leading-tight truncate w-full text-center">
                  Apariencia
                </span>
                <span className="text-[8.5px] sm:text-[9px] text-slate-400 dark:text-slate-500 font-medium leading-none truncate w-full text-center">
                  {darkMode ? "Oscuro" : "Claro"}
                </span>
              </button>

              {/* Seguridad HIPAA */}
              <button
                type="button"
                onClick={() => {
                  onOpenHipaa();
                  onClose();
                }}
                className="p-2 sm:p-2.5 rounded-xl min-w-0 flex flex-col items-center justify-center text-center gap-1 sm:gap-1.5 bg-slate-50/60 dark:bg-slate-800/30 hover:bg-emerald-50/80 dark:hover:bg-emerald-950/30 border border-slate-200/60 dark:border-slate-800/60 hover:border-emerald-500/25 transition-all cursor-pointer group active:scale-95"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform shrink-0">
                  <ShieldCheck className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                </div>
                <span className="text-[10px] sm:text-[11px] font-semibold text-slate-700 dark:text-slate-200 leading-tight truncate w-full text-center">
                  HIPAA
                </span>
                <span className="text-[8.5px] sm:text-[9px] text-slate-400 dark:text-slate-500 font-medium leading-none truncate w-full text-center">
                  Privacidad
                </span>
              </button>
            </div>
          </div>

          {/* SECCIÓN 2: MÓDULOS CLÍNICOS & EXPEDIENTE */}
          <div>
            <div className="flex items-center justify-between px-0.5 mb-2">
              <span className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-slate-400 dark:text-slate-500">
                Módulos Clínicos & Pacientes
              </span>
              <span className="text-[9px] sm:text-[9.5px] font-medium text-slate-400 dark:text-slate-500">
                FDI & Citas
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1 sm:gap-2">
              {/* Odontograma */}
              <button
                type="button"
                onClick={() => {
                  onNavigateTab("clinica", "odontograma");
                  onClose();
                }}
                className="p-1.5 sm:p-2 rounded-xl min-w-0 flex flex-col items-center justify-center text-center gap-1 bg-slate-50/60 dark:bg-slate-800/30 hover:bg-indigo-50/80 dark:hover:bg-indigo-950/30 border border-slate-200/60 dark:border-slate-800/60 hover:border-indigo-500/25 transition-all cursor-pointer group active:scale-95"
              >
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform shrink-0">
                  <Smile className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <span className="text-[9.5px] sm:text-[10.5px] font-semibold text-slate-700 dark:text-slate-200 leading-tight truncate w-full text-center">
                  Odonto
                </span>
                <span className="text-[8px] sm:text-[8.5px] text-slate-400 dark:text-slate-500 font-medium leading-none truncate w-full text-center">
                  FDI 32
                </span>
              </button>

              {/* Periodontograma */}
              <button
                type="button"
                onClick={() => {
                  onNavigateTab("clinica", "periodontograma");
                  onClose();
                }}
                className="p-1.5 sm:p-2 rounded-xl min-w-0 flex flex-col items-center justify-center text-center gap-1 bg-slate-50/60 dark:bg-slate-800/30 hover:bg-teal-50/80 dark:hover:bg-teal-950/40 border border-slate-200/60 dark:border-slate-800/60 hover:border-teal-500/25 transition-all cursor-pointer group active:scale-95"
              >
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform shrink-0">
                  <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <span className="text-[9.5px] sm:text-[10.5px] font-semibold text-slate-700 dark:text-slate-200 leading-tight truncate w-full text-center">
                  Perio
                </span>
                <span className="text-[8px] sm:text-[8.5px] text-slate-400 dark:text-slate-500 font-medium leading-none truncate w-full text-center">
                  6 Puntos
                </span>
              </button>

              {/* Radiografías IA */}
              <button
                type="button"
                onClick={() => {
                  onNavigateTab("clinica", "xrays");
                  onClose();
                }}
                className="p-1.5 sm:p-2 rounded-xl min-w-0 flex flex-col items-center justify-center text-center gap-1 bg-slate-50/60 dark:bg-slate-800/30 hover:bg-cyan-50/80 dark:hover:bg-cyan-950/30 border border-slate-200/60 dark:border-slate-800/60 hover:border-cyan-500/25 transition-all cursor-pointer group active:scale-95"
              >
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform shrink-0">
                  <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <span className="text-[9.5px] sm:text-[10.5px] font-semibold text-slate-700 dark:text-slate-200 leading-tight truncate w-full text-center">
                  Rayos X
                </span>
                <span className="text-[8px] sm:text-[8.5px] text-slate-400 dark:text-slate-500 font-medium leading-none truncate w-full text-center">
                  IA Diag.
                </span>
              </button>

              {/* Agenda Médica */}
              <button
                type="button"
                onClick={() => {
                  onNavigateTab("agenda");
                  onClose();
                }}
                className="p-1.5 sm:p-2 rounded-xl min-w-0 flex flex-col items-center justify-center text-center gap-1 bg-slate-50/60 dark:bg-slate-800/30 hover:bg-blue-50/80 dark:hover:bg-blue-950/30 border border-slate-200/60 dark:border-slate-800/60 hover:border-blue-500/25 transition-all cursor-pointer group active:scale-95"
              >
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform shrink-0">
                  <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <span className="text-[9.5px] sm:text-[10.5px] font-semibold text-slate-700 dark:text-slate-200 leading-tight truncate w-full text-center">
                  Agenda
                </span>
                <span className="text-[8px] sm:text-[8.5px] text-slate-400 dark:text-slate-500 font-medium leading-none truncate w-full text-center">
                  Citas
                </span>
              </button>

              {/* Directorio Pacientes */}
              <button
                type="button"
                onClick={() => {
                  onNavigateTab("pacientes");
                  onClose();
                }}
                className="p-1.5 sm:p-2 rounded-xl min-w-0 flex flex-col items-center justify-center text-center gap-1 bg-slate-50/60 dark:bg-slate-800/30 hover:bg-purple-50/80 dark:hover:bg-purple-950/30 border border-slate-200/60 dark:border-slate-800/60 hover:border-purple-500/25 transition-all cursor-pointer group active:scale-95"
              >
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform shrink-0">
                  <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <span className="text-[9.5px] sm:text-[10.5px] font-semibold text-slate-700 dark:text-slate-200 leading-tight truncate w-full text-center">
                  Pacientes
                </span>
                <span className="text-[8px] sm:text-[8.5px] text-slate-400 dark:text-slate-500 font-medium leading-none truncate w-full text-center">
                  Fichas
                </span>
              </button>
            </div>
          </div>

          {/* Micro-Barra Inferior con Atajos de Teclado */}
          <div className="pt-2.5 sm:pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 px-0.5">
            <div className="flex items-center gap-1.5 font-mono text-[9px] sm:text-[9.5px]">
              <Command className="w-3 h-3 text-slate-400" />
              <span>Atajos: <strong className="text-slate-600 dark:text-slate-300">Ctrl+K</strong> • <strong className="text-slate-600 dark:text-slate-300">Alt+S</strong></span>
            </div>
            <span className="text-[9px] sm:text-[9.5px] font-medium text-teal-600 dark:text-teal-400">
              PerioDash Pro v15
            </span>
          </div>
        </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
