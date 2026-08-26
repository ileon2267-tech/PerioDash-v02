import React, { useState, useEffect, useRef } from "react";
import { 
  ShieldCheck, 
  KeyRound, 
  Mail, 
  Clock, 
  RefreshCw, 
  ArrowLeft, 
  AlertCircle,
  CheckCircle2,
  Copy,
  Check,
  Zap
} from "lucide-react";
import { motion } from "motion/react";
import { ClinicalUser } from "../types";

interface TwoFactorAuthStepProps {
  user: ClinicalUser;
  onVerifySuccess: () => void;
  onCancel: () => void;
  darkMode: boolean;
}

export default function TwoFactorAuthStep({
  user,
  onVerifySuccess,
  onCancel,
  darkMode
}: TwoFactorAuthStepProps) {
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [currentOtp, setCurrentOtp] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [error, setError] = useState<string | null>(null);
  const [infoNotice, setInfoNotice] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [trustDevice, setTrustDevice] = useState<boolean>(true);
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Mask email for privacy (e.g. j***z@clinic.com)
  const maskEmail = (email: string) => {
    if (!email) return "usuario@clinica.com";
    const [name, domain] = email.split("@");
    if (!domain) return email;
    const maskedName = name.length > 2 ? `${name[0]}***${name[name.length - 1]}` : `${name[0]}***`;
    return `${maskedName}@${domain}`;
  };

  // Generate a dynamic one-time passcode for this session
  const generateNewPasscode = (showNotice = false) => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setCurrentOtp(code);
    setTimeLeft(60);
    setError(null);
    setDigits(["", "", "", "", "", ""]);
    setCopied(false);
    
    if (showNotice) {
      setInfoNotice("Se ha generado un nuevo código de seguridad para su sesión.");
      setTimeout(() => setInfoNotice(null), 4000);
    }
    
    setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 100);
  };

  useEffect(() => {
    generateNewPasscode(false);
  }, []);

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  // Handle single digit input
  const handleDigitChange = (index: number, value: string) => {
    setError(null);
    const cleanVal = value.replace(/\D/g, "").slice(-1);

    const newDigits = [...digits];
    newDigits[index] = cleanVal;
    setDigits(newDigits);

    // Auto-advance to next input
    if (cleanVal && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify if all 6 digits entered
    const completeCode = newDigits.join("");
    if (completeCode.length === 6 && !newDigits.includes("")) {
      performVerification(completeCode);
    }
  };

  // Quick auto-fill helper
  const handleAutoFill = () => {
    if (!currentOtp || currentOtp.length !== 6) return;
    const splitCode = currentOtp.split("");
    setDigits(splitCode);
    performVerification(currentOtp);
  };

  // Copy OTP to clipboard
  const handleCopyOtp = () => {
    if (!currentOtp) return;
    navigator.clipboard.writeText(currentOtp);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Handle Backspace navigation
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle paste full 6-digit code
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pastedData) return;

    const newDigits = ["", "", "", "", "", ""];
    for (let i = 0; i < pastedData.length; i++) {
      newDigits[i] = pastedData[i];
    }
    setDigits(newDigits);

    const targetIdx = Math.min(pastedData.length, 5);
    inputRefs.current[targetIdx]?.focus();

    if (pastedData.length === 6) {
      performVerification(pastedData);
    }
  };

  // Verify entered code
  const performVerification = (codeToTest: string) => {
    setIsVerifying(true);
    setError(null);

    if (timeLeft <= 0) {
      setIsVerifying(false);
      setError("El código de seguridad ha expirado. Solicite un nuevo código.");
      return;
    }

    if (codeToTest === currentOtp) {
      setIsVerifying(false);
      if (trustDevice) {
        localStorage.setItem(`2fa_trusted_${user.email}`, "true");
      }
      onVerifySuccess();
    } else {
      setIsVerifying(false);
      setError("Código de seguridad incorrecto. Intente nuevamente.");
      setDigits(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    }
  };

  const isComplete = digits.every(d => d !== "");

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="text-center space-y-1">
        <div className="inline-flex p-2.5 bg-teal-500/10 text-teal-600 dark:text-teal-400 rounded-xl border border-teal-500/20">
          <KeyRound className="w-5 h-5" />
        </div>
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
          Verificación de Seguridad en Dos Pasos (2FA)
        </h3>
        <p className={`text-xs ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
          Ingrese el código de seguridad generado para su cuenta
        </p>
      </div>

      {/* Target User Info */}
      <div className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs ${
        darkMode ? "bg-slate-950/60 border-slate-800 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-700"
      }`}>
        <div className="flex items-center gap-2 min-w-0">
          <Mail className="w-3.5 h-3.5 text-teal-500 shrink-0" />
          <span className="truncate font-medium">{maskEmail(user.email)}</span>
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-md">
          OTP Activo
        </span>
      </div>

      {/* Instant OTP Card for direct access */}
      {currentOtp && (
        <div className={`p-3 rounded-2xl border transition-all ${
          darkMode 
            ? "bg-gradient-to-br from-teal-950/40 via-slate-900 to-slate-900 border-teal-500/30 text-slate-200" 
            : "bg-gradient-to-br from-teal-50/70 via-slate-50 to-white border-teal-200 text-slate-800 shadow-xs"
        }`}>
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-teal-600 dark:text-teal-400">
              <Zap className="w-3.5 h-3.5" />
              <span>Código emitido para su sesión:</span>
            </div>
            <button
              type="button"
              onClick={handleCopyOtp}
              className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 hover:text-teal-600 dark:text-slate-400 dark:hover:text-teal-300 transition-colors cursor-pointer bg-transparent border-0"
              title="Copiar código"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-500" />
                  <span className="text-emerald-500">Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copiar</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center justify-between gap-3 bg-white dark:bg-slate-950/70 border border-teal-500/20 rounded-xl px-3 py-2">
            <div className="font-mono text-xl font-black tracking-widest text-teal-700 dark:text-teal-300 select-all">
              {currentOtp}
            </div>

            <button
              type="button"
              onClick={handleAutoFill}
              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold text-xs rounded-lg transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Autocompletar</span>
            </button>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5 leading-snug">
            Haga clic en <strong>Autocompletar</strong> para ingresar y validar inmediatamente.
          </p>
        </div>
      )}

      {/* Info notice if resent */}
      {infoNotice && (
        <motion.div 
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-2.5 bg-teal-500/10 border border-teal-500/20 text-teal-700 dark:text-teal-300 text-xs rounded-xl font-medium flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0 text-teal-500" />
          <span>{infoNotice}</span>
        </motion.div>
      )}

      {/* Error Message */}
      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-2.5 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs rounded-xl font-medium flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </motion.div>
      )}

      {/* 6-Digit Pin Input Matrix */}
      <div className="py-1">
        <div className="flex justify-center gap-2">
          {digits.map((digit, idx) => (
            <input
              key={idx}
              ref={(el) => {
                inputRefs.current[idx] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleDigitChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              onPaste={handlePaste}
              className={`w-9.5 h-11 text-center font-mono text-base font-bold rounded-xl border outline-none transition-all ${
                digit
                  ? "border-teal-500 bg-teal-500/10 text-teal-600 dark:text-teal-300 ring-2 ring-teal-500/20"
                  : darkMode
                  ? "bg-slate-950 border-slate-800 text-white focus:border-teal-500/70 focus:ring-2 focus:ring-teal-500/20"
                  : "bg-white border-slate-300 text-slate-800 focus:border-teal-500/70 focus:ring-2 focus:ring-teal-500/20"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Expiry and Resend */}
      <div className="flex items-center justify-between text-xs px-0.5">
        <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
          <Clock className="w-3.5 h-3.5 text-teal-500" />
          <span>Expira en: <strong className="font-mono text-slate-700 dark:text-slate-300">{timeLeft}s</strong></span>
        </div>

        <button
          type="button"
          disabled={timeLeft > 45}
          onClick={() => generateNewPasscode(true)}
          className={`flex items-center gap-1 text-[11px] font-semibold transition-colors cursor-pointer border-0 bg-transparent ${
            timeLeft > 45
              ? "text-slate-400 opacity-40 cursor-not-allowed"
              : "text-teal-600 dark:text-teal-400 hover:underline"
          }`}
        >
          <RefreshCw className="w-3 h-3" />
          <span>Generar nuevo código</span>
        </button>
      </div>

      {/* Trust this device checkbox */}
      <label className="flex items-center gap-2 cursor-pointer select-none px-0.5">
        <input
          type="checkbox"
          checked={trustDevice}
          onChange={(e) => setTrustDevice(e.target.checked)}
          className="rounded text-teal-600 focus:ring-teal-500 border-slate-300 dark:border-slate-700 w-3.5 h-3.5 cursor-pointer"
        />
        <span className={`text-[11px] ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
          Recordar este equipo clínico durante 30 días
        </span>
      </label>

      {/* Action Buttons */}
      <div className="space-y-2 pt-1">
        <button
          type="button"
          disabled={isVerifying || !isComplete}
          onClick={() => performVerification(digits.join(""))}
          className={`w-full font-semibold text-xs py-2.5 px-4 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer ${
            isComplete
              ? "bg-teal-600 hover:bg-teal-700 text-white"
              : "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed"
          }`}
        >
          {isVerifying ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Verificando código...</span>
            </>
          ) : (
            <>
              <ShieldCheck className="w-4 h-4" />
              <span>Confirmar y Autorizar</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={onCancel}
          className={`w-full py-1.5 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer border-0 bg-transparent ${
            darkMode ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <ArrowLeft className="w-3 h-3" />
          <span>Volver al formulario de acceso</span>
        </button>
      </div>
    </motion.div>
  );
}

