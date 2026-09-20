import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Logo from './Logo';

export type ActiveTab = "dashboard" | "flujo" | "clinica" | "agenda" | "finanzas" | "dentalstories" | "reportes" | "pacientes" | "ajustes" | "tienda" | "bolsa-empleo";
import { 
  X, 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Banknote, 
  Briefcase, 
  Printer, 
  MessageSquare, 
  ShoppingBag, 
  Settings, 
  Search, 
  Sparkles, 
  Sun, 
  Moon, 
  LogOut, 
  UserPlus, 
  CalendarPlus,
  ChevronRight,
  ShieldCheck,
  Stethoscope,
  Activity,
  FileText,
  Zap,
  ExternalLink,
  Mic,
  MicOff
} from 'lucide-react';
import { DENTITO_APP_URL } from '../services/dentitoFinanceSync';

interface MobileNavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  clinicalSubView: string;
  onSelectClinicalSubView: (subView: any) => void;
  doctorName: string;
  clinicName: string;
  activePatientName?: string;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenSearch: () => void;
  onOpenHelp: () => void;
  onOpenNewPatient: () => void;
  onOpenNewAppointment: () => void;
  onOpenLanding?: () => void;
  onOpenChairMode?: () => void;
  handsFreeVoiceActive?: boolean;
  onToggleHandsFreeVoice?: () => void;
  onOpenVoiceHelp?: () => void;
  onLogout: () => void;
}

function MobileNavigationDrawerComponent({
  isOpen,
  onClose,
  activeTab,
  onSelectTab,
  clinicalSubView,
  onSelectClinicalSubView,
  doctorName,
  clinicName,
  activePatientName,
  darkMode,
  onToggleDarkMode,
  onOpenSearch,
  onOpenHelp,
  onOpenNewPatient,
  onOpenNewAppointment,
  onOpenLanding,
  onOpenChairMode,
  handsFreeVoiceActive = false,
  onToggleHandsFreeVoice,
  onOpenVoiceHelp,
  onLogout
}: MobileNavigationDrawerProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const MENU_GROUPS = [
    {
      category: "Atención Clínica",
      items: [
        { id: "clinica", label: "Estación Clínica", icon: Stethoscope },
        { id: "pacientes", label: "Expedientes", icon: Users },
        { id: "flujo", label: "Flujo & Sillones", icon: Activity },
        { id: "agenda", label: "Agenda Médica", icon: Calendar }
      ]
    },
    {
      category: "Gestión & Métricas",
      items: [
        { id: "dashboard", label: "Panel Principal", icon: LayoutDashboard },
        { id: "finanzas", label: "Plan & Finanzas", icon: Banknote },
        { id: "dentito-finance", label: "Dentito Finance", icon: Zap, isExternal: true, url: DENTITO_APP_URL },
        { id: "reportes", label: "Imp / Reportes", icon: Printer }
      ]
    },
    {
      category: "Comunidad & Mercado",
      items: [
        { id: "dentalstories", label: "DentalStories", icon: MessageSquare },
        { id: "tienda", label: "Mercado Dental", icon: ShoppingBag },
        { id: "bolsa-empleo", label: "Bolsa de Empleo", icon: Briefcase }
      ]
    },
    {
      category: "Configuración",
      items: [
        { id: "ajustes", label: "Ajustes", icon: Settings }
      ]
    }
  ];

  const CLINICAL_SUB_VIEWS = [
    { id: "odontograma", label: "Odontograma" },
    { id: "periodontograma", label: "Periodontograma" },
    { id: "psr", label: "Sondaje PSR (OMS)" },
    { id: "ficha", label: "Ficha Médica" },
    { id: "especialidad", label: "Especialidades" },
    { id: "xrays", label: "Radiografías" },
    { id: "pra", label: "Riesgo PRA" },
    { id: "oleary", label: "Índice O'Leary" },
    { id: "soap", label: "SOAP & Evolución" },
    { id: "presupuesto", label: "Presupuestos" }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex no-print">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm"
          />

          {/* Sliding Content Drawer */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className="relative w-[85%] max-w-sm bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col z-10 overflow-hidden border-r border-slate-200 dark:border-slate-800"
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40">
              <Logo size="sm" subtitle="Software Odontológico" />

              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              
              {/* Doctor Context Card */}
              <div className="bg-slate-50 dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center font-mono font-bold text-xs shrink-0 shadow-xs">
                    DR
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{doctorName}</p>
                    <p className="text-[10px] text-slate-400 truncate">{clinicName}</p>
                  </div>
                </div>

                <button
                  onClick={onToggleDarkMode}
                  className="p-2 text-slate-500 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 rounded-xl transition-all cursor-pointer"
                  title="Cambiar Modo Claro/Oscuro"
                >
                  {darkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-indigo-500" />}
                </button>
              </div>

              {/* Active Patient Shortcut Pill */}
              {activePatientName && (
                <div className="p-3 bg-teal-500/10 border border-teal-500/20 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    <span className="text-xs font-bold text-teal-700 dark:text-teal-300 truncate">
                      Paciente: {activePatientName}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      onSelectTab("clinica");
                      onClose();
                    }}
                    className="text-[10px] bg-teal-600 text-white font-bold px-2 py-1 rounded-lg shrink-0 flex items-center gap-1"
                  >
                    Ver Ficha
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Quick Action Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    onOpenNewPatient();
                    onClose();
                  }}
                  className="p-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  Nuevo Paciente
                </button>

                <button
                  onClick={() => {
                    onOpenNewAppointment();
                    onClose();
                  }}
                  className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-700 cursor-pointer"
                >
                  <CalendarPlus className="w-4 h-4 text-teal-500" />
                  Agendar Cita
                </button>
              </div>

              {/* Modo Sillón Button */}
              {onOpenChairMode && (
                <button
                  onClick={() => {
                    onOpenChairMode();
                    onClose();
                  }}
                  className="w-full p-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-between shadow-xs cursor-pointer min-h-[44px] touch-manipulation"
                >
                  <div className="flex items-center gap-2">
                    <Stethoscope className="w-4 h-4" />
                    <span>Modo Sillón Clínico (XL + Voz)</span>
                  </div>
                  <span className="text-[9px] bg-white/20 px-1.5 py-0.5 rounded font-mono font-bold">
                    Alt+S
                  </span>
                </button>
              )}

              {/* Control por Voz Manos Libres Móvil */}
              {onToggleHandsFreeVoice && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                        handsFreeVoiceActive
                          ? "bg-teal-500/20 text-teal-600 dark:text-teal-400"
                          : "bg-slate-200 dark:bg-slate-700 text-slate-500"
                      }`}>
                        {handsFreeVoiceActive ? (
                          <Mic className="w-4 h-4 animate-pulse" />
                        ) : (
                          <MicOff className="w-4 h-4" />
                        )}
                      </div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Voz Manos Libres
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onToggleHandsFreeVoice()}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all shadow-xs min-h-[38px] flex items-center gap-1.5 touch-manipulation ${
                        handsFreeVoiceActive
                          ? "bg-teal-600 text-white shadow-teal-500/20 ring-2 ring-teal-500/30"
                          : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      {handsFreeVoiceActive ? (
                        <>
                          <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping" />
                          <span>Activa</span>
                        </>
                      ) : (
                        <span>Pausada</span>
                      )}
                    </button>
                  </div>

                  {onOpenVoiceHelp && (
                    <button
                      type="button"
                      onClick={() => {
                        onOpenVoiceHelp();
                        onClose();
                      }}
                      className="w-full py-2 px-2.5 rounded-xl text-[11px] font-semibold text-teal-700 dark:text-teal-300 bg-teal-500/10 hover:bg-teal-500/15 transition-colors flex items-center justify-between cursor-pointer min-h-[36px] touch-manipulation"
                    >
                      <span>Ver comandos de voz disponibles</span>
                      <span>&rarr;</span>
                    </button>
                  )}
                </div>
              )}

              {/* Quick Search & Help Trigger */}
              <div className="space-y-1.5">
                <button
                  onClick={() => {
                    onOpenSearch();
                    onClose();
                  }}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Search className="w-4 h-4 text-teal-500" />
                    <span>Buscador General</span>
                  </div>
                  <kbd className="text-[9px] bg-slate-200 dark:bg-slate-900 text-slate-500 px-1.5 py-0.5 rounded font-mono">Ctrl+K</kbd>
                </button>

                <button
                  onClick={() => {
                    onOpenHelp();
                    onClose();
                  }}
                  className="w-full p-2.5 bg-gradient-to-r from-teal-500/10 to-emerald-500/10 border border-teal-500/20 text-teal-700 dark:text-teal-300 rounded-xl text-xs font-semibold flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-teal-500" />
                    <span>Guía de Aprendizaje e IA</span>
                  </div>
                  <span className="text-[9px] bg-teal-500 text-white font-bold px-1.5 py-0.5 rounded-full">Ayuda</span>
                </button>
              </div>

              {/* Sub-navigation if inside Clinica */}
              {activeTab === "clinica" && (
                <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Sub-vistas Clínicas
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {CLINICAL_SUB_VIEWS.map((sub) => {
                      const isSubActive = clinicalSubView === sub.id;
                      return (
                        <button
                          key={sub.id}
                          onClick={() => {
                            onSelectClinicalSubView(sub.id);
                            onClose();
                          }}
                          className={`px-2.5 py-1.5 rounded-xl text-[11px] font-semibold text-left transition-all ${
                            isSubActive
                              ? 'bg-teal-600 text-white font-bold'
                              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          {sub.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Main Navigation Tabs Grouped */}
              <div className="space-y-4">
                {MENU_GROUPS.map((group) => (
                  <div key={group.category} className="space-y-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block px-1">
                      {group.category}
                    </span>
                    {group.items.map((item) => {
                      const ItemIcon = item.icon;
                      const isActive = activeTab === item.id;
                      const isSpecial = item.id === "dentalstories" || item.id === "tienda" || item.id === "bolsa-empleo";
                      const isExternal = (item as any).isExternal;

                      if (isExternal) {
                        return (
                          <a
                            key={item.id}
                            href={(item as any).url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={onClose}
                            className="w-full p-2.5 rounded-2xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer bg-gradient-to-r from-amber-500/10 to-teal-500/10 hover:from-amber-500/20 hover:to-teal-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 shadow-xs"
                          >
                            <div className="flex items-center gap-3">
                              <Zap className="w-4 h-4 text-amber-500" />
                              <span>{item.label}</span>
                            </div>
                            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                          </a>
                        );
                      }

                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            onSelectTab(item.id as ActiveTab);
                            onClose();
                          }}
                          className={`w-full p-2.5 rounded-2xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                            isActive
                              ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
                              : isSpecial
                              ? 'bg-gradient-to-r from-teal-500/5 to-indigo-500/5 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <ItemIcon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-teal-600 dark:text-teal-400'}`} />
                            <span>{item.label}</span>
                          </div>
                          {isActive && <ChevronRight className="w-4 h-4 opacity-80" />}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>

            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-2">
              {onOpenLanding && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenLanding();
                  }}
                  className="w-full p-2.5 bg-teal-500/10 hover:bg-teal-500/20 text-teal-700 dark:text-teal-300 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer border border-teal-500/20"
                >
                  <Sparkles className="w-4 h-4 text-teal-500" />
                  Conoce PerioDash (Página Pública)
                </button>
              )}

              <button
                onClick={() => {
                  onClose();
                  onLogout();
                }}
                className="w-full p-3 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Cerrar Sesión Activa
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default React.memo(MobileNavigationDrawerComponent);
