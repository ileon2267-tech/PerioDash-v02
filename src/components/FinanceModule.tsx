import React, { useState, useEffect } from "react";
import { Patient, TreatmentProcedure, TreatmentPlan, PaymentTransaction } from "../types";
import { 
  Banknote, 
  CheckCircle, 
  Circle, 
  Calculator, 
  Percent, 
  CreditCard, 
  ChevronRight, 
  Plus, 
  Trash2, 
  Receipt, 
  ArrowDownRight, 
  ShieldCheck,
  DollarSign,
  Award,
  Boxes,
  Zap,
  ExternalLink
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { DENTITO_APP_URL } from "../services/dentitoFinanceSync";
import PaymentGatewayModal from "./PaymentGatewayModal";
import DailyCashRegister from "./DailyCashRegister";
import DoctorCommissions from "./DoctorCommissions";
import ClinicalSuppliesInventory from "./ClinicalSuppliesInventory";

interface FinanceModuleProps {
  activePatient: Patient | null;
  setPatients: React.Dispatch<React.SetStateAction<Patient[]>>;
  aranceles?: Record<string, number>;
  patients?: Patient[];
  doctorName?: string;
  onSelectPatient?: (patientId: string) => void;
}

type FinanceSubTab = "presupuesto" | "caja" | "liquidaciones" | "insumos";

export default function FinanceModule({ 
  activePatient, 
  setPatients, 
  aranceles,
  patients = [],
  doctorName = "Dr. Ignacio León",
  onSelectPatient
}: FinanceModuleProps) {
  const [activeSubTab, setActiveSubTab] = useState<FinanceSubTab>(() => {
    return activePatient ? "presupuesto" : "caja";
  });

  const plan: TreatmentPlan = activePatient?.treatmentPlan || { procedures: [], financing: { months: 12, downPayment: 0, interestRate: 15 } };
  
  const [newDesc, setNewDesc] = useState("");
  const [newCost, setNewCost] = useState("");
  const [newPhase, setNewPhase] = useState<"Diagnostico" | "Saneamiento" | "Rehabilitacion" | "Mantenimiento">("Diagnostico");
  
  // Simulator State
  const [months, setMonths] = useState(plan.financing?.months || 12);
  const [down, setDown] = useState(plan.financing?.downPayment || 0);
  const [rate, setRate] = useState(plan.financing?.interestRate || 15);
  const [contractSuccess, setContractSuccess] = useState(false);

  const totalCost = plan.procedures.reduce((acc, p) => acc + p.cost, 0);
  const completedCost = plan.procedures.filter(p => p.completed).reduce((acc, p) => acc + p.cost, 0);
  const principal = Math.max(0, totalCost - down); // Lo que se va a financiar
  
  // Formula francesa (anualidad)
  const monthlyRate = (rate / 100) / 12;
  const calculateInstallment = () => {
    if (principal <= 0) return 0;
    if (months <= 0) return 0;
    if (monthlyRate === 0) return principal / months;
    return (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months));
  };
  const installment = calculateInstallment();

  const handleUpdatePlan = (newPlan: TreatmentPlan) => {
    if (!activePatient) return;
    setPatients(prev => prev.map(p => p.id === activePatient.id ? { ...p, treatmentPlan: newPlan } : p));
  };

  const handleApproveContract = () => {
    if (!activePatient) return;
    const newEvolution = {
      id: `evo-fin-${Date.now()}`,
      date: new Date().toLocaleDateString("es-ES"),
      description: `💳 CONTRATO DE FINANCIAMIENTO PLANIFICADO:\n\n- Costo Total Tratamientos: $${Math.round(totalCost).toLocaleString("es-CL")} CLP\n- Abono Enganche: $${Math.round(down).toLocaleString("es-CL")} CLP\n- Capital Financiado: $${Math.round(principal).toLocaleString("es-CL")} CLP\n- Plazo: ${months} meses con Tasa de ${rate}% interés anual.\n- Cuota Mensual Estimada: $${Math.round(installment).toLocaleString("es-CL")} CLP.`,
      professional: "Administración / Finanzas",
    };

    const updatedEvolutions = [newEvolution, ...(activePatient.evolutions || [])];

    setPatients(prev => prev.map(p => p.id === activePatient.id ? {
      ...p,
      evolutions: updatedEvolutions,
      treatmentPlan: {
        ...plan,
        financing: { months, downPayment: down, interestRate: rate }
      }
    } : p));

    setContractSuccess(true);
    setTimeout(() => {
      setContractSuccess(false);
    }, 4000);
  };

  const handleAddProcedure = () => {
    if (!newDesc.trim() || !newCost || !activePatient) return;
    const costNum = parseFloat(newCost);
    if (isNaN(costNum)) return;

    const newProc: TreatmentProcedure = {
      id: `proc-${Date.now()}`,
      phase: newPhase,
      description: newDesc,
      cost: costNum,
      completed: false
    };

    handleUpdatePlan({
      ...plan,
      procedures: [...plan.procedures, newProc]
    });
    setNewDesc("");
    setNewCost("");
  };

  const toggleStatus = (procId: string) => {
    if (!activePatient) return;
    handleUpdatePlan({
      ...plan,
      procedures: plan.procedures.map(p => p.id === procId ? { ...p, completed: !p.completed } : p)
    });
  };

  const deleteProcedure = (procId: string) => {
    if (!activePatient) return;
    handleUpdatePlan({
      ...plan,
      procedures: plan.procedures.filter(p => p.id !== procId)
    });
  };

  // Sync parameters when patient changes to avoid cross-patient overwriting
  useEffect(() => {
    if (activePatient) {
      const f = activePatient.treatmentPlan?.financing;
      setMonths(f?.months ?? 12);
      setDown(f?.downPayment ?? 0);
      setRate(f?.interestRate ?? 15);
    }
  }, [activePatient?.id]);

  useEffect(() => {
    if (activePatient) {
      const currentFin = activePatient.treatmentPlan?.financing;
      const currentMonths = currentFin?.months ?? 12;
      const currentDown = currentFin?.downPayment ?? 0;
      const currentRate = currentFin?.interestRate ?? 15;

      if (months !== currentMonths || down !== currentDown || rate !== currentRate) {
        handleUpdatePlan({
          ...plan,
          financing: { months, downPayment: down, interestRate: rate }
        });
      }
    }
  }, [months, down, rate]);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPayAmount, setSelectedPayAmount] = useState<number>(50000);
  const [selectedPayConcept, setSelectedPayConcept] = useState<string>("Abono Tratamiento Odontológico");

  const patientPayments: PaymentTransaction[] = activePatient?.payments || [];
  const totalPaid = patientPayments.reduce((acc, tx) => acc + (tx.status === "completed" ? tx.amount : 0), 0);
  const realBalance = Math.max(0, totalCost - totalPaid);

  const handlePaymentSuccess = (tx: PaymentTransaction) => {
    if (!activePatient) return;
    const updatedPayments = [tx, ...patientPayments];
    
    // Also record in medical evolutions as official payment receipt
    const paymentEvolution = {
      id: `evo-pay-${Date.now()}`,
      date: new Date().toLocaleDateString("es-ES"),
      description: `💵 REGISTRO DE PAGO / ABONO:\n- Comprobante: ${tx.receiptNumber}\n- Monto: $${tx.amount.toLocaleString("es-CL")} CLP\n- Medio: ${tx.method.toUpperCase()} (${tx.paymentGateway || "Online"})\n- Concepto: ${tx.concept}\n- Ref: ${tx.transactionRef || "N/A"}`,
      professional: "Administración / Finanzas"
    };

    setPatients(prev => prev.map(p => p.id === activePatient.id ? {
      ...p,
      payments: updatedPayments,
      evolutions: [paymentEvolution, ...(p.evolutions || [])]
    } : p));
  };

  const handleAddPaymentFromCashRegister = (patientId: string, tx: PaymentTransaction) => {
    setPatients(prev => prev.map(p => {
      if (p.id === patientId) {
        const pPayments = p.payments || [];
        const paymentEvolution = {
          id: `evo-pay-${Date.now()}`,
          date: new Date().toLocaleDateString("es-ES"),
          description: `💵 COBRO EN CAJA / POS:\n- Comprobante: ${tx.receiptNumber}\n- Monto: $${tx.amount.toLocaleString("es-CL")} CLP\n- Medio: ${tx.method.toUpperCase()}\n- Concepto: ${tx.concept}`,
          professional: "Caja Central"
        };
        return {
          ...p,
          payments: [tx, ...pPayments],
          evolutions: [paymentEvolution, ...(p.evolutions || [])]
        };
      }
      return p;
    }));
  };

  const patientsList = patients.length > 0 ? patients : (activePatient ? [activePatient] : []);

  return (
    <div className="space-y-6">
      {/* Sub-Tabs Nav */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-2 flex items-center gap-2 overflow-x-auto shadow-xs">
        <button
          type="button"
          onClick={() => setActiveSubTab("presupuesto")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeSubTab === "presupuesto"
              ? "bg-teal-600 text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Banknote className="w-4 h-4" />
          Plan & Presupuesto Paciente
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("caja")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeSubTab === "caja"
              ? "bg-teal-600 text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <DollarSign className="w-4 h-4" />
          Caja Diaria & Cuadratura POS
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("liquidaciones")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeSubTab === "liquidaciones"
              ? "bg-teal-600 text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Award className="w-4 h-4" />
          Liquidación de Honorarios Médicos
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("insumos")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeSubTab === "insumos"
              ? "bg-teal-600 text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Boxes className="w-4 h-4" />
          Insumos & Stock Clínico
        </button>

        {/* Direct Shortcut to Dentito Finance */}
        <a
          href={DENTITO_APP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap bg-gradient-to-r from-amber-500/10 to-teal-500/10 hover:from-amber-500/20 hover:to-teal-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 shadow-xs group cursor-pointer"
          title="Abrir Dentito Finance en una nueva pestaña"
        >
          <Zap className="w-3.5 h-3.5 text-amber-500 group-hover:scale-110 transition-transform" />
          <span>Dentito Finance</span>
          <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-amber-500" />
        </a>
      </div>

      {/* Sub-Tab: Caja Diaria */}
      {activeSubTab === "caja" && (
        <DailyCashRegister 
          patients={patientsList} 
          onAddPaymentToPatient={handleAddPaymentFromCashRegister}
          currentUser={doctorName}
        />
      )}

      {/* Sub-Tab: Liquidación de Médicos */}
      {activeSubTab === "liquidaciones" && (
        <DoctorCommissions patients={patientsList} />
      )}

      {/* Sub-Tab: Insumos y Stock */}
      {activeSubTab === "insumos" && (
        <ClinicalSuppliesInventory />
      )}

      {/* Sub-Tab: Presupuesto del Paciente */}
      {activeSubTab === "presupuesto" && (
        <>
          {!activePatient ? (
            <div className="flex flex-col items-center justify-center p-12 text-slate-500 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
              <Banknote className="w-12 h-12 mb-4 text-slate-300 dark:text-slate-700" />
              <h3 className="text-xl font-bold font-display text-slate-800 dark:text-slate-200">Sin Paciente Seleccionado</h3>
              <p className="text-sm mt-1 mb-4">Seleccione un paciente para ver su plan de tratamiento y emitir presupuestos o cuotas.</p>
              {patients.length > 0 && onSelectPatient && (
                <div className="flex flex-wrap gap-2 justify-center max-w-md">
                  {patients.slice(0, 4).map(p => (
                    <button
                      key={p.id}
                      onClick={() => onSelectPatient(p.id)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950/40 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-teal-600 transition-all cursor-pointer"
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Header with Payment Trigger */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xs">
                <div>
                  <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-white flex items-center gap-3">
                     <Banknote className="w-7 h-7 text-teal-600 dark:text-teal-400" /> Plan Financiero & Pagos
                  </h2>
                  <p className="text-sm text-slate-500 font-mono mt-1 flex items-center gap-2 flex-wrap">
                    <span>Paciente: <span className="font-bold text-slate-800 dark:text-slate-200">{activePatient.name}</span></span>
                    {activePatient.rut && (
                      <span className="px-2 py-0.5 rounded bg-teal-500/10 text-teal-700 dark:text-teal-300 font-mono text-xs font-bold border border-teal-500/20">
                        RUT: {activePatient.rut}
                      </span>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPayAmount(realBalance > 0 ? realBalance : 50000);
                      setSelectedPayConcept(`Abono a Tratamiento - ${activePatient.name}`);
                      setIsPaymentModalOpen(true);
                    }}
                    className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-black text-xs rounded-xl shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <CreditCard className="w-4 h-4" />
                    Recibir Abono / Pasarela de Pago
                  </button>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 shadow-xs">
                  <span className="text-xs font-mono font-bold text-slate-400">COSTO TOTAL</span>
                  <div className="text-2xl font-bold font-display text-slate-900 dark:text-white mt-2">
                    ${Math.round(totalCost).toLocaleString("es-CL")} CLP
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">{plan.procedures.length} procedimientos</span>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 shadow-xs">
                  <span className="text-xs font-mono font-bold text-slate-400">ABONADO / PAGADO</span>
                  <div className="text-2xl font-bold font-display text-emerald-600 dark:text-emerald-400 mt-2">
                    ${Math.round(totalPaid).toLocaleString("es-CL")} CLP
                  </div>
                  <span className="text-[11px] text-emerald-600 font-mono">{patientPayments.filter(p => p.status === 'completed').length} pagos registrados</span>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 shadow-xs">
                  <span className="text-xs font-mono font-bold text-slate-400">SALDO PENDIENTE</span>
                  <div className="text-2xl font-bold font-display text-rose-600 dark:text-rose-400 mt-2">
                    ${Math.round(realBalance).toLocaleString("es-CL")} CLP
                  </div>
                  <span className="text-[11px] text-rose-500 font-mono">Por saldar</span>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 shadow-xs">
                  <span className="text-xs font-mono font-bold text-slate-400">CUOTA MENSUAL (SIM.)</span>
                  <div className="text-2xl font-bold font-display text-teal-600 dark:text-teal-400 mt-2">
                    ${Math.round(installment).toLocaleString("es-CL")} CLP
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">En {months} cuotas al {rate}%</span>
                </div>
              </div>

              {/* Procedures and Simulator */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Procedures List */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 shadow-xs">
                  <h3 className="text-lg font-display font-bold text-slate-900 dark:text-white mb-4">
                    Procedimientos Planificados
                  </h3>
                  
                  {/* Add procedure bar */}
                  <div className="flex flex-col sm:flex-row gap-2 mb-6">
                    <select
                      value={newPhase}
                      onChange={(e) => setNewPhase(e.target.value as any)}
                      className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
                    >
                      <option value="Diagnostico">Diagnóstico</option>
                      <option value="Saneamiento">Saneamiento</option>
                      <option value="Rehabilitacion">Rehabilitación</option>
                      <option value="Mantenimiento">Mantenimiento</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Descripción de la prestación..."
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                      className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                    />
                    <input
                      type="number"
                      placeholder="Costo (CLP)"
                      value={newCost}
                      onChange={(e) => setNewCost(e.target.value)}
                      className="w-28 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleAddProcedure}
                      className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" /> Añadir
                    </button>
                  </div>

                  {/* Procedures table */}
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {plan.procedures.length === 0 ? (
                      <div className="text-center py-8 text-slate-400 text-xs">
                        No hay procedimientos registrados en el plan.
                      </div>
                    ) : (
                      plan.procedures.map((proc) => (
                        <div key={proc.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => toggleStatus(proc.id)}
                              className={`p-1 rounded-lg transition-colors cursor-pointer ${
                                proc.completed ? "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30" : "text-slate-300 hover:text-slate-500"
                              }`}
                            >
                              {proc.completed ? <CheckCircle className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                            </button>
                            <div>
                              <span className="font-bold text-slate-800 dark:text-slate-200">{proc.description}</span>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                  {proc.phase}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-bold text-slate-900 dark:text-white">
                              ${proc.cost.toLocaleString("es-CL")} CLP
                            </span>
                            <button
                              type="button"
                              onClick={() => deleteProcedure(proc.id)}
                              className="text-slate-300 hover:text-rose-500 p-1 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Simulator Card */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 shadow-xs flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-display font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                      <Calculator className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                      Simulador de Cuotas
                    </h3>
                    <p className="text-xs text-slate-500 font-mono mb-4">
                      Amortización francesa para tratamientos rehabilitadores o periodontales complejos.
                    </p>

                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex justify-between">
                          <span>Plazo de Pago</span>
                          <span className="font-mono text-teal-600">{months} Meses</span>
                        </label>
                        <input
                          type="range"
                          min="3"
                          max="36"
                          step="1"
                          value={months}
                          onChange={(e) => setMonths(Number(e.target.value))}
                          className="w-full accent-teal-600 mt-1 cursor-pointer"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex justify-between">
                          <span>Pie / Enganche (Abono)</span>
                          <span className="font-mono text-teal-600">${down.toLocaleString("es-CL")} CLP</span>
                        </label>
                        <input
                          type="range"
                          min="0"
                          max={totalCost}
                          step="10000"
                          value={down}
                          onChange={(e) => setDown(Number(e.target.value))}
                          className="w-full accent-teal-600 mt-1 cursor-pointer"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex justify-between">
                          <span>Tasa Anual de Interés</span>
                          <span className="font-mono text-teal-600">{rate}% EA</span>
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="30"
                          step="0.5"
                          value={rate}
                          onChange={(e) => setRate(Number(e.target.value))}
                          className="w-full accent-teal-600 mt-1 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-100 dark:border-slate-800 mt-6">
                    <div className="text-center mb-4">
                      <span className="text-[11px] text-slate-400 font-mono block">VALOR ESTIMADO DE CUOTA</span>
                      <span className="text-2xl font-black font-display text-teal-600 dark:text-teal-400">
                        ${Math.round(installment).toLocaleString("es-CL")} CLP
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono block">/ mes por {months} meses</span>
                    </div>

                    <button
                      type="button"
                      onClick={handleApproveContract}
                      className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      Guardar Acuerdo Financiero
                    </button>

                    {contractSuccess && (
                      <p className="text-[11px] text-emerald-600 font-bold text-center mt-2 font-mono">
                        ✓ Contrato guardado en la evolución clínica del paciente.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Historic Receipts / Payments Table */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 shadow-xs">
                <h3 className="text-lg font-display font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                  Historial de Abonos y Comprobantes
                </h3>

                {patientPayments.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    No se han registrado abonos o comprobantes para este paciente.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase text-[10px] font-bold">
                          <th className="pb-3">Comprobante</th>
                          <th className="pb-3">Fecha</th>
                          <th className="pb-3">Concepto</th>
                          <th className="pb-3">Método / Pasarela</th>
                          <th className="pb-3 text-right">Monto</th>
                          <th className="pb-3 text-right">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                        {patientPayments.map((tx) => (
                          <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-950/40">
                            <td className="py-3 font-mono font-bold text-teal-600 dark:text-teal-400">
                              {tx.receiptNumber || tx.id.substring(0, 10)}
                            </td>
                            <td className="py-3 text-slate-500 dark:text-slate-400 font-mono">{tx.date}</td>
                            <td className="py-3 font-medium text-slate-800 dark:text-slate-200">{tx.concept}</td>
                            <td className="py-3">
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-bold uppercase text-slate-700 dark:text-slate-300">
                                {tx.method} {tx.paymentGateway ? `• ${tx.paymentGateway}` : ""}
                              </span>
                            </td>
                            <td className="py-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                              ${tx.amount.toLocaleString("es-CL")} CLP
                            </td>
                            <td className="py-3 text-right">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                Completado
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Payment Gateway Modal */}
      <AnimatePresence>
        {isPaymentModalOpen && activePatient && (
          <PaymentGatewayModal
            patient={activePatient}
            initialAmount={selectedPayAmount}
            initialConcept={selectedPayConcept}
            onPaymentSuccess={handlePaymentSuccess}
            onClose={() => setIsPaymentModalOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
