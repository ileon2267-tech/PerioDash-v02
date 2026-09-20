import React, { useState, useMemo } from "react";
import { 
  ClipboardList, 
  Search, 
  UserCheck, 
  Plus, 
  Activity, 
  Smile, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  X,
  Stethoscope,
  Filter,
  ArrowRight
} from "lucide-react";
import { Patient } from "../types";

interface ClinicalPatientSelectorProps {
  patients: Patient[];
  onSelectPatient: (patientId: string, subView?: "ficha" | "odontograma" | "periodontograma" | "especialidad") => void;
  onRegisterNew: () => void;
}

export default function ClinicalPatientSelector({
  patients,
  onSelectPatient,
  onRegisterNew,
}: ClinicalPatientSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "en_sillon" | "espera" | "atendido">("all");

  // Filtered patients list
  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !term ||
        p.name.toLowerCase().includes(term) ||
        (p.rut && p.rut.toLowerCase().includes(term)) ||
        p.id.toLowerCase().includes(term) ||
        (p.phone && p.phone.includes(term));

      const matchesStatus =
        statusFilter === "all" || p.flowStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [patients, searchTerm, statusFilter]);

  // Count pockets >= 4mm for a patient
  const getPocketCount = (p: Patient) => {
    return Object.values(p.periodontogram || {}).reduce((acc, currentTooth: any) => {
      let pcts = 0;
      if (currentTooth) {
        const pts = ["pv1", "pv2", "pv3", "pl1", "pl2", "pl3"];
        pts.forEach((pt) => {
          if (currentTooth[pt] >= 4) pcts++;
        });
      }
      return acc + pcts;
    }, 0);
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 py-2 px-1">
      {/* Banner de Bienvenida & Selección de Paciente */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-850 to-teal-950 text-white p-6 sm:p-8 border border-teal-500/20 shadow-xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-500/30 text-teal-300 text-xs font-bold uppercase tracking-wider">
              <Stethoscope className="w-3.5 h-3.5" />
              Estación Clínica
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-display font-bold text-white tracking-tight">
              ¿A qué paciente deseas atender hoy?
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Selecciona un expediente para habilitar su odontograma interactivo, periodontograma paramétrico a 6 puntos, ficha médica y plan de tratamiento.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onRegisterNew}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs sm:text-sm transition-all shadow-lg shadow-teal-500/20 hover:shadow-teal-500/30 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Nuevo Paciente
            </button>
          </div>
        </div>
      </div>

      {/* Controles de Búsqueda y Filtros Rápidos */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-3 sm:p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Barra de Búsqueda */}
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre, RUT o N° expediente..."
            className="w-full pl-10 pr-9 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filtros de Estado */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <div className="flex items-center gap-1 text-slate-400 text-xs mr-1 hidden lg:flex">
            <Filter className="w-3 h-3" />
            <span className="text-[11px] font-medium">Estado:</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === "all"
                ? "bg-teal-600 text-white shadow-xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-750"
            }`}
          >
            Todos ({patients.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("en_sillon")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              statusFilter === "en_sillon"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-slate-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            En Sillón
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("espera")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              statusFilter === "espera"
                ? "bg-amber-600 text-white shadow-xs"
                : "bg-slate-100 dark:bg-slate-800 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30"
            }`}
          >
            <Clock className="w-3 h-3" />
            En Espera
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("atendido")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === "atendido"
                ? "bg-sky-600 text-white shadow-xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-750"
            }`}
          >
            Atendidos
          </button>
        </div>
      </div>

      {/* Grid de Pacientes */}
      {filteredPatients.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPatients.map((p) => {
            const pockets = getPocketCount(p);
            const hasSystemic = p.anamnesis.hta || p.anamnesis.diabetes || p.anamnesis.alergias;

            return (
              <div
                key={p.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4.5 flex flex-col justify-between hover:border-teal-500/50 hover:shadow-lg transition-all duration-200 group"
              >
                {/* Cabecera de la Tarjeta */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center font-display font-bold text-sm border border-teal-100 dark:border-teal-900/40 shrink-0 group-hover:scale-105 transition-transform">
                        {p.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                          {p.name}
                        </h4>
                        <p className="text-[11px] font-mono text-slate-400 dark:text-slate-500 truncate">
                          {p.rut ? (
                            <span>RUT: <strong className="text-slate-600 dark:text-slate-300">{p.rut}</strong></span>
                          ) : (
                            `Exp. #${p.id.split("-")[1] || p.id}`
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Badge de Estado de Flujo */}
                    <span
                      className={`text-[9.5px] uppercase px-2 py-0.5 rounded-full font-bold tracking-wider shrink-0 ${
                        p.flowStatus === "en_sillon"
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                          : p.flowStatus === "espera"
                          ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30"
                          : p.flowStatus === "atendido"
                          ? "bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      {p.flowStatus === "en_sillon"
                        ? "En Sillón"
                        : p.flowStatus === "espera"
                        ? "En Espera"
                        : p.flowStatus === "atendido"
                        ? "Atendido"
                        : "Registrado"}
                    </span>
                  </div>

                  {/* Datos del Paciente */}
                  <div className="space-y-1 text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/60">
                    <div className="flex items-center justify-between">
                      <span>🎂 {p.birthdate || "Sin fecha"}</span>
                      <span>📞 {p.phone || "Sin teléfono"}</span>
                    </div>
                    {hasSystemic && (
                      <div className="pt-1.5 flex items-center gap-1.5 flex-wrap border-t border-slate-200/50 dark:border-slate-700/50">
                        {p.anamnesis.hta && (
                          <span className="text-[8.5px] font-black uppercase px-1.5 py-0.2 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded border border-rose-500/20">
                            HTA
                          </span>
                        )}
                        {p.anamnesis.diabetes && (
                          <span className="text-[8.5px] font-black uppercase px-1.5 py-0.2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded border border-amber-500/20">
                            Diabetes
                          </span>
                        )}
                        {p.anamnesis.alergias && (
                          <span className="text-[8.5px] font-black uppercase px-1.5 py-0.2 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded border border-purple-500/20">
                            Alergias
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Acciones & Botón Principal de Atención */}
                <div className="pt-3.5 mt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 dark:text-slate-500">
                      Bolsas &ge; 4mm:{" "}
                      <strong className={pockets > 0 ? "text-rose-600 dark:text-rose-400 font-bold" : "text-emerald-600 dark:text-emerald-400 font-bold"}>
                        {pockets}
                      </strong>
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onSelectPatient(p.id, "odontograma")}
                        className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                        title="Ir directo a Odontograma"
                      >
                        Odonto
                      </button>
                      <button
                        type="button"
                        onClick={() => onSelectPatient(p.id, "periodontograma")}
                        className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                        title="Ir directo a Periodontograma"
                      >
                        Perio
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelectPatient(p.id, "ficha")}
                    className="w-full py-2 px-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-teal-700/10 active:scale-98"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Tratar Este Paciente</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-auto opacity-70 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Estado sin resultados */
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 text-center space-y-4 max-w-md mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              No se encontraron pacientes
            </h4>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              {searchTerm
                ? `No hay expedientes que coincidan con "${searchTerm}".`
                : "No hay pacientes con el filtro seleccionado."}
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 pt-2">
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
              >
                Limpiar búsqueda
              </button>
            )}
            <button
              type="button"
              onClick={onRegisterNew}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-teal-600 text-white hover:bg-teal-500 cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Registrar Nuevo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
