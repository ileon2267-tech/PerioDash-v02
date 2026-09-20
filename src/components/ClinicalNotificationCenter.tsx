import React, { useState, useEffect, useRef } from "react";
import { Patient } from "../types";
import { 
  Bell, 
  Package, 
  FileCheck, 
  Calendar, 
  DollarSign, 
  CheckCircle2, 
  X, 
  AlertTriangle, 
  ExternalLink,
  Trash2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ClinicalNotificationCenterProps {
  patients: Patient[];
  onSelectPatient: (patientId: string) => void;
  onNavigateTab: (tab: string, subView?: string) => void;
  renderTrigger?: (unreadCount: number, toggle: () => void) => React.ReactNode;
}

interface NotificationItem {
  id: string;
  type: "supply" | "consent" | "recall" | "finance";
  title: string;
  description: string;
  patientId?: string;
  targetTab?: string;
  targetSubView?: string;
  severity: "high" | "medium" | "low";
  timestamp: string;
}

export default function ClinicalNotificationCenter({
  patients,
  onSelectPatient,
  onNavigateTab,
  renderTrigger
}: ClinicalNotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("perio_dismissed_notifications");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Compute live notifications
  const notifications: NotificationItem[] = [];

  // 1. Insumos en stock crítico
  try {
    const rawSupplies = localStorage.getItem("perio_supplies_inventory");
    if (rawSupplies) {
      const supplies = JSON.parse(rawSupplies);
      supplies.forEach((s: any) => {
        if (s.currentStock <= s.minStock) {
          notifications.push({
            id: `supply-${s.id}`,
            type: "supply",
            title: `Stock Crítico: ${s.name}`,
            description: `Quedan ${s.currentStock} ${s.unit} (mínimo de seguridad: ${s.minStock}). Reponer en ${s.location}.`,
            targetTab: "finanzas",
            severity: "high",
            timestamp: "En tiempo real"
          });
        }
      });
    } else {
      // Default notification if no custom inventory edited yet
      notifications.push({
        id: "supply-default-1",
        type: "supply",
        title: "Stock Crítico: Articaína 4% c/ Epi 1:100.000",
        description: "Quedan 15 carpules en Box 1 (mínimo de seguridad: 30). Requiere compra urgente.",
        targetTab: "finanzas",
        severity: "high",
        timestamp: "Hoy"
      });
    }
  } catch (e) {
    // ignore
  }

  // 2. Consentimientos pendientes de firma
  patients.forEach((pat) => {
    (pat.consentimientos || []).forEach((c) => {
      if (!c.signature) {
        notifications.push({
          id: `consent-${c.id}`,
          type: "consent",
          title: `Consentimiento Pendiente: ${pat.name}`,
          description: `Falta firma para "${c.documentType}". Requiere validación antes de la atención.`,
          patientId: pat.id,
          targetTab: "clinica",
          targetSubView: "ficha",
          severity: "medium",
          timestamp: "Pendiente"
        });
      }
    });
  });

  // 3. Pacientes con saldo de tratamiento pendiente
  patients.forEach((pat) => {
    const procedures = pat.treatmentPlan?.procedures || [];
    const pendingTotal = procedures.filter(p => !p.completed).reduce((acc, p) => acc + (p.cost || 0), 0);
    if (pendingTotal > 150000) {
      notifications.push({
        id: `fin-${pat.id}`,
        type: "finance",
        title: `Plan Presupuestado: ${pat.name}`,
        description: `Plan de tratamiento con saldo de $${pendingTotal.toLocaleString("es-CL")} CLP pendiente de ejecución.`,
        patientId: pat.id,
        targetTab: "finanzas",
        severity: "low",
        timestamp: "Seguimiento"
      });
    }
  });

  const activeNotifications = notifications.filter(n => !dismissedIds.includes(n.id));

  const handleDismiss = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = [...dismissedIds, id];
    setDismissedIds(updated);
    localStorage.setItem("perio_dismissed_notifications", JSON.stringify(updated));
  };

  const handleDismissAll = () => {
    const allIds = notifications.map(n => n.id);
    setDismissedIds(allIds);
    localStorage.setItem("perio_dismissed_notifications", JSON.stringify(allIds));
  };

  const handleAction = (item: NotificationItem) => {
    if (item.patientId) {
      onSelectPatient(item.patientId);
    }
    if (item.targetTab) {
      onNavigateTab(item.targetTab, item.targetSubView);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {renderTrigger ? (
        renderTrigger(activeNotifications.length, () => setIsOpen(!isOpen))
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="relative p-2 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
          title="Centro de Alertas y Tareas Clínicas"
        >
          <Bell className="w-4 h-4 text-slate-600 dark:text-slate-300" />
          {activeNotifications.length > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white font-mono font-bold text-[9px] flex items-center justify-center ring-2 ring-white dark:ring-slate-900 animate-pulse">
              {activeNotifications.length}
            </span>
          )}
        </button>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                  Alertas y Tareas Clínicas
                </span>
                <span className="px-1.5 py-0.5 rounded-full bg-teal-500/10 text-teal-700 dark:text-teal-300 text-[10px] font-mono font-bold">
                  {activeNotifications.length}
                </span>
              </div>

              {activeNotifications.length > 0 && (
                <button
                  type="button"
                  onClick={handleDismissAll}
                  className="text-[10px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  Marcar todo leído
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
              {activeNotifications.length === 0 ? (
                <div className="p-8 text-center text-slate-400 space-y-1">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-1 opacity-80" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">¡Todo al día!</p>
                  <p className="text-[11px]">No hay insumos críticos ni consentimientos pendientes.</p>
                </div>
              ) : (
                activeNotifications.map((item) => {
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleAction(item)}
                      className="p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer flex items-start justify-between gap-3 group"
                    >
                      <div className="flex items-start gap-2.5">
                        <div className={`p-1.5 rounded-xl shrink-0 mt-0.5 ${
                          item.severity === "high" 
                            ? "bg-rose-500/10 text-rose-600" 
                            : item.severity === "medium" 
                            ? "bg-amber-500/10 text-amber-600" 
                            : "bg-teal-500/10 text-teal-600"
                        }`}>
                          {item.type === "supply" && <Package className="w-3.5 h-3.5" />}
                          {item.type === "consent" && <FileCheck className="w-3.5 h-3.5" />}
                          {item.type === "finance" && <DollarSign className="w-3.5 h-3.5" />}
                          {item.type === "recall" && <Calendar className="w-3.5 h-3.5" />}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                              {item.title}
                            </h5>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                            {item.description}
                          </p>
                          <span className="text-[9px] font-mono text-slate-400 mt-1 inline-block">
                            {item.timestamp}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => handleDismiss(item.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-opacity"
                        title="Descartar"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
