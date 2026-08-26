import React, { useState } from 'react';
import { motion } from 'motion/react';
import Logo from './Logo';
import {
  Stethoscope,
  UserCheck,
  ShieldCheck,
  Zap,
  Activity,
  CalendarCheck,
  CreditCard,
  Layers,
  Bot,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  Mic,
  FileSpreadsheet,
  Users,
  ChevronDown,
  Building2,
  Award,
  PhoneCall,
  Search,
  Lock,
  Smartphone
} from 'lucide-react';

interface LandingPageProps {
  onEnterAsDentist: () => void;
  onEnterAsPatient: () => void;
  onSelectPatientRut?: (rut: string) => void;
}

export default function LandingPage({
  onEnterAsDentist,
  onEnterAsPatient,
  onSelectPatientRut,
}: LandingPageProps) {
  const [patientSearchRut, setPatientSearchRut] = useState('');
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const handlePatientQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSelectPatientRut && patientSearchRut.trim()) {
      onSelectPatientRut(patientSearchRut.trim());
    } else {
      onEnterAsPatient();
    }
  };

  const comparisonData = [
    {
      feature: 'Periodontograma Paramétrico a 6 Puntos',
      us: 'Gráficas vectoriales interactivas, cálculo automático de BOP% y Placa O\'Leary en tiempo real.',
      them: 'Planillas estáticas o módulos anticuados sin feedback visual inmediato.',
      highlight: true
    },
    {
      feature: 'Copiloto de IA Clínica ("Dentito")',
      us: 'Comandos de voz locales, protocolos de urgencia y análisis contextual del expediente.',
      them: 'Inexistente o menús de texto rígidos sin procesamiento inteligente.',
      highlight: true
    },
    {
      feature: 'Odontograma 2D/3D con Notación FDI',
      us: '32 piezas permanentes y temporales con desglose por las 5 caras y estados clínicos precisos.',
      them: 'Gráficos genéricos poco detallados o limitados a 1 solo estado por diente.',
      highlight: false
    },
    {
      feature: 'Portal de Pacientes con Acceso Directo por RUT',
      us: 'Sin registros engorrosos: el paciente consulta citas, odontograma y pagos con su RUT/DNI.',
      them: 'Requiere crear cuentas complejas con contraseñas que el paciente olvida.',
      highlight: true
    },
    {
      feature: 'Sincronización Cloud + Modo Seguro Offline',
      us: 'Almacenamiento en la nube con respaldo local para no interrumpir la atención del sillón.',
      them: 'Dependencia 100% de servidores locales lentos o fallos por caída de red.',
      highlight: false
    },
    {
      feature: 'Módulo Financiero y Consentimientos Móviles',
      us: 'Firma digital en tablet/smartphone, presupuestos y control de abonos en 1 clic.',
      them: 'Impresión constante de papel y carpetas físicas desorganizadas.',
      highlight: false
    }
  ];

  const faqs = [
    {
      q: '¿Qué es PerioDash y a quién está dirigido?',
      a: 'PerioDash es una plataforma clínica integral diseñada para odontólogos generales, periodoncistas, higienistas y clínicas dentales que buscan optimizar sus diagnósticos periodontales, agilizar la toma de registros clínicos y brindar un portal transparente y educativo a sus pacientes.'
    },
    {
      q: '¿Cómo ingresa un paciente a revisar su ficha o citas?',
      a: 'El paciente puede ingresar directamente haciendo clic en "Portal del Paciente" e ingresando su RUT/DNI o código de paciente. Desde allí podrá revisar sus próximas citas, presupuesto, recetas médicas y el estado visual de sus tratamientos.'
    },
    {
      q: '¿Es compatible con el estándar periodontal internacional?',
      a: 'Sí. PerioDash implementa el sistema de registro periodontal a 6 puntos (mesio, centro, disto por vestibular y lingual/palatino), cálculo automático de índice de sangrado al sondaje (BOP%), índice de placa de O\'Leary y clasificación de riesgo PRA.'
    },
    {
      q: '¿Qué ventajas ofrece el Copiloto Clínico IA?',
      a: 'Permite dictar parámetros de sondaje con las manos ocupadas durante el procedimiento, consultar protocolos de urgencias médicas odontológicas y generar resúmenes SOAP automáticos para la ficha clínica.'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-teal-500 selection:text-white overflow-x-hidden">
      {/* Background Glows (Cosmic Slate identity) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-teal-600/10 rounded-full blur-[140px]" />
        <div className="absolute top-1/3 -right-40 w-[550px] h-[550px] bg-cyan-600/10 rounded-full blur-[140px]" />
        <div className="absolute -bottom-40 left-1/3 w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-[140px]" />
      </div>

      {/* Top Navigation Bar */}
      <header className="relative z-30 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size="md" subtitle="Software Odontológico Profesional" />
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#sobre-periodash" className="hover:text-teal-400 transition-colors">¿Qué es PerioDash?</a>
            <a href="#que-hacemos" className="hover:text-teal-400 transition-colors">Funcionalidades</a>
            <a href="#comparativa" className="hover:text-teal-400 transition-colors">Ventajas vs Competencia</a>
            <a href="#faq" className="hover:text-teal-400 transition-colors">Preguntas Frecuentes</a>
          </nav>

          {/* Quick Access Dual Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={onEnterAsPatient}
              className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-200 hover:text-white bg-slate-900 border border-slate-700 hover:border-slate-600 transition-all flex items-center gap-2"
            >
              <UserCheck className="w-4 h-4 text-cyan-400" />
              <span className="hidden sm:inline">Soy</span> Paciente
            </button>
            <button
              onClick={onEnterAsDentist}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 shadow-lg shadow-teal-500/20 transition-all flex items-center gap-2"
            >
              <Stethoscope className="w-4 h-4" />
              <span>Acceso Odontólogos</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 pt-12 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-semibold tracking-wide"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Plataforma Clínica de Nueva Generación
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-6xl font-display font-extrabold tracking-tight text-white leading-tight"
          >
            La odontología moderna <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-cyan-400 to-emerald-300">
              conectada, rápida y precisa.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-base sm:text-lg text-slate-400 font-normal leading-relaxed"
          >
            Diseñado para clínicas y profesionales que exigen periodontogramas a 6 puntos en segundos, 
            odontogramas anatómicos FDI, asistencia clínica por voz y un portal transparente para que los pacientes sigan su salud oral.
          </motion.p>
        </div>

        {/* Dual Access Gateway Cards */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Card 1: Dentist Access */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="relative group rounded-3xl p-8 bg-gradient-to-b from-slate-900/90 to-slate-950 border border-teal-500/30 hover:border-teal-400/60 shadow-2xl transition-all flex flex-col justify-between"
          >
            <div className="absolute top-0 right-0 p-6">
              <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30 uppercase tracking-wider font-mono">
                Profesionales
              </span>
            </div>

            <div>
              <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 mb-6 group-hover:scale-105 transition-transform">
                <Stethoscope className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-display font-bold text-white mb-2">
                Soy Odontólogo / Clínica
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                Accede a la suite clínica completa: Odontograma interactivo, Periodontograma paramétrico, Copiloto Dentito IA, Agenda Inteligente y Finanzas.
              </p>

              <ul className="space-y-2.5 text-xs text-slate-300 mb-8 font-medium">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                  <span>Sondaje periodontal a 6 puntos y cálculo BOP%</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                  <span>Dictado por voz & Asistente IA para SOAP</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                  <span>Consentimientos informados digitales en tablet</span>
                </li>
              </ul>
            </div>

            <button
              onClick={onEnterAsDentist}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white font-bold text-sm shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2 group-hover:gap-3 transition-all"
            >
              <span>Ingresar al Sistema Clínico</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>

          {/* Card 2: Patient Access */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="relative group rounded-3xl p-8 bg-gradient-to-b from-slate-900/90 to-slate-950 border border-cyan-500/30 hover:border-cyan-400/60 shadow-2xl transition-all flex flex-col justify-between"
          >
            <div className="absolute top-0 right-0 p-6">
              <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 uppercase tracking-wider font-mono">
                Pacientes
              </span>
            </div>

            <div>
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-6 group-hover:scale-105 transition-transform">
                <UserCheck className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-display font-bold text-white mb-2">
                Soy Paciente
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                Consulta tu tratamiento, citas programadas, recetas y estado de tu odontograma sin contraseñas difíciles.
              </p>

              <form onSubmit={handlePatientQuickSubmit} className="space-y-3 mb-4">
                <label className="text-xs text-slate-400 font-semibold block uppercase tracking-wider">
                  Acceso rápido por RUT / DNI:
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Ej: 12.345.678-5 o 18943210K"
                    value={patientSearchRut}
                    onChange={(e) => setPatientSearchRut(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-sm font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-400 transition-colors"
                  />
                </div>
              </form>

              <ul className="space-y-2 text-xs text-slate-400 mb-6 font-medium">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Visualización clara de tu odontograma</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Descarga de recetas y presupuestos en PDF</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Auto-ingreso libre para pacientes nuevos</span>
                </li>
              </ul>
            </div>

            <div className="space-y-2.5">
              <button
                onClick={() => {
                  if (patientSearchRut.trim() && onSelectPatientRut) {
                    onSelectPatientRut(patientSearchRut.trim());
                  } else {
                    onEnterAsPatient();
                  }
                }}
                className="w-full py-3 px-5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-cyan-500/50 hover:border-cyan-400 text-cyan-300 hover:text-white font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Consultar Mi Portal Dental</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onSelectPatientRut) {
                    onSelectPatientRut("new");
                  } else {
                    onEnterAsPatient();
                  }
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-teal-500/20 to-emerald-500/20 hover:from-teal-500/30 hover:to-emerald-500/30 border border-teal-500/40 text-teal-300 hover:text-teal-200 font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                <span>✨ Soy Paciente Nuevo (Auto-Registro)</span>
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Section: ¿Qué es PerioDash y para qué está destinada? */}
      <section id="sobre-periodash" className="py-20 border-t border-slate-800/80 bg-slate-900/40 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 text-teal-400 text-xs font-bold font-mono">
                <Building2 className="w-3.5 h-3.5" />
                PROPÓSITO & ALCANCE CLÍNICO
              </div>
              <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-white tracking-tight">
                ¿Qué es PerioDash y para qué fue creada?
              </h2>
              <p className="text-slate-300 text-base leading-relaxed">
                <strong>PerioDash Pro</strong> es una plataforma de software odontológico de alta precisión, diseñada específicamente para transformar y agilizar la evaluación periodontal y el diagnóstico dental integral.
              </p>
              <p className="text-slate-400 text-sm leading-relaxed">
                Fue concebida para sustituir las planillas manuales y los softwares obsoletos por una interfaz rápida, intuitiva y científica. Permite registrar sondajes a 6 puntos, calcular índices de sangrado (BOP) y placa bacteriana al instante, dictar hallazgos con manos libres mediante IA y ofrecer a los pacientes una experiencia visual clara y transparente de su salud oral.
              </p>

              <div className="grid grid-cols-3 gap-4 pt-4">
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-center">
                  <div className="text-2xl sm:text-3xl font-extrabold text-teal-400 font-mono">6 pts</div>
                  <div className="text-[11px] text-slate-400 mt-1 uppercase font-bold">Sondaje Exacto</div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-center">
                  <div className="text-2xl sm:text-3xl font-extrabold text-cyan-400 font-mono">32</div>
                  <div className="text-[11px] text-slate-400 mt-1 uppercase font-bold">Piezas FDI</div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-center">
                  <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono">100%</div>
                  <div className="text-[11px] text-slate-400 mt-1 uppercase font-bold">Cloud & Seguro</div>
                </div>
              </div>
            </div>

            <div className="p-8 rounded-3xl bg-slate-950 border border-slate-800 shadow-2xl relative overflow-hidden space-y-6">
              <div className="absolute top-0 right-0 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                <Logo size="sm" subtitle="Estándar Clínico Certificado" />
              </div>
              <div className="space-y-4 text-xs text-slate-300">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">Basado en Directrices Científicas</h4>
                    <p className="text-slate-400 mt-0.5">Seguimiento riguroso de los criterios de la AAP (American Academy of Periodontology) y la EFP (European Federation of Periodontology).</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0 mt-0.5">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">Privacidad & Seguridad de Datos</h4>
                    <p className="text-slate-400 mt-0.5">Cifrado de fichas clínicas, respaldos instantáneos y cumplimiento con las normas de confidencialidad médica y protección de datos.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section: ¿Qué Hacemos? */}
      <section id="que-hacemos" className="py-20 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="px-3.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-bold font-mono">
              SUITE CLÍNICA INTEGRADA
            </span>
            <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-white">
              ¿Qué Hacemos?
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              Todo lo que tu clínica necesita para diagnosticar, tratar, facturar y fidelizar a tus pacientes en una sola pantalla.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-teal-500/40 transition-all space-y-3">
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Periodoncia Paramétrica</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Registro de profundidad de sondaje, margen gingival, furcas, movilidad, sangrado (BOP) y placa O\'Leary con curvas de evolución y gráficos automáticos.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 transition-all space-y-3">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Odontograma 5 Caras FDI</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Mapeo anatómico por pieza dental: caries, endodoncias, coronas, implantes y prótesis con códigos de color visuales y esquema 3D.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/40 transition-all space-y-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Bot className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Copiloto IA ("Dentito")</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Asistente inteligente con reconocimiento de voz en manos libres para dictar medidas, redactar notas clínicas SOAP y sugerir protocolos.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-teal-500/40 transition-all space-y-3">
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center">
                <CalendarCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Agenda & Citas Google Sync</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Organización de sillones y doctores, recordatorios de citas y sincronización bidireccional directa con Google Calendar.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 transition-all space-y-3">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                <CreditCard className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Finanzas, Pagos & Recetas</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Presupuestos detallados, registro de abonos y emisión de recetas médicas estandarizadas listas para imprimir en PDF.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/40 transition-all space-y-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Portal & Consentimiento Digital</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Firma de consentimientos informados directo en la pantalla del paciente y portal web para consultar tratamientos con su RUT.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section: Matriz Comparativa vs Competencia */}
      <section id="comparativa" className="py-20 border-t border-slate-800/80 bg-slate-900/50 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="px-3.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold font-mono">
              VENTAJAS COMPETITIVAS
            </span>
            <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-white">
              ¿Por qué elegir PerioDash?
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              Compara directamente las capacidades de PerioDash frente a los softwares dentales convencionales del mercado.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-4 px-6">Funcionalidad</th>
                  <th className="py-4 px-6 text-teal-400 bg-teal-950/30 rounded-t-2xl border-t border-x border-teal-500/30">
                    <div className="flex items-center gap-2">
                      <Logo size="sm" showSubtitle={false} />
                      <span className="font-bold text-sm text-teal-300">PerioDash Pro</span>
                    </div>
                  </th>
                  <th className="py-4 px-6 text-slate-400">Software Dental Tradicional</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-sm">
                {comparisonData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/60 transition-colors">
                    <td className="py-4 px-6 font-semibold text-slate-200">
                      {row.feature}
                    </td>
                    <td className="py-4 px-6 bg-teal-950/20 border-x border-teal-500/20 font-medium text-slate-200">
                      <div className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                        <span>{row.us}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-400">
                      <div className="flex items-start gap-2.5">
                        <XCircle className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" />
                        <span>{row.them}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Section: Preguntas Frecuentes (FAQ) */}
      <section id="faq" className="py-20 border-t border-slate-800/80 relative z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 space-y-2">
            <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-bold font-mono">
              RESOLVEMOS TUS DUDAS
            </span>
            <h2 className="text-3xl font-display font-bold text-white">
              Preguntas Frecuentes
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden transition-colors"
                >
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 font-semibold text-slate-200 hover:text-white"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`w-5 h-5 text-teal-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-sm text-slate-400 leading-relaxed border-t border-slate-800/50 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="py-16 border-t border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 relative z-10 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <h2 className="text-3xl font-display font-extrabold text-white">
            ¿Listo para transformar la experiencia en tu clínica?
          </h2>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            Accede de inmediato al sistema clínico o al portal de pacientes sin configuraciones complejas.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <button
              onClick={onEnterAsDentist}
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white font-bold text-base shadow-xl shadow-teal-500/20 flex items-center gap-3 transition-all"
            >
              <Stethoscope className="w-5 h-5" />
              <span>Entrar como Odontólogo</span>
            </button>
            <button
              onClick={onEnterAsPatient}
              className="px-8 py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white font-bold text-base transition-all flex items-center gap-3"
            >
              <UserCheck className="w-5 h-5 text-cyan-400" />
              <span>Entrar como Paciente</span>
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Logo size="sm" showSubtitle={false} />
            <span>PerioDash v15 Pro — Todos los derechos reservados.</span>
          </div>
          <div className="flex items-center gap-6">
            <span>Privacidad de Datos Médicos</span>
            <span>Estándar FDI / AAP</span>
            <span>Soporte Clínico 24/7</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
