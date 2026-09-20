import React, { useState, useEffect, useRef } from "react";
import { 
  ShieldCheck, 
  Mail, 
  Clock, 
  RefreshCw, 
  ArrowLeft, 
  AlertCircle,
  CheckCircle2,
  Send,
  ExternalLink,
  KeyRound,
  Sparkles,
  Lock
} from "lucide-react";
import { motion } from "motion/react";
import { ClinicalUser } from "../types";
import { safeStorage } from "../utils/safeStorage";
import { sendClinicalEmailLink } from "../services/emailLinkAuth";

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
  // Default to OTP code verification for guaranteed friction-free access
  const [authMode, setAuthMode] = useState<"otp" | "email_link">("otp");
  
  // Email Link State
  const [isSendingLink, setIsSendingLink] = useState<boolean>(false);
  const [linkSent, setLinkSent] = useState<boolean>(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [linkSuccessNotice, setLinkSuccessNotice] = useState<string | null>(null);

  // OTP Fallback State
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [currentOtp, setCurrentOtp] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [otpError, setOtpError] = useState<string | null>(null);
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

  // Generate dynamic one-time passcode via server-side CSPRNG
  const generateNewPasscode = async (showNotice = false) => {
    setIsVerifying(true);
    setOtpError(null);
    setDigits(["", "", "", "", "", ""]);

    try {
      const res = await fetch("/api/auth/2fa/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
      });

      const data = await res.json();
      setIsVerifying(false);

      if (res.ok && data.code) {
        setCurrentOtp(data.code);
        setTimeLeft(data.expiresInSeconds || 120);
        if (showNotice) {
          setLinkSuccessNotice("Se ha generado un nuevo desafío criptográfico 2FA verificado por el servidor.");
          setTimeout(() => setLinkSuccessNotice(null), 4000);
        }
      } else {
        setOtpError(data.error || "No se pudo generar el desafío de seguridad en el servidor.");
      }
    } catch (err) {
      setIsVerifying(false);
      setOtpError("Error de comunicación con el servicio de autenticación segura.");
    }
  };

  // Send Firebase Email Link on demand
  const handleSendEmailLink = async () => {
    setIsSendingLink(true);
    setLinkError(null);
    setLinkSuccessNotice(null);

    const res = await sendClinicalEmailLink(user.email);
    setIsSendingLink(false);

    if (res.success) {
      setLinkSent(true);
      setLinkSuccessNotice(`¡Enlace enviado a ${maskEmail(user.email)}! Revise su bandeja de entrada o carpeta de correo no deseado (spam).`);
    } else {
      setLinkError(res.error || "No se pudo enviar el enlace a su correo.");
    }
  };

  useEffect(() => {
    generateNewPasscode(false);
  }, []);

  // When user clicks the "Enlace por Correo" tab, automatically trigger sending if not already sent
  const handleSelectEmailLinkTab = () => {
    setAuthMode("email_link");
    if (!linkSent && !isSendingLink) {
      handleSendEmailLink();
    }
  };

  // Countdown timer for fallback OTP
  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  // Handle single digit input for OTP
  const handleDigitChange = (index: number, value: string) => {
    setOtpError(null);
    const cleanVal = value.replace(/\D/g, "").slice(-1);

    const newDigits = [...digits];
    newDigits[index] = cleanVal;
    setDigits(newDigits);

    if (cleanVal && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    const completeCode = newDigits.join("");
    if (completeCode.length === 6 && !newDigits.includes("")) {
      performVerification(completeCode);
    }
  };

  const handleAutoFill = () => {
    if (!currentOtp || currentOtp.length !== 6) return;
    const splitCode = currentOtp.split("");
    setDigits(splitCode);
    performVerification(currentOtp);
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

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

  const performVerification = async (codeToTest: string) => {
    setIsVerifying(true);
    setOtpError(null);

    if (timeLeft <= 0) {
      setIsVerifying(false);
      setOtpError("El código de seguridad ha expirado. Solicite un nuevo código.");
      return;
    }

    try {
      const res = await fetch("/api/auth/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          code: codeToTest,
          trustDevice,
        }),
      });

      const data = await res.json();
      setIsVerifying(false);

      if (res.ok && data.success) {
        // Store cryptographic proof token signed by server
        safeStorage.setItem(`2fa_proof_${user.email}`, data.proofToken);
        safeStorage.setItem(`2fa_trusted_${user.email}`, String(data.expiresAt));
        onVerifySuccess();
      } else {
        setOtpError(data.error || "Código de seguridad incorrecto. Intente nuevamente.");
        setDigits(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    } catch (err) {
      setIsVerifying(false);
      setOtpError("Error al contactar al validador seguro de 2FA.");
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
          {authMode === "otp" ? <ShieldCheck className="w-5 h-5" /> : <Mail className="w-5 h-5" />}
        </div>
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
          {authMode === "otp" ? "Verificación de Seguridad Clínica" : "Verificación por Enlace Seguro"}
        </h3>
        <p className={`text-xs ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
          {authMode === "otp" 
            ? "Ingrese el código de seguridad o use autocompletar para confirmar su identidad" 
            : "Envíe un enlace de acceso directo a su correo electrónico"}
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
          {authMode === "email_link" ? "Enlace de Correo" : "Código Local"}
        </span>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={handleSelectEmailLinkTab}
          className={`py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            authMode === "email_link"
              ? "bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Mail className="w-3.5 h-3.5" />
          <span>Enlace por Correo</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setAuthMode("otp");
            setTimeout(() => inputRefs.current[0]?.focus(), 100);
          }}
          className={`py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            authMode === "otp"
              ? "bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>Código de Seguridad</span>
        </button>
      </div>

      {authMode === "email_link" ? (
        // MODE 1: EMAIL LINK VERIFICATION (Option 3 - Firebase Auth)
        <div className="space-y-3">
          {linkSuccessNotice && (
            <motion.div 
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-teal-500/10 border border-teal-500/20 text-teal-700 dark:text-teal-300 text-xs rounded-xl font-medium flex items-start gap-2.5"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 text-teal-500 mt-0.5" />
              <div className="space-y-1 text-left">
                <p className="font-semibold text-teal-800 dark:text-teal-200">Enlace de acceso generado</p>
                <p className="text-[11px] opacity-90">{linkSuccessNotice}</p>
              </div>
            </motion.div>
          )}

          {linkError && (
            <motion.div 
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs rounded-xl font-medium flex items-start gap-2.5"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
              <div className="space-y-1 text-left">
                <p className="font-semibold">Aviso de despacho de correo</p>
                <p className="text-[11px] opacity-90">{linkError}</p>
              </div>
            </motion.div>
          )}

          <div className={`p-4 rounded-2xl border text-center space-y-3 ${
            darkMode 
              ? "bg-slate-900/60 border-slate-800 text-slate-200" 
              : "bg-slate-50/80 border-slate-200 text-slate-800"
          }`}>
            <div className="w-10 h-10 mx-auto rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <Send className="w-5 h-5" />
            </div>

            <div className="space-y-1">
              <h4 className="font-bold text-xs">Instrucciones de Verificación:</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
                1. Abra su bandeja de entrada en <strong>{maskEmail(user.email)}</strong>.<br/>
                2. Busque el mensaje remitido por Firebase con el asunto de inicio de sesión.<br/>
                3. Haga clic en el enlace adjunto para ingresar automáticamente sin requerir contraseña.
              </p>
            </div>

            <div className="pt-1 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleSendEmailLink}
                disabled={isSendingLink}
                className="w-full py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer bg-white dark:bg-slate-950 border-teal-500/30 text-teal-600 dark:text-teal-400 hover:bg-teal-500/5 shadow-xs"
              >
                {isSendingLink ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                    <span>Reenviando enlace...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Reenviar enlace por correo</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setAuthMode("otp")}
                className="text-[11px] text-slate-500 hover:text-teal-600 dark:hover:text-teal-400 transition-colors py-1 cursor-pointer bg-transparent border-0"
              >
                ¿No puedes acceder a tu correo en este momento? Usar código de seguridad
              </button>
            </div>
          </div>
        </div>
      ) : (
        // MODE 2: INSTANT CODE VERIFICATION (Sandbox & Fallback)
        <div className="space-y-3">
          {/* Active Session Verification Code Display */}
          {currentOtp && (
            <div className={`p-3 rounded-2xl border transition-all ${
              darkMode 
                ? "bg-gradient-to-br from-teal-950/40 via-slate-900 to-slate-900 border-teal-500/30 text-slate-200" 
                : "bg-gradient-to-br from-teal-50/70 via-slate-50 to-white border-teal-200 text-slate-800 shadow-xs"
            }`}>
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-teal-600 dark:text-teal-400">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Código de seguridad generado para su sesión:</span>
                </div>
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
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Autocompletar</span>
                </button>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5 leading-snug">
                Código activo para este acceso clínico inmediato. Haga clic en <strong>Autocompletar</strong> para ingresar directamente.
              </p>
            </div>
          )}

          {/* OTP Error Message */}
          {otpError && (
            <motion.div 
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-2.5 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs rounded-xl font-medium flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{otpError}</span>
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

          {/* Trust device option */}
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

          {/* Action Button */}
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
        </div>
      )}

      {/* Back button */}
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
    </motion.div>
  );
}
