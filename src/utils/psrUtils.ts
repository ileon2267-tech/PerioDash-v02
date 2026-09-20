import { PsrRecord, PsrCode, PsrSextant } from "../types";

export interface SextantMeta {
  id: keyof Omit<PsrRecord, 'updatedAt' | 'evaluatedBy' | 'globalRecommendation'>;
  label: string;
  shortLabel: string;
  teethRange: string;
  teeth: number[];
  arch: 'superior' | 'inferior';
  position: 'derecho' | 'anterior' | 'izquierdo';
}

export const PSR_SEXTANTS: SextantMeta[] = [
  {
    id: 's1',
    label: 'Sextante 1 (Sup. Derecho)',
    shortLabel: 'S1',
    teethRange: '18 - 14',
    teeth: [18, 17, 16, 15, 14],
    arch: 'superior',
    position: 'derecho'
  },
  {
    id: 's2',
    label: 'Sextante 2 (Sup. Anterior)',
    shortLabel: 'S2',
    teethRange: '13 - 23',
    teeth: [13, 12, 11, 21, 22, 23],
    arch: 'superior',
    position: 'anterior'
  },
  {
    id: 's3',
    label: 'Sextante 3 (Sup. Izquierdo)',
    shortLabel: 'S3',
    teethRange: '24 - 28',
    teeth: [24, 25, 26, 27, 28],
    arch: 'superior',
    position: 'izquierdo'
  },
  {
    id: 's4',
    label: 'Sextante 4 (Inf. Izquierdo)',
    shortLabel: 'S4',
    teethRange: '38 - 34',
    teeth: [38, 37, 36, 35, 34],
    arch: 'inferior',
    position: 'izquierdo'
  },
  {
    id: 's5',
    label: 'Sextante 5 (Inf. Anterior)',
    shortLabel: 'S5',
    teethRange: '33 - 43',
    teeth: [33, 32, 31, 41, 42, 43],
    arch: 'inferior',
    position: 'anterior'
  },
  {
    id: 's6',
    label: 'Sextante 6 (Inf. Derecho)',
    shortLabel: 'S6',
    teethRange: '44 - 48',
    teeth: [44, 45, 46, 47, 48],
    arch: 'inferior',
    position: 'derecho'
  }
];

export interface PsrCodeInfo {
  code: PsrCode;
  label: string;
  badge: string;
  clinicalMeaning: string;
  whoProbeFinding: string;
  treatment: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
}

export const PSR_CODE_DETAILS: Record<string, PsrCodeInfo> = {
  '0': {
    code: 0,
    label: 'Código 0',
    badge: 'Salud',
    clinicalMeaning: 'Tejidos periodontales clínicamente sanos.',
    whoProbeFinding: 'Banda coloreada (3.5 - 5.5 mm) completamente visible. Sin sangrado ni cálculo.',
    treatment: 'Cuidados preventivos habituales y refuerzo de higiene oral.',
    colorClass: 'text-emerald-500',
    bgClass: 'bg-emerald-500/10 dark:bg-emerald-950/40',
    borderClass: 'border-emerald-500/40'
  },
  '1': {
    code: 1,
    label: 'Código 1',
    badge: 'Gingivitis',
    clinicalMeaning: 'Inflamación gingival sin pérdida de inserción clínica ni bolsas.',
    whoProbeFinding: 'Banda coloreada completamente visible. Sin cálculo ni desbordes. Sangrado al sondaje.',
    treatment: 'Profilaxis supragingival, instrucción en técnica de cepillado y seda dental.',
    colorClass: 'text-sky-500',
    bgClass: 'bg-sky-500/10 dark:bg-sky-950/40',
    borderClass: 'border-sky-500/40'
  },
  '2': {
    code: 2,
    label: 'Código 2',
    badge: 'Cálculo',
    clinicalMeaning: 'Gingivitis asociada a cálculo y/o factores iatrogénicos de retención de placa.',
    whoProbeFinding: 'Banda coloreada visible. Presencia de cálculo supra/subgingival o restauraciones desbordantes.',
    treatment: 'Tartrectomía (destartraje supragingival/subgingival) y corrección de márgenes desbordantes.',
    colorClass: 'text-amber-500',
    bgClass: 'bg-amber-500/10 dark:bg-amber-950/40',
    borderClass: 'border-amber-500/40'
  },
  '3': {
    code: 3,
    label: 'Código 3',
    badge: 'Bolsa 3.5-5.5mm',
    clinicalMeaning: 'Periodontitis incipiente / moderada en el sextante.',
    whoProbeFinding: 'Banda coloreada parcialmente cubierta por el margen gingival (profundidad 3.5 a 5.5 mm).',
    treatment: 'Periodontograma completo a 6 puntos del sextante afectado (o toda la boca si 2+ sextantes) y terapia básica (RAR).',
    colorClass: 'text-orange-500',
    bgClass: 'bg-orange-500/10 dark:bg-orange-950/40',
    borderClass: 'border-orange-500/40'
  },
  '4': {
    code: 4,
    label: 'Código 4',
    badge: 'Bolsa >5.5mm',
    clinicalMeaning: 'Periodontitis avanzada con bolsas profundas y pérdida ósea severa.',
    whoProbeFinding: 'Banda coloreada completamente oculta en la bolsa periodontal (> 5.5 mm).',
    treatment: 'Periodontograma completo a 6 puntos de toda la boca, serie radiográfica periapical y tratamiento periodontal especializado.',
    colorClass: 'text-rose-500',
    bgClass: 'bg-rose-500/10 dark:bg-rose-950/40',
    borderClass: 'border-rose-500/40'
  },
  'X': {
    code: 'X',
    label: 'Código X',
    badge: 'Edéntulo',
    clinicalMeaning: 'Sextante edéntulo o con menos de 2 piezas funcionales remanentes.',
    whoProbeFinding: 'No evaluable por ausencia de soporte dentario mínimo.',
    treatment: 'Evaluar rehabilitación protésica / implantes o soporte remanente.',
    colorClass: 'text-slate-400',
    bgClass: 'bg-slate-500/10 dark:bg-slate-800/40',
    borderClass: 'border-slate-500/40'
  }
};

export interface PsrEvaluationSummary {
  maxCode: number | 'X' | null;
  hasAsterisk: boolean;
  asteriskSextants: string[];
  evaluatedCount: number;
  totalSextants: number;
  isComplete: boolean;
  overallStatus: 'Salud Periodontal' | 'Gingivitis' | 'Cálculo / Retención' | 'Periodontitis Moderada' | 'Periodontitis Avanzada' | 'Sin Evaluar' | 'Edéntulo';
  clinicalGuideline: string;
  recommendedAction: string;
  severityColor: string;
  requiresFullPeriodontogram: boolean;
}

export function evaluatePsrRecord(record?: PsrRecord | null): PsrEvaluationSummary {
  if (!record) {
    return {
      maxCode: null,
      hasAsterisk: false,
      asteriskSextants: [],
      evaluatedCount: 0,
      totalSextants: 6,
      isComplete: false,
      overallStatus: 'Sin Evaluar',
      clinicalGuideline: 'Complete el sondaje de los 6 sextantes con la sonda OMS (World Health Organization).',
      recommendedAction: 'Iniciar tamizaje periodontal en Sextante 1.',
      severityColor: 'text-slate-400',
      requiresFullPeriodontogram: false
    };
  }

  const sextantKeys: (keyof Omit<PsrRecord, 'updatedAt' | 'evaluatedBy' | 'globalRecommendation'>)[] = [
    's1', 's2', 's3', 's4', 's5', 's6'
  ];

  let maxNumericCode = -1;
  let hasXOnly = true;
  let evaluatedCount = 0;
  let hasAsterisk = false;
  const asteriskSextants: string[] = [];
  let code3Count = 0;
  let code4Count = 0;

  sextantKeys.forEach((key, idx) => {
    const s = record[key];
    if (s && s.code !== null && s.code !== undefined) {
      evaluatedCount++;
      if (s.hasAsterisk) {
        hasAsterisk = true;
        asteriskSextants.push(`S${idx + 1}`);
      }

      if (typeof s.code === 'number') {
        hasXOnly = false;
        if (s.code > maxNumericCode) {
          maxNumericCode = s.code;
        }
        if (s.code === 3) code3Count++;
        if (s.code === 4) code4Count++;
      } else if (s.code !== 'X') {
        hasXOnly = false;
      }
    }
  });

  if (evaluatedCount === 0) {
    return {
      maxCode: null,
      hasAsterisk: false,
      asteriskSextants: [],
      evaluatedCount: 0,
      totalSextants: 6,
      isComplete: false,
      overallStatus: 'Sin Evaluar',
      clinicalGuideline: 'No se ha registrado tamizaje PSR para este paciente.',
      recommendedAction: 'Realice el sondaje rápido por sextantes con sonda OMS de bolita.',
      severityColor: 'text-slate-400',
      requiresFullPeriodontogram: false
    };
  }

  const isComplete = evaluatedCount === 6;
  let maxCode: number | 'X' | null = maxNumericCode >= 0 ? maxNumericCode : (hasXOnly ? 'X' : null);

  let overallStatus: PsrEvaluationSummary['overallStatus'] = 'Salud Periodontal';
  let clinicalGuideline = '';
  let recommendedAction = '';
  let severityColor = 'text-emerald-500';
  let requiresFullPeriodontogram = false;

  if (maxCode === 4) {
    overallStatus = 'Periodontitis Avanzada';
    severityColor = 'text-rose-500';
    requiresFullPeriodontogram = true;
    clinicalGuideline = 'Código 4 detectado: bolsa periodontal profunda > 5.5 mm. Pérdida de soporte óseo crítica.';
    recommendedAction = 'Mapeo periodontal completo a 6 puntos de toda la boca, serie radiográfica periapical completa y tratamiento de especialista (Fase 1 + Reevaluación).';
  } else if (maxCode === 3) {
    overallStatus = 'Periodontitis Moderada';
    severityColor = 'text-orange-500';
    requiresFullPeriodontogram = true;
    if (code3Count >= 2) {
      clinicalGuideline = `Múltiples sextantes con Código 3 (${code3Count} sextantes con bolsas de 3.5 a 5.5 mm).`;
      recommendedAction = 'Realizar periodontograma completo a 6 puntos en toda la boca y planificar terapia RAR.';
    } else {
      clinicalGuideline = 'Código 3 localizado: bolsa de 3.5 a 5.5 mm en un sextante.';
      recommendedAction = 'Realizar periodontograma completo a 6 puntos en el sextante afectado e iniciar terapia no quirúrgica (RAR).';
    }
  } else if (maxCode === 2) {
    overallStatus = 'Cálculo / Retención';
    severityColor = 'text-amber-500';
    clinicalGuideline = 'Código 2: Presencia de depósitos de cálculo supra o subgingival y/o márgenes desbordantes sin formación de bolsa profunda.';
    recommendedAction = 'Destartraje y profilaxis profesional (tartrectomía), pulido dental y ajuste o reemplazo de restauraciones desbordantes.';
  } else if (maxCode === 1) {
    overallStatus = 'Gingivitis';
    severityColor = 'text-sky-500';
    clinicalGuideline = 'Código 1: Sangrado al sondaje sin bolsa ni cálculo visible.';
    recommendedAction = 'Profilaxis dental, instrucción intensiva de higiene bucal, uso de hilo dental o cepillos interproximales.';
  } else if (maxCode === 0) {
    overallStatus = 'Salud Periodontal';
    severityColor = 'text-emerald-500';
    clinicalGuideline = 'Código 0 en todos los sextantes evaluados. Tejidos gingivales clínicamente sanos.';
    recommendedAction = 'Mantener programa de prevención habitual y control semestral/anual.';
  } else if (maxCode === 'X') {
    overallStatus = 'Edéntulo';
    severityColor = 'text-slate-400';
    clinicalGuideline = 'Sextantes edéntulos o con menos de dos piezas.';
    recommendedAction = 'Evaluar soporte mucoso para rehabilitación protésica.';
  }

  if (hasAsterisk) {
    clinicalGuideline += ` [ALERTA * en ${asteriskSextants.join(', ')}: hallazgo de complejidad clínica como furcación, movilidad patológica grado 2+, recesión ≥ 3.5mm o defecto mucogingival].`;
    recommendedAction += ' Requiere evaluación minuciosa de las piezas con asterisco.';
  }

  return {
    maxCode,
    hasAsterisk,
    asteriskSextants,
    evaluatedCount,
    totalSextants: 6,
    isComplete,
    overallStatus,
    clinicalGuideline,
    recommendedAction,
    severityColor,
    requiresFullPeriodontogram
  };
}
