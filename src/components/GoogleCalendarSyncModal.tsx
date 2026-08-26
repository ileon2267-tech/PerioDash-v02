import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, AlertCircle, Trash2, CheckCircle2, X, RefreshCw, ExternalLink, ShieldCheck } from 'lucide-react';
import { Appointment } from '../types';

interface ConfirmCalendarActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  actionType: 'create' | 'delete' | 'syncAll' | 'exportAll';
  appointment?: Appointment;
  totalAppointments?: number;
  isLoading?: boolean;
}

export function ConfirmCalendarActionModal({
  isOpen,
  onClose,
  onConfirm,
  actionType,
  appointment,
  totalAppointments = 1,
  isLoading = false,
}: ConfirmCalendarActionModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, isLoading]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        onClick={isLoading ? undefined : onClose}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2.5xl max-w-lg w-full shadow-2xl overflow-hidden max-h-[90vh] flex flex-col my-auto"
        >
          {/* Modal Header */}
          <div className="p-6 border-b border-slate-100 dark:border-slate-800/80 flex items-start justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
                actionType === 'delete'
                  ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                  : 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20'
              }`}>
                {actionType === 'delete' ? (
                  <Trash2 className="w-5 h-5" />
                ) : (
                  <Calendar className="w-5 h-5" />
                )}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                  {actionType === 'create' && 'Confirmar sincronización con Google Calendar'}
                  {actionType === 'syncAll' && `Sincronizar ${totalAppointments} citas con Google Calendar`}
                  {actionType === 'exportAll' && `Exportar ${totalAppointments} citas a Google Calendar`}
                  {actionType === 'delete' && 'Eliminar evento de Google Calendar'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {actionType === 'delete'
                    ? 'Esta acción retirará la cita de tu calendario de Google.'
                    : actionType === 'exportAll'
                    ? 'Esta acción exportará todo el estado de citas de la clínica hacia tu Google Calendar.'
                    : 'Esta acción creará o actualizará el evento en tu cuenta de Google.'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 space-y-4 text-xs">
            {appointment && (
              <div className="bg-slate-50 dark:bg-slate-950/60 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Paciente:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{appointment.patientName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Tratamiento:</span>
                  <span className="font-semibold text-teal-600 dark:text-teal-400">{appointment.treatment}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Fecha y Hora:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">{appointment.date} a las {appointment.time} hrs</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Ubicación / Sillón:</span>
                  <span className="text-slate-700 dark:text-slate-300">{appointment.box || 'Sillón 1'}</span>
                </div>
              </div>
            )}

            {(actionType === 'syncAll' || actionType === 'exportAll') && (
              <div className="bg-teal-50 dark:bg-teal-950/30 p-4 rounded-xl border border-teal-500/20 flex gap-3 items-start">
                <ShieldCheck className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                  Se transferirán <strong>{totalAppointments} citas</strong> a tu Google Calendar principal con recordatorios clínicos predeterminados (24 horas antes por email y 1 hora antes por notificación emergente).
                </p>
              </div>
            )}

            {actionType === 'delete' && (
              <div className="bg-rose-50 dark:bg-rose-950/30 p-4 rounded-xl border border-rose-500/20 flex gap-3 items-start">
                <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <p className="text-rose-700 dark:text-rose-300 leading-relaxed text-[11px]">
                  ¿Estás seguro de que deseas eliminar este evento de tu Google Calendar? Esta acción no se puede deshacer en Google, aunque el registro de la cita continuará en PerioDash.
                </p>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={async () => {
                await onConfirm();
                onClose();
              }}
              disabled={isLoading}
              className={`px-5 py-2.5 rounded-xl text-xs font-black text-white cursor-pointer shadow-md transition-all flex items-center gap-2 ${
                actionType === 'delete'
                  ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20'
                  : 'bg-teal-600 hover:bg-teal-700 shadow-teal-500/20'
              }`}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Procesando...</span>
                </>
              ) : (
                <>
                  {actionType === 'delete' ? <Trash2 className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>{actionType === 'delete' ? 'Confirmar Eliminación' : 'Confirmar y Sincronizar'}</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

interface GoogleImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: any[];
  onImportEvent: (event: any) => void;
  isLoading: boolean;
  onRefresh: () => void;
}

export function GoogleImportModal({
  isOpen,
  onClose,
  events,
  onImportEvent,
  isLoading,
  onRefresh,
}: GoogleImportModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, isLoading]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        onClick={isLoading ? undefined : onClose}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2.5xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh] my-auto"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 flex items-center justify-center">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                  Eventos de tu Google Calendar
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Importa eventos de tu calendario directamente a la agenda clínica de PerioDash.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onRefresh}
                disabled={isLoading}
                className="p-2 rounded-xl text-slate-500 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Actualizar eventos"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Event List */}
          <div className="p-6 overflow-y-auto space-y-3 flex-1">
            {events.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Calendar className="w-10 h-10 mx-auto mb-3 opacity-40 text-teal-500" />
                <p className="text-sm font-bold text-slate-600 dark:text-slate-300">No se encontraron eventos próximos</p>
                <p className="text-xs text-slate-400 mt-1">Crea citas en Google Calendar o pulsa refrescar para recargar.</p>
              </div>
            ) : (
              events.map((evt) => {
                const startDate = evt.start?.dateTime ? new Date(evt.start.dateTime) : null;
                const formattedDate = startDate ? startDate.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }) : evt.start?.date || '';
                const formattedTime = startDate ? startDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : 'Todo el día';

                return (
                  <div
                    key={evt.id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-between gap-4 hover:border-teal-500/40 transition-colors"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black text-teal-600 dark:text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-md">
                          {formattedDate} • {formattedTime}
                        </span>
                        {evt.htmlLink && (
                          <a
                            href={evt.htmlLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-slate-400 hover:text-teal-500 flex items-center gap-0.5"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                        {evt.summary || '(Sin título)'}
                      </h4>
                      {evt.description && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                          {evt.description}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => onImportEvent(evt)}
                      className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shrink-0 shadow-xs flex items-center gap-1.5"
                    >
                      <span>Importar a Agenda</span>
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl cursor-pointer hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
