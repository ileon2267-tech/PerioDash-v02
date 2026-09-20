import React, { useState, useMemo } from "react";
import { Patient, Evolution } from "../types";
import { 
  Calendar, 
  Activity, 
  DollarSign, 
  FileCheck, 
  Pill, 
  Clock, 
  Filter, 
  Search, 
  UserCheck, 
  ChevronRight, 
  FileText, 
  CreditCard,
  Printer,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface PatientTimelineProps {
  patient: Patient;
  onNavigateToTab?: (tab: string, subView?: string) => void;
}

type TimelineCategory = "all" | "clinical" | "financial" | "legal" | "prescriptions";

interface TimelineEvent {
  id: string;
  category: "clinical" | "financial" | "legal" | "prescriptions" | "appointment";
  date: string;
  title: string;
  description: string;
  badge?: string;
  badgeColor?: string;
  doctor?: string;
  details?: Record<string, string | number | undefined>;
}

export default function PatientTimeline({ patient, onNavigateToTab }: PatientTimelineProps) {
  const [filter, setFilter] = useState<TimelineCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Consolidate all historical items into a single unified chronological list
  const events = useMemo(() => {
    const list: TimelineEvent[] = [];

    // 1. Evoluciones
    (patient.evolutions || []).forEach((evo: Evolution) => {
      list.push({
        id: `evo-${evo.id}`,
        category: "clinical",
        date: evo.date,
        title: "Evolución Clínica Odontológica",
        description: evo.description || "Atención clínica sin observaciones adicionales",
        badge: "Clínico",
        badgeColor: "bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/20",
        doctor: evo.professional || "Dr. Titular",
        details: {
          "Profesional": evo.professional || "Dr. Titular",
          "Registro": "Ficha Oficial"
        }
      });
    });

    // 2. Consentimientos
    (patient.consentimientos || []).forEach((c) => {
      const isSigned = !!c.signature;
      list.push({
        id: `cons-${c.id}`,
        category: "legal",
        date: c.date || patient.createdAt,
        title: `Consentimiento: ${c.documentType}`,
        description: isSigned 
          ? "Firmado digitalmente por el paciente (Firma biométrica almacenada)"
          : "Pendiente de firma y validación legal",
        badge: isSigned ? "Firmado" : "Pendiente",
        badgeColor: isSigned ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20" : "bg-amber-500/10 text-amber-700 border-amber-500/20",
        doctor: "Dr. Titular",
        details: {
          "Estado Legal": isSigned ? "Válido y Acreditado" : "Requiere Firma",
          "Tipo Documento": c.documentType
        }
      });
    });

    // 3. Pagos realizados (from treatment plan)
    const plan = patient.treatmentPlan || { procedures: [] };
    (plan.procedures || []).filter(p => p.completed).forEach((p) => {
      list.push({
        id: `pay-${p.id}`,
        category: "financial",
        date: patient.createdAt, // fallback or completion date
        title: `Tratamiento Completado: ${p.description}`,
        description: `Arancel cancelado o devengado de $${p.cost.toLocaleString("es-CL")} CLP en Fase ${p.phase}.`,
        badge: "Devengado",
        badgeColor: "bg-blue-500/10 text-blue-700 border-blue-500/20",
        details: {
          "Monto": `$${p.cost.toLocaleString("es-CL")}`,
          "Fase": p.phase
        }
      });
    });

    // 4. Creación inicial de expediente
    if (patient.createdAt) {
      list.push({
        id: `creation-${patient.id}`,
        category: "clinical",
        date: patient.createdAt,
        title: "Ingreso de Ficha y Anamnesis",
        description: `Apertura oficial del expediente clínico para ${patient.name}. Registro de antecedentes médicos y odontograma basal.`,
        badge: "Apertura",
        badgeColor: "bg-purple-500/10 text-purple-700 border-purple-500/20"
      });
    }

    // Sort descending by date
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [patient]);

  // Filter and search
  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      const matchesFilter = filter === "all" || e.category === filter;
      const matchesQuery = searchQuery === "" || 
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        e.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesQuery;
    });
  }, [events, filter, searchQuery]);

  return (
    <div className="space-y-4">
      {/* Header and Controls */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-display font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              Línea de Tiempo Integral del Paciente
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Historial cronológico unificado: evoluciones clínicas, consentimientos, pagos y registros odontológicos.
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar en historial..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
            />
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
          {[
            { id: "all", label: "Todo el Historial", icon: Clock },
            { id: "clinical", label: "Evoluciones Clínicas", icon: Activity },
            { id: "financial", label: "Financiero y Pagos", icon: DollarSign },
            { id: "legal", label: "Consentimientos", icon: FileCheck },
          ].map((cat) => {
            const Icon = cat.icon;
            const active = filter === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setFilter(cat.id as TimelineCategory)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                  active 
                    ? "bg-teal-600 text-white border-teal-600 shadow-xs" 
                    : "bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Timeline Feed */}
      <div className="relative pl-6 sm:pl-8 before:absolute before:left-3 sm:before:left-4 before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800 space-y-4">
        {filteredEvents.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center text-slate-400">
            <Clock className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-700" />
            <p className="text-xs font-bold">No se encontraron eventos en este criterio de búsqueda</p>
          </div>
        ) : (
          filteredEvents.map((evt) => {
            const formattedDate = new Date(evt.date).toLocaleDateString("es-CL", {
              day: "2-digit",
              month: "short",
              year: "numeric"
            });

            return (
              <motion.div
                key={evt.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs hover:border-teal-500/40 transition-all"
              >
                {/* Node bullet */}
                <div className="absolute -left-6 sm:-left-8 top-5 w-4 h-4 rounded-full border-2 border-white dark:border-slate-950 bg-teal-500 shadow-xs" />

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase font-mono border ${evt.badgeColor || "bg-slate-100 text-slate-700"}`}>
                      {evt.badge}
                    </span>
                    <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                      {evt.title}
                    </h4>
                  </div>
                  
                  <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-mono shrink-0">
                    <Calendar className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                    <span>{formattedDate}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 mt-2.5 leading-relaxed">
                  {evt.description}
                </p>

                {evt.details && Object.keys(evt.details).length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/60 flex flex-wrap gap-3">
                    {Object.entries(evt.details).map(([key, val]) => val ? (
                      <span key={key} className="text-[10.5px] text-slate-500 dark:text-slate-400 font-mono">
                        <strong className="text-slate-700 dark:text-slate-300 font-semibold">{key}:</strong> {val}
                      </span>
                    ) : null)}
                    {evt.doctor && (
                      <span className="text-[10.5px] text-teal-600 dark:text-teal-400 font-mono ml-auto">
                        A cargo: {evt.doctor}
                      </span>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
