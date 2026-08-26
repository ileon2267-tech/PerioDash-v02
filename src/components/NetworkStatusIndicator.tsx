import React, { useState } from "react";
import { Cloud, CloudOff, RefreshCw, CheckCircle2, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface NetworkStatusIndicatorProps {
  isSyncing: boolean;
  syncError: string | null;
  lastSyncedTime?: Date | null;
  onManualSync?: () => void;
}

export default function NetworkStatusIndicator({
  isSyncing,
  syncError,
  lastSyncedTime,
  onManualSync,
}: NetworkStatusIndicatorProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onClick={onManualSync}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all border cursor-pointer ${
          syncError
            ? "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20"
            : isSyncing
            ? "bg-teal-500/10 border-teal-500/30 text-teal-600 dark:text-teal-400 hover:bg-teal-500/20"
            : "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20"
        }`}
        title="Estado de sincronización en la nube"
      >
        {syncError ? (
          <>
            <CloudOff className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden sm:inline">Modo Local</span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          </>
        ) : isSyncing ? (
          <>
            <RefreshCw className="w-3.5 h-3.5 text-teal-500 animate-spin" />
            <span className="hidden sm:inline">Sincronizando...</span>
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-ping" />
          </>
        ) : (
          <>
            <Cloud className="w-3.5 h-3.5 text-emerald-500" />
            <span className="hidden sm:inline">Nube Conectada</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </>
        )}
      </button>

      {/* Tooltip Card */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-64 p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 z-50 text-left pointer-events-none font-sans"
          >
            <div className="flex items-center gap-2 mb-1.5">
              <ShieldCheck className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {syncError ? "Caché Local Offline" : "Cloud Firestore Activo"}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
              {syncError
                ? "Los datos se guardan en este dispositivo. Se sincronizarán automáticamente al restablecerse la red."
                : "Sincronización multi-dispositivo en tiempo real (consultorios, sillones y recepción)."}
            </p>
            {lastSyncedTime && !syncError && (
              <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[9px] font-mono text-slate-400 flex items-center justify-between">
                <span>Último sync:</span>
                <span>{lastSyncedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
