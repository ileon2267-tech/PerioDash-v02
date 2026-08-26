import React, { useState, useEffect } from "react";
import { Copy, Link as LinkIcon, X, CheckCircle2, Send, ExternalLink, Smartphone } from "lucide-react";
import { Patient } from "../types";
import { motion } from "motion/react";
import { recordHipaaAudit } from "../utils/hipaaAudit";

interface SharePatientModalProps {
  patient: Patient;
  onClose: () => void;
}

export default function SharePatientModal({ patient, onClose }: SharePatientModalProps) {
  const [copied, setCopied] = useState(false);
  
  // Real dynamic link pointing to the External Patient Portal
  const shareUrl = `${window.location.origin}/?portal_patient=${encodeURIComponent(patient.id)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);

    recordHipaaAudit("EXPORT_PATIENT_RECORD", `Generación y copiado de enlace seguro para Portal de Paciente de ${patient.name}.`, {
      patientId: patient.id,
      patientName: patient.name,
      resource: "Portal de Pacientes ePHI",
      severity: "warning"
    });
  };

  const handleWhatsApp = () => {
    const phoneClean = (patient.phone || "").replace(/[^0-9]/g, "");
    const msg = encodeURIComponent(
      `Hola ${patient.name.split(" ")[0]}, te compartimos el acceso a tu Portal Dental Seguro en PerioDash. Aquí puedes consultar tu plan de tratamiento, radiografías, presupuestos y agendar tus próximas horas: ${shareUrl}`
    );
    window.open(`https://wa.me/${phoneClean}?text=${msg}`, "_blank");

    recordHipaaAudit("COMMUNICATION_SENT", `Enlace de acceso a portal de paciente enviado vía WhatsApp a ${patient.name}.`, {
      patientId: patient.id,
      patientName: patient.name,
      resource: "Portal de Pacientes ePHI",
      severity: "warning"
    });
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
      className="fixed inset-0 z-[999] bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
    >
      <motion.div 
        initial={{ y: 20, scale: 0.95 }}
        animate={{ y: 0, scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 border-2 border-teal-500/40 dark:border-teal-400/50 shadow-2xl rounded-3xl w-full max-w-lg overflow-hidden relative max-h-[92vh] flex flex-col my-auto"
      >
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 z-10"
        >
          <X className="w-5 h-5"/>
        </button>

        <div className="overflow-y-auto flex-1 p-6 sm:p-8 space-y-6">
          <div>
            <div className="flex items-center gap-3 mb-4 pr-8">
              <div className="w-12 h-12 bg-teal-50 dark:bg-teal-900/30 rounded-2xl flex items-center justify-center border border-teal-100 dark:border-teal-500/20 text-teal-600 dark:text-teal-400 shadow-md shrink-0">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] bg-teal-500/15 border border-teal-500/30 text-teal-600 dark:text-teal-400 font-extrabold uppercase px-2.5 py-0.5 rounded-full tracking-widest">
                  Portal Seguro del Paciente
                </span>
                <h2 className="text-xl font-display font-black text-slate-800 dark:text-white mt-1">
                  {patient.name}
                </h2>
              </div>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Comparte este enlace cifrado con tu paciente para que consulte desde su teléfono o computador su presupuesto, radiografías, citas y recomendaciones médicas en tiempo real.
            </p>
          </div>

          <div className="space-y-5">
            {/* QR Code Graphic */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
              <div className="p-2 bg-white rounded-xl shadow-xs shrink-0 border border-slate-200">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(shareUrl)}`} 
                  alt="Código QR Portal Paciente" 
                  className="w-24 h-24"
                />
              </div>
              <div className="space-y-1 text-xs">
                <strong className="text-slate-800 dark:text-slate-200 block font-bold">Escaneo Rápido con Móvil</strong>
                <p className="text-slate-400 text-[11px] leading-snug">
                  El paciente puede escanear este código QR en consulta o abrir el link directo.
                </p>
              </div>
            </div>

            {/* Copyable Link */}
            <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <LinkIcon className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="text-xs font-mono text-slate-600 dark:text-slate-300 truncate select-all flex-1">
                {shareUrl}
              </span>
              <button 
                onClick={handleCopy}
                className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-teal-600 transition-all flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer"
              >
                {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-teal-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "¡Copiado!" : "Copiar"}
              </button>
            </div>

            {/* Quick Actions Bar */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={handleWhatsApp}
                className="py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                Enviar WhatsApp
              </button>

              <a
                href={shareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-3 bg-teal-600 hover:bg-teal-500 text-white font-black text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-center"
              >
                <ExternalLink className="w-4 h-4" />
                Ver Portal en Vivo
              </a>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
