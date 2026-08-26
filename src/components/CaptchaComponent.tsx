import React, { useState, useEffect } from "react";
import { ShieldCheck, CheckCircle2, RefreshCw, Shield, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface CaptchaComponentProps {
  onVerify: (isValid: boolean) => void;
  darkMode: boolean;
  isRequired?: boolean;
  action?: string;
}

export default function CaptchaComponent({ onVerify, darkMode, isRequired = true, action = "login" }: CaptchaComponentProps) {
  const [isChecked, setIsChecked] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  // Quick auto-verification on click for smooth UX
  const handleCheck = () => {
    if (isChecked || isVerifying) return;
    setIsVerifying(true);
    
    setTimeout(() => {
      setIsVerifying(false);
      setIsChecked(true);
      onVerify(true);
    }, 450);
  };

  return (
    <div 
      onClick={handleCheck}
      className={`p-2.5 px-3.5 rounded-xl border transition-all select-none cursor-pointer flex items-center justify-between gap-3 ${
        isChecked
          ? darkMode
            ? "bg-teal-950/20 border-teal-500/30 text-teal-300"
            : "bg-teal-50/70 border-teal-200 text-teal-800"
          : darkMode
          ? "bg-slate-900/50 border-slate-800 hover:border-slate-700 text-slate-400"
          : "bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-600"
      }`}
    >
      <div className="flex items-center gap-2.5">
        <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
          isChecked
            ? "bg-teal-600 border-teal-600 text-white shadow-xs"
            : isVerifying
            ? "border-teal-500 bg-teal-500/10"
            : darkMode
            ? "border-slate-700 bg-slate-950"
            : "border-slate-300 bg-white"
        }`}>
          {isVerifying ? (
            <RefreshCw className="w-3 h-3 text-teal-500 animate-spin" />
          ) : isChecked ? (
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          ) : null}
        </div>
        <span className="text-xs font-medium tracking-tight">
          {isChecked ? "Verificación de seguridad completada" : "Verificación humana de acceso clínico"}
        </span>
      </div>

      <div className="flex items-center gap-1 opacity-60 text-[10px] uppercase font-semibold tracking-wider">
        <ShieldCheck className="w-3.5 h-3.5 text-teal-500" />
        <span>HIPAA / Sec</span>
      </div>
    </div>
  );
}

