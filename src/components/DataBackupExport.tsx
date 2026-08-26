import React, { useState, useRef } from "react";
import { Patient, Appointment } from "../types";
import { 
  Download, 
  Upload, 
  Database, 
  FileSpreadsheet, 
  FileJson, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  ShieldCheck,
  HardDrive,
  Copy,
  Check,
  Lock,
  EyeOff
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { recordHipaaAudit, maskPII } from "../utils/hipaaAudit";

interface DataBackupExportProps {
  patients: Patient[];
  appointments: Appointment[];
  aranceles: Record<string, number>;
  onRestoreData: (patients: Patient[], appointments: Appointment[]) => void;
}

export default function DataBackupExport({
  patients,
  appointments,
  aranceles,
  onRestoreData
}: DataBackupExportProps) {
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [anonymizeExport, setAnonymizeExport] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Export Full JSON Backup
  const handleExportJSON = () => {
    try {
      const exportPatients = anonymizeExport 
        ? patients.map(p => ({
            ...p,
            name: maskPII(p.name, "name"),
            rut: maskPII(p.rut, "rut"),
            dni: maskPII(p.dni, "rut"),
            phone: maskPII(p.phone, "phone"),
            email: maskPII(p.email, "email"),
            birthdate: p.birthdate ? `${p.birthdate.split('-')[0]}-XX-XX` : ""
          }))
        : patients;

      const backupData = {
        version: "PerioDash-v15-Pro",
        exportDate: new Date().toISOString(),
        deidentified: anonymizeExport,
        hipaaStandard: "45 CFR § 164.514(b)",
        totalPatients: patients.length,
        totalAppointments: appointments.length,
        patients: exportPatients,
        appointments,
        aranceles
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `PerioDash_Backup_${anonymizeExport ? 'ANONIMIZADO_' : ''}${new Date().toISOString().split("T")[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);

      recordHipaaAudit("DATA_EXPORT", `Exportación de base de datos clínica JSON (${patients.length} pacientes, de-identificado: ${anonymizeExport ? "SÍ" : "NO"}).`, {
        resource: "Copia de Seguridad ePHI",
        severity: anonymizeExport ? "info" : "warning"
      });

      setExportSuccess(`Copia de seguridad completa (JSON) descargada con éxito${anonymizeExport ? ' (Datos ePHI Desidentificados/Anonimizados)' : ''}.`);
      setTimeout(() => setExportSuccess(null), 4000);
    } catch (e) {
      console.error(e);
    }
  };

  // 2. Export Patients CSV / Excel compatible
  const handleExportPatientsCSV = () => {
    try {
      const headers = [
        "ID",
        "Nombre",
        "RUT/DNI",
        "Telefono",
        "Email",
        "FechaNacimiento",
        "EstadoClinico",
        "HTA",
        "Diabetes",
        "Tabaquismo",
        "TotalProcedimientos",
        "FechaCreacion"
      ];

      const rows = patients.map(p => [
        `"${p.id}"`,
        `"${((anonymizeExport ? maskPII(p.name, 'name') : p.name) || '').replace(/"/g, '""')}"`,
        `"${anonymizeExport ? maskPII(p.rut || p.dni, 'rut') : (p.rut || p.dni || '')}"`,
        `"${anonymizeExport ? maskPII(p.phone, 'phone') : (p.phone || '')}"`,
        `"${anonymizeExport ? maskPII(p.email, 'email') : (p.email || '')}"`,
        `"${anonymizeExport && p.birthdate ? p.birthdate.split('-')[0] + '-01-01' : (p.birthdate || '')}"`,
        `"${p.status || 'evaluacion'}"`,
        p.anamnesis?.hta ? "Si" : "No",
        p.anamnesis?.diabetes ? "Si" : "No",
        p.anamnesis?.tabaquismo || 0,
        p.treatmentPlan?.procedures?.length || 0,
        `"${p.createdAt || ''}"`
      ]);

      const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\r\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Pacientes_PerioDash_${anonymizeExport ? 'ANON_' : ''}${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      recordHipaaAudit("DATA_EXPORT", `Exportación de nómina de pacientes a CSV (${patients.length} registros, anonimizado: ${anonymizeExport ? "SÍ" : "NO"}).`, {
        resource: "Padrón de Pacientes CSV",
        severity: anonymizeExport ? "info" : "warning"
      });

      setExportSuccess(`Fichero CSV de Pacientes descargado${anonymizeExport ? ' con enmascaramiento seguro Safe Harbor' : ''}.`);
      setTimeout(() => setExportSuccess(null), 4000);
    } catch (e) {
      console.error(e);
    }
  };

  // 3. Export Appointments CSV
  const handleExportAppointmentsCSV = () => {
    try {
      const headers = ["ID", "PacienteID", "NombrePaciente", "Fecha", "Hora", "Tratamiento", "Estado", "Sillon"];
      const rows = appointments.map(a => [
        `"${a.id}"`,
        `"${a.patientId}"`,
        `"${((anonymizeExport ? maskPII(a.patientName, 'name') : a.patientName) || '').replace(/"/g, '""')}"`,
        `"${a.date}"`,
        `"${a.time}"`,
        `"${(a.treatment || '').replace(/"/g, '""')}"`,
        `"${a.status}"`,
        `"${a.box || ''}"`
      ]);

      const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\r\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Agenda_PerioDash_${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      recordHipaaAudit("DATA_EXPORT", `Exportación de agenda clínica a CSV (${appointments.length} citas).`, {
        resource: "Agenda Clínica ePHI"
      });

      setExportSuccess("Fichero CSV de Agenda descargado.");
      setTimeout(() => setExportSuccess(null), 4000);
    } catch (e) {
      console.error(e);
    }
  };

  // 4. Handle JSON Restore / Import
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError(null);
    setImportStatus("Analizando archivo de respaldo...");

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const parsed = JSON.parse(text);

        if (!parsed.patients || !Array.isArray(parsed.patients)) {
          throw new Error("El archivo no contiene un arreglo de pacientes válido.");
        }

        const restoredAppointments = Array.isArray(parsed.appointments) ? parsed.appointments : [];
        onRestoreData(parsed.patients, restoredAppointments);

        recordHipaaAudit("SYSTEM_RESTORE", `Restauración masiva de datos clínicos desde respaldo JSON (${parsed.patients.length} pacientes, ${restoredAppointments.length} citas).`, {
          resource: "Copia de Seguridad ePHI",
          severity: "warning"
        });

        setImportStatus(`¡Restauración exitosa! ${parsed.patients.length} pacientes y ${restoredAppointments.length} citas sincronizadas.`);
        setTimeout(() => setImportStatus(null), 5000);
      } catch (err: any) {
        setImportError(err.message || "Error al procesar el archivo JSON de respaldo.");
        setImportStatus(null);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-display font-black text-slate-900 dark:text-white">
              Centro de Respaldo, Auditoría & Exportación de Datos
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Genera copias de seguridad portables en JSON o exporta ficheros en formato CSV compatibles con Microsoft Excel y hojas de cálculo.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/60 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
          <HardDrive className="w-3.5 h-3.5 text-teal-500" />
          <span>{patients.length} Pacientes / {appointments.length} Citas en Base</span>
        </div>
      </div>

      {/* Notifications banner */}
      <AnimatePresence>
        {exportSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 rounded-2xl text-xs font-bold flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{exportSuccess}</span>
          </motion.div>
        )}

        {importStatus && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-teal-500/10 border border-teal-500/30 text-teal-700 dark:text-teal-300 rounded-2xl text-xs font-bold flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-teal-500 shrink-0" />
            <span>{importStatus}</span>
          </motion.div>
        )}

        {importError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 rounded-2xl text-xs font-bold flex items-center gap-2"
          >
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{importError}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Export Card */}
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100 dark:border-slate-800">
            <Download className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
              Exportar Datos & Fichas Clínicas
            </h3>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Descarga tus registros para almacenamiento local seguro, auditorías contables o migración entre sistemas odontológicos.
          </p>

          {/* HIPAA Safe Harbor De-identification toggle */}
          <div className="p-3 bg-teal-500/10 dark:bg-teal-950/30 border border-teal-500/30 rounded-2xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
              <div>
                <p className="text-xs font-bold text-teal-800 dark:text-teal-200">De-identificación HIPAA / Safe Harbor</p>
                <p className="text-[10px] text-teal-600 dark:text-teal-400">Enmascarar PII (RUT, nombre, teléfono, email) en los archivos exportados</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={anonymizeExport}
                onChange={(e) => setAnonymizeExport(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-teal-600"></div>
            </label>
          </div>

          <div className="space-y-3">
            {/* Full JSON */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  <FileJson className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Respaldo Integral (JSON)</h4>
                  <p className="text-[11px] text-slate-500">Incluye odontogramas, periodontogramas a 6 puntos y anamnesis.</p>
                </div>
              </div>
              <button
                onClick={handleExportJSON}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs cursor-pointer active:scale-95 shrink-0"
              >
                Descargar JSON
              </button>
            </div>

            {/* Patients CSV */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Padrón de Pacientes (Excel / CSV)</h4>
                  <p className="text-[11px] text-slate-500">Listado tabular de pacientes, teléfonos y alertas sistémicas.</p>
                </div>
              </div>
              <button
                onClick={handleExportPatientsCSV}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs cursor-pointer active:scale-95 shrink-0"
              >
                Descargar CSV
              </button>
            </div>

            {/* Agenda CSV */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Registro de Citas & Agenda (CSV)</h4>
                  <p className="text-[11px] text-slate-500">Historial y programación de turnos de la clínica.</p>
                </div>
              </div>
              <button
                onClick={handleExportAppointmentsCSV}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs cursor-pointer active:scale-95 shrink-0"
              >
                Descargar CSV
              </button>
            </div>
          </div>
        </div>

        {/* Restore / Import Card */}
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100 dark:border-slate-800">
              <Upload className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
                Restauración e Importación de Respaldo
              </h3>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Carga un archivo de respaldo previo en formato <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-teal-600">.json</code> para restablecer de forma inmediata los expedientes de tus pacientes y citas en este navegador y en la nube.
            </p>

            <div className="p-6 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 text-center space-y-3 bg-slate-50/50 dark:bg-slate-800/20">
              <Database className="w-10 h-10 mx-auto text-slate-400 opacity-60" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Selecciona tu archivo PerioDash_Backup.json
                </p>
                <p className="text-[11px] text-slate-400">
                  Soporta estructura JSON oficial de PerioDash v15 Pro
                </p>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".json,application/json"
                className="hidden"
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-5 py-2.5 bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 font-extrabold text-xs rounded-xl transition-all shadow-md cursor-pointer inline-flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                <span>Explorar Archivo JSON</span>
              </button>
            </div>
          </div>

          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-2.5 text-[11px] text-amber-800 dark:text-amber-300">
            <ShieldCheck className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
            <span>
              La importación reemplazará o sincronizará los expedientes locales con los datos del archivo. Se recomienda hacer un respaldo previo antes de importar.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
