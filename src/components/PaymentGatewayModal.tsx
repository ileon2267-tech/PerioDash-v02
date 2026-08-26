import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  CreditCard, 
  ShieldCheck, 
  CheckCircle2, 
  Lock, 
  X, 
  DollarSign, 
  Smartphone, 
  Building2, 
  ArrowRight, 
  QrCode, 
  FileText, 
  AlertCircle,
  Copy,
  Receipt
} from "lucide-react";
import { PaymentTransaction, Patient } from "../types";

export interface PaymentGatewayModalProps {
  patient: Patient;
  initialAmount?: number;
  initialConcept?: string;
  onPaymentSuccess: (transaction: PaymentTransaction) => void;
  onClose: () => void;
}

export default function PaymentGatewayModal({
  patient,
  initialAmount = 50000,
  initialConcept = "Abono a Tratamiento Odontológico",
  onPaymentSuccess,
  onClose
}: PaymentGatewayModalProps) {
  const [step, setStep] = useState<"form" | "processing" | "success">("form");
  const [gateway, setGateway] = useState<"webpay" | "mercadopago" | "stripe" | "transferencia">("webpay");
  const [amount, setAmount] = useState<number>(initialAmount || 50000);
  const [concept, setConcept] = useState<string>(initialConcept);
  const [customReceipt, setCustomReceipt] = useState<string>(`REC-${Math.floor(100000 + Math.random() * 900000)}`);
  
  // Card Form State (Mock Card Simulation for testing/client)
  const [cardNumber, setCardNumber] = useState("4532 •••• •••• 8892");
  const [cardHolder, setCardHolder] = useState(patient.name.toUpperCase());
  const [cardExpiry, setCardExpiry] = useState("12/28");
  const [cardCvv, setCardCvv] = useState("•••");
  const [completedTx, setCompletedTx] = useState<PaymentTransaction | null>(null);
  const [copiedBank, setCopiedBank] = useState(false);

  const handleProcessPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) return;

    setStep("processing");

    // Realistic secure processing animation
    setTimeout(() => {
      const newTx: PaymentTransaction = {
        id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        patientId: patient.id,
        patientName: patient.name,
        date: new Date().toISOString().split("T")[0] + " " + new Date().toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" }),
        amount: Number(amount),
        method: gateway === "transferencia" ? "transferencia" : gateway === "mercadopago" ? "mercadopago" : gateway === "stripe" ? "stripe" : "webpay",
        status: "completed",
        concept: concept.trim() || "Abono / Pago de Tratamiento",
        receiptNumber: customReceipt,
        transactionRef: `REF-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
        paymentGateway: gateway.toUpperCase()
      };

      setCompletedTx(newTx);
      onPaymentSuccess(newTx);
      setStep("success");
    }, 1800);
  };

  const copyBankDetails = () => {
    const text = `Banco Santander\nTipo: Cuenta Corriente\nNº: 89012345-6\nTitular: Clínica Dental PerioDash Pro SpA\nRUT: 76.543.210-K\nEmail: pagos@periodash.cl\nMonto: $${amount.toLocaleString("es-CL")} CLP`;
    navigator.clipboard.writeText(text);
    setCopiedBank(true);
    setTimeout(() => setCopiedBank(false), 2000);
  };

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-[1000] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
    >
      <motion.div 
        initial={{ y: 20, scale: 0.95 }}
        animate={{ y: 0, scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border border-teal-500/40 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative text-white max-h-[92vh] flex flex-col my-auto"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black tracking-widest text-teal-400 uppercase">
                Pasarela de Pago Segura
              </span>
              <h2 className="text-base font-black text-white">
                {step === "success" ? "Comprobante de Pago Emitido" : "Recepción & Abono de Tratamiento"}
              </h2>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          
          {/* STEP 1: PAYMENT FORM */}
          {step === "form" && (
            <form onSubmit={handleProcessPayment} className="space-y-5">
              
              {/* Patient Info Chip */}
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Paciente Titular</span>
                  <strong className="text-teal-300 font-bold">{patient.name}</strong>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">RUT / ID</span>
                  <span className="font-mono text-slate-300">{patient.rut || patient.dni || "N/A"}</span>
                </div>
              </div>

              {/* Gateway Selector Tabs */}
              <div>
                <label className="text-[11px] font-bold text-slate-400 mb-2 block uppercase tracking-wider">
                  Selecciona Método de Pago
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: "webpay", label: "Webpay Plus", icon: CreditCard, tag: "Débito / Crédito" },
                    { id: "mercadopago", label: "Mercado Pago", icon: Smartphone, tag: "QR / Cuotas" },
                    { id: "stripe", label: "Stripe / Int.", icon: Lock, tag: "Visa / MC / ApplePay" },
                    { id: "transferencia", label: "Transferencia", icon: Building2, tag: "Banco Directo" }
                  ].map((item) => {
                    const isSel = gateway === item.id;
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setGateway(item.id as any)}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          isSel
                            ? "bg-teal-600/20 border-teal-500 text-white shadow-lg shadow-teal-500/10"
                            : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                        }`}
                      >
                        <Icon className={`w-4 h-4 mb-2 ${isSel ? "text-teal-400" : "text-slate-500"}`} />
                        <div>
                          <strong className="text-xs block font-bold leading-tight">{item.label}</strong>
                          <span className="text-[9px] text-slate-400">{item.tag}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Amount and Concept Inputs */}
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 mb-1 block">
                    Monto del Abono o Pago (CLP):
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-teal-400 font-bold">$</span>
                    <input
                      type="number"
                      min="100"
                      step="500"
                      value={amount}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-4 py-2.5 text-base font-black text-white font-mono outline-none focus:border-teal-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 mb-1 block">
                    Concepto o Tratamiento:
                  </label>
                  <input
                    type="text"
                    value={concept}
                    onChange={(e) => setConcept(e.target.value)}
                    placeholder="Ej. Abono Fase de Rehabilitación, Limpieza, etc."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:border-teal-500"
                    required
                  />
                </div>
              </div>

              {/* Gateway Specific Card Visualizer or Bank Info */}
              {gateway === "transferencia" ? (
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-300 flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-teal-400" />
                      Datos Bancarios para Transferencia:
                    </span>
                    <button
                      type="button"
                      onClick={copyBankDetails}
                      className="text-[10px] font-bold text-teal-400 hover:text-teal-300 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedBank ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedBank ? "¡Copiado!" : "Copiar Datos"}
                    </button>
                  </div>
                  <div className="space-y-1 text-slate-400 font-mono text-[11px] bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                    <div><strong>Banco:</strong> Banco Santander</div>
                    <div><strong>Cuenta Corriente:</strong> 89012345-6</div>
                    <div><strong>Titular:</strong> Clínica Dental PerioDash Pro SpA</div>
                    <div><strong>RUT:</strong> 76.543.210-K</div>
                    <div><strong>Email:</strong> pagos@periodash.cl</div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-gradient-to-br from-slate-950 to-slate-900 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      Cifrado SSL 256-bit
                    </span>
                    <span className="text-[10px] font-mono text-teal-400 font-bold uppercase">
                      {gateway} Gateway
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block mb-1">Nº Tarjeta / Terminal</span>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 font-mono text-xs text-slate-300 outline-none"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block mb-1">Titular</span>
                      <input
                        type="text"
                        value={cardHolder}
                        onChange={(e) => setCardHolder(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-black text-sm rounded-2xl shadow-xl shadow-teal-500/20 cursor-pointer transition-all flex items-center justify-center gap-2"
              >
                <span>Procesar Pago de ${amount.toLocaleString("es-CL")} CLP</span>
                <ArrowRight className="w-4 h-4" />
              </button>

            </form>
          )}

          {/* STEP 2: PROCESSING ANIMATION */}
          {step === "processing" && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-teal-500/20 border-t-teal-400 rounded-full animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center text-teal-400">
                  <ShieldCheck className="w-7 h-7" />
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">Conectando con Pasarela Bancaria...</h3>
                <p className="text-xs text-slate-400">
                  Validando transacción por ${amount.toLocaleString("es-CL")} CLP mediante {gateway.toUpperCase()}
                </p>
              </div>
            </div>
          )}

          {/* STEP 3: SUCCESS & RECEIPT */}
          {step === "success" && completedTx && (
            <div className="space-y-5">
              
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase text-emerald-400">¡Pago Aprobado con Éxito!</h4>
                  <p className="text-xs text-slate-300">
                    El abono se ha registrado en el plan financiero y en la ficha del paciente.
                  </p>
                </div>
              </div>

              {/* Printable Receipt Card */}
              <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Comprobante</span>
                  <span className="font-bold text-teal-300">{completedTx.receiptNumber}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Ref. Transacción</span>
                  <span className="text-slate-200">{completedTx.transactionRef}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Fecha y Hora</span>
                  <span className="text-slate-200">{completedTx.date}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Método / Pasarela</span>
                  <span className="text-teal-400 font-bold uppercase">{completedTx.paymentGateway}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Concepto</span>
                  <span className="text-slate-200 truncate max-w-[200px]">{completedTx.concept}</span>
                </div>
                <div className="flex items-center justify-between border-t border-slate-800 pt-2 text-sm">
                  <span className="text-slate-300 font-bold">Total Abonado</span>
                  <span className="text-emerald-400 font-black text-base">${completedTx.amount.toLocaleString("es-CL")} CLP</span>
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors border border-slate-700"
                >
                  <Receipt className="w-4 h-4 text-teal-400" />
                  Imprimir Recibo
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="py-3 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Finalizar
                </button>
              </div>

            </div>
          )}

        </div>

      </motion.div>
    </motion.div>
  );
}
