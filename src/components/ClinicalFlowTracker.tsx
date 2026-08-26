import React, { useState } from 'react';
import { Patient, ClinicalFlowStatus } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, 
  Clock, 
  User, 
  CheckCircle, 
  AlertCircle, 
  ArrowRight, 
  UserCheck, 
  ShieldAlert, 
  Armchair, 
  Coffee, 
  LogIn, 
  LogOut, 
  Check, 
  ChevronRight,
  Plus
} from 'lucide-react';

interface ClinicalFlowTrackerProps {
  patients: Patient[];
  onUpdatePatient: (updatedPatient: Patient) => void;
  onSelectPatient: (patientId: string) => void;
  compact?: boolean;
}

export const ClinicalFlowTracker: React.FC<ClinicalFlowTrackerProps> = ({
  patients,
  onUpdatePatient,
  onSelectPatient,
  compact = false
}) => {
  const [selectedChair, setSelectedChair] = useState<string>('Sillón 1');
  const [showAssignModal, setShowAssignModal] = useState<string | null>(null); // Chair name if modal open

  // Filter patients by flow status
  const waitingPatients = patients.filter(p => p.flowStatus === 'espera');
  const inChairPatients = patients.filter(p => p.flowStatus === 'en_sillon');
  const finishedPatients = patients.filter(p => p.flowStatus === 'atendido' || p.flowStatus === 'completado');
  const scheduledPatients = patients.filter(p => !p.flowStatus || p.flowStatus === 'programado');

  const chairsList = ['Sillón 1', 'Sillón 2', 'Sillón 3', 'Gabinete Quirúrgico'];

  const getPatientInChair = (chairName: string) => {
    return patients.find(p => p.flowStatus === 'en_sillon' && (p.chairAssigned || 'Sillón 1') === chairName);
  };

  const updateStatus = (patient: Patient, newStatus: ClinicalFlowStatus, chair?: string) => {
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const updated: Patient = {
      ...patient,
      flowStatus: newStatus,
      chairAssigned: chair || patient.chairAssigned || 'Sillón 1',
      checkInTime: patient.checkInTime || (newStatus === 'espera' ? now : undefined),
      statusUpdatedAt: now
    };
    onUpdatePatient(updated);
  };

  if (compact) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400">
              <Activity className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">Flujo Clínico Activo</h4>
          </div>
          <span className="text-[10px] font-extrabold text-teal-600 dark:text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-full">
            {inChairPatients.length} en sillón | {waitingPatients.length} en espera
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
          {chairsList.map(chair => {
            const occupant = getPatientInChair(chair);
            return (
              <div 
                key={chair} 
                className={`p-2.5 rounded-xl border text-xs transition-all ${
                  occupant 
                    ? 'bg-emerald-500/10 border-emerald-500/30 dark:bg-emerald-950/20 text-slate-800 dark:text-slate-200' 
                    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-extrabold text-[10px] uppercase text-slate-500 dark:text-slate-400">{chair}</span>
                  <span className={`w-2 h-2 rounded-full ${occupant ? 'bg-emerald-500 animate-ping' : 'bg-slate-300 dark:bg-slate-700'}`} />
                </div>
                {occupant ? (
                  <div>
                    <p className="font-bold text-xs truncate text-teal-700 dark:text-teal-300">{occupant.name}</p>
                    <div className="flex items-center justify-between mt-1 text-[10px] text-slate-500">
                      <span>{occupant.statusUpdatedAt || occupant.checkInTime}</span>
                      <button 
                        onClick={() => onSelectPatient(occupant.id)}
                        className="text-teal-600 dark:text-teal-400 hover:underline font-bold"
                      >
                        Ver Ficha
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-400 italic">Disponible</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-md flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-teal-500/20 text-teal-300 border border-teal-500/30 rounded-2xl">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-display font-black tracking-tight text-white flex items-center gap-2">
              Trazabilidad y Flujo Clínico en Tiempo Real
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/40 uppercase">
                En vivo
              </span>
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Control de ubicación de pacientes en sala de espera, gabinetes de atención y registro de salida.
            </p>
          </div>
        </div>

        {/* Quick KPI Counters */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-center">
            <span className="block text-[10px] font-bold text-slate-400 uppercase">Sala de Espera</span>
            <span className="text-base font-black text-amber-400">{waitingPatients.length}</span>
          </div>
          <div className="px-3.5 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-center">
            <span className="block text-[10px] font-bold text-slate-400 uppercase">En Sillón</span>
            <span className="text-base font-black text-emerald-400">{inChairPatients.length}</span>
          </div>
          <div className="px-3.5 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-center">
            <span className="block text-[10px] font-bold text-slate-400 uppercase">Atendidos Hoy</span>
            <span className="text-base font-black text-sky-400">{finishedPatients.length}</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Chair Occupancy & Waiting Room */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT 2 COLUMNS: GABINETES & SILLONES DENTALES */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Armchair className="w-4 h-4 text-emerald-500" /> Monitoreo de Gabinetes Odontológicos
            </h3>
            <span className="text-xs text-slate-400 font-medium">4 Gabinetes en Instalación</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {chairsList.map(chairName => {
              const occupant = getPatientInChair(chairName);
              
              return (
                <div 
                  key={chairName} 
                  className={`rounded-2xl border transition-all p-5 shadow-xs relative overflow-hidden flex flex-col justify-between min-h-[220px] ${
                    occupant 
                      ? 'bg-gradient-to-br from-emerald-500/5 via-white to-emerald-500/10 dark:from-emerald-950/30 dark:via-slate-900 dark:to-emerald-950/20 border-emerald-500/40 ring-1 ring-emerald-500/20' 
                      : 'bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800/80 hover:border-slate-300'
                  }`}
                >
                  {/* Status Indicator Bar */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider flex items-center gap-1.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${occupant ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300 dark:bg-slate-700'}`} />
                      {chairName}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                      occupant 
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-700 dark:text-emerald-300' 
                        : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                    }`}>
                      {occupant ? 'Ocupado / En Tratamiento' : 'Disponible'}
                    </span>
                  </div>

                  {occupant ? (
                    <div className="space-y-3 my-2">
                      <div>
                        <h4 className="text-base font-extrabold text-slate-900 dark:text-white hover:text-teal-600 transition-colors cursor-pointer" onClick={() => onSelectPatient(occupant.id)}>
                          {occupant.name}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {occupant.phone} • Teléfono paciente
                        </p>
                      </div>

                      {/* Time & Medical Info */}
                      <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-xs space-y-1">
                        <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 font-medium">
                          <span className="flex items-center gap-1 text-[11px] text-slate-400">
                            <Clock className="w-3.5 h-3.5 text-teal-500" /> Hora ingreso sillón:
                          </span>
                          <span className="font-mono font-bold">{occupant.statusUpdatedAt || occupant.checkInTime || 'En atención'}</span>
                        </div>
                        {occupant.anamnesis?.motivoConsulta && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 italic truncate pt-1 border-t border-slate-200/40 dark:border-slate-700/40">
                            "{occupant.anamnesis.motivoConsulta}"
                          </p>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 pt-2">
                        <button
                          onClick={() => onSelectPatient(occupant.id)}
                          className="flex-1 py-2 px-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <User className="w-3.5 h-3.5" /> Abrir Ficha
                        </button>

                        <button
                          onClick={() => updateStatus(occupant, 'atendido')}
                          className="py-2 px-3 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-500/30 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                          title="Marcar como atendido y enviar a salida/caja"
                        >
                          <LogOut className="w-3.5 h-3.5" /> Concluir
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center my-4 space-y-3">
                      <div className="p-3 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400">
                        <Armchair className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-600 dark:text-slate-400">Gabinete Libre</p>
                        <p className="text-[11px] text-slate-400">Listo para recibir al siguiente paciente</p>
                      </div>

                      {waitingPatients.length > 0 && (
                        <div className="w-full pt-2">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Asignar desde Sala de Espera:</label>
                          <select
                            defaultValue=""
                            onChange={(e) => {
                              const pId = e.target.value;
                              if (!pId) return;
                              const pat = patients.find(p => p.id === pId);
                              if (pat) updateStatus(pat, 'en_sillon', chairName);
                            }}
                            className="w-full text-xs p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-teal-600 dark:text-teal-400 outline-none cursor-pointer"
                          >
                            <option value="" disabled>Seleccionar paciente...</option>
                            {waitingPatients.map(wp => (
                              <option key={wp.id} value={wp.id}>
                                {wp.name} (Llegó {wp.checkInTime || 'recién'})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: SALA DE ESPERA & PACIENTES ATENDIDOS */}
        <div className="space-y-6">
          
          {/* BLOQUE SALA DE ESPERA */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                  <Coffee className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Sala de Espera</h3>
                  <p className="text-[11px] text-slate-400">Pacientes en recepción</p>
                </div>
              </div>
              <span className="text-xs font-black px-2.5 py-1 bg-amber-500/10 text-amber-700 dark:text-amber-300 rounded-full border border-amber-500/20">
                {waitingPatients.length} en espera
              </span>
            </div>

            {waitingPatients.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs italic">
                No hay pacientes en la sala de espera actualmente.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                {waitingPatients.map(wp => (
                  <div key={wp.id} className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/70 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h5 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 hover:text-teal-600 cursor-pointer" onClick={() => onSelectPatient(wp.id)}>
                          {wp.name}
                        </h5>
                        <p className="text-[10px] text-slate-400">Llegó a recepción: {wp.checkInTime || 'Hora no reg.'}</p>
                      </div>
                      <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">
                        En Espera
                      </span>
                    </div>

                    <div className="flex items-center gap-1 pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
                      <span className="text-[10px] font-bold text-slate-400 mr-1">Ingresar a:</span>
                      {['Sillón 1', 'Sillón 2', 'Gabinete Quirúrgico'].map(ch => (
                        <button
                          key={ch}
                          onClick={() => updateStatus(wp, 'en_sillon', ch)}
                          className="px-2 py-0.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-700 dark:text-teal-300 text-[10px] font-bold transition-all border border-teal-500/20 cursor-pointer"
                        >
                          {ch.replace('Sillón ', 'S').replace('Gabinete Quirúrgico', 'Gab. Quir.')}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* BLOQUE PACIENTES PROGRAMADOS & POR INGRESAR A RECEPCION */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Programados / Próximos</h3>
                  <p className="text-[11px] text-slate-400">Registrar llegada a recepción</p>
                </div>
              </div>
            </div>

            {scheduledPatients.length === 0 ? (
              <p className="text-center text-xs text-slate-400 italic py-2">Todos los pacientes han sido procesados.</p>
            ) : (
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {scheduledPatients.slice(0, 5).map(sp => (
                  <div key={sp.id} className="p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[150px]">{sp.name}</p>
                      <p className="text-[10px] text-slate-400">Cita agendada</p>
                    </div>
                    <button
                      onClick={() => updateStatus(sp, 'espera')}
                      className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-bold border border-amber-500/30 transition-all cursor-pointer flex items-center gap-1"
                    >
                      <LogIn className="w-3 h-3" /> Marcó Llegada
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* BLOQUE ATENDIDOS / CONCLUIDOS HOY */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-sky-500" /> Finalizados / Salida ({finishedPatients.length})
              </h3>
            </div>
            {finishedPatients.length === 0 ? (
              <p className="text-center text-xs text-slate-400 italic py-2">No hay pacientes finalizados aún hoy.</p>
            ) : (
              <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                {finishedPatients.map(fp => (
                  <div key={fp.id} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 text-xs flex items-center justify-between">
                    <span className="font-bold text-slate-700 dark:text-slate-300 truncate">{fp.name}</span>
                    <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400">
                      {fp.flowStatus === 'completado' ? '✅ Concluido' : '🔵 En Salida'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
