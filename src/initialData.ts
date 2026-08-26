import { Patient, ToothState, PeriodonState, Appointment, OLearyState, Anamnesis, XRayImage, TreatmentPlan, TreatmentProcedure } from "./types";

// Adult FDI Two-Digit Notation Teeth lists:
export const UPPER_TEETH = {
  right: [18, 17, 16, 15, 14, 13, 12, 11],
  left: [21, 22, 23, 24, 25, 26, 27, 28]
};

export const LOWER_TEETH = {
  right: [48, 47, 46, 45, 44, 43, 42, 41],
  left: [31, 32, 33, 34, 35, 36, 37, 38]
};

export const ALL_TEETH_NUMBERS = [
  ...UPPER_TEETH.right, ...UPPER_TEETH.left,
  ...LOWER_TEETH.right, ...LOWER_TEETH.left
];

export function createEmptyOdontogram(): Record<number, ToothState> {
  const odo: Record<number, ToothState> = {};
  ALL_TEETH_NUMBERS.forEach((num) => {
    odo[num] = {
      toothNumber: num,
      surfaces: {
        vestibular: "sano",
        occlusal: "sano",
        lingual: "sano",
        mesial: "sano",
        distal: "sano",
      },
      condition: "sano",
    };
  });
  return odo;
}

export function createEmptyPeriodontogram(): Record<number, PeriodonState> {
  const perio: Record<number, PeriodonState> = {};
  ALL_TEETH_NUMBERS.forEach((num) => {
    perio[num] = {
      toothNumber: num,
      vestibularPocket: { mesial: 2, central: 1, distal: 2 },
      palatinoPocket: { mesial: 2, central: 1, distal: 2 },
      vestibularRecess: { mesial: 0, central: 0, distal: 0 },
      palatinoRecess: { mesial: 0, central: 0, distal: 0 },
      sangradoVestibular: { mesial: false, central: false, distal: false },
      sangradoPalatino: { mesial: false, central: false, distal: false },
      supuracionVestibular: { mesial: false, central: false, distal: false },
      supuracionPalatino: { mesial: false, central: false, distal: false },
      placaVestibular: { mesial: false, central: false, distal: false },
      placaPalatino: { mesial: false, central: false, distal: false },
      movilidad: 0,
      furca: 0,
    };
  });
  return perio;
}

export function createEmptyOLeary(): Record<number, OLearyState> {
  const oleary: Record<number, OLearyState> = {};
  ALL_TEETH_NUMBERS.forEach((num) => {
    oleary[num] = {
      toothNumber: num,
      mesial: false,
      distal: false,
      vestibular: false,
      lingual: false,
    };
  });
  return oleary;
}

export function createEmptyAnamnesis(): Anamnesis {
  return {
    hta: false,
    diabetes: false,
    tabaquismo: 0,
    alergias: "",
    dolorActual: "ninguno",
    notasSistemicas: "",
    anticoagulantes: false,
    tipoAnticoagulante: "",
    valorINR: "",
    bifosfonatos: false,
    viaBifosfonatos: "ninguno",
    profilaxisAntibiotica: false,
    razonProfilaxis: "",
    presionSistolica: 120,
    presionDiastolica: 80,
    alergiaAnestesia: "Ninguna",
    alergiaLatex: false,
    embarazo: false,
    biotipoPeriodontal: "medio"
  };
}

export function createEmptyTreatmentPlan(): TreatmentPlan {
  return {
    procedures: [],
    financing: {
      months: 12,
      downPayment: 0,
      interestRate: 15
    }
  };
}

export const INITIAL_PATIENTS: Patient[] = [
  {
    id: "pat-1",
    name: "Carlos Mendoza Silva",
    rut: "12.345.678-5",
    phone: "+56 9 8472 1923",
    email: "carlos.mendoza@email.com",
    birthdate: "1983-05-14",
    notes: "Paciente con antecedentes de hipertensión controlada. Refiere sensibilidad en el cuadrante superior derecho.",
    createdAt: "2026-03-10T10:00:00Z",
    flowStatus: "en_sillon",
    chairAssigned: "Sillón 1",
    checkInTime: "15:05",
    statusUpdatedAt: "15:10",
    odontogram: {
      ...createEmptyOdontogram(),
      16: {
        toothNumber: 16,
        surfaces: {
          vestibular: "caries",
          occlusal: "caries",
          lingual: "sano",
          mesial: "sano",
          distal: "sano",
        },
        condition: "sano",
      },
      14: {
        toothNumber: 14,
        surfaces: {
          vestibular: "sano",
          occlusal: "obturado",
          lingual: "sano",
          mesial: "sano",
          distal: "sano",
        },
        condition: "sano",
      },
      24: {
        toothNumber: 24,
        surfaces: {
          vestibular: "sano",
          occlusal: "sano",
          lingual: "sano",
          mesial: "sano",
          distal: "sano",
        },
        condition: "ausente",
      },
      36: {
        toothNumber: 36,
        surfaces: {
          vestibular: "sano",
          occlusal: "sano",
          lingual: "sano",
          mesial: "sano",
          distal: "sano",
        },
        condition: "endodoncia",
      },
      46: {
        toothNumber: 46,
        surfaces: {
          vestibular: "sano",
          occlusal: "sano",
          lingual: "sano",
          mesial: "sano",
          distal: "sano",
        },
        condition: "implante",
      }
    },
    periodontogram: {
      ...createEmptyPeriodontogram(),
      17: {
        toothNumber: 17,
        vestibularPocket: { mesial: 4, central: 2, distal: 4 },
        palatinoPocket: { mesial: 3, central: 2, distal: 3 },
        vestibularRecess: { mesial: 1, central: 0, distal: 1 },
        palatinoRecess: { mesial: 0, central: 0, distal: 0 },
        sangradoVestibular: { mesial: true, central: false, distal: true },
        sangradoPalatino: { mesial: false, central: false, distal: false },
        supuracionVestibular: { mesial: false, central: false, distal: false },
        supuracionPalatino: { mesial: false, central: false, distal: false },
        placaVestibular: { mesial: true, central: true, distal: false },
        placaPalatino: { mesial: false, central: false, distal: false },
        movilidad: 1,
        furca: 0
      },
      16: {
        toothNumber: 16,
        vestibularPocket: { mesial: 5, central: 3, distal: 6 },
        palatinoPocket: { mesial: 4, central: 3, distal: 5 },
        vestibularRecess: { mesial: 2, central: 1, distal: 2 },
        palatinoRecess: { mesial: 1, central: 1, distal: 1 },
        sangradoVestibular: { mesial: true, central: true, distal: true },
        sangradoPalatino: { mesial: true, central: false, distal: true },
        supuracionVestibular: { mesial: true, central: false, distal: false },
        supuracionPalatino: { mesial: false, central: false, distal: false },
        placaVestibular: { mesial: true, central: true, distal: true },
        placaPalatino: { mesial: true, central: true, distal: true },
        movilidad: 2,
        furca: 1
      },
      46: {
        toothNumber: 46,
        vestibularPocket: { mesial: 2, central: 1, distal: 2 },
        palatinoPocket: { mesial: 2, central: 1, distal: 2 },
        vestibularRecess: { mesial: 0, central: 0, distal: 0 },
        palatinoRecess: { mesial: 0, central: 0, distal: 0 },
        sangradoVestibular: { mesial: false, central: false, distal: false },
        sangradoPalatino: { mesial: false, central: false, distal: false },
        supuracionVestibular: { mesial: false, central: false, distal: false },
        supuracionPalatino: { mesial: false, central: false, distal: false },
        placaVestibular: { mesial: false, central: false, distal: false },
        placaPalatino: { mesial: false, central: false, distal: false },
        movilidad: 0,
        furca: 0
      }
    },
    oLeary: createEmptyOLeary(),
    anamnesis: {
      ...createEmptyAnamnesis(),
      hta: true,
    },
    xRays: [],
    treatmentPlan: createEmptyTreatmentPlan(),
    evolutions: []
  },
  {
    id: "pat-2",
    name: "Ana María Valenzuela",
    rut: "18.943.210-K",
    phone: "+56 9 7321 0044",
    email: "ana.valenzuela@email.com",
    birthdate: "1994-09-22",
    notes: "Paciente sana de 31 años. Acude por limpieza semestral de rutina. Excelente higiene general, bruxismo leve en las noches.",
    createdAt: "2026-05-18T14:30:00Z",
    flowStatus: "espera",
    checkInTime: "16:15",
    statusUpdatedAt: "16:15",
    odontogram: createEmptyOdontogram(),
    periodontogram: createEmptyPeriodontogram(),
    oLeary: createEmptyOLeary(),
    anamnesis: createEmptyAnamnesis(),
    xRays: [],
    treatmentPlan: createEmptyTreatmentPlan(),
    evolutions: []
  },
  {
    id: "pat-3",
    name: "Roberto Gómez Ortiz",
    rut: "9.876.543-2",
    phone: "+56 9 9128 4432",
    email: "rgomez.ortiz@email.com",
    birthdate: "1965-11-03",
    notes: "Fumador pesado (10 cigarrillos/día). Indica sangrado profuso al cepillarse y movilidad subjetiva.",
    createdAt: "2026-06-01T08:15:00Z",
    flowStatus: "programado",
    odontogram: {
      ...createEmptyOdontogram(),
      21: {
        toothNumber: 21,
        surfaces: {
          vestibular: "obturado",
          occlusal: "sano",
          lingual: "sano",
          mesial: "sano",
          distal: "sano",
        },
        condition: "sano",
      }
    },
    periodontogram: {
      ...createEmptyPeriodontogram(),
      31: {
        toothNumber: 31,
        vestibularPocket: { mesial: 4, central: 3, distal: 4 },
        palatinoPocket: { mesial: 4, central: 3, distal: 5 },
        vestibularRecess: { mesial: 2, central: 1, distal: 2 },
        palatinoRecess: { mesial: 1, central: 2, distal: 1 },
        sangradoVestibular: { mesial: true, central: true, distal: true },
        sangradoPalatino: { mesial: true, central: true, distal: true },
        supuracionVestibular: { mesial: false, central: false, distal: false },
        supuracionPalatino: { mesial: false, central: false, distal: false },
        placaVestibular: { mesial: true, central: true, distal: true },
        placaPalatino: { mesial: true, central: true, distal: true },
        movilidad: 2,
        furca: 0
      },
      32: {
        toothNumber: 32,
        vestibularPocket: { mesial: 3, central: 2, distal: 4 },
        palatinoPocket: { mesial: 3, central: 3, distal: 4 },
        vestibularRecess: { mesial: 1, central: 1, distal: 1 },
        palatinoRecess: { mesial: 0, central: 0, distal: 0 },
        sangradoVestibular: { mesial: true, central: false, distal: true },
        sangradoPalatino: { mesial: true, central: false, distal: true },
        supuracionVestibular: { mesial: false, central: false, distal: false },
        supuracionPalatino: { mesial: false, central: false, distal: false },
        placaVestibular: { mesial: true, central: true, distal: true },
        placaPalatino: { mesial: false, central: true, distal: false },
        movilidad: 1,
        furca: 0
      },
      41: {
        toothNumber: 41,
        vestibularPocket: { mesial: 5, central: 4, distal: 5 },
        palatinoPocket: { mesial: 4, central: 3, distal: 4 },
        vestibularRecess: { mesial: 2, central: 1, distal: 2 },
        palatinoRecess: { mesial: 2, central: 1, distal: 2 },
        sangradoVestibular: { mesial: true, central: true, distal: true },
        sangradoPalatino: { mesial: true, central: true, distal: true },
        supuracionVestibular: { mesial: false, central: false, distal: false },
        supuracionPalatino: { mesial: false, central: false, distal: false },
        placaVestibular: { mesial: true, central: true, distal: true },
        placaPalatino: { mesial: true, central: true, distal: true },
        movilidad: 2,
        furca: 0
      },
      42: {
        toothNumber: 42,
        vestibularPocket: { mesial: 4, central: 3, distal: 4 },
        palatinoPocket: { mesial: 4, central: 2, distal: 4 },
        vestibularRecess: { mesial: 1, central: 0, distal: 1 },
        palatinoRecess: { mesial: 1, central: 0, distal: 1 },
        sangradoVestibular: { mesial: true, central: false, distal: true },
        sangradoPalatino: { mesial: true, central: false, distal: true },
        supuracionVestibular: { mesial: false, central: false, distal: false },
        supuracionPalatino: { mesial: false, central: false, distal: false },
        placaVestibular: { mesial: true, central: true, distal: true },
        placaPalatino: { mesial: true, central: false, distal: true },
        movilidad: 1,
        furca: 0
      }
    },
    oLeary: createEmptyOLeary(),
    anamnesis: {
      ...createEmptyAnamnesis(),
      tabaquismo: 10
    },
    xRays: [],
    treatmentPlan: createEmptyTreatmentPlan(),
    evolutions: []
  }
];

const getTodayStr = (offsetDays = 0): string => {
  const d = new Date();
  if (offsetDays !== 0) d.setDate(d.getDate() + offsetDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: "app-1",
    patientId: "pat-1",
    patientName: "Carlos Mendoza Silva",
    date: getTodayStr(0),
    time: "15:00",
    treatment: "Tratamiento Periodontal Quadrant Upper Right & Obturación P. 16",
    status: "Confirmed",
    box: "Sillón 1"
  },
  {
    id: "app-2",
    patientId: "pat-2",
    patientName: "Ana María Valenzuela",
    date: getTodayStr(0),
    time: "16:30",
    treatment: "Limpieza ultrasónica, Profilaxis y Guardia Oclusal",
    status: "Pending",
    box: "Sillón 2"
  },
  {
    id: "app-3",
    patientId: "pat-3",
    patientName: "Roberto Gómez Ortiz",
    date: getTodayStr(1),
    time: "09:00",
    treatment: "Sondaje periodontal completo y raspado coronorradicular",
    status: "Confirmed",
    box: "Sillón 1"
  }
];
