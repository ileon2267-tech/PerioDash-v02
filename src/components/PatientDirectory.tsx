import React, { useState, useMemo, useEffect } from "react";
import { Patient } from "../types";
import { 
  Search, 
  Plus, 
  UserPlus, 
  Trash2, 
  Activity, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  User,
  Phone,
  Mail,
  FileText,
  Calendar,
  X,
  CreditCard,
  CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { formatRut, matchPatientByRut, validateRut } from "../utils/rutUtils";
import { maskPII } from "../utils/hipaaAudit";

interface PatientDirectoryProps {
  patients: Patient[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  setActivePatientId: (id: string) => void;
  setClinicalSubView: (view: any) => void;
  startEditPatient: (patient: Patient) => void;
  handleDeletePatient: (id: string) => void;
  showRegisterForm: boolean;
  setShowRegisterForm: (show: boolean) => void;
  editingPatientId: string | null;
  setEditingPatientId: (id: string | null) => void;
  handleRegisterPatient: (e: React.FormEvent) => void;
  newPatientName: string;
  setNewPatientName: (val: string) => void;
  newPatientRut: string;
  setNewPatientRut: (val: string) => void;
  newPatientPhone: string;
  setNewPatientPhone: (val: string) => void;
  newPatientEmail: string;
  setNewPatientEmail: (val: string) => void;
  newPatientBirthdate: string;
  setNewPatientBirthdate: (val: string) => void;
  newPatientNotes: string;
  setNewPatientNotes: (val: string) => void;
  privacyMode?: boolean;
}

function PatientDirectoryComponent({
  patients,
  searchQuery,
  setSearchQuery,
  setActivePatientId,
  setClinicalSubView,
  startEditPatient,
  handleDeletePatient,
  showRegisterForm,
  setShowRegisterForm,
  editingPatientId,
  setEditingPatientId,
  handleRegisterPatient,
  newPatientName,
  setNewPatientName,
  newPatientRut,
  setNewPatientRut,
  newPatientPhone,
  setNewPatientPhone,
  newPatientEmail,
  setNewPatientEmail,
  newPatientBirthdate,
  setNewPatientBirthdate,
  newPatientNotes,
  setNewPatientNotes,
  privacyMode = false,
}: PatientDirectoryProps) {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Escape key handler for register/edit form
  useEffect(() => {
    if (!showRegisterForm) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowRegisterForm(false);
        setEditingPatientId(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showRegisterForm, setShowRegisterForm, setEditingPatientId]);

  // Filtered list - Support search by Name, Email, Phone, ID, and RUT (with and without format)
  const filteredPatients = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const seen = new Set<string>();
    const base: Patient[] = [];

    for (let i = 0; i < patients.length; i++) {
      const p = patients[i];
      if (!p || !p.id || seen.has(p.id)) continue;
      seen.add(p.id);
      base.push(p);
    }

    if (!q) return base;
    return base.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        p.phone.includes(q) ||
        p.id.toLowerCase().includes(q) ||
        matchPatientByRut(p.rut || p.dni, searchQuery)
    );
  }, [patients, searchQuery]);

  // Reset to page 1 whenever filter or page size changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, pageSize]);

  const totalItems = filteredPatients.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // Ensure current page is valid
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  // Paginated items
  const paginatedPatients = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPatients.slice(start, start + pageSize);
  }, [filteredPatients, currentPage, pageSize]);

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generate page numbers for pagination bar
  const pageNumbers = useMemo(() => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
      
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  }, [currentPage, totalPages]);

  return (
    <div className="space-y-6" id="pacientes-control">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-xs">
        <div>
          <h3 className="text-lg font-display font-semibold text-slate-800 dark:text-white flex items-center gap-2">
            <span>Directorio y Registro Clínico</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 font-bold border border-teal-500/20">
              {patients.length} Expedientes
            </span>
          </h3>
          <p className="text-xs text-slate-400 font-normal">
            Paginación activa para máximo rendimiento y fluidez en grandes listados
          </p>
        </div>

        <button
          onClick={() => setShowRegisterForm(!showRegisterForm)}
          className="bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs py-2.5 px-4 rounded-xl cursor-pointer transition-all shadow-md inline-flex items-center gap-1.5 self-start sm:self-center"
        >
          <Plus className="w-4 h-4" /> 
          <span>Registrar Paciente</span>
        </button>
      </div>

      {/* Quick Registration Form Modal */}
      <AnimatePresence>
        {showRegisterForm && (
          <motion.form 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            onSubmit={handleRegisterPatient} 
            className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800/80 space-y-4 shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800 pb-3 w-full">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white inline-flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-teal-600" />
                <span>{editingPatientId ? "Editar Expediente" : "Nuevo Expediente Histórico Odontorradicular"}</span>
              </h4>
              <button
                type="button"
                onClick={() => {
                  setShowRegisterForm(false);
                  setEditingPatientId(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Cerrar formulario (Esc)"
                aria-label="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="space-y-1.5 lg:col-span-2">
                <label className="text-xs text-slate-400 font-bold block uppercase tracking-wider">Nombre Completo:</label>
                <input 
                  type="text" 
                  placeholder="P. ej., Mario Alberto Rojas"
                  value={newPatientName}
                  onChange={(e) => setNewPatientName(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-teal-500/20 text-slate-800 dark:text-slate-100"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-slate-400 font-bold block uppercase tracking-wider">RUT / DNI:</label>
                  {newPatientRut && (
                    <span className={`text-[10px] font-mono font-bold ${validateRut(newPatientRut) ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                      {validateRut(newPatientRut) ? '✓ Válido' : 'RUT'}
                    </span>
                  )}
                </div>
                <input 
                  type="text" 
                  placeholder="12.345.678-5 o 18943210K"
                  value={newPatientRut}
                  onChange={(e) => setNewPatientRut(formatRut(e.target.value))}
                  className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-teal-500/20 text-slate-800 dark:text-slate-100 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-bold block uppercase tracking-wider">Teléfono de Enlace:</label>
                <input 
                  type="text" 
                  placeholder="+56 9 8234 1928"
                  value={newPatientPhone}
                  onChange={(e) => setNewPatientPhone(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-bold block uppercase tracking-wider">Correo Electrónico:</label>
                <input 
                  type="email" 
                  placeholder="mario@email.com"
                  value={newPatientEmail}
                  onChange={(e) => setNewPatientEmail(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-bold block uppercase tracking-wider">Nacimiento:</label>
                <input 
                  type="date" 
                  value={newPatientBirthdate}
                  onChange={(e) => setNewPatientBirthdate(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2 lg:col-span-4">
                <label className="text-xs text-slate-500 font-bold block uppercase tracking-wider">Antecedentes Clínicos, Patologías Generales o Alergias:</label>
                <textarea 
                  placeholder="P. ej., Hipertenso, Alérgico a la Penicilina o anestésicos, diabetes mellitus tipo II..."
                  value={newPatientNotes}
                  onChange={(e) => setNewPatientNotes(e.target.value)}
                  rows={2}
                  className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowRegisterForm(false);
                  setEditingPatientId(null);
                  setNewPatientName("");
                  setNewPatientRut("");
                  setNewPatientPhone("");
                  setNewPatientEmail("");
                  setNewPatientBirthdate("");
                  setNewPatientNotes("");
                }}
                className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-xs py-2.5 px-4 rounded-xl cursor-pointer transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs py-2.5 px-5 rounded-xl cursor-pointer transition-all shadow-md"
              >
                {editingPatientId ? "Guardar Cambios" : "Crear Ficha y Habilitar Periodonto"}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Main Patient Data Table Container */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/80 p-0 overflow-hidden shadow-xs">
        {/* Search & Page Size Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/20 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:max-w-md">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Buscar por RUT, nombre, correo, teléfono o ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs sm:text-sm p-2.5 pl-9 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-teal-500/10 text-slate-800 dark:text-slate-200 shadow-xs font-medium"
            />
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 self-end sm:self-center">
            <span>Mostrar por página:</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-200 outline-none cursor-pointer font-bold"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="text-[11px] uppercase bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Paciente & RUT</th>
                <th className="px-6 py-3.5">Contacto</th>
                <th className="px-6 py-3.5 text-center">Fichas Clínicas</th>
                <th className="px-6 py-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedPatients.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group">
                  <td className="px-6 py-3.5 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center font-display font-black text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800 uppercase shadow-xs text-xs">
                        {p.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm flex items-center gap-2">
                          <span>{privacyMode ? maskPII(p.name, "name") : p.name}</span>
                          {p.rut && (
                            <span className="px-1.5 py-0.5 rounded-md bg-teal-500/10 text-teal-700 dark:text-teal-300 font-mono text-[10px] font-bold border border-teal-500/20">
                              {privacyMode ? maskPII(p.rut, "rut") : p.rut}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2">
                          <span>ID: {p.id.split('-')[1] || p.id}</span>
                          {p.birthdate && <span>• 🎂 {privacyMode ? `${p.birthdate.split('-')[0]}-XX-XX` : p.birthdate}</span>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3.5 whitespace-nowrap">
                    <div className="text-slate-700 dark:text-slate-300 text-xs">
                      📞 {privacyMode ? maskPII(p.phone, "phone") : (p.phone || "Sin teléfono")}
                    </div>
                    <div className="text-slate-400 text-[11px] mt-0.5">
                      ✉️ {privacyMode ? maskPII(p.email, "email") : (p.email || "Sin email")}
                    </div>
                  </td>
                  <td className="px-6 py-3.5 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => {
                          setActivePatientId(p.id);
                          setClinicalSubView("ficha");
                        }}
                        className="bg-teal-50 dark:bg-teal-900/40 text-teal-700 dark:text-teal-400 hover:bg-teal-100 hover:text-teal-800 border border-teal-100 dark:border-teal-800 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                      >
                        Abrir Expediente
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-3.5 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => startEditPatient(p)}
                        className="p-1.5 text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 bg-slate-50 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-slate-700 rounded-lg transition-all cursor-pointer"
                        title="Editar"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button
                        onClick={() => handleDeletePatient(p.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 bg-slate-50 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-slate-700 rounded-lg transition-all cursor-pointer"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {totalItems === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-light text-xs">
                    <Activity className="w-8 h-8 opacity-20 mx-auto mb-2" />
                    No se encontraron pacientes que coincidan con la búsqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalItems > 0 && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
            <div>
              Mostrando <strong className="text-slate-800 dark:text-slate-200">{startItem}</strong> a{" "}
              <strong className="text-slate-800 dark:text-slate-200">{endItem}</strong> de{" "}
              <strong className="text-slate-800 dark:text-slate-200">{totalItems}</strong> pacientes
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  title="Primera página"
                >
                  <ChevronsLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  title="Página anterior"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                <div className="flex items-center gap-1 px-1">
                  {pageNumbers.map((num, idx) =>
                    typeof num === "number" ? (
                      <button
                        key={idx}
                        onClick={() => setCurrentPage(num)}
                        className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          currentPage === num
                            ? "bg-teal-600 text-white shadow-xs"
                            : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                        }`}
                      >
                        {num}
                      </button>
                    ) : (
                      <span key={idx} className="px-1 text-slate-400">
                        {num}
                      </span>
                    )
                  )}
                </div>

                <button
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  title="Página siguiente"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  title="Última página"
                >
                  <ChevronsRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default React.memo(PatientDirectoryComponent);
