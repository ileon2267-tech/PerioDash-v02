import { Patient, ToothState, PeriodonState } from "../types";

export type ContextModeId = 
  | "brief_summary"        // Resumen clínico breve
  | "periodontal_detailed" // Análisis periodontológico detallado
  | "soap_evolution"       // Redacción de evoluciones
  | "odontogram_rehab"     // Odontograma & Rehabilitación
  | "custom";              // Configuración personalizada

export interface ClinicalContextConfig {
  mode: ContextModeId;
  includeAnamnesis: boolean;
  includeOdontogram: boolean;
  includePeriodontogram: boolean;
  includeTreatmentPlan: boolean;
  includeEvolutions: boolean;
  includeXRays: boolean;
  maskPII: boolean; // Privacy by Design (HIPAA / GDPR)
}

export interface ContextModeOption {
  id: ContextModeId;
  title: string;
  shortTitle: string;
  badge: string;
  badgeColor: string;
  description: string;
  directive: string;
  defaultConfig: Omit<ClinicalContextConfig, "mode">;
  chips: { label: string; query: string; icon?: string }[];
  suggestedPrompts: string[];
}

export const CONTEXT_MODES: Record<ContextModeId, ContextModeOption> = {
  brief_summary: {
    id: "brief_summary",
    title: "Resumen clínico breve",
    shortTitle: "Resumen Breve",
    badge: "Rápido",
    badgeColor: "bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/30",
    description: "Ficha esencial, alertas médicas críticas de anamnesis, resumen de conteos dentales y diagnóstico general sintetizado.",
    directive: "Modo: 'Resumen clínico breve'. Genera respuestas sintéticas, profesionales y de lectura rápida (bullet points). Prioriza alertas médicas (alergias, patologías sistémicas), estado general y plan de acción inmediato sin saturar de detalles numéricos.",
    defaultConfig: {
      includeAnamnesis: true,
      includeOdontogram: true,
      includePeriodontogram: true,
      includeTreatmentPlan: false,
      includeEvolutions: false,
      includeXRays: false,
      maskPII: true,
    },
    chips: [
      { label: "📊 Resumen Ejecutivo", query: "Dame un resumen clínico ejecutivo del paciente activo." },
      { label: "⚠️ Alertas y Alergias", query: "¿El paciente presenta alguna alergia medicamentosa, patología sistémica o contraindicación médica?" },
      { label: "🩺 Motivo y Diagnóstico", query: "¿Cuál es el motivo de consulta registrado y el diagnóstico presuntivo general?" },
      { label: "💰 Presupuesto Global", query: "¿Cuál es el resumen de costos y tratamientos planificados para este paciente?" },
      { label: "🚨 Emergencias", query: "Protocolos de Emergencia Médica" }
    ],
    suggestedPrompts: [
      "Dame un resumen clínico ejecutivo del paciente activo.",
      "¿El paciente presenta alguna alergia medicamentosa o patología sistémica?",
      "¿Cuál es el motivo de consulta registrado y el diagnóstico presuntivo?",
      "¿Cuál es el resumen de costos y tratamientos planificados?"
    ]
  },
  periodontal_detailed: {
    id: "periodontal_detailed",
    title: "Análisis periodontológico detallado",
    shortTitle: "Periodoncia Detallada",
    badge: "Especialista",
    badgeColor: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    description: "Periodontograma a 6 puntos, bolsas patológicas ≥4mm y ≥5mm, sangrado BOP %, índice de O'Leary, riesgo PRA y clasificación AAP/EFP 2018.",
    directive: "Modo: 'Análisis periodontológico detallado'. Actúa como especialista en Periodoncia e Implantología. Analiza meticulosamente el periodontograma a 6 puntos, evalúa profundidad al sondaje (PPD), recesión gingival, pérdida de inserción clínica (CAL), sangrado al sondaje (BOP %), índice O'Leary e implicación de furcas. Basa tus conclusiones en el Consenso AAP/EFP 2018 (Estadios I-IV, Grados A-C), estratificación de riesgo PRA (Lang & Tonetti) y planifica la Fase Higiénica / Terapia Causa-Efecto (RAR).",
    defaultConfig: {
      includeAnamnesis: true,
      includeOdontogram: false,
      includePeriodontogram: true,
      includeTreatmentPlan: false,
      includeEvolutions: false,
      includeXRays: true,
      maskPII: true,
    },
    chips: [
      { label: "📏 Clasificación AAP 2018", query: "Clasifica el diagnóstico periodontal según el Consenso AAP/EFP 2018 (Estadio y Grado)." },
      { label: "🕳️ Bolsas Activas ≥ 5mm", query: "Enumera todas las piezas y superficies con bolsas periodontales patológicas ≥ 5mm." },
      { label: "🩸 Sangrado BOP y PRA", query: "Calcula el porcentaje de sangrado al sondaje (BOP %) y estratifica el riesgo periodontal PRA." },
      { label: "🧼 Higiene O'Leary y RAR", query: "Analiza el índice de higiene O'Leary y planifica las sesiones de Raspado y Alisado Radicular (RAR)." },
      { label: "🚨 Emergencias", query: "Protocolos de Emergencia Médica" }
    ],
    suggestedPrompts: [
      "Clasifica el diagnóstico periodontal según el Consenso AAP/EFP 2018 (Estadio y Grado).",
      "Enumera todas las piezas y superficies con bolsas periodontales patológicas ≥ 5mm.",
      "Calcula el porcentaje de sangrado al sondaje (BOP %) y estratifica el riesgo periodontal PRA.",
      "Analiza el índice de higiene O'Leary y planifica las sesiones de Raspado y Alisado Radicular (RAR)."
    ]
  },
  soap_evolution: {
    id: "soap_evolution",
    title: "Redacción de evoluciones (SOAP)",
    shortTitle: "Evolución SOAP",
    badge: "Médico-Legal",
    badgeColor: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/30",
    description: "Historial de notas previas, procedimientos realizados en la sesión, fármacos prescritos, indicaciones postoperatorias y estructura SOAP lista para copiar.",
    directive: "Modo: 'Redacción de evoluciones clínicas'. Actúa como asistente médico-legal y clínico. Redacta notas de evolución médica estrictamente en formato SOAP estandarizado:\n- **S (Subjetivo)**: Motivo de consulta referido, sintomatología y dolor EVA.\n- **O (Objetivo)**: Hallazgos clínicos intraorales, anestesia utilizada (técnica, cartuchos y vasoconstrictor), instrumental y campo quirúrgico.\n- **A (Análisis/Evaluación)**: Diagnóstico de la sesión y evolución del tratamiento.\n- **P (Plan/Prescripción)**: Receta médica con posología exacta, indicaciones postoperatorias entregadas al paciente y próxima cita programada.",
    defaultConfig: {
      includeAnamnesis: true,
      includeOdontogram: false,
      includePeriodontogram: false,
      includeTreatmentPlan: true,
      includeEvolutions: true,
      includeXRays: false,
      maskPII: true,
    },
    chips: [
      { label: "📝 Redactar Nota SOAP", query: "Redacta una nota clínica completa en formato SOAP para la sesión de hoy." },
      { label: "💊 Receta e Indicaciones", query: "Genera una prescripción farmacológica e indicaciones postoperatorias para el paciente." },
      { label: "🔄 Reevaluación Periodontal", query: "Redacta una nota de control y reevaluación periodontal a 4-6 semanas tras RAR." },
      { label: "📌 Procedimientos Pendientes", query: "Resume los procedimientos completados hoy y los tratamientos pendientes para la próxima cita." },
      { label: "🚨 Emergencias", query: "Protocolos de Emergencia Médica" }
    ],
    suggestedPrompts: [
      "Redacta una nota clínica completa en formato SOAP para la sesión de hoy.",
      "Genera una prescripción farmacológica e indicaciones postoperatorias para el paciente.",
      "Redacta una nota de control y reevaluación periodontal a 4-6 semanas tras RAR.",
      "Resume los procedimientos completados hoy y los tratamientos pendientes."
    ]
  },
  odontogram_rehab: {
    id: "odontogram_rehab",
    title: "Odontograma & Rehabilitación",
    shortTitle: "Odontograma & Rehab",
    badge: "Restauradora",
    badgeColor: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30",
    description: "Detalle de caries por caras dentales exactas (FDI), piezas ausentes, endodoncias, implantes y presupuesto de rehabilitación oral.",
    directive: "Modo: 'Odontograma y Rehabilitación Oral'. Actúa como especialista en Operatoria Dental y Rehabilitación Protésica. Analiza en detalle cada pieza dentaria afectada por caries (especificando caras: oclusal, mesial, distal, vestibular, lingual/palatino), dientes ausentes y tratamientos previos (endodoncias, coronas, implantes). Prioriza la secuencia de saneamiento restaurador y propone alternativas de rehabilitación fija, sobre implantes o removible según el presupuesto del paciente.",
    defaultConfig: {
      includeAnamnesis: false,
      includeOdontogram: true,
      includePeriodontogram: false,
      includeTreatmentPlan: true,
      includeEvolutions: false,
      includeXRays: true,
      maskPII: true,
    },
    chips: [
      { label: "🦷 Caries por Caras (FDI)", query: "Detalla todas las piezas dentales con caries activa y sus caras específicas comprometidas." },
      { label: "🔨 Secuencia Operatoria", query: "¿Cuál es el orden de prioridad recomendado para las restauraciones y saneamiento cariogénico?" },
      { label: "🦿 Opciones de Rehabilitación", query: "Analiza las opciones de rehabilitación protésica (implantes vs prótesis) para las piezas ausentes." },
      { label: "💰 Presupuesto Restaurador", query: "Calcula el desglose presupuestario de las restauraciones y procedimientos pendientes." },
      { label: "🚨 Emergencias", query: "Protocolos de Emergencia Médica" }
    ],
    suggestedPrompts: [
      "Detalla todas las piezas dentales con caries activa y sus caras específicas comprometidas.",
      "¿Cuál es el orden de prioridad recomendado para las restauraciones?",
      "Analiza las opciones de rehabilitación protésica para las piezas ausentes.",
      "Calcula el desglose presupuestario de las restauraciones y procedimientos pendientes."
    ]
  },
  custom: {
    id: "custom",
    title: "Configuración personalizada",
    shortTitle: "Personalizado",
    badge: "A Medida",
    badgeColor: "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30",
    description: "Control manual granular sobre qué componentes clínicos específicos (ficha, odontograma, periodontograma, presupuesto, etc.) se envían al modelo.",
    directive: "Modo: 'Personalizado'. Utiliza la combinación específica de datos clínicos seleccionados por el odontólogo tratante para responder con la máxima fidelidad a la información suministrada.",
    defaultConfig: {
      includeAnamnesis: true,
      includeOdontogram: true,
      includePeriodontogram: true,
      includeTreatmentPlan: true,
      includeEvolutions: true,
      includeXRays: false,
      maskPII: true,
    },
    chips: [
      { label: "📊 Resumen Completo", query: "Analizar el estado clínico completo del paciente activo." },
      { label: "⚠️ Alertas Médicas", query: "¿Hay condiciones de alarma sistémica o interacciones farmacológicas?" },
      { label: "📏 Sondaje y Bolsas", query: "Revisar los hallazgos principales del periodontograma." },
      { label: "🦷 Caries y Odontograma", query: "Revisar el odontograma y tratamientos pendientes." },
      { label: "🚨 Emergencias", query: "Protocolos de Emergencia Médica" }
    ],
    suggestedPrompts: [
      "Analizar el estado clínico completo del paciente activo.",
      "¿Hay condiciones de alarma sistémica o interacciones farmacológicas?",
      "Revisar los hallazgos principales del periodontograma.",
      "Revisar el odontograma y tratamientos pendientes."
    ]
  }
};

export const DEFAULT_CONTEXT_CONFIG: ClinicalContextConfig = {
  mode: "brief_summary",
  ...CONTEXT_MODES.brief_summary.defaultConfig
};

// Helper to mask PII according to Privacy by Design guidelines
export function maskPatientPII(patient: Patient, mask: boolean) {
  if (!mask) {
    return {
      name: patient.name,
      rut: patient.rut || patient.dni || "No registrado",
      phone: patient.phone,
      email: patient.email,
      birthdate: patient.birthdate,
    };
  }

  // Mask Name: e.g. "Carlos Valenzuela" -> "Carlos V. [PII Protegido]"
  const parts = (patient.name || "").trim().split(/\s+/);
  const maskedName = parts.length > 1
    ? `${parts[0]} ${parts[1].charAt(0)}. [PII Enmascarado]`
    : `${parts[0] || "Paciente"} [PII Enmascarado]`;

  // Mask RUT/DNI: e.g. "15.342.129-4" -> "15.***.***-4"
  const rawId = patient.rut || patient.dni || "";
  let maskedId = "[Protegido]";
  if (rawId.length >= 6) {
    maskedId = `${rawId.slice(0, 2)}.***.***-${rawId.slice(-1)}`;
  }

  // Mask Phone: e.g. "+56 9 8412 9901" -> "+56 9 **** 9901"
  const phone = patient.phone || "";
  let maskedPhone = "[Protegido]";
  if (phone.length >= 6) {
    maskedPhone = `${phone.slice(0, 5)} **** ${phone.slice(-4)}`;
  }

  // Mask Email: e.g. "carlos@gmail.com" -> "c***s@g***l.com"
  const email = patient.email || "";
  let maskedEmail = "[Protegido]";
  if (email.includes("@")) {
    const [u, d] = email.split("@");
    const uMask = u.length > 2 ? `${u[0]}***${u.slice(-1)}` : "u***";
    maskedEmail = `${uMask}@${d}`;
  }

  return {
    name: maskedName,
    rut: maskedId,
    phone: maskedPhone,
    email: maskedEmail,
    birthdate: patient.birthdate ? `${patient.birthdate.split("-")[0]}-**-**` : "No registrada",
  };
}

// Extractor of structured Odontogram data
export function extractOdontogramSummary(odontogram?: Record<number, ToothState>) {
  if (!odontogram) {
    return {
      cariesCount: 0,
      cariesDetails: [],
      missingCount: 0,
      missingTeeth: [],
      endoCount: 0,
      endoTeeth: [],
      implantCount: 0,
      implantTeeth: [],
      crownCount: 0,
      crownTeeth: [],
    };
  }

  const cariesDetails: { tooth: number; surfaces: string[] }[] = [];
  const missingTeeth: number[] = [];
  const endoTeeth: number[] = [];
  const implantTeeth: number[] = [];
  const crownTeeth: number[] = [];

  Object.entries(odontogram).forEach(([numStr, t]) => {
    const toothNum = Number(numStr);
    if (t.condition === "ausente") missingTeeth.push(toothNum);
    if (t.condition === "endodoncia") endoTeeth.push(toothNum);
    if (t.condition === "implante") implantTeeth.push(toothNum);
    if (t.condition === "corona") crownTeeth.push(toothNum);

    const s = (t.surfaces || {}) as Record<string, string | undefined>;
    const affectedSurfaces: string[] = [];
    if (s.vestibular === "caries") affectedSurfaces.push("Vestibular");
    if (s.occlusal === "caries") affectedSurfaces.push("Oclusal/Incisal");
    if (s.lingual === "caries") affectedSurfaces.push("Lingual/Palatino");
    if (s.mesial === "caries") affectedSurfaces.push("Mesial");
    if (s.distal === "caries") affectedSurfaces.push("Distal");

    if (affectedSurfaces.length > 0) {
      cariesDetails.push({ tooth: toothNum, surfaces: affectedSurfaces });
    }
  });

  return {
    cariesCount: cariesDetails.length,
    cariesDetails,
    missingCount: missingTeeth.length,
    missingTeeth,
    endoCount: endoTeeth.length,
    endoTeeth,
    implantCount: implantTeeth.length,
    implantTeeth,
    crownCount: crownTeeth.length,
    crownTeeth,
  };
}

// Extractor of structured Periodontogram data
export function extractPeriodontogramSummary(
  periodontogram?: Record<number, PeriodonState>,
  oLeary?: Record<number, any>,
  anamnesis?: any
) {
  if (!periodontogram || Object.keys(periodontogram).length === 0) {
    return {
      totalEvaluatedTeeth: 0,
      deepPockets5mmCount: 0,
      pockets4mmCount: 0,
      deepPocketsList: [],
      bopCount: 0,
      totalProbedSites: 0,
      bopPercentage: 0,
      plaquePercentage: 20,
      furcationTeeth: [],
      mobilityTeeth: [],
      praRiskLevel: "Bajo" as const,
      aap2018Suggested: "Salud Gingival / Gingivitis"
    };
  }

  let totalSites = 0;
  let bopSites = 0;
  let deep5mmCount = 0;
  let pockets4mmCount = 0;
  const deepPocketsList: { tooth: number; site: string; ppd: number; rec: number; cal: number; bop: boolean }[] = [];
  const furcationTeeth: { tooth: number; grade: number }[] = [];
  const mobilityTeeth: { tooth: number; grade: number }[] = [];

  Object.entries(periodontogram).forEach(([numStr, item]) => {
    const toothNum = Number(numStr);
    const vp = item.vestibularPocket || { mesial: 0, central: 0, distal: 0 };
    const pp = item.palatinoPocket || { mesial: 0, central: 0, distal: 0 };
    const vr = item.vestibularRecess || { mesial: 0, central: 0, distal: 0 };
    const pr = item.palatinoRecess || { mesial: 0, central: 0, distal: 0 };
    const vb = item.sangradoVestibular || { mesial: false, central: false, distal: false };
    const pb = item.sangradoPalatino || { mesial: false, central: false, distal: false };

    // Probing vestibular sites: Mesio-V, Centro-V, Disto-V
    const sites = [
      { name: "Mesio-Vestibular", ppd: vp.mesial || 0, rec: vr.mesial || 0, bop: !!vb.mesial },
      { name: "Centro-Vestibular", ppd: vp.central || 0, rec: vr.central || 0, bop: !!vb.central },
      { name: "Disto-Vestibular", ppd: vp.distal || 0, rec: vr.distal || 0, bop: !!vb.distal },
      { name: "Mesio-Palatino", ppd: pp.mesial || 0, rec: pr.mesial || 0, bop: !!pb.mesial },
      { name: "Centro-Palatino", ppd: pp.central || 0, rec: pr.central || 0, bop: !!pb.central },
      { name: "Disto-Palatino", ppd: pp.distal || 0, rec: pr.distal || 0, bop: !!pb.distal },
    ];

    sites.forEach(s => {
      totalSites++;
      if (s.bop) bopSites++;
      if (s.ppd >= 5) {
        deep5mmCount++;
        deepPocketsList.push({
          tooth: toothNum,
          site: s.name,
          ppd: s.ppd,
          rec: s.rec,
          cal: s.ppd + s.rec,
          bop: s.bop
        });
      } else if (s.ppd === 4) {
        pockets4mmCount++;
      }
    });

    if (item.furca && item.furca > 0) {
      furcationTeeth.push({ tooth: toothNum, grade: item.furca });
    }
    if (item.movilidad && item.movilidad > 0) {
      mobilityTeeth.push({ tooth: toothNum, grade: item.movilidad });
    }
  });

  const bopPercentage = totalSites > 0 ? Math.round((bopSites / totalSites) * 100) : 0;

  // Plaque calculation from O'Leary or Periodontogram
  let plaquePercentage = 25;
  if (oLeary && Object.keys(oLeary).length > 0) {
    let surfaces = 0;
    let stained = 0;
    Object.values(oLeary).forEach((o: any) => {
      surfaces += 4;
      if (o.mesial) stained++;
      if (o.distal) stained++;
      if (o.vestibular) stained++;
      if (o.lingual) stained++;
    });
    if (surfaces > 0) plaquePercentage = Math.round((stained / surfaces) * 100);
  }

  // PRA Lang & Tonetti Risk Calculation
  let highRiskPoints = 0;
  if (bopPercentage > 25) highRiskPoints++;
  if (deep5mmCount >= 5) highRiskPoints++;
  if (anamnesis?.tabaquismo >= 10) highRiskPoints++;
  if (anamnesis?.diabetesStatus === "severe" || (anamnesis?.diabetes && !anamnesis.diabetesStatus)) highRiskPoints++;
  if (furcationTeeth.length > 0 || mobilityTeeth.length > 0) highRiskPoints++;

  let praRiskLevel: "Bajo" | "Moderado" | "Alto" = "Bajo";
  if (highRiskPoints >= 2) praRiskLevel = "Alto";
  else if (highRiskPoints === 1 || bopPercentage >= 15 || deep5mmCount > 0) praRiskLevel = "Moderado";

  // Suggested AAP 2018
  let aapStage = "Salud / Gingivitis";
  let aapGrade = "Grado A";

  if (deep5mmCount >= 5 || furcationTeeth.length > 0) {
    aapStage = "Periodontitis Estadio III / IV";
  } else if (deep5mmCount > 0 || pockets4mmCount >= 4) {
    aapStage = "Periodontitis Estadio II";
  } else if (pockets4mmCount > 0) {
    aapStage = "Periodontitis Estadio I";
  }

  if (anamnesis?.tabaquismo >= 10 || anamnesis?.diabetesStatus === "severe") {
    aapGrade = "Grado C (Riesgo de progresión rápida)";
  } else if (anamnesis?.tabaquismo > 0 || anamnesis?.diabetes) {
    aapGrade = "Grado B (Riesgo de progresión moderada)";
  }

  const aap2018Suggested = `${aapStage}, ${aapGrade}`;

  return {
    totalEvaluatedTeeth: Object.keys(periodontogram).length,
    deepPockets5mmCount: deep5mmCount,
    pockets4mmCount,
    deepPocketsList,
    bopCount: bopSites,
    totalProbedSites: totalSites,
    bopPercentage,
    plaquePercentage,
    furcationTeeth,
    mobilityTeeth,
    praRiskLevel,
    aap2018Suggested
  };
}

// Master function to build the structured context payload
export function buildStructuredClinicalPayload(
  activePatient: Patient | null,
  config: ClinicalContextConfig,
  metadata: {
    activeTab?: string;
    clinicalSubView?: string;
    doctorName?: string;
    clinicName?: string;
    totalPatients?: number;
    totalAppointmentsToday?: number;
  }
) {
  const currentModeInfo = CONTEXT_MODES[config.mode] || CONTEXT_MODES.brief_summary;

  if (!activePatient) {
    const globalContext = {
      tipoContexto: "SISTEMA_GLOBAL_SIN_PACIENTE_ACTIVO",
      modoSeleccionado: currentModeInfo.title,
      directivaEspecial: currentModeInfo.directive,
      entorno: {
        moduloActivo: metadata.activeTab || "dashboard",
        subVista: metadata.clinicalSubView || "general",
        profesionalTratante: metadata.doctorName || "Dr. Odontólogo",
        clinica: metadata.clinicName || "PerioClinic",
        totalPacientesEnClinica: metadata.totalPatients || 0,
        citasHoy: metadata.totalAppointmentsToday || 0,
      },
      instruccion: "No hay paciente seleccionado en el visor. Asiste al usuario en consultas teóricas, aranceles, navegación o emergencias."
    };

    const jsonStr = JSON.stringify(globalContext, null, 2);
    return {
      structuredObject: globalContext,
      jsonString: jsonStr,
      characterCount: jsonStr.length,
      estimatedTokens: Math.round(jsonStr.length / 4),
      activeModulesCount: 0,
    };
  }

  const masked = maskPatientPII(activePatient, config.maskPII);
  const patientData: Record<string, any> = {
    identificacionSegura: {
      id: config.maskPII ? `PAC-${activePatient.id.slice(0, 6)}` : activePatient.id,
      nombre: masked.name,
      rutDni: masked.rut,
      telefono: masked.phone,
      correo: masked.email,
      fechaNacimiento: masked.birthdate,
      notasGenerales: activePatient.notes || "Sin notas registradas",
    }
  };

  let activeModulesCount = 0;

  // 1. Ficha y Anamnesis
  if (config.includeAnamnesis) {
    activeModulesCount++;
    const anam = activePatient.anamnesis || ({} as any);
    const systemicAlerts: string[] = [];

    if (anam.alergias && anam.alergias !== "Ninguna" && anam.alergias !== "ninguna") {
      systemicAlerts.push(`🚨 ALERTA ALERGIA: ${anam.alergias}`);
    }
    if (anam.anticoagulantes) {
      systemicAlerts.push(`⚠️ PACIENTE ANTICOAGULADO (${anam.tipoAnticoagulante || "Fármaco activo"}, INR: ${anam.valorINR || "No registrado"})`);
    }
    if (anam.bifosfonatos) {
      systemicAlerts.push(`🚨 RIESGO OSTEONECROSIS (MRONJ): Terapia con Bifosfonatos (${anam.viaBifosfonatos || "Vía oral/IV"})`);
    }
    if (anam.hta) systemicAlerts.push("Hipertensión Arterial (HTA)");
    if (anam.diabetes) systemicAlerts.push(`Diabetes Mellitus (Control: ${anam.diabetesStatus || "no especificado"})`);
    if (anam.tabaquismo && anam.tabaquismo > 0) systemicAlerts.push(`Fumador Activo: ${anam.tabaquismo} cigarrillos/día`);

    patientData.fichaYAnamnesis = {
      motivoConsulta: anam.motivoConsulta || "Evaluación odontológica periódica",
      alertasMedicasCriticas: systemicAlerts.length > 0 ? systemicAlerts : ["Sin alertas críticas reportadas"],
      patologias: {
        hipertension: !!anam.hta,
        diabetes: !!anam.diabetes,
        controlDiabetes: anam.diabetesStatus || "none",
        tabaquismoCigarrillosDia: anam.tabaquismo || 0,
        alergias: anam.alergias || "Ninguna declarada",
        farmacosHabituales: anam.farmacos || "Ninguno",
        dolorActual: anam.dolorActual || "ninguno",
        presionArterial: anam.presionSistolica ? `${anam.presionSistolica}/${anam.presionDiastolica || 80} mmHg` : "No registrada",
      }
    };
  }

  // 2. Odontograma
  if (config.includeOdontogram) {
    activeModulesCount++;
    const odonto = extractOdontogramSummary(activePatient.odontogram);
    patientData.odontogramaFDI = {
      resumenDientes: {
        cariesTotales: odonto.cariesCount,
        dientesAusentes: odonto.missingCount,
        endodoncias: odonto.endoCount,
        implantes: odonto.implantCount,
        coronas: odonto.crownCount,
      },
      piezasCariadasConCaras: odonto.cariesDetails.map(c => `Pieza ${c.tooth}: ${c.surfaces.join(", ")}`),
      piezasAusentes: odonto.missingTeeth,
      piezasConEndodoncia: odonto.endoTeeth,
      piezasConImplantes: odonto.implantTeeth,
    };
  }

  // 3. Periodontograma
  if (config.includePeriodontogram) {
    activeModulesCount++;
    const perio = extractPeriodontogramSummary(
      activePatient.periodontogram,
      activePatient.oLeary,
      activePatient.anamnesis
    );
    patientData.periodontogramaBiometrico = {
      resumenSondaje: {
        dientesEvaluados: perio.totalEvaluatedTeeth,
        sitiosSondadosTotal: perio.totalProbedSites,
        bolsasProfundas5mmOMas: perio.deepPockets5mmCount,
        bolsasLeves4mm: perio.pockets4mmCount,
        porcentajeSangradoBOP: `${perio.bopPercentage}%`,
        indicePlacaOLeary: `${perio.plaquePercentage}%`,
        estratificacionRiesgoPRA: perio.praRiskLevel,
        clasificacionAAP2018Sugerida: perio.aap2018Suggested,
      },
      compromisoFurca: perio.furcationTeeth.map(f => `Pieza ${f.tooth} (Grado ${f.grade})`),
      movilidadDental: perio.mobilityTeeth.map(m => `Pieza ${m.tooth} (Grado ${m.grade})`),
      bolsasPatologicasActivas: perio.deepPocketsList.map(b => 
        `Pieza ${b.tooth} - ${b.site}: ${b.ppd}mm (Recesión: ${b.rec}mm, CAL: ${b.cal}mm, Sangrado: ${b.bop ? 'SÍ' : 'NO'})`
      ),
    };
  }

  // 4. Presupuesto y Tratamiento
  if (config.includeTreatmentPlan) {
    activeModulesCount++;
    const procedures = activePatient.treatmentPlan?.procedures || [];
    let plannedTotal = 0;
    let completedTotal = 0;

    procedures.forEach(p => {
      if (p.completed) completedTotal += p.cost;
      else plannedTotal += p.cost;
    });

    patientData.planDeTratamientoYPresupuesto = {
      resumenFinanciero: {
        totalPlanificado: plannedTotal + completedTotal,
        totalCompletado: completedTotal,
        saldoPendiente: plannedTotal,
        totalProcedimientos: procedures.length,
      },
      procedimientos: procedures.map(p => ({
        descripcion: p.description,
        fase: p.phase,
        pieza: p.tooth || "General",
        costo: `$${p.cost.toLocaleString("es-CL")} CLP`,
        estado: p.completed ? "Completado" : "Pendiente",
      }))
    };
  }

  // 5. Evoluciones Clínicas Previas
  if (config.includeEvolutions) {
    activeModulesCount++;
    const evols = activePatient.evolutions || [];
    patientData.evolucionesPrevias = evols.slice(-5).map(e => ({
      fecha: e.date,
      doctor: e.professional || "Dr. Tratante",
      descripcion: e.description,
    }));
  }

  // 6. Radiografías Digitales
  if (config.includeXRays) {
    activeModulesCount++;
    const xrays = activePatient.xRays || [];
    patientData.estudiosRadiograficos = xrays.map(x => ({
      id: x.id,
      tipo: x.type,
      fecha: x.date,
      hallazgosClinicos: x.notes || "Sin notas radiológicas",
    }));
  }

  const finalPayload = {
    modoDeContextoActivo: currentModeInfo.title,
    codigoModo: currentModeInfo.id,
    directivaEspecialParaIA: currentModeInfo.directive,
    politicaPrivacidadEnmascarada: config.maskPII ? "PII_ENMASCARADO_HIPAA_CUMPLIDO" : "DATOS_COMPLETOS",
    fechaGeneracion: new Date().toISOString(),
    entornoClinico: {
      pestanaActiva: metadata.activeTab || "clinica",
      subVistaActiva: metadata.clinicalSubView || "odontograma",
      odontologo: metadata.doctorName || "Dr. Ignacio León",
      clinica: metadata.clinicName || "PerioClinic Providencia",
    },
    paciente: patientData
  };

  const jsonString = JSON.stringify(finalPayload, null, 2);

  return {
    structuredObject: finalPayload,
    jsonString,
    characterCount: jsonString.length,
    estimatedTokens: Math.round(jsonString.length / 4),
    activeModulesCount,
  };
}
