import React, { useState, useMemo } from "react";
import { Patient } from "../types";
import { safeStorage } from "../utils/safeStorage";
import { 
  Users, 
  Award, 
  Percent, 
  DollarSign, 
  Calendar, 
  CheckCircle2, 
  Printer, 
  FileText, 
  TrendingUp, 
  Filter, 
  Plus, 
  Building, 
  Briefcase,
  ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export interface DoctorProfile {
  id: string;
  name: string;
  rut: string;
  specialty: string;
  defaultCommissionRate: number; // percentage e.g. 45
  email: string;
  phone: string;
}

export interface DoctorSettlementItem {
  id: string;
  doctorId: string;
  patientName: string;
  procedureDescription: string;
  procedureDate: string;
  grossAmount: number;
  labDeduction: number;
  commissionRate: number;
  netDoctorPay: number;
  status: "completado" | "pendiente_pago";
}

const DEFAULT_DOCTORS: DoctorProfile[] = [
  {
    id: "doc-1",
    name: "Dr. Ignacio León",
    rut: "17.928.341-2",
    specialty: "Periodoncia e Implantología",
    defaultCommissionRate: 50,
    email: "i.leon@periodash.cl",
    phone: "+56 9 8472 1928"
  },
  {
    id: "doc-2",
    name: "Dra. Carolina Silva",
    rut: "16.482.903-8",
    specialty: "Rehabilitación Oral y Estética",
    defaultCommissionRate: 45,
    email: "c.silva@periodash.cl",
    phone: "+56 9 7361 9021"
  },
  {
    id: "doc-3",
    name: "Dr. Matías Valenzuela",
    rut: "18.391.028-5",
    specialty: "Endodoncia Microscópica",
    defaultCommissionRate: 45,
    email: "m.valenzuela@periodash.cl",
    phone: "+56 9 6512 8849"
  }
];

interface DoctorCommissionsProps {
  patients: Patient[];
}

export default function DoctorCommissions({ patients }: DoctorCommissionsProps) {
  const [doctors, setDoctors] = useState<DoctorProfile[]>(() => {
    const saved = safeStorage.getItem("perio_doctors_list");
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return DEFAULT_DOCTORS;
  });

  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(doctors[0]?.id || "doc-1");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("Septiembre 2026");
  const [showAddDoctorModal, setShowAddDoctorModal] = useState(false);
  const [showPrintVoucherModal, setShowPrintVoucherModal] = useState(false);

  // New Doctor Form State
  const [newDocName, setNewDocName] = useState("");
  const [newDocRut, setNewDocRut] = useState("");
  const [newDocSpecialty, setNewDocSpecialty] = useState("Odontología General");
  const [newDocRate, setNewDocRate] = useState("45");

  // Build settlement list combining patient completed procedures
  const settlements = useMemo(() => {
    const list: DoctorSettlementItem[] = [];

    patients.forEach((patient) => {
      const procs = patient.treatmentPlan?.procedures || [];
      procs.forEach((proc, idx) => {
        if (proc.completed) {
          // Assign doctor deterministically or based on active specialty
          const docIndex = (patient.name.length + idx) % doctors.length;
          const assignedDoctor = doctors[docIndex] || doctors[0];

          const gross = proc.cost || 45000;
          const labCost = proc.description.toLowerCase().includes("corona") || proc.description.toLowerCase().includes("implante")
            ? 35000
            : 0;
          const commissionBase = Math.max(0, gross - labCost);
          const rate = assignedDoctor.defaultCommissionRate;
          const doctorEarnings = Math.round((commissionBase * rate) / 100);

          list.push({
            id: `set-${patient.id}-${proc.id}`,
            doctorId: assignedDoctor.id,
            patientName: patient.name,
            procedureDescription: proc.description,
            procedureDate: new Date().toLocaleDateString("es-CL"),
            grossAmount: gross,
            labDeduction: labCost,
            commissionRate: rate,
            netDoctorPay: doctorEarnings,
            status: "completado"
          });
        }
      });
    });

    return list;
  }, [patients, doctors]);

  const activeDoctor = doctors.find(d => d.id === selectedDoctorId) || doctors[0];
  const doctorProcedures = settlements.filter(s => s.doctorId === activeDoctor?.id);

  const stats = useMemo(() => {
    const totalGross = doctorProcedures.reduce((acc, p) => acc + p.grossAmount, 0);
    const totalLab = doctorProcedures.reduce((acc, p) => acc + p.labDeduction, 0);
    const totalToPay = doctorProcedures.reduce((acc, p) => acc + p.netDoctorPay, 0);
    const clinicNetMargin = totalGross - totalLab - totalToPay;

    return {
      totalGross,
      totalLab,
      totalToPay,
      clinicNetMargin,
      count: doctorProcedures.length
    };
  }, [doctorProcedures]);

  const handleSaveDoctor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocName.trim()) return;

    const newDoc: DoctorProfile = {
      id: `doc-${Date.now()}`,
      name: newDocName,
      rut: newDocRut || "12.345.678-9",
      specialty: newDocSpecialty,
      defaultCommissionRate: parseFloat(newDocRate) || 45,
      email: `${newDocName.toLowerCase().replace(/\s+/g, ".")}@periodash.cl`,
      phone: "+56 9 9999 8888"
    };

    const updated = [...doctors, newDoc];
    setDoctors(updated);
    safeStorage.setItem("perio_doctors_list", JSON.stringify(updated));
    setSelectedDoctorId(newDoc.id);
    setShowAddDoctorModal(false);
    setNewDocName("");
    setNewDocRut("");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-display font-bold text-slate-900 dark:text-white">
                Liquidación de Honorarios & Comisiones
              </h2>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Cálculo automatizado de comisiones médicas, deducciones de laboratorio y planilla mensual.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            type="button"
            onClick={() => setShowAddDoctorModal(true)}
            className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all border border-slate-200 dark:border-slate-700 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Nuevo Profesional
          </button>
          <button
            type="button"
            onClick={() => setShowPrintVoucherModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-xs rounded-xl shadow-md shadow-teal-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Emitir Liquidación Oficial
          </button>
        </div>
      </div>

      {/* Selector de Doctor y Período */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 shadow-xs">
        <div className="flex items-center gap-3 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-bold text-slate-400 font-mono uppercase whitespace-nowrap">
            Profesional:
          </span>
          <div className="flex items-center gap-2">
            {doctors.map((doc) => {
              const isSelected = doc.id === activeDoctor?.id;
              return (
                <button
                  key={doc.id}
                  onClick={() => setSelectedDoctorId(doc.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    isSelected
                      ? "bg-teal-600 text-white shadow-xs"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  {doc.name} ({doc.defaultCommissionRate}%)
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="text-xs font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="Septiembre 2026">Septiembre 2026 (En Curso)</option>
            <option value="Agosto 2026">Agosto 2026 (Cerrado)</option>
            <option value="Julio 2026">Julio 2026 (Cerrado)</option>
          </select>
        </div>
      </div>

      {/* KPI Cards del Doctor */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 shadow-xs">
          <span className="text-xs font-mono font-bold text-slate-400">PRODUCCIÓN BRUTA</span>
          <div className="text-2xl font-bold font-display text-slate-800 dark:text-slate-100 mt-2">
            ${stats.totalGross.toLocaleString("es-CL")}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono">
            {stats.count} prestaciones terminadas
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 shadow-xs">
          <span className="text-xs font-mono font-bold text-slate-400">DEDUCCIÓN LABORATORIO</span>
          <div className="text-2xl font-bold font-display text-rose-600 dark:text-rose-400 mt-2">
            -${stats.totalLab.toLocaleString("es-CL")}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono">
            Costos técnicos y materiales
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 shadow-xs">
          <span className="text-xs font-mono font-bold text-teal-600 dark:text-teal-400">HONORARIOS A PAGAR</span>
          <div className="text-2xl font-black font-display text-teal-600 dark:text-teal-400 mt-2">
            ${stats.totalToPay.toLocaleString("es-CL")}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono">
            {activeDoctor?.defaultCommissionRate}% comisión pactada
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 shadow-xs">
          <span className="text-xs font-mono font-bold text-slate-400">MARGEN CLÍNICA</span>
          <div className="text-2xl font-bold font-display text-emerald-600 dark:text-emerald-400 mt-2">
            ${stats.clinicNetMargin.toLocaleString("es-CL")}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono">
            Remanente tras honorarios y lab
          </div>
        </div>
      </div>

      {/* Detalle de Prestaciones Realizadas */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
          <h3 className="font-bold text-xs font-mono text-slate-700 dark:text-slate-300 uppercase">
            Prestaciones Realizadas por {activeDoctor?.name} ({selectedPeriod})
          </h3>
          <span className="text-xs font-bold text-teal-600 dark:text-teal-400 font-mono">
            RUT: {activeDoctor?.rut} | {activeDoctor?.specialty}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/50 dark:bg-slate-800/30 text-slate-400 font-mono border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Fecha</th>
                <th className="py-3 px-4">Paciente</th>
                <th className="py-3 px-4">Tratamiento</th>
                <th className="py-3 px-4 text-right">Arancel Bruto</th>
                <th className="py-3 px-4 text-right">Costo Lab</th>
                <th className="py-3 px-4 text-center">% Com.</th>
                <th className="py-3 px-4 text-right font-bold text-teal-600 dark:text-teal-400">Honorario Neto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {doctorProcedures.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    No se registran tratamientos completados para este profesional en el período seleccionado.
                  </td>
                </tr>
              ) : (
                doctorProcedures.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap">
                      {item.procedureDate}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">
                      {item.patientName}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      {item.procedureDescription}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-700 dark:text-slate-300">
                      ${item.grossAmount.toLocaleString("es-CL")}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-rose-500">
                      {item.labDeduction > 0 ? `-$${item.labDeduction.toLocaleString("es-CL")}` : "-"}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-slate-600 dark:text-slate-400">
                      {item.commissionRate}%
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-teal-600 dark:text-teal-400 whitespace-nowrap">
                      ${item.netDoctorPay.toLocaleString("es-CL")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nuevo Profesional */}
      <AnimatePresence>
        {showAddDoctorModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                  Registrar Profesional Odontológico
                </h3>
                <button onClick={() => setShowAddDoctorModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
              </div>

              <form onSubmit={handleSaveDoctor} className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nombre Completo</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Dra. Marcela Contreras"
                    value={newDocName}
                    onChange={(e) => setNewDocName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">RUT Profesional</label>
                    <input
                      type="text"
                      placeholder="15.829.102-4"
                      value={newDocRut}
                      onChange={(e) => setNewDocRut(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">% Comisión Arancel</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      required
                      value={newDocRate}
                      onChange={(e) => setNewDocRate(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Especialidad Clínica</label>
                  <select
                    value={newDocSpecialty}
                    onChange={(e) => setNewDocSpecialty(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="Periodoncia e Implantología">Periodoncia e Implantología</option>
                    <option value="Rehabilitación Oral y Estética">Rehabilitación Oral y Estética</option>
                    <option value="Endodoncia">Endodoncia</option>
                    <option value="Ortodoncia y Ortopedia DDF">Ortodoncia y Ortopedia DDF</option>
                    <option value="Odontopediatría">Odontopediatría</option>
                    <option value="Cirugía Maxilofacial">Cirugía Maxilofacial</option>
                    <option value="Odontología General">Odontología General</option>
                  </select>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddDoctorModal(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-xl"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-500 rounded-xl shadow-md cursor-pointer"
                  >
                    Guardar Profesional
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal / Vista de Impresión de Liquidación Oficial */}
      <AnimatePresence>
        {showPrintVoucherModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
            >
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                <span className="text-xs font-mono font-bold text-slate-500">PLANILLA OFICIAL DE LIQUIDACIÓN DE HONORARIOS</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Imprimir Comprobante
                  </button>
                  <button onClick={() => setShowPrintVoucherModal(false)} className="text-slate-400 hover:text-slate-600 p-1">✕</button>
                </div>
              </div>

              <div className="p-8 overflow-y-auto space-y-6 text-slate-800 dark:text-slate-200 text-xs font-sans">
                {/* Cabecera Clínica */}
                <div className="flex justify-between items-start border-b pb-4 border-slate-200 dark:border-slate-700">
                  <div>
                    <h1 className="text-xl font-display font-black text-slate-900 dark:text-white">PerioClinic Providencia</h1>
                    <p className="text-slate-500 font-mono text-[11px]">Av. Providencia 1208, Of. 402 - Santiago de Chile</p>
                    <p className="text-slate-500 font-mono text-[11px]">RUT Clínica: 76.892.401-K | Tel: +56 2 2891 0022</p>
                  </div>
                  <div className="text-right">
                    <span className="px-2.5 py-1 rounded bg-teal-500/10 text-teal-600 font-mono font-bold text-xs border border-teal-500/20">
                      LIQUIDACIÓN Nº LIQ-{Math.floor(1000 + Math.random() * 9000)}
                    </span>
                    <p className="text-slate-400 font-mono text-[10px] mt-2">Emisión: {new Date().toLocaleDateString("es-CL")}</p>
                  </div>
                </div>

                {/* Datos del Doctor */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl font-mono text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">PROFESIONAL BENEFICIARIO:</span>
                    <strong className="text-slate-900 dark:text-white text-sm">{activeDoctor?.name}</strong>
                    <div className="text-slate-500 text-[11px]">{activeDoctor?.specialty}</div>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">RUT / IDENTIFICACIÓN FISCAL:</span>
                    <strong className="text-slate-800 dark:text-slate-200">{activeDoctor?.rut}</strong>
                    <div className="text-slate-500 text-[11px]">Período de Pago: {selectedPeriod}</div>
                  </div>
                </div>

                {/* Tabla Resumen */}
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-400 font-mono text-[11px]">
                      <th className="py-2 text-left">Prestación Realizada</th>
                      <th className="py-2 text-right">Bruto</th>
                      <th className="py-2 text-right">Lab.</th>
                      <th className="py-2 text-center">%</th>
                      <th className="py-2 text-right">Honorario</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {doctorProcedures.map(p => (
                      <tr key={p.id}>
                        <td className="py-2 font-medium">{p.procedureDescription} <span className="text-slate-400">({p.patientName})</span></td>
                        <td className="py-2 text-right font-mono">${p.grossAmount.toLocaleString("es-CL")}</td>
                        <td className="py-2 text-right font-mono text-rose-500">{p.labDeduction > 0 ? `-$${p.labDeduction.toLocaleString("es-CL")}` : "-"}</td>
                        <td className="py-2 text-center font-mono">{p.commissionRate}%</td>
                        <td className="py-2 text-right font-mono font-bold text-teal-600">${p.netDoctorPay.toLocaleString("es-CL")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Totalizador Final */}
                <div className="border-t-2 border-slate-900 dark:border-white pt-4 flex justify-between items-center">
                  <div>
                    <div className="text-[11px] text-slate-500 font-mono">Forma de Pago: Transferencia Bancaria Directa</div>
                    <div className="text-[10px] text-slate-400 font-mono">Retención legal de honorarios conforme a normativa tributaria vigente.</div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-slate-400 block">TOTAL LÍQUIDO A PAGAR:</span>
                    <span className="text-2xl font-black font-mono text-teal-600 dark:text-teal-400">
                      ${stats.totalToPay.toLocaleString("es-CL")} CLP
                    </span>
                  </div>
                </div>

                {/* Firmas */}
                <div className="grid grid-cols-2 gap-12 pt-12 text-center text-[11px] font-mono text-slate-400">
                  <div className="border-t border-slate-300 dark:border-slate-700 pt-2">
                    Firma Administración / Clínica
                  </div>
                  <div className="border-t border-slate-300 dark:border-slate-700 pt-2">
                    Firma de Conformidad Odontólogo
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
