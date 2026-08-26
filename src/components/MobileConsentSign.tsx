import React, { useState, useEffect, useRef } from "react";
import { db, cleanForFirestore } from "../firebase";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { motion, AnimatePresence } from "motion/react";
import { 
  ShieldCheck, 
  PenTool, 
  CheckCircle2, 
  AlertTriangle, 
  RotateCcw, 
  Smartphone,
  Lock,
  Calendar,
  User,
  Check
} from "lucide-react";

export interface MobileConsentSignProps {
  sessionId: string;
  onDone?: () => void;
}

export default function MobileConsentSign({ sessionId, onDone }: MobileConsentSignProps) {
  const [loading, setLoading] = useState(true);
  const [sessionData, setSessionData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [signerName, setSignerName] = useState("");
  const [signerDocument, setSignerDocument] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSignedSuccess, setIsSignedSuccess] = useState(false);

  // Canvas drawing state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);

  // Load Session from Firestore
  useEffect(() => {
    if (!sessionId) {
      setError("Código de sesión de firma inválido o expirado.");
      setLoading(false);
      return;
    }

    const unsub = onSnapshot(
      doc(db, "consent_sessions", sessionId),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setSessionData(data);
          if (data.status === "signed") {
            setIsSignedSuccess(true);
            setSignatureDataUrl(data.signatureDataUrl);
          }
          if (data.patientName && !signerName) {
            setSignerName(data.patientName);
          }
          if (data.patientDocumentId && !signerDocument) {
            setSignerDocument(data.patientDocumentId);
          }
          setLoading(false);
        } else {
          setError("No se encontró la sesión de consentimiento o ya fue completada.");
          setLoading(false);
        }
      },
      (err) => {
        console.error("Error al cargar sesión de firma:", err);
        setError("Error de conexión al cargar el documento médico.");
        setLoading(false);
      }
    );

    return () => unsub();
  }, [sessionId]);

  // Handle Canvas Drawing
  const getCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (isSignedSuccess) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.strokeStyle = "#0d9488"; // teal-600
    ctx.lineWidth = 3.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const coords = getCoords(e, canvas);
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    setIsDrawing(true);
    if ("cancelable" in e && e.cancelable) {
      e.preventDefault();
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || isSignedSuccess) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const coords = getCoords(e, canvas);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
    setHasSignature(true);
    if ("cancelable" in e && e.cancelable) {
      e.preventDefault();
    }
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (canvasRef.current && hasSignature) {
      setSignatureDataUrl(canvasRef.current.toDataURL("image/png"));
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    setSignatureDataUrl(null);
  };

  const handleSignSubmit = async () => {
    if (!acceptedTerms || !hasSignature || !signatureDataUrl || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const now = new Date();
      await setDoc(
        doc(db, "consent_sessions", sessionId),
        cleanForFirestore({
          status: "signed",
          signedAt: now.toLocaleString("es-CL"),
          signerName: signerName.trim() || sessionData?.patientName || "Paciente",
          signerDocument: signerDocument.trim() || sessionData?.patientDocumentId || "N/A",
          signatureDataUrl,
          userAgent: navigator.userAgent
        }),
        { merge: true }
      );

      setIsSignedSuccess(true);
      if (onDone) onDone();
    } catch (err) {
      console.error("Error al enviar la firma:", err);
      alert("Hubo un problema al transmitir la firma. Revisa tu conexión a internet.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 border-4 border-teal-500/30 border-t-teal-400 rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-300">Cargando documento médico seguro...</p>
        <span className="text-[11px] text-slate-500 mt-1 font-mono">Sesión: {sessionId}</span>
      </div>
    );
  }

  if (error || !sessionData) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-3xl max-w-sm w-full space-y-3">
          <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
          <h3 className="text-base font-bold text-rose-300">Enlace No Disponible</h3>
          <p className="text-xs text-slate-400 leading-relaxed">{error || "No se pudo recuperar la información del consentimiento."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 font-sans">
      <div className="max-w-lg w-full mx-auto space-y-5 pb-8">
        
        {/* Header Badge */}
        <div className="bg-slate-900/90 border border-teal-500/30 rounded-3xl p-4 shadow-xl text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 text-teal-400 text-[11px] font-extrabold uppercase border border-teal-500/20">
            <ShieldCheck className="w-3.5 h-3.5" /> Portal de Firma Digital
          </div>
          <h1 className="text-lg font-black text-white">Consentimiento Informado Odontológico</h1>
          <p className="text-xs text-slate-400">
            Procedimiento: <span className="text-amber-300 font-bold font-mono">"{sessionData.procedureDescription}"</span>
          </p>
        </div>

        {isSignedSuccess ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-emerald-950/40 border border-emerald-500/40 rounded-3xl p-6 text-center space-y-4 shadow-2xl"
          >
            <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-400 rounded-full flex items-center justify-center mx-auto text-emerald-400">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>
            <h2 className="text-xl font-black text-emerald-300">¡Documento Firmado con Éxito!</h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Tu firma ha sido transmitida en tiempo real a la pantalla del doctor. Puedes cerrar esta ventana.
            </p>
            {signatureDataUrl && (
              <div className="p-3 bg-white rounded-2xl max-w-xs mx-auto shadow-md">
                <img src={signatureDataUrl} alt="Firma registrada" className="max-h-24 mx-auto" />
              </div>
            )}
            <div className="text-[10px] text-slate-500 font-mono">
              Registrado: {sessionData.signedAt || new Date().toLocaleTimeString()}
            </div>
          </motion.div>
        ) : (
          <>
            {/* Medical Clauses & Risks Box */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4 space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Términos del Procedimiento</span>
              
              <div className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80 space-y-2">
                <p>
                  <strong className="text-teal-400">Declaración:</strong> {sessionData.customClauses}
                </p>
                <p className="text-amber-300/90 pt-1 border-t border-slate-800/80">
                  <strong className="text-amber-400">⚠️ Riesgos informados:</strong> {sessionData.customRisks}
                </p>
              </div>
            </div>

            {/* Signer Data */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4 space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Datos del Firmante</span>
              
              <div className="space-y-2.5">
                <div>
                  <label className="text-[11px] text-slate-400 font-semibold mb-1 block">Nombre Completo:</label>
                  <input
                    type="text"
                    value={signerName}
                    onChange={(e) => setSignerName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 font-semibold mb-1 block">Cédula / RUN / DNI:</label>
                  <input
                    type="text"
                    value={signerDocument}
                    onChange={(e) => setSignerDocument(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold font-mono text-white outline-none focus:border-teal-500"
                  />
                </div>
              </div>
            </div>

            {/* Tactile Signature Pad */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
                  <PenTool className="w-3.5 h-3.5" /> Dibuja tu firma aquí (con tu dedo):
                </span>
                {hasSignature && (
                  <button
                    type="button"
                    onClick={clearCanvas}
                    className="text-[11px] font-bold text-rose-400 hover:text-rose-300 cursor-pointer flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" /> Limpiar
                  </button>
                )}
              </div>

              <div className="border-2 border-dashed border-teal-500/40 rounded-2xl bg-white p-1 overflow-hidden shadow-inner">
                <canvas
                  ref={canvasRef}
                  width={480}
                  height={180}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full h-36 bg-white touch-none cursor-crosshair block"
                />
              </div>
              <p className="text-[10px] text-slate-500 text-center">
                {hasSignature ? "✓ Firma lista para transmitir" : "Usa la pantalla táctil de tu teléfono para dibujar tu firma."}
              </p>
            </div>

            {/* Acceptance Checkbox */}
            <label className="flex items-start gap-3 p-3.5 bg-slate-900/90 border border-slate-800 rounded-2xl cursor-pointer select-none">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-slate-700 bg-slate-950 text-teal-600 focus:ring-teal-500 cursor-pointer"
              />
              <span className="text-[11px] text-slate-300 leading-snug">
                He leído y acepto en su totalidad los términos, riesgos clínicos y costos del procedimiento odontológico indicado.
              </span>
            </label>

            {/* Submit Button */}
            <button
              type="button"
              disabled={!acceptedTerms || !hasSignature || isSubmitting}
              onClick={handleSignSubmit}
              className={`w-full py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-xl transition-all ${
                acceptedTerms && hasSignature && !isSubmitting
                  ? "bg-gradient-to-r from-teal-600 to-emerald-600 text-white cursor-pointer hover:opacity-95 active:scale-98"
                  : "bg-slate-800 text-slate-500 cursor-not-allowed opacity-60"
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Transmitiendo firma en vivo...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Firmar y Enviar al Doctor</span>
                </>
              )}
            </button>
          </>
        )}
      </div>

      <div className="text-center text-[10px] text-slate-600 font-mono py-2">
        PerioDash v15 Pro • Encriptación Segura de Consentimiento
      </div>
    </div>
  );
}
