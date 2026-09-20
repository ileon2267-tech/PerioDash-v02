import React, { useState, useMemo } from "react";
import { Patient, PaymentTransaction } from "../types";
import { safeStorage } from "../utils/safeStorage";
import { 
  DollarSign, 
  CreditCard, 
  ArrowUpRight, 
  ArrowDownRight, 
  Receipt, 
  Lock, 
  Unlock, 
  Printer, 
  Plus, 
  Filter, 
  Search, 
  CheckCircle2, 
  AlertTriangle,
  FileSpreadsheet,
  Calendar,
  User,
  Building2,
  Clock
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export interface CashMovement {
  id: string;
  timestamp: string;
  type: "ingreso" | "egreso";
  category: "abono_tratamiento" | "consulta" | "urgencia" | "laboratorio" | "insumos" | "gastos_menores";
  amount: number;
  method: "efectivo" | "tarjeta_pos" | "transferencia" | "webpay";
  patientName?: string;
  patientRut?: string;
  patientId?: string;
  concept: string;
  receiptNumber?: string;
  cashierName: string;
}

export interface ShiftClosure {
  id: string;
  openedAt: string;
  closedAt: string;
  cashierName: string;
  initialCash: number;
  totalCashIncome: number;
  totalCardIncome: number;
  totalTransferIncome: number;
  totalWebpayIncome: number;
  totalExpenses: number;
  expectedCashInBox: number;
  actualCashCounted: number;
  discrepancy: number; // actual - expected
  notes?: string;
}

interface DailyCashRegisterProps {
  patients: Patient[];
  onAddPaymentToPatient?: (patientId: string, tx: PaymentTransaction) => void;
  currentUser?: string;
}

const INITIAL_MOVEMENTS: CashMovement[] = [
  {
    id: "mov-001",
    timestamp: new Date(Date.now() - 1000 * 60 * 180).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" }),
    type: "ingreso",
    category: "abono_tratamiento",
    amount: 120000,
    method: "tarjeta_pos",
    patientName: "Valentina Gómez",
    patientRut: "18.452.129-3",
    concept: "Abono Fase Higiénica Periodontal",
    receiptNumber: "BOL-4092",
    cashierName: "Recepción Box 1"
  },
  {
    id: "mov-002",
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" }),
    type: "ingreso",
    category: "consulta",
    amount: 35000,
    method: "efectivo",
    patientName: "Carlos Méndez",
    patientRut: "12.839.201-K",
    concept: "Control Periodontal y Sondaje",
    receiptNumber: "BOL-4093",
    cashierName: "Recepción Box 1"
  },
  {
    id: "mov-003",
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" }),
    type: "egreso",
    category: "laboratorio",
    amount: 28000,
    method: "efectivo",
    concept: "Envío Urgente Laboratorio Prótesis Cad/Cam",
    receiptNumber: "GTO-102",
    cashierName: "Recepción Box 1"
  }
];

export default function DailyCashRegister({ patients, onAddPaymentToPatient, currentUser = "Dr. Ignacio León" }: DailyCashRegisterProps) {
  const [isShiftOpen, setIsShiftOpen] = useState<boolean>(() => {
    return safeStorage.getItem("perio_cash_shift_open") !== "false";
  });
  
  const [initialCash, setInitialCash] = useState<number>(() => {
    const saved = safeStorage.getItem("perio_cash_initial");
    return saved ? Number(saved) : 50000;
  });

  const [movements, setMovements] = useState<CashMovement[]>(() => {
    const saved = safeStorage.getItem("perio_cash_movements");
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return INITIAL_MOVEMENTS;
  });

  const [closures, setClosures] = useState<ShiftClosure[]>(() => {
    const saved = safeStorage.getItem("perio_cash_closures");
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return [];
  });

  // Modal states
  const [showAddMovementModal, setShowAddMovementModal] = useState(false);
  const [showCloseShiftModal, setShowCloseShiftModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [methodFilter, setMethodFilter] = useState<string>("all");

  // Form State
  const [movType, setMovType] = useState<"ingreso" | "egreso">("ingreso");
  const [movCategory, setMovCategory] = useState<CashMovement["category"]>("abono_tratamiento");
  const [movAmount, setMovAmount] = useState("");
  const [movMethod, setMovMethod] = useState<CashMovement["method"]>("tarjeta_pos");
  const [movConcept, setMovConcept] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState("");

  // Cash Count for closing
  const [countedCash, setCountedCash] = useState("");
  const [closureNotes, setClosureNotes] = useState("");

  // Totals calculations
  const totals = useMemo(() => {
    let cashIncome = 0;
    let cardIncome = 0;
    let transferIncome = 0;
    let webpayIncome = 0;
    let totalExpenses = 0;

    movements.forEach((m) => {
      if (m.type === "ingreso") {
        if (m.method === "efectivo") cashIncome += m.amount;
        if (m.method === "tarjeta_pos") cardIncome += m.amount;
        if (m.method === "transferencia") transferIncome += m.amount;
        if (m.method === "webpay") webpayIncome += m.amount;
      } else {
        totalExpenses += m.amount;
      }
    });

    const totalIncome = cashIncome + cardIncome + transferIncome + webpayIncome;
    const expectedCashInBox = initialCash + cashIncome - totalExpenses;

    return {
      cashIncome,
      cardIncome,
      transferIncome,
      webpayIncome,
      totalIncome,
      totalExpenses,
      expectedCashInBox,
      netBalance: totalIncome - totalExpenses
    };
  }, [movements, initialCash]);

  const handleSaveMovement = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(movAmount);
    if (isNaN(amountNum) || amountNum <= 0 || !movConcept.trim()) return;

    const patient = patients.find(p => p.id === selectedPatientId);

    const newMov: CashMovement = {
      id: `mov-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" }),
      type: movType,
      category: movCategory,
      amount: amountNum,
      method: movMethod,
      patientName: patient?.name,
      patientRut: patient?.rut,
      patientId: patient?.id,
      concept: movConcept,
      receiptNumber: movType === "ingreso" ? `BOL-${Math.floor(1000 + Math.random() * 9000)}` : `GTO-${Math.floor(100 + Math.random() * 900)}`,
      cashierName: currentUser
    };

    const updated = [newMov, ...movements];
    setMovements(updated);
    safeStorage.setItem("perio_cash_movements", JSON.stringify(updated));

    // If linked to a patient and is income, also reflect on patient's transaction list
    if (patient && movType === "ingreso" && onAddPaymentToPatient) {
      onAddPaymentToPatient(patient.id, {
        id: `tx-${Date.now()}`,
        patientId: patient.id,
        patientName: patient.name,
        date: new Date().toISOString().split("T")[0],
        amount: amountNum,
        method: movMethod,
        status: "completed",
        concept: movConcept,
        receiptNumber: newMov.receiptNumber,
        paymentGateway: movMethod === "tarjeta_pos" ? "Klap/Transbank POS" : "Caja Central"
      });
    }

    setShowAddMovementModal(false);
    setMovAmount("");
    setMovConcept("");
    setSelectedPatientId("");
  };

  const handleExecuteCloseShift = () => {
    const counted = parseFloat(countedCash) || 0;
    const discrepancy = counted - totals.expectedCashInBox;

    const closure: ShiftClosure = {
      id: `cls-${Date.now()}`,
      openedAt: new Date().toLocaleDateString("es-CL") + " 08:30",
      closedAt: new Date().toLocaleDateString("es-CL") + " " + new Date().toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" }),
      cashierName: currentUser,
      initialCash,
      totalCashIncome: totals.cashIncome,
      totalCardIncome: totals.cardIncome,
      totalTransferIncome: totals.transferIncome,
      totalWebpayIncome: totals.webpayIncome,
      totalExpenses: totals.totalExpenses,
      expectedCashInBox: totals.expectedCashInBox,
      actualCashCounted: counted,
      discrepancy,
      notes: closureNotes
    };

    const updatedClosures = [closure, ...closures];
    setClosures(updatedClosures);
    safeStorage.setItem("perio_cash_closures", JSON.stringify(updatedClosures));

    // Reset movements for next shift
    setMovements([]);
    safeStorage.removeItem("perio_cash_movements");
    setIsShiftOpen(false);
    safeStorage.setItem("perio_cash_shift_open", "false");
    setShowCloseShiftModal(false);
  };

  const handleOpenNewShift = () => {
    setIsShiftOpen(true);
    safeStorage.setItem("perio_cash_shift_open", "true");
  };

  const filteredMovements = movements.filter((m) => {
    const matchesSearch = 
      m.concept.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.patientName && m.patientName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (m.receiptNumber && m.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesMethod = methodFilter === "all" || m.method === methodFilter;
    return matchesSearch && matchesMethod;
  });

  return (
    <div className="space-y-6">
      {/* Header & Status Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-display font-bold text-slate-900 dark:text-white">
                  Caja Diaria & Cuadratura POS
                </h2>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                  isShiftOpen 
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" 
                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                }`}>
                  {isShiftOpen ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                  {isShiftOpen ? "Turno Activo" : "Caja Cerrada"}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Flujo de pagos en sillón, terminales Transbank/Klap y gastos menores de box.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {isShiftOpen ? (
            <>
              <button
                type="button"
                onClick={() => setShowAddMovementModal(true)}
                className="flex-1 md:flex-none px-4 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-xs rounded-xl shadow-md shadow-teal-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Plus className="w-4 h-4" />
                Registrar Movimiento
              </button>
              <button
                type="button"
                onClick={() => {
                  setCountedCash(String(totals.expectedCashInBox));
                  setShowCloseShiftModal(true);
                }}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all border border-slate-200 dark:border-slate-700"
              >
                <Lock className="w-4 h-4" />
                Cerrar Turno & Arqueo
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleOpenNewShift}
              className="w-full md:w-auto px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <Unlock className="w-4 h-4" />
              Abrir Nuevo Turno de Caja
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 shadow-xs">
          <div className="flex justify-between items-start">
            <span className="text-xs font-mono font-bold text-slate-400">TOTAL INGRESOS HOY</span>
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
              <ArrowUpRight className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold font-display text-emerald-600 dark:text-emerald-400 mt-2">
            ${totals.totalIncome.toLocaleString("es-CL")}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono">
            Efectivo + POS + Transferencias
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 shadow-xs">
          <div className="flex justify-between items-start">
            <span className="text-xs font-mono font-bold text-slate-400">TARJETA & POS</span>
            <span className="p-1.5 rounded-lg bg-teal-500/10 text-teal-500">
              <CreditCard className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold font-display text-teal-600 dark:text-teal-400 mt-2">
            ${totals.cardIncome.toLocaleString("es-CL")}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono">
            Vía Klap / Transbank / Débito
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 shadow-xs">
          <div className="flex justify-between items-start">
            <span className="text-xs font-mono font-bold text-slate-400">EFECTIVO EN CAJÓN</span>
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
              <Receipt className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold font-display text-slate-800 dark:text-slate-100 mt-2">
            ${totals.expectedCashInBox.toLocaleString("es-CL")}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono">
            Fondo inicial (${initialCash.toLocaleString("es-CL")}) + Efectivo
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 shadow-xs">
          <div className="flex justify-between items-start">
            <span className="text-xs font-mono font-bold text-slate-400">EGRESOS & CAJA CHICA</span>
            <span className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500">
              <ArrowDownRight className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold font-display text-rose-600 dark:text-rose-400 mt-2">
            ${totals.totalExpenses.toLocaleString("es-CL")}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono">
            Insumos urgentes y laboratorio
          </div>
        </div>
      </div>

      {/* Movements Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por paciente, concepto o boleta..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="all">Todos los Medios</option>
              <option value="efectivo">Solo Efectivo</option>
              <option value="tarjeta_pos">Tarjeta / POS</option>
              <option value="transferencia">Transferencia</option>
              <option value="webpay">WebPay</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-mono border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Hora</th>
                <th className="py-3 px-4">Tipo / Boleta</th>
                <th className="py-3 px-4">Concepto / Paciente</th>
                <th className="py-3 px-4">Medio de Pago</th>
                <th className="py-3 px-4 text-right">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No hay movimientos registrados en este turno de caja.
                  </td>
                </tr>
              ) : (
                filteredMovements.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap">
                      {m.timestamp}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${m.type === "ingreso" ? "bg-emerald-500" : "bg-rose-500"}`} />
                        <span className="font-bold font-mono text-slate-700 dark:text-slate-200">{m.receiptNumber || "N/A"}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800 dark:text-slate-100">{m.concept}</div>
                      {m.patientName && (
                        <div className="text-[11px] text-slate-400 font-mono">
                          {m.patientName} {m.patientRut ? `(${m.patientRut})` : ""}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {m.method === "tarjeta_pos" ? "💳 POS / Tarjeta" : m.method === "efectivo" ? "💵 Efectivo" : m.method === "transferencia" ? "🏦 Transferencia" : "🌐 WebPay"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold whitespace-nowrap">
                      <span className={m.type === "ingreso" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}>
                        {m.type === "ingreso" ? "+" : "-"}${m.amount.toLocaleString("es-CL")}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Historial de Cierres de Turno Previos */}
      {closures.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 shadow-xs">
          <h3 className="text-sm font-bold font-display text-slate-900 dark:text-white flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            Historial de Arqueos de Caja Recientes
          </h3>
          <div className="space-y-2">
            {closures.slice(0, 3).map((cls) => (
              <div key={cls.id} className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs">
                <div>
                  <div className="font-bold text-slate-800 dark:text-slate-200">
                    Cierre {cls.closedAt} - Cajero: {cls.cashierName}
                  </div>
                  <div className="text-slate-400 font-mono text-[11px] mt-0.5">
                    Total Ingresos: ${(cls.totalCashIncome + cls.totalCardIncome + cls.totalTransferIncome).toLocaleString("es-CL")} | Egresos: ${cls.totalExpenses.toLocaleString("es-CL")}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-slate-700 dark:text-slate-300">
                    Efectivo Contado: ${cls.actualCashCounted.toLocaleString("es-CL")}
                  </div>
                  <div className={`font-mono text-[11px] font-bold ${cls.discrepancy === 0 ? "text-emerald-500" : cls.discrepancy > 0 ? "text-teal-500" : "text-rose-500"}`}>
                    {cls.discrepancy === 0 ? "Cuadratura Exacta (Sin descuadre)" : cls.discrepancy > 0 ? `Sobrante: +$${cls.discrepancy.toLocaleString("es-CL")}` : `Faltante: -$${Math.abs(cls.discrepancy).toLocaleString("es-CL")}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Registrar Movimiento */}
      <AnimatePresence>
        {showAddMovementModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                  Nuevo Movimiento de Caja
                </h3>
                <button 
                  onClick={() => setShowAddMovementModal(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveMovement} className="p-5 space-y-4">
                {/* Tipo Selector */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMovType("ingreso")}
                    className={`py-2 rounded-xl text-xs font-bold transition-all ${
                      movType === "ingreso"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    + Ingreso (Cobro)
                  </button>
                  <button
                    type="button"
                    onClick={() => setMovType("egreso")}
                    className={`py-2 rounded-xl text-xs font-bold transition-all ${
                      movType === "egreso"
                        ? "bg-rose-600 text-white shadow-xs"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    - Egreso (Gasto)
                  </button>
                </div>

                {/* Monto & Medio */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Monto (CLP)</label>
                    <input
                      type="number"
                      placeholder="50000"
                      required
                      value={movAmount}
                      onChange={(e) => setMovAmount(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Medio de Pago</label>
                    <select
                      value={movMethod}
                      onChange={(e) => setMovMethod(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="tarjeta_pos">💳 POS / Tarjeta</option>
                      <option value="efectivo">💵 Efectivo</option>
                      <option value="transferencia">🏦 Transferencia</option>
                      <option value="webpay">🌐 WebPay</option>
                    </select>
                  </div>
                </div>

                {/* Paciente (Opcional) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Paciente Asociado (Opcional)</label>
                  <select
                    value={selectedPatientId}
                    onChange={(e) => {
                      setSelectedPatientId(e.target.value);
                      const pat = patients.find(p => p.id === e.target.value);
                      if (pat && !movConcept) {
                        setMovConcept(`Abono tratamiento ${pat.name}`);
                      }
                    }}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="">-- Sin paciente / Varios --</option>
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>{p.name} {p.rut ? `(${p.rut})` : ""}</option>
                    ))}
                  </select>
                </div>

                {/* Concepto */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Concepto / Descripción</label>
                  <input
                    type="text"
                    placeholder="Ej. Control de ortodoncia, raspado radicular, caja chica..."
                    required
                    value={movConcept}
                    onChange={(e) => setMovConcept(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddMovementModal(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-500 rounded-xl shadow-md cursor-pointer"
                  >
                    Guardar Movimiento
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Cerrar Turno & Cuadratura */}
      <AnimatePresence>
        {showCloseShiftModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg overflow-hidden"
            >
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Lock className="w-5 h-5 text-amber-500" />
                  Arqueo de Turno y Cierre de Caja
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Verifique los montos recaudados e ingrese el conteo físico de billetes y monedas.
                </p>
              </div>

              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-xs font-mono">
                  <div>
                    <span className="text-slate-400 block">Fondo Inicial:</span>
                    <span className="font-bold text-slate-700 dark:text-slate-200">${initialCash.toLocaleString("es-CL")}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Efectivo Cobrado:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">+${totals.cashIncome.toLocaleString("es-CL")}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Gastos / Egresos:</span>
                    <span className="font-bold text-rose-600 dark:text-rose-400">-${totals.totalExpenses.toLocaleString("es-CL")}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-bold text-teal-600 dark:text-teal-400">Efectivo Teórico:</span>
                    <span className="font-black text-slate-900 dark:text-white">${totals.expectedCashInBox.toLocaleString("es-CL")}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Conteo Real de Efectivo en Caja (CLP)
                  </label>
                  <input
                    type="number"
                    value={countedCash}
                    onChange={(e) => setCountedCash(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono font-bold"
                  />
                  {parseFloat(countedCash) !== totals.expectedCashInBox && (
                    <div className="mt-1 text-[11px] font-bold text-amber-600 flex items-center gap-1 font-mono">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Diferencia de arqueo: ${(parseFloat(countedCash) - totals.expectedCashInBox).toLocaleString("es-CL")} CLP
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Observaciones o Notas de Cierre
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Ej. Cuadratura conforme, comprobantes POS archivados..."
                    value={closureNotes}
                    onChange={(e) => setClosureNotes(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCloseShiftModal(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                  >
                    Volver
                  </button>
                  <button
                    type="button"
                    onClick={handleExecuteCloseShift}
                    className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Confirmar Cierre de Turno
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
