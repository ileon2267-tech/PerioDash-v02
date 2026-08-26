import React, { useState } from "react";
import { Patient, Appointment, PatientCommunication } from "../types";
import { 
  Send, 
  MessageSquare, 
  Mail, 
  Smartphone, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  Sparkles, 
  FileText, 
  Copy, 
  ExternalLink,
  ShieldCheck,
  PhoneCall,
  Flame
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { recordHipaaAudit } from "../utils/hipaaAudit";

interface PatientCommunicationsProps {
  patient: Patient;
  appointments: Appointment[];
  clinicName: string;
  doctorName: string;
  onUpdatePatient: (updated: Patient) => void;
}

export default function PatientCommunications({
  patient,
  appointments,
  clinicName,
  doctorName,
  onUpdatePatient
}: PatientCommunicationsProps) {
  const patientAppointments = appointments.filter(a => a.patientId === patient.id);
  const nextAppointment = patientAppointments[0];

  const [channel, setChannel] = useState<"whatsapp" | "email" | "sms">("whatsapp");
  const [templateType, setTemplateType] = useState<PatientCommunication["template"]>("recordatorio_cita");
  const [customSubject, setCustomSubject] = useState<string>("Recordatorio de Cita Dental");
  const [messageBody, setMessageBody] = useState<string>("");
  const [copiedSuccess, setCopiedSuccess] = useState<boolean>(false);
  const [sentSuccess, setSentSuccess] = useState<boolean>(false);

  // Template generator based on patient live data
  const generateTemplateContent = (type: PatientCommunication["template"]) => {
    const cleanPhone = (patient.phone || "").replace(/[^0-9]/g, "");
    const dateStr = nextAppointment?.date || "Próxima sesión";
    const timeStr = nextAppointment?.time || "10:00";
    const clinic = clinicName || "PerioClinic Pro";
    const doctor = doctorName || "Dr. Titular";

    switch (type) {
      case "recordatorio_cita":
        return `Hola ${patient.name}, te recordamos tu cita odontológica en ${clinic} el día ${dateStr} a las ${timeStr} hrs con el ${doctor}.\n\nPor favor confirma tu asistencia respondiendo a este mensaje. ¡Te esperamos!`;
      
      case "postoperatorio":
        return `Estimado/a ${patient.name}, desde ${clinic} esperamos que te encuentres muy bien tras tu procedimiento de hoy.\n\nInstrucciones postoperatorias clave:\n1. Morder la gasa durante 30-45 minutos si hubo sangrado leve.\n2. Aplicar hielo local en la mejilla de forma intermitente.\n3. Dieta blanda y fría/tibia; evitar alimentos calientes o irritantes.\n4. No realizar enjuagues fuertes ni escupir durante las primeras 24 hrs.\n5. Tomar la medicación prescrita en los horarios indicados.\n\nAnte cualquier duda o urgencia, contáctanos inmediatamente.`;

      case "presupuesto": {
        const totalCost = patient.treatmentPlan?.procedures?.reduce((acc, p) => acc + (p.cost * (1 - (p.discount || 0)/100)), 0) || 0;
        return `Hola ${patient.name}, adjuntamos el resumen de tu plan de tratamiento propuesto en ${clinic} por un total estimado de $${totalCost.toLocaleString('es-CL')}.\n\nContamos con opciones de financiamiento y facilidades de pago. Puedes consultar el detalle en tu portal o respondernos directamente.`;
      }

      case "higiene_mantenimiento":
        return `Hola ${patient.name}, en ${clinic} nos preocupamos por la salud de tus encías. Recuerda cepillarte 3 veces al día, utilizar hilo dental o cepillos interproximales y acudir a tu control periodontal semestral. ¡Una sonrisa sana es salud de por vida!`;

      default:
        return `Estimado/a ${patient.name}, nos comunicamos desde ${clinic}...`;
    }
  };

  // Sync template whenever selection changes
  const handleSelectTemplate = (type: PatientCommunication["template"]) => {
    setTemplateType(type);
    setMessageBody(generateTemplateContent(type));
  };

  // Initial load template
  React.useEffect(() => {
    setMessageBody(generateTemplateContent(templateType));
  }, [templateType, patient.id]);

  const handleSendWhatsApp = () => {
    const rawNumber = patient.phone.replace(/[^0-9]/g, "");
    if (!rawNumber) {
      alert("El paciente no tiene un número telefónico válido registrado.");
      return;
    }

    const encodedText = encodeURIComponent(messageBody);
    const whatsappUrl = `https://wa.me/${rawNumber}?text=${encodedText}`;
    window.open(whatsappUrl, "_blank");

    recordCommunication("sent");
  };

  const handleSendEmail = () => {
    if (!patient.email) {
      alert("El paciente no tiene un correo electrónico registrado.");
      return;
    }

    const mailtoUrl = `mailto:${patient.email}?subject=${encodeURIComponent(customSubject)}&body=${encodeURIComponent(messageBody)}`;
    window.open(mailtoUrl, "_blank");

    recordCommunication("sent");
  };

  const handleCopyClipboard = () => {
    navigator.clipboard.writeText(messageBody);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2000);
    recordCommunication("queued");
  };

  const recordCommunication = (status: PatientCommunication["status"]) => {
    const newComm: PatientCommunication = {
      id: `comm-${Date.now()}`,
      date: new Date().toISOString().replace("T", " ").slice(0, 16),
      type: channel,
      template: templateType,
      recipient: channel === "email" ? patient.email : patient.phone,
      message: messageBody,
      status
    };

    const updatedComms = [newComm, ...(patient.communications || [])];
    onUpdatePatient({
      ...patient,
      communications: updatedComms
    });

    setSentSuccess(true);
    setTimeout(() => setSentSuccess(false), 3000);

    recordHipaaAudit("COMMUNICATION_SENT", `Envío/gestión de comunicación clínica (${channel.toUpperCase()}) al paciente ${patient.name}. Plantilla: ${templateType}.`, {
      patientId: patient.id,
      patientName: patient.name,
      resource: "Comunicaciones & Notificaciones ePHI",
      severity: "info"
    });
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-display font-black text-slate-900 dark:text-white">
              Centro de Comunicación & Notificaciones Automatizadas
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Envío directo de recordatorios de citas, pautas post-quirúrgicas y presupuestos con 1 solo clic a WhatsApp o Email.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setChannel("whatsapp")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              channel === "whatsapp" 
                ? "bg-emerald-600 text-white shadow-xs" 
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </button>

          <button
            onClick={() => setChannel("email")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              channel === "email" 
                ? "bg-blue-600 text-white shadow-xs" 
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Email</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Template Selector & Patient Data */}
        <div className="space-y-6">
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider text-slate-500">
              1. Seleccionar Plantilla Clínica
            </h3>

            <div className="space-y-2">
              {[
                { id: "recordatorio_cita", label: "Recordatorio de Cita", icon: Calendar, color: "text-indigo-500 bg-indigo-500/10" },
                { id: "postoperatorio", label: "Pauta Postoperatoria", icon: ShieldCheck, color: "text-emerald-500 bg-emerald-500/10" },
                { id: "presupuesto", label: "Envío de Presupuesto", icon: FileText, color: "text-amber-500 bg-amber-500/10" },
                { id: "higiene_mantenimiento", label: "Control de Higiene & Perio", icon: Sparkles, color: "text-teal-500 bg-teal-500/10" }
              ].map(tpl => {
                const IconComponent = tpl.icon;
                const isSelected = templateType === tpl.id;
                return (
                  <button
                    key={tpl.id}
                    onClick={() => handleSelectTemplate(tpl.id as any)}
                    className={`w-full p-3 rounded-2xl border text-left transition-all flex items-center gap-3 cursor-pointer ${
                      isSelected 
                        ? "border-teal-500 bg-teal-50/50 dark:bg-teal-950/30 text-teal-950 dark:text-teal-200 shadow-xs" 
                        : "border-slate-200/80 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <div className={`p-2 rounded-xl ${tpl.color}`}>
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold">{tpl.label}</p>
                    </div>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Patient Card Info */}
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
              Destinatario Activo
            </h4>
            <div className="space-y-1">
              <p className="text-base font-bold text-slate-900 dark:text-white font-display">{patient.name}</p>
              <p className="text-xs font-mono text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-emerald-500" /> {patient.phone || "Sin teléfono"}
              </p>
              <p className="text-xs font-mono text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-blue-500" /> {patient.email || "Sin email"}
              </p>
            </div>
          </div>
        </div>

        {/* Message Editor & Live Preview */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-teal-600" /> Editor y Personalización de Mensaje
              </h3>

              {sentSuccess && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/20"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Registrado en Historial
                </motion.div>
              )}
            </div>

            {channel === "email" && (
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Asunto del Correo
                </label>
                <input
                  type="text"
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                />
              </div>
            )}

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Cuerpo del Mensaje
                </label>
                <span className="text-[11px] text-slate-400 font-mono">
                  {messageBody.length} caracteres
                </span>
              </div>
              <textarea
                rows={8}
                value={messageBody}
                onChange={(e) => setMessageBody(e.target.value)}
                className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-xs font-medium leading-relaxed text-slate-900 dark:text-slate-100 resize-y"
              />
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              {channel === "whatsapp" ? (
                <button
                  onClick={handleSendWhatsApp}
                  className="flex-1 min-w-[200px] py-3 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Abrir Chat de WhatsApp Directo</span>
                </button>
              ) : (
                <button
                  onClick={handleSendEmail}
                  className="flex-1 min-w-[200px] py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <Mail className="w-4 h-4" />
                  <span>Enviar por Correo Electrónico</span>
                </button>
              )}

              <button
                onClick={handleCopyClipboard}
                className="py-3 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition-all border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedSuccess ? "¡Copiado!" : "Copiar Texto"}</span>
              </button>
            </div>
          </div>

          {/* Communications History */}
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              Historial de Comunicaciones Enviadas ({patient.communications?.length || 0})
            </h3>

            {(!patient.communications || patient.communications.length === 0) ? (
              <p className="text-xs text-slate-400 py-4 text-center">
                Aún no se han enviado notificaciones a este paciente.
              </p>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {patient.communications.map(comm => (
                  <div
                    key={comm.id}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-md font-bold uppercase text-[10px] ${
                          comm.type === "whatsapp" ? "bg-emerald-500/10 text-emerald-600" : "bg-blue-500/10 text-blue-600"
                        }`}>
                          {comm.type}
                        </span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 capitalize">
                          {comm.template.replace(/_/g, " ")}
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 text-[11px] line-clamp-1">
                        {comm.message}
                      </p>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 whitespace-nowrap">
                      {comm.date}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
