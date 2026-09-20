import React, { useState, useEffect } from "react";
import { PeriodonState, ToothState, Patient } from "../types";
import { UPPER_TEETH, LOWER_TEETH, ALL_TEETH_NUMBERS } from "../initialData";
import InteractiveTooth3D from "./InteractiveTooth3D";
import FastProbingBar from "./FastProbingBar";
import PeriodontogramComparisonModal from "./PeriodontogramComparisonModal";
import { 
  Droplet, 
  CircleDot, 
  Info, 
  AlertTriangle, 
  ChevronRight, 
  ChevronLeft,
  Activity, 
  Percent,
  Keyboard,
  Sparkles,
  Zap,
  Award,
  Settings,
  Mic,
  MicOff,
  History,
  Stethoscope,
  Camera
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { recordHipaaAudit } from "../utils/hipaaAudit";

const ANATOMY_CACHE: Record<string, any> = {};

const getToothAnatomyPaths = (num: number, arch: "upper" | "lower") => {
  const cacheKey = `${num}-${arch}`;
  if (ANATOMY_CACHE[cacheKey]) return ANATOMY_CACHE[cacheKey];

  const lastDigit = num % 10;
  let family: "molar" | "premolar" | "canine" | "incisor" = "incisor";
  if (lastDigit === 1 || lastDigit === 2) family = "incisor";
  else if (lastDigit === 3) family = "canine";
  else if (lastDigit === 4 || lastDigit === 5) family = "premolar";
  else family = "molar";

  let result: any;
  if (arch === "upper") {
    switch (family) {
      case "molar":
        result = {
          rootPath: "M 32,80 C 12,42 22,22 28,12 C 34,26 36,46 42,80 C 44,46 47,24 49,8 C 51,24 54,46 56,80 C 58,46 60,26 66,12 C 72,22 82,42 68,80 Z",
          crownPath: "M 32,80 C 21,95 24,125 35,131 Q 50,135 65,131 C 76,125 79,95 68,80 Z",
          dentinPath: "M 35,80 C 23,48 31,30 35,20 C 39,32 40,50 44,80 C 46,50 48,32 50,16 C 52,32 54,50 56,80 C 58,50 59,32 63,20 C 67,30 75,48 65,80 Z",
          pulpPath: "M 44,80 C 42,50 43,36 43,24 C 44,36 45,55 48,80 C 49,55 50,36 51,24 C 50,36 51,50 49,80 Z",
          highlightPath: "M 38,84 C 32,94 34,118 43,123",
          ligamentPath: "M 29,80 C 9,38 19,18 26,8 C 32,24 34,44 41,80 C 43,44 46,22 49,4 C 52,22 55,44 57,80 C 59,44 61,24 67,8 C 74,18 84,38 71,80"
        };
        break;
      case "premolar":
        result = {
          rootPath: "M 34,80 C 20,40 33,24 36,12 C 39,26 42,46 47,80 C 50,46 53,26 56,12 C 59,24 72,40 64,80 Z",
          crownPath: "M 34,80 C 24,94 28,124 44,128 Q 50,130 56,128 C 72,124 76,94 64,80 Z",
          dentinPath: "M 37,80 C 27,45 36,32 39,20 C 41,32 43,48 48,80 C 50,48 52,32 54,20 C 57,32 66,45 61,80 Z",
          pulpPath: "M 45,80 C 43,50 44,36 44,22 C 45,36 47,55 49,80 C 50,55 52,36 52,22 C 51,36 52,50 50,80 Z",
          highlightPath: "M 39,84 C 33,94 35,118 44,122",
          ligamentPath: "M 31,80 C 17,36 30,20 34,8 C 37,22 40,42 46,80 C 49,42 52,22 55,8 C 58,20 71,36 67,80"
        };
        break;
      case "canine":
        result = {
          rootPath: "M 35,80 C 23,40 37,16 46,2 C 48,16 62,40 65,80 Z",
          crownPath: "M 35,80 C 25,95 28,120 50,134 C 72,120 75,95 65,80 Z",
          dentinPath: "M 38,80 C 29,45 40,24 47,10 C 49,24 60,45 62,80 Z",
          pulpPath: "M 46,80 C 43,50 45,32 47,18 C 49,32 51,50 49,80 Z",
          highlightPath: "M 39,84 C 33,94 35,116 44,122",
          ligamentPath: "M 32,80 C 20,36 34,12 45,0 C 47,12 61,36 68,80"
        };
        break;
      case "incisor":
      default:
        result = {
          rootPath: "M 36,80 C 28,45 40,25 47,8 C 49,25 61,45 64,80 Z",
          crownPath: "M 36,80 C 28,94 30,124 38,128 L 62,128 C 70,124 72,94 64,80 Z",
          dentinPath: "M 39,80 C 33,50 42,32 48,16 C 50,32 59,50 61,80 Z",
          pulpPath: "M 46,80 C 44,52 46,36 48,22 C 50,36 52,52 50,80 Z",
          highlightPath: "M 40,84 C 34,94 35,118 41,122",
          ligamentPath: "M 33,80 C 25,41 37,21 46,4 C 48,21 60,41 67,80"
        };
        break;
    }
  } else {
    switch (family) {
      case "molar":
        result = {
          rootPath: "M 32,80 C 12,118 22,138 28,148 C 34,134 36,114 42,80 C 44,114 47,136 49,152 C 51,136 54,114 56,80 C 58,114 60,134 66,148 C 72,138 82,118 68,80 Z",
          crownPath: "M 32,80 C 21,65 24,35 35,29 Q 50,25 65,29 C 76,35 79,65 68,80 Z",
          dentinPath: "M 35,80 C 23,112 31,130 35,140 C 39,128 40,110 44,80 C 46,110 48,128 50,144 C 52,128 54,110 56,80 C 58,110 59,128 63,140 C 67,130 75,112 65,80 Z",
          pulpPath: "M 44,80 C 42,110 43,124 43,136 C 44,124 45,105 48,80 C 49,105 50,124 51,136 C 50,124 51,110 49,80 Z",
          highlightPath: "M 38,76 C 32,66 34,42 43,37",
          ligamentPath: "M 29,80 C 9,122 19,142 26,152 C 32,136 34,116 41,80 C 43,116 46,138 49,156 C 52,138 55,116 57,80 C 59,116 61,136 67,152 C 74,142 84,122 71,80"
        };
        break;
      case "premolar":
        result = {
          rootPath: "M 34,80 C 20,120 33,136 36,148 C 39,134 42,114 47,80 C 50,114 53,134 56,148 C 59,136 72,120 64,80 Z",
          crownPath: "M 34,80 C 24,66 28,36 44,32 Q 50,30 56,32 C 72,36 76,66 64,80 Z",
          dentinPath: "M 37,80 C 27,115 36,128 39,140 C 41,128 43,112 48,80 C 50,112 52,128 54,140 C 57,128 66,115 61,80 Z",
          pulpPath: "M 45,80 C 43,110 44,124 44,138 C 45,124 47,105 49,80 C 50,105 52,124 52,138 C 51,124 52,110 50,80 Z",
          highlightPath: "M 39,76 C 33,66 35,42 44,38",
          ligamentPath: "M 31,80 C 17,124 30,140 34,152 C 37,138 40,118 46,80 C 49,118 52,138 55,152 C 58,140 71,124 67,80"
        };
        break;
      case "canine":
        result = {
          rootPath: "M 35,80 C 23,120 37,144 46,158 C 48,144 62,120 65,80 Z",
          crownPath: "M 35,80 C 25,65 28,40 50,26 C 72,40 75,65 65,80 Z",
          dentinPath: "M 38,80 C 29,115 40,136 47,150 C 49,136 60,115 62,80 Z",
          pulpPath: "M 46,80 C 43,110 45,128 47,142 C 49,128 51,110 49,80 Z",
          highlightPath: "M 39,76 C 33,66 35,44 44,38",
          ligamentPath: "M 32,80 C 20,124 34,148 45,160 C 47,148 61,124 68,80"
        };
        break;
      case "incisor":
      default:
        result = {
          rootPath: "M 36,80 C 28,115 40,135 47,152 C 49,135 61,115 64,80 Z",
          crownPath: "M 36,80 C 28,66 30,36 38,32 L 62,32 C 70,36 72,66 64,80 Z",
          dentinPath: "M 39,80 C 33,110 42,128 48,144 C 50,128 59,110 61,80 Z",
          pulpPath: "M 46,80 C 44,108 46,124 48,138 C 50,124 52,108 50,80 Z",
          highlightPath: "M 40,76 C 34,66 35,42 41,38",
          ligamentPath: "M 33,80 C 25,119 37,139 46,156 C 48,139 60,119 67,80"
        };
        break;
    }
  }

  ANATOMY_CACHE[cacheKey] = result;
  return result;
};

interface PeriodontogramaProps {
  periodontogram: Record<number, PeriodonState>;
  onChange: (updatedPeriodontogram: Record<number, PeriodonState>) => void;
  odontogram?: Record<number, ToothState>;
  patient?: Patient | null;
  onUpdatePatient?: (updatedPatient: Patient) => void;
  onOpenChairMode?: () => void;
  onNavigateToPsr?: () => void;
}

function PeriodontogramaComponent({ periodontogram, onChange, odontogram, patient, onUpdatePatient, onOpenChairMode, onNavigateToPsr }: PeriodontogramaProps) {
  const [selectedTooth, setSelectedTooth] = useState<number>(16);
  const [activeArch, setActiveArch] = useState<"upper" | "lower">("upper");

  const teethList = activeArch === "upper" 
    ? [...UPPER_TEETH.right, ...UPPER_TEETH.left]
    : [...LOWER_TEETH.right, ...LOWER_TEETH.left];

  // 3D Tooth & Bone Support interactive states

  // Keyboard shortcut assistant
  const [keyboardMode, setKeyboardMode] = useState<boolean>(false);
  const [isFastProbingActive, setIsFastProbingActive] = useState<boolean>(false);
  const [isComparisonModalOpen, setIsComparisonModalOpen] = useState<boolean>(false);
  const [inputMetric, setInputMetric] = useState<"pocket" | "recess">("pocket");
  const [inputSurface, setInputSurface] = useState<"vestibular" | "palatino">("vestibular");
  const [inputPosition, setInputPosition] = useState<"mesial" | "central" | "distal">("mesial");

  // Audit access to Periodontogram
  useEffect(() => {
    if (patient?.id) {
      recordHipaaAudit("VIEW_PERIODONTOGRAM", `Acceso al periodontograma a 6 puntos de ${patient.name}.`, {
        patientId: patient.id,
        patientName: patient.name,
        resource: "Periodontograma Clínico ePHI",
        severity: "info"
      });
    }
  }, [patient?.id]);

  useEffect(() => {
    if (isComparisonModalOpen && patient?.id) {
      recordHipaaAudit("COMPARE_PERIODONTOGRAM", `Comparación de evolución periodontal histórica para ${patient.name}.`, {
        patientId: patient.id,
        patientName: patient.name,
        resource: "Periodontograma Histórico ePHI",
        severity: "info"
      });
    }
  }, [isComparisonModalOpen, patient?.id]);

  // Voice assistant clinical mode states
  const [voiceChartingMode, setVoiceChartingMode] = useState<boolean>(false);
  const [voiceTranscript, setVoiceTranscript] = useState<string>("");
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const recognitionRef = React.useRef<any>(null);

  const voiceStateRef = React.useRef({
    selectedTooth,
    inputMetric,
    inputSurface,
    inputPosition,
    periodontogram,
    teethList,
  });

  useEffect(() => {
    voiceStateRef.current = {
      selectedTooth,
      inputMetric,
      inputSurface,
      inputPosition,
      periodontogram,
      teethList,
    };
  }, [selectedTooth, inputMetric, inputSurface, inputPosition, periodontogram, teethList]);

  // Prognosis and Lang & Tonetti Risk parameters (synced back to patient or internal state fallbacks)
  const [internalSmoking, setInternalSmoking] = useState<number>(0);
  const [internalDiabetes, setInternalDiabetes] = useState<"none" | "controlled" | "severe">("none");
  const [internalAge, setInternalAge] = useState<number>(45);

  const getEffectiveAge = () => {
    if (patient?.anamnesis?.edadSimulada) return patient.anamnesis.edadSimulada;
    if (patient?.birthdate) {
      const birth = new Date(patient.birthdate);
      const now = new Date();
      let age = now.getFullYear() - birth.getFullYear();
      const m = now.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
      return isNaN(age) || age <= 0 ? 45 : age;
    }
    return internalAge;
  };

  const praSmoking = patient ? (patient.anamnesis?.tabaquismo ?? 0) : internalSmoking;
  const praDiabetes = patient 
    ? (patient.anamnesis?.diabetesStatus ?? (patient.anamnesis?.diabetes ? "controlled" : "none")) 
    : internalDiabetes;
  const praAge = getEffectiveAge();

  const handleSmokingChange = (val: number) => {
    if (patient && onUpdatePatient) {
      onUpdatePatient({
        ...patient,
        anamnesis: {
          ...patient.anamnesis,
          tabaquismo: val
        }
      });
    } else {
      setInternalSmoking(val);
    }
  };

  const handleDiabetesChange = (val: "none" | "controlled" | "severe") => {
    if (patient && onUpdatePatient) {
      onUpdatePatient({
        ...patient,
        anamnesis: {
          ...patient.anamnesis,
          diabetes: val !== "none",
          diabetesStatus: val
        }
      });
    } else {
      setInternalDiabetes(val);
    }
  };

  const handleAgeChange = (val: number) => {
    if (patient && onUpdatePatient) {
      onUpdatePatient({
        ...patient,
        anamnesis: {
          ...patient.anamnesis,
          edadSimulada: val
        }
      });
    } else {
      setInternalAge(val);
    }
  };

  // teethList moved to top of component to support voice hooks

  const isUpper = UPPER_TEETH.right.includes(selectedTooth) || UPPER_TEETH.left.includes(selectedTooth);

  // Dynamically calculate clinical O'Leary Plaque Index and BOP Index for the active patient
  let totalEvaluatedSurfaces = 0;
  let plaqueSurfaces = 0;
  let bopSurfaces = 0;
  let pocketsGreaterEqual5 = 0;
  let maxCALInMouth = 0;

  const allTeeth = [...UPPER_TEETH.right, ...UPPER_TEETH.left, ...LOWER_TEETH.right, ...LOWER_TEETH.left];

  allTeeth.forEach((toothNumber) => {
    // Skip absent teeth from indices calculation
    const toothCondition = odontogram?.[toothNumber]?.condition;
    if (toothCondition === "ausente") return;

    // Each present tooth has 6 evaluated surfaces (3 vestibular, 3 palatales/linguales)
    totalEvaluatedSurfaces += 6;

    const state = periodontogram?.[toothNumber];
    if (state) {
      if (state.placaVestibular?.mesial) plaqueSurfaces++;
      if (state.placaVestibular?.central) plaqueSurfaces++;
      if (state.placaVestibular?.distal) plaqueSurfaces++;
      if (state.placaPalatino?.mesial) plaqueSurfaces++;
      if (state.placaPalatino?.central) plaqueSurfaces++;
      if (state.placaPalatino?.distal) plaqueSurfaces++;

      if (state.sangradoVestibular?.mesial) bopSurfaces++;
      if (state.sangradoVestibular?.central) bopSurfaces++;
      if (state.sangradoVestibular?.distal) bopSurfaces++;
      if (state.sangradoPalatino?.mesial) bopSurfaces++;
      if (state.sangradoPalatino?.central) bopSurfaces++;
      if (state.sangradoPalatino?.distal) bopSurfaces++;

      // Residual pockets counts
      const vPk = state.vestibularPocket || { mesial: 0, central: 0, distal: 0 };
      const pPk = state.palatinoPocket || { mesial: 0, central: 0, distal: 0 };
      if (vPk.mesial >= 5) pocketsGreaterEqual5++;
      if (vPk.central >= 5) pocketsGreaterEqual5++;
      if (vPk.distal >= 5) pocketsGreaterEqual5++;
      if (pPk.mesial >= 5) pocketsGreaterEqual5++;
      if (pPk.central >= 5) pocketsGreaterEqual5++;
      if (pPk.distal >= 5) pocketsGreaterEqual5++;

      // Max CAL Loss in mouth
      const vRc = state.vestibularRecess || { mesial: 0, central: 0, distal: 0 };
      const pRc = state.palatinoRecess || { mesial: 0, central: 0, distal: 0 };
      
      const calVMesial = (vPk.mesial || 0) + (vRc.mesial || 0);
      const calVCentral = (vPk.central || 0) + (vRc.central || 0);
      const calVDistal = (vPk.distal || 0) + (vRc.distal || 0);
      const calPMesial = (pPk.mesial || 0) + (pRc.mesial || 0);
      const calPCentral = (pPk.central || 0) + (pRc.central || 0);
      const calPDistal = (pPk.distal || 0) + (pRc.distal || 0);

      const toothMaxCAL = Math.max(calVMesial, calVCentral, calVDistal, calPMesial, calPCentral, calPDistal);
      if (toothMaxCAL > maxCALInMouth) {
        maxCALInMouth = toothMaxCAL;
      }
    }
  });

  const oLearyIndexValue = totalEvaluatedSurfaces > 0 
    ? Math.round((plaqueSurfaces / totalEvaluatedSurfaces) * 100) 
    : 0;
  const normalizedOLeary = Math.min(100, oLearyIndexValue);

  const bopIndexValue = totalEvaluatedSurfaces > 0 
    ? Math.round((bopSurfaces / totalEvaluatedSurfaces) * 100)
    : 0;
  const normalizedBop = Math.min(100, bopIndexValue);

  // Assess missing teeth count
  let missingTeethCount = 0;
  if (odontogram) {
    Object.values(odontogram).forEach((t) => {
      if (t.condition === "ausente") missingTeethCount++;
    });
  } else {
    // Falls back to checking if standard periodontogram pockets are entirely empty (0/0/0)
    Object.values(periodontogram || {}).forEach((state) => {
      const is0 = (state.vestibularPocket?.mesial === 0) && (state.vestibularPocket?.central === 0) && (state.vestibularPocket?.distal === 0);
      if (is0) missingTeethCount++;
    });
  }

  // Define Lang & Tonetti risk model metrics
  const praiseRatio = praAge > 0 ? maxCALInMouth / praAge : 0;
  
  // High risk pillars
  const isBopHigh = normalizedBop > 25;
  const isPocketsHigh = pocketsGreaterEqual5 > 4;
  const isMissingHigh = missingTeethCount > 8;
  const isBoneLossHigh = praiseRatio > 1.0;
  const isDiabetesHigh = praDiabetes === "severe";
  const isSmokingHigh = praSmoking >= 10;

  let highRiskPillarsCount = 0;
  if (isBopHigh) highRiskPillarsCount++;
  if (isPocketsHigh) highRiskPillarsCount++;
  if (isMissingHigh) highRiskPillarsCount++;
  if (isBoneLossHigh) highRiskPillarsCount++;
  if (isDiabetesHigh) highRiskPillarsCount++;
  if (isSmokingHigh) highRiskPillarsCount++;

  const overallRiskLevel = highRiskPillarsCount >= 3 
    ? "ALTO" 
    : highRiskPillarsCount === 2 
    ? "MODERADO" 
    : "BAJO";

  const handlePocketChange = (
    toothNum: number,
    surface: "vestibularPocket" | "palatinoPocket" | "vestibularRecess" | "palatinoRecess",
    position: "mesial" | "central" | "distal",
    val: number
  ) => {
    const updated = { ...periodontogram };
    const tooth = { ...updated[toothNum] };
    
    // Copy inner state
    const values = { ...tooth[surface] } as any;
    values[position] = Math.max(0, val);
    tooth[surface] = values;
    
    updated[toothNum] = tooth;
    onChange(updated);
  };

  const handleToggleFlag = (
    toothNum: number,
    surface: "sangradoVestibular" | "sangradoPalatino" | "placaVestibular" | "placaPalatino",
    position: "mesial" | "central" | "distal"
  ) => {
    const updated = { ...periodontogram };
    const tooth = { ...updated[toothNum] };
    
    const flags = { ...tooth[surface] } as any;
    flags[position] = !flags[position];
    tooth[surface] = flags;
    
    updated[toothNum] = tooth;
    onChange(updated);
  };

  const handleToggleSupuracion = (
    toothNum: number,
    surface: "supuracionVestibular" | "supuracionPalatino",
    position: "mesial" | "central" | "distal"
  ) => {
    const updated = { ...periodontogram };
    const tooth = { ...updated[toothNum] };
    
    const flags = { ...tooth[surface] } as any;
    flags[position] = !flags[position];
    tooth[surface] = flags;
    
    updated[toothNum] = tooth;
    onChange(updated);
  };

  // Global keydown triggers when rapid entry keyboard mode is active
  useEffect(() => {
    if (!keyboardMode) return;

    const handleGlobalKeys = (e: KeyboardEvent) => {
      // Avoid overriding physical keyboard actions when writing standard text inputs
      if (
        document.activeElement?.tagName === "INPUT" && 
        !document.activeElement.classList.contains("perio-shortcut-raw")
      ) {
        return;
      }

      const key = e.key.toLowerCase();

      // Navigation keys
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        const idx = teethList.indexOf(selectedTooth);
        const prevIdx = idx > 0 ? idx - 1 : teethList.length - 1;
        setSelectedTooth(teethList[prevIdx]);
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        const idx = teethList.indexOf(selectedTooth);
        const nextIdx = (idx + 1) % teethList.length;
        setSelectedTooth(teethList[nextIdx]);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setInputMetric((p) => (p === "recess" ? "pocket" : "recess"));
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setInputMetric((p) => (p === "pocket" ? "recess" : "pocket"));
        return;
      }

      // Quick Numeric Keypad Entry (0 - 9)
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        const numVal = parseInt(e.key);
        const targetField = inputSurface === "vestibular"
          ? (inputMetric === "pocket" ? "vestibularPocket" : "vestibularRecess")
          : (inputMetric === "pocket" ? "palatinoPocket" : "palatinoRecess");

        handlePocketChange(selectedTooth, targetField, inputPosition, numVal);

        // Advance sequence: mesial -> central -> distal
        if (inputPosition === "mesial") {
          setInputPosition("central");
        } else if (inputPosition === "central") {
          setInputPosition("distal");
        } else {
          // distal completed, now toggle surface/metric or advance tooth
          if (inputSurface === "vestibular") {
            setInputSurface("palatino");
            setInputPosition("mesial");
          } else {
            // Both vestibular and palatine faces completed, move to next tooth clinical sequence
            const idx = teethList.indexOf(selectedTooth);
            const nextIdx = (idx + 1) % teethList.length;
            setSelectedTooth(teethList[nextIdx]);
            setInputSurface("vestibular");
            setInputPosition("mesial");
          }
        }
        return;
      }

      // Rapid hotkeys toggles
      if (key === "s" || key === "b") {
        e.preventDefault();
        const flagSurface = inputSurface === "vestibular" ? "sangradoVestibular" : "sangradoPalatino";
        handleToggleFlag(selectedTooth, flagSurface, inputPosition);
        return;
      }
      if (key === "u" || key === "d" || key === "p") {
        e.preventDefault();
        const flagSurface = inputSurface === "vestibular" ? "supuracionVestibular" : "supuracionPalatino";
        handleToggleSupuracion(selectedTooth, flagSurface, inputPosition);
        return;
      }
      if (key === "f") {
        e.preventDefault();
        const currentGrade = periodontogram[selectedTooth]?.furca || 0;
        const nextGrade = ((currentGrade + 1) % 4) as 0 | 1 | 2 | 3;
        handleNumberFlag(selectedTooth, "furca", nextGrade);
        return;
      }
    };

    window.addEventListener("keydown", handleGlobalKeys);
    return () => {
      window.removeEventListener("keydown", handleGlobalKeys);
    };
  }, [keyboardMode, selectedTooth, inputMetric, inputSurface, inputPosition, periodontogram, teethList]);

  // Voice command parsing logic for hands-free clinical input
  const parseVoiceCommand = (rawText: string): boolean => {
    const text = rawText.toLowerCase().trim();
    setVoiceTranscript(rawText);

    const {
      selectedTooth: refSelected,
      inputMetric: refMetric,
      inputSurface: refSurface,
      inputPosition: refPosition,
      teethList: refList,
    } = voiceStateRef.current;

    // Jump to Modo Sillón hands-free
    if (
      text.includes("modo sillon") ||
      text.includes("modo sillón") ||
      text.includes("abrir sillon") ||
      text.includes("activar sillon") ||
      text.includes("entrar a modo sillon") ||
      text.includes("sillon clinico") ||
      text === "sillon" ||
      text === "sillón"
    ) {
      if (onOpenChairMode) {
        onOpenChairMode();
      } else {
        window.dispatchEvent(new CustomEvent('periodash-open-chair-mode'));
      }
      return true;
    }

    // 0. Jump to tooth directly: "pieza 16", "diente 24", or FDI code
    const toothMatch = text.match(/(?:pieza|diente|fdi)\s*(\d{2})/);
    if (toothMatch && toothMatch[1]) {
      const parsedNum = parseInt(toothMatch[1], 10);
      if (refList.includes(parsedNum)) {
        setSelectedTooth(parsedNum);
        return true;
      }
    }

    // 1. Navigation & State changes
    if (text.includes("siguiente") || text.includes("avanzar")) {
      const idx = refList.indexOf(refSelected);
      const nextIdx = (idx + 1) % refList.length;
      setSelectedTooth(refList[nextIdx]);
      return true;
    }
    if (text.includes("atrás") || text.includes("anterior") || text.includes("regresar") || text.includes("atras")) {
      const idx = refList.indexOf(refSelected);
      const prevIdx = idx > 0 ? idx - 1 : refList.length - 1;
      setSelectedTooth(refList[prevIdx]);
      return true;
    }
    if (text.includes("vestibular") || text.includes("exterior") || text.includes("afuera")) {
      setInputSurface("vestibular");
      return true;
    }
    if (text.includes("palatino") || text.includes("lingual") || text.includes("interior") || text.includes("adentro")) {
      setInputSurface("palatino");
      return true;
    }
    if (text.includes("mesial")) {
      setInputPosition("mesial");
      return true;
    }
    if (text.includes("central") || text.includes("medio")) {
      setInputPosition("central");
      return true;
    }
    if (text.includes("distal")) {
      setInputPosition("distal");
      return true;
    }
    if (text.includes("sondaje") || text.includes("profundidad") || text.includes("bolsa")) {
      setInputMetric("pocket");
      return true;
    }
    if (text.includes("recesión") || text.includes("recesion") || text.includes("receso")) {
      setInputMetric("recess");
      return true;
    }

    // 2. Flags toggles
    if (text.includes("sangrado") || text.includes("sangra") || text.includes("bop") || text.includes("sangrar")) {
      const flagSurface = refSurface === "vestibular" ? "sangradoVestibular" : "sangradoPalatino";
      handleToggleFlag(refSelected, flagSurface, refPosition);
      return true;
    }
    if (text.includes("placa") || text.includes("bacterias") || text.includes("sarro")) {
      const flagSurface = refSurface === "vestibular" ? "placaVestibular" : "placaPalatino";
      handleToggleFlag(refSelected, flagSurface, refPosition);
      return true;
    }
    if (text.includes("supuración") || text.includes("supuracion") || text.includes("pus") || text.includes("supura") || text.includes("exudado")) {
      const flagSurface = refSurface === "vestibular" ? "supuracionVestibular" : "supuracionPalatino";
      handleToggleSupuracion(refSelected, flagSurface, refPosition);
      return true;
    }
    if (text.includes("furca") || text.includes("furcación") || text.includes("furcacion")) {
      const matchGrade = text.match(/furca\s*(?:grado\s*|clase\s*)?([0-3]|uno|dos|tres|cero)/i);
      let grade: 0 | 1 | 2 | 3 = 1;
      if (matchGrade && matchGrade[1]) {
        const raw = matchGrade[1].toLowerCase();
        if (raw === "0" || raw === "cero") grade = 0;
        else if (raw === "1" || raw === "uno") grade = 1;
        else if (raw === "2" || raw === "dos") grade = 2;
        else if (raw === "3" || raw === "tres") grade = 3;
      } else {
        const curr = periodontogram[refSelected]?.furca || 0;
        grade = ((curr + 1) % 4) as 0 | 1 | 2 | 3;
      }
      handleNumberFlag(refSelected, "furca", grade);
      return true;
    }

    // 3. Multi-number sequence (e.g. "4 3 2" or sequence of 3 digits)
    const numberMatches = text.match(/\b\d+\b/g);
    if (numberMatches && numberMatches.length >= 3) {
      const last3 = numberMatches.slice(-3).map(Number);
      const targetField = refSurface === "vestibular"
        ? (refMetric === "pocket" ? "vestibularPocket" : "vestibularRecess")
        : (refMetric === "pocket" ? "palatinoPocket" : "palatinoRecess");

      handlePocketChange(refSelected, targetField, "mesial", last3[0]);
      handlePocketChange(refSelected, targetField, "central", last3[1]);
      handlePocketChange(refSelected, targetField, "distal", last3[2]);

      // Distal completed, advance face or next tooth
      if (refSurface === "vestibular") {
        setInputSurface("palatino");
        setInputPosition("mesial");
      } else {
        const idx = refList.indexOf(refSelected);
        const nextIdx = (idx + 1) % refList.length;
        setSelectedTooth(refList[nextIdx]);
        setInputSurface("vestibular");
        setInputPosition("mesial");
      }
      return true;
    }

    // 4. Single number Parsing for pocket/recess values
    let val: number | null = null;
    if (text.includes("cero") || text === "0" || text.includes("nulo")) val = 0;
    else if (text.includes("uno") || text.includes("una") || text === "1") val = 1;
    else if (text.includes("dos") || text === "2") val = 2;
    else if (text.includes("tres") || text.includes("tre") || text === "3") val = 3;
    else if (text.includes("cuatro") || text === "4") val = 4;
    else if (text.includes("cinco") || text === "5") val = 5;
    else if (text.includes("seis") || text === "6") val = 6;
    else if (text.includes("siete") || text === "7") val = 7;
    else if (text.includes("ocho") || text === "8") val = 8;
    else if (text.includes("nueve") || text === "9") val = 9;
    else if (text.includes("diez") || text === "10") val = 10;
    else if (text.includes("once") || text === "11") val = 11;
    else if (text.includes("doce") || text === "12") val = 12;
    else if (text.includes("trece") || text === "13") val = 13;
    else if (text.includes("catorce") || text === "14") val = 14;
    else if (text.includes("quince") || text === "15") val = 15;

    // If a number was successfully found, set it and advance site
    if (val !== null) {
      const targetField = refSurface === "vestibular"
        ? (refMetric === "pocket" ? "vestibularPocket" : "vestibularRecess")
        : (refMetric === "pocket" ? "palatinoPocket" : "palatinoRecess");

      handlePocketChange(refSelected, targetField, refPosition, val);

      // Replicate fast advance sequence: mesial -> central -> distal
      if (refPosition === "mesial") {
        setInputPosition("central");
      } else if (refPosition === "central") {
        setInputPosition("distal");
      } else {
        // distal completed, now toggle face or advance tooth
        if (refSurface === "vestibular") {
          setInputSurface("palatino");
          setInputPosition("mesial");
        } else {
          // Both vestibular and palatine faces completed, move to next tooth clinical sequence
          const idx = refList.indexOf(refSelected);
          const nextIdx = (idx + 1) % refList.length;
          setSelectedTooth(refList[nextIdx]);
          setInputSurface("vestibular");
          setInputPosition("mesial");
        }
      }
      return true;
    }

    return false;
  };

  useEffect(() => {
    if (!voiceChartingMode) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // safe teardown
        }
        recognitionRef.current = null;
      }
      return;
    }

    setVoiceError(null);

    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      setVoiceError("Tu navegador no soporta reconocimiento de voz nativo. Por favor usa Google Chrome o Microsoft Edge.");
      setVoiceChartingMode(false);
      return;
    }

    let isTerminated = false;
    let rec: any = null;
    const handledIndices = new Set<number>();

    try {
      rec = new SpeechRecognitionClass();
    } catch {
      setVoiceError("No se pudo iniciar el servicio de reconocimiento de voz.");
      setVoiceChartingMode(false);
      return;
    }

    rec.lang = typeof navigator !== "undefined" && navigator.language?.startsWith("es")
      ? navigator.language
      : "es-ES";
    rec.interimResults = true;
    rec.continuous = true;

    rec.onresult = (event: any) => {
      try {
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const res = event.results[i];
          const transcript = res[0]?.transcript;
          if (!transcript) continue;

          if (handledIndices.has(i)) {
            continue;
          }

          if (!res.isFinal) {
            const didExecute = parseVoiceCommand(transcript);
            if (didExecute) {
              handledIndices.add(i);
            }
          } else {
            if (!handledIndices.has(i)) {
              handledIndices.add(i);
              parseVoiceCommand(transcript);
            }
          }
        }
        if (handledIndices.size > 50) {
          handledIndices.clear();
        }
      } catch {
        // Safe capture
      }
    };

    rec.onerror = (e: any) => {
      const errorType = e?.error || 'unknown';

      // Benign event in standard speech recognition (silence or stopped)
      if (errorType === 'no-speech' || errorType === 'aborted') {
        return;
      }

      // Permission or hardware errors
      if (errorType === 'not-allowed' || errorType === 'service-not-allowed') {
        isTerminated = true;
        setVoiceError("Acceso al micrófono denegado. Permite el micrófono en los ajustes de tu navegador.");
        setVoiceChartingMode(false);
        return;
      }

      if (errorType === 'audio-capture') {
        isTerminated = true;
        setVoiceError("No se detectó un micrófono disponible en tu dispositivo.");
        setVoiceChartingMode(false);
        return;
      }

      if (errorType === 'network') {
        isTerminated = true;
        setVoiceError("Error de conexión con el servicio de reconocimiento de voz.");
        setVoiceChartingMode(false);
        return;
      }

      isTerminated = true;
      setVoiceError("El servicio de voz se pausó temporalmente.");
      setVoiceChartingMode(false);
    };

    rec.onend = () => {
      handledIndices.clear();
      // Auto-restart only if active and no fatal error occurred
      if (!isTerminated && voiceStateRef.current.selectedTooth) {
        try {
          rec.start();
        } catch {
          isTerminated = true;
        }
      }
    };

    try {
      rec.start();
      recognitionRef.current = rec;
    } catch {
      setVoiceError("No se pudo activar el micrófono. Verifica los permisos de tu navegador.");
      setVoiceChartingMode(false);
    }

    return () => {
      isTerminated = true;
      if (rec) {
        try {
          rec.stop();
        } catch {
          // safe
        }
      }
      recognitionRef.current = null;
    };
  }, [voiceChartingMode]);

  const handleNumberFlag = (toothNum: number, field: "movilidad" | "furca", val: 0 | 1 | 2 | 3) => {
    const updated = { ...periodontogram };
    const tooth = { ...updated[toothNum] };
    
    tooth[field] = val;
    updated[toothNum] = tooth;
    onChange(updated);
  };

  const getToothSummary = (toothNum: number) => {
    const tooth = periodontogram[toothNum];
    if (!tooth) return { bleeding: 0, plaque: 0, maxPocket: 0, hasSuppuration: false };

    let bleeding = 0;
    let plaque = 0;
    let maxPk = 0;
    let hasSupp = false;

    const vPk = tooth.vestibularPocket || { mesial: 0, central: 0, distal: 0 };
    const pPk = tooth.palatinoPocket || { mesial: 0, central: 0, distal: 0 };
    
    maxPk = Math.max(vPk.mesial, vPk.central, vPk.distal, pPk.mesial, pPk.central, pPk.distal);

    if (tooth.sangradoVestibular?.mesial) bleeding++;
    if (tooth.sangradoVestibular?.central) bleeding++;
    if (tooth.sangradoVestibular?.distal) bleeding++;
    if (tooth.sangradoPalatino?.mesial) bleeding++;
    if (tooth.sangradoPalatino?.central) bleeding++;
    if (tooth.sangradoPalatino?.distal) bleeding++;

    if (tooth.placaVestibular?.mesial) plaque++;
    if (tooth.placaVestibular?.central) plaque++;
    if (tooth.placaVestibular?.distal) plaque++;
    if (tooth.placaPalatino?.mesial) plaque++;
    if (tooth.placaPalatino?.central) plaque++;
    if (tooth.placaPalatino?.distal) plaque++;

    if (
      tooth.supuracionVestibular?.mesial || tooth.supuracionVestibular?.central || tooth.supuracionVestibular?.distal ||
      tooth.supuracionPalatino?.mesial || tooth.supuracionPalatino?.central || tooth.supuracionPalatino?.distal
    ) {
      hasSupp = true;
    }

    return { bleeding, plaque, maxPocket: maxPk, hasSuppuration: hasSupp };
  };

  const getToothMetrics = (num: number) => {
    const data = periodontogram[num];
    const pocket = inputSurface === "vestibular" 
      ? (data?.vestibularPocket || { mesial: 2, central: 1, distal: 2 })
      : (data?.palatinoPocket || { mesial: 2, central: 1, distal: 2 });
    const recess = inputSurface === "vestibular"
      ? (data?.vestibularRecess || { mesial: 0, central: 0, distal: 0 })
      : (data?.palatinoRecess || { mesial: 0, central: 0, distal: 0 });
    
    // Check if right or left side to orient the mesial-distal points correctly from left to right on screen
    const isRightSide = (num >= 11 && num <= 18) || (num >= 41 && num <= 48);
    if (isRightSide) {
      return {
        left: { pocket: pocket.distal ?? 2, recess: recess.distal ?? 0, label: "Distal" },
        central: { pocket: pocket.central ?? 1, recess: recess.central ?? 0, label: "Central" },
        right: { pocket: pocket.mesial ?? 2, recess: recess.mesial ?? 0, label: "Mesial" },
      };
    } else {
      return {
        left: { pocket: pocket.mesial ?? 2, recess: recess.mesial ?? 0, label: "Mesial" },
        central: { pocket: pocket.central ?? 1, recess: recess.central ?? 0, label: "Central" },
        right: { pocket: pocket.distal ?? 2, recess: recess.distal ?? 0, label: "Distal" },
      };
    }
  };

  const activeToothData = periodontogram[selectedTooth];
  const toothIsImplant = odontogram?.[selectedTooth]?.condition === "implante";
  const toothIsMissing = odontogram?.[selectedTooth]?.condition === "ausente";
  const paths = getToothAnatomyPaths(selectedTooth, activeArch);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm p-6 space-y-6" id="periodonto-panel">
      
      {/* Clinician Interface Brand Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-teal-500/5 via-cyan-500/5 to-transparent p-4 rounded-xl border border-teal-500/10 dark:border-teal-500/5">
        <div>
          <span className="text-[10px] font-bold tracking-widest text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 px-2 py-0.5 rounded-md font-mono uppercase mb-2 inline-block">
            Módulo Clínico PerioTools™
          </span>
          <h3 className="text-lg font-display font-bold text-slate-800 dark:text-white">Periodontograma de Precisión Académica</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
            <Activity className="w-3.5 h-3.5 text-teal-500" />
            Cumple con estándares de Lang & Tonetti para clasificación de riesgo periodontal.
          </p>
        </div>

        {/* Arch Selector Pill & Quick Action Tools */}
        <div className="flex flex-wrap items-center gap-2">
          {onOpenChairMode && (
            <button
              onClick={onOpenChairMode}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white shadow-md active:scale-95"
              title="Activar Modo Sillón Clínico con botones XL sanitarios, manos libres por voz, sondaje 6P, PSR, Odontograma y O'Leary (Alt+S)"
            >
              <Stethoscope className="w-3.5 h-3.5" />
              <span>Modo Sillón (XL + Voz)</span>
              <span className="text-[9px] bg-white/20 px-1.5 py-0.5 rounded font-mono font-bold">Alt+S</span>
            </button>
          )}

          {onNavigateToPsr && (
            <button
              onClick={onNavigateToPsr}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/40 dark:hover:bg-teal-900/60 text-teal-700 dark:text-teal-300 border border-teal-200/80 dark:border-teal-800/80 shadow-xs"
              title="Ir al Tamizaje Periodontal Rápido PSR (OMS) por sextantes"
            >
              <Activity className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>Tamizaje PSR OMS</span>
              <span className="text-[9px] bg-teal-600 text-white dark:bg-teal-400 dark:text-slate-950 px-1.5 py-0.5 rounded-full font-bold">Rápido</span>
            </button>
          )}

          <button
            onClick={() => setIsFastProbingActive(!isFastProbingActive)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              isFastProbingActive
                ? 'bg-amber-500 text-slate-900 font-bold shadow-md'
                : 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300 hover:bg-amber-500/20'
            }`}
            title="Activar entrada rápida con dictado por voz y teclado numérico continuo"
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Sondaje Rápido & Dictado</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </button>

          {patient && (
            <button
              onClick={() => setIsComparisonModalOpen(true)}
              className="px-3 py-1.5 bg-teal-500/10 text-teal-600 dark:bg-teal-500/20 dark:text-teal-300 rounded-xl text-xs font-semibold hover:bg-teal-500/20 transition-all flex items-center gap-1.5"
              title="Comparar evolución histórica con visitas previas"
            >
              <History className="w-3.5 h-3.5" />
              Comparar Visitas ({patient.periodontogramHistory?.length || 0})
            </button>
          )}

          <div className="bg-slate-50 dark:bg-slate-800 p-1 rounded-xl flex border border-slate-100 dark:border-slate-700/80 shrink-0 select-none">
            <button
              onClick={() => {
                setActiveArch("upper");
                setSelectedTooth(16);
              }}
              className={`text-xs py-1.5 px-3.5 rounded-lg font-semibold transition-all cursor-pointer ${
                activeArch === "upper"
                  ? "bg-white dark:bg-slate-900 shadow-xs text-teal-600 dark:text-teal-400"
                  : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              }`}
            >
              Arcada Superior
            </button>
            <button
              onClick={() => {
                setActiveArch("lower");
                setSelectedTooth(46);
              }}
              className={`text-xs py-1.5 px-3.5 rounded-lg font-semibold transition-all cursor-pointer ${
                activeArch === "lower"
                  ? "bg-white dark:bg-slate-900 shadow-xs text-teal-600 dark:text-teal-400"
                  : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              }`}
            >
              Arcada Inferior
            </button>
          </div>
        </div>
      </div>

      {/* Dynamic O'Leary and BOP Analytics Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* O'Leary Index Card */}
        <div className="bg-slate-50/50 dark:bg-slate-855 border border-slate-100 dark:border-slate-800/80 p-4 rounded-xl flex items-center justify-between gap-3 shadow-2xs">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">PCR (Índice de Placa)</span>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-2xl font-display font-extrabold ${
                normalizedOLeary > 20 ? "text-rose-500" : normalizedOLeary > 10 ? "text-amber-500" : "text-emerald-500"
              }`}>
                {normalizedOLeary}%
              </span>
              <span className="text-[10px] text-slate-400 font-medium font-mono">de Placa</span>
            </div>
            <p className="text-[10px] text-slate-400 font-light leading-relaxed">
              {normalizedOLeary > 20 
                ? "Higiene deficiente (>20%). Alto riesgo de gingivitis." 
                : "Higiene clínica adecuada (≤20%)."}
            </p>
          </div>
          <div className={`w-11 h-11 rounded-full border-2 flex items-center justify-center font-mono font-bold text-[10px] ${
            normalizedOLeary > 20 
              ? "border-rose-500/50 bg-rose-500/5 text-rose-500" 
              : "border-emerald-500/50 bg-emerald-500/5 text-emerald-500"
          }`}>
            PCR
          </div>
        </div>

        {/* BOP Bleeding Index Card */}
        <div className="bg-slate-50/50 dark:bg-slate-855 border border-slate-100 dark:border-slate-800/80 p-4 rounded-xl flex items-center justify-between gap-3 shadow-2xs">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">BOP (Sangrado al Sondaje)</span>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-2xl font-display font-extrabold ${
                normalizedBop > 25 ? "text-rose-500" : "text-emerald-500"
              }`}>
                {normalizedBop}%
              </span>
              <span className="text-[10px] text-slate-400 font-medium font-mono">BOP</span>
            </div>
            <p className="text-[10px] text-slate-400 font-light leading-relaxed">
              {normalizedBop > 25 
                ? "Inflamación periodontal activa (>25%). Tratamiento urgente." 
                : "Salud gingival clínica estable."}
            </p>
          </div>
          <div className={`w-11 h-11 rounded-full border-2 flex items-center justify-center font-mono font-bold text-[10px] ${
            normalizedBop > 25 
              ? "border-rose-500/50 bg-rose-500/5 text-rose-500" 
              : "border-emerald-500/50 bg-emerald-500/5 text-emerald-500"
          }`}>
            BOP
          </div>
        </div>

        {/* Active Suppurating Teeth and general parameters */}
        <div className="bg-slate-50/50 dark:bg-slate-855 border border-slate-100 dark:border-slate-800/80 p-4 rounded-xl flex items-center justify-between gap-3 shadow-2xs">
          <div className="space-y-1 w-full">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Estado de Infección</span>
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">Bolsas Profundas:</span>
              <span className={`text-base font-bold font-mono ${pocketsGreaterEqual5 > 0 ? "text-rose-500 font-bold" : "text-emerald-500"}`}>
                {pocketsGreaterEqual5} (&ge;5mm)
              </span>
            </div>
            <div className="flex items-baseline justify-between text-[10px] text-slate-400 mt-1">
              <span>Pérdidas dentales:</span>
              <span className="font-mono font-bold">{missingTeethCount} piezas</span>
            </div>
          </div>
        </div>
      </div>

      {/* QUICK SELECTOR HORIZONTAL BAR */}
      <div className="space-y-2 border-t border-b border-slate-105 dark:border-slate-800/60 py-4">
        <div className="flex justify-between items-center px-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">
            Explorador por Pieza Dental ( FDI ):
          </span>
          <span className="text-[10px] font-mono text-slate-400 font-light">
            Selecciona un diente para ver profundidad, recesión, NIC y gráficos.
          </span>
        </div>
        
        <div className="flex gap-2 overflow-x-auto py-2 px-1 scrollbar-thin">
          {teethList.map((num) => {
            const { bleeding, plaque, maxPocket, hasSuppuration } = getToothSummary(num);
            const isSelected = selectedTooth === num;
            const hasSeverePocket = maxPocket >= 4;
            const stateIsImplant = odontogram?.[num]?.condition === "implante";
            const stateIsMissing = odontogram?.[num]?.condition === "ausente";

            return (
              <button
                key={num}
                onClick={() => setSelectedTooth(num)}
                className={`flex-shrink-0 w-14 p-2 rounded-xl border text-center transition-all cursor-pointer relative ${
                  isSelected
                    ? "bg-teal-600 border-teal-600 text-white shadow-sm scale-102"
                    : stateIsMissing
                    ? "bg-slate-100 dark:bg-slate-800/30 border-slate-200/50 dark:border-slate-800/40 text-slate-300 opacity-40 line-through"
                    : stateIsImplant
                    ? "bg-cyan-500/10 border-cyan-400/55 dark:border-cyan-500/30 text-teal-600 dark:text-cyan-400 focus:ring-1 focus:ring-cyan-500"
                    : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-slate-300 text-slate-800 dark:text-slate-200"
                }`}
              >
                {/* Tooth number and small icons */}
                <div className="flex justify-between items-center px-0.5">
                  <span className={`text-[9px] font-mono font-extrabold ${isSelected ? 'text-white/90' : 'text-slate-400'}`}>
                    {num}
                  </span>
                  {stateIsImplant && <span className="text-[8px] font-bold text-cyan-500 font-mono" title="Implante Dental">Im</span>}
                </div>
                
                {/* Max Pocket Depth */}
                <div className={`text-sm font-display font-bold mt-1 ${
                  isSelected ? 'text-white' : stateIsMissing ? 'text-slate-300 dark:text-slate-700' : hasSeverePocket ? 'text-rose-500' : 'text-slate-800 dark:text-slate-100'
                }`}>
                  {stateIsMissing ? "Ø" : `${maxPocket}mm`}
                </div>

                {/* Flags indicators */}
                <div className="flex justify-center gap-1 mt-1.5 h-1.5">
                  {bleeding > 0 && <span className={`w-1 h-1 rounded-full ${isSelected ? "bg-white" : "bg-red-500"}`} />}
                  {plaque > 0 && <span className={`w-1 h-1 rounded-full ${isSelected ? "bg-white" : "bg-amber-400"}`} />}
                  {hasSuppuration && <span className={`w-1 h-1 rounded-full ${isSelected ? "bg-white" : "bg-cyan-400"}`} />}
                </div>

                {hasSeverePocket && !stateIsMissing && (
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full border border-white" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* SELECTED TOOTH EXPANDED WORKBOARD */}
      <AnimatePresence mode="wait">
        {activeToothData && (
          <motion.div 
            key={selectedTooth}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-50/50 dark:bg-slate-800/30 p-5 rounded-2xl border border-slate-200 dark:border-slate-800"
          >
            {/* LEFT AREA: Advanced Control Config / Key Shortcuts / Bio SVG (7 Cols) */}
            <div className="lg:col-span-7 space-y-4">
              
              {/* Specialized Keyboard Shortcuts Mode Switch */}
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-3.5 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Keyboard className="w-4 h-4 text-teal-500" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Modo Teclado Ultrarrápido PerioTools
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug">
                    Digita números 0-9 para rellenar sondajes y avanzar de celda de forma continua.
                  </p>
                </div>

                <div className="flex items-center gap-3.5">
                  <button
                    onClick={() => setKeyboardMode(!keyboardMode)}
                    className={`text-xs font-bold py-1 px-3.5 rounded-full border cursor-pointer transition-all ${
                      keyboardMode 
                        ? "bg-teal-500/10 text-teal-600 border-teal-500/20 shadow-xs" 
                        : "bg-slate-50 text-slate-500 border-slate-205 dark:bg-slate-800 dark:text-slate-400"
                    }`}
                  >
                    {keyboardMode ? "⌨️ Activo" : "⌨️ Desactivado"}
                  </button>
                </div>
              </div>

              {/* Keyboard Mode Helper Info - Interactive Guide */}
              {keyboardMode && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="bg-teal-950/20 dark:bg-teal-950/15 border border-teal-500/20 p-3 rounded-lg space-y-2 text-[10.5px] leading-relaxed"
                >
                  <p className="font-semibold text-teal-700 dark:text-teal-400 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> Guía de Teclado Rápida (PerioTools)
                  </p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-slate-600 dark:text-slate-300 font-mono">
                    <div><span className="text-teal-600 font-bold bg-white dark:bg-slate-800 px-1 rounded dark:border dark:border-slate-700 font-sans">0-9</span> mm Sondaje/Recesión</div>
                    <div><span className="text-teal-600 font-bold bg-white dark:bg-slate-800 px-1 rounded dark:border dark:border-slate-700 font-sans">S / B</span> Toggle Sangrado</div>
                    <div><span className="text-teal-600 font-bold bg-white dark:bg-slate-800 px-1 rounded dark:border dark:border-slate-700 font-sans font-semibold">P / L</span> Toggle Placa (Bact)</div>
                    <div><span className="text-teal-600 font-bold bg-white dark:bg-slate-800 px-1 rounded dark:border dark:border-slate-700 font-sans">U / D</span> Toggle Supuración</div>
                    <div><span className="text-teal-600 font-bold bg-white dark:bg-slate-800 px-1 rounded dark:border dark:border-slate-700 font-sans">&larr; / &rarr;</span> Siguiente Diente</div>
                    <div><span className="text-teal-600 font-bold bg-white dark:bg-slate-800 px-1 rounded dark:border dark:border-slate-700 font-sans">&uarr; / &darr;</span> Alternar Medición</div>
                  </div>
                  <div className="pt-2 border-t border-teal-500/10 flex flex-wrap gap-2 text-[10px]">
                    <span className="text-slate-400 font-sans">Celda Activa:</span>
                    <span className="bg-slate-800 text-white dark:bg-slate-900 border border-slate-700 px-2 py-0.5 rounded font-bold uppercase">
                      {inputSurface} - {inputPosition} ({inputMetric === "pocket" ? "Sondaje" : "Recesión"})
                    </span>
                  </div>
                </motion.div>
              )}

              {/* Dictado por Voz Clínico (Modo Manos Libres) */}
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-3.5 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Mic className={`w-4 h-4 ${voiceChartingMode ? "text-red-500" : "text-emerald-500"}`} />
                      {voiceChartingMode && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping" />
                      )}
                    </div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Asistente de Dictado por Voz Clínico (Manos Libres)
                    </span>
                    <span className="text-[8px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded font-black uppercase tracking-wider">PRO v15</span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug">
                    Usa comandos de voz en español para rellenar el periodontograma completo sin tocar el teclado.
                  </p>
                </div>

                <div className="flex items-center gap-3.5">
                  <button
                    onClick={() => {
                      if (!voiceChartingMode) {
                        setVoiceError(null);
                        setVoiceChartingMode(true);
                        setKeyboardMode(true); // Auto-enable keyboard metrics logic for coordination
                      } else {
                        setVoiceChartingMode(false);
                      }
                    }}
                    className={`text-xs font-bold py-1.5 px-4 rounded-full border cursor-pointer transition-all flex items-center gap-1.5 ${
                      voiceChartingMode 
                        ? "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30 shadow-md shadow-red-950/15" 
                        : "bg-slate-50 text-slate-500 hover:text-emerald-500 hover:bg-emerald-50 dark:bg-slate-800 dark:text-slate-400 border-slate-200"
                    }`}
                  >
                    {voiceChartingMode ? (
                      <>
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
                        <span>Escuchando...</span>
                      </>
                    ) : (
                      <>
                        <Mic className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-500" />
                        <span>Activar Voz</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Voice Error Notice if blocked or unsupported */}
              {voiceError && (
                <div className="bg-amber-500/10 border border-amber-500/25 text-amber-800 dark:text-amber-200 px-3.5 py-2.5 rounded-xl text-xs flex items-center justify-between gap-3 animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-600 dark:text-amber-400 font-bold">⚠️ Micrófono:</span>
                    <span>{voiceError}</span>
                  </div>
                  <button
                    onClick={() => setVoiceError(null)}
                    className="text-[11px] font-bold text-amber-700 dark:text-amber-300 hover:underline cursor-pointer shrink-0"
                  >
                    Cerrar
                  </button>
                </div>
              )}

              {/* Voice Guide Panel and Live Transcript */}
              {voiceChartingMode && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="bg-emerald-950/20 dark:bg-emerald-950/10 border border-emerald-500/20 p-3.5 rounded-lg space-y-3.5 text-[10.5px] leading-relaxed animate-in fade-in duration-200"
                >
                  <div className="flex justify-between items-center border-b border-emerald-500/10 pb-2">
                    <p className="font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-500" /> Guía de Comandos de Voz Clínicos
                    </p>
                    <div className="text-[9px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-mono font-bold animate-pulse">
                      Estado: Escuchando activamente
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-slate-600 dark:text-slate-300 font-sans">
                    <div>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono">"cero" a "quince"</span>
                      <p className="text-[9.5px] text-slate-500 dark:text-slate-500 leading-none mt-0.5">Ingresa los milímetros del sondaje/recesión y avanza al siguiente sitio automáticamente.</p>
                    </div>
                    <div>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono">"sangrado" / "bop"</span>
                      <p className="text-[9.5px] text-slate-500 dark:text-slate-500 leading-none mt-0.5">Activa/Desactiva el sangrado al sondaje en el sitio actual.</p>
                    </div>
                    <div>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono">"placa" / "bacterias"</span>
                      <p className="text-[9.5px] text-slate-500 dark:text-slate-500 leading-none mt-0.5">Activa/Desactiva la placa bacteriana en el sitio actual.</p>
                    </div>
                    <div>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono">"supuración" / "pus"</span>
                      <p className="text-[9.5px] text-slate-500 dark:text-slate-500 leading-none mt-0.5">Activa/Desactiva la presencia de supuración purulenta.</p>
                    </div>
                    <div>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono">"siguiente" / "atrás"</span>
                      <p className="text-[9.5px] text-slate-500 dark:text-slate-500 leading-none mt-0.5">Navega libremente entre las piezas dentales permanentemente.</p>
                    </div>
                    <div>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono">"vestibular" / "palatino"</span>
                      <p className="text-[9.5px] text-slate-500 dark:text-slate-500 leading-none mt-0.5">Cambia la cara activa entre externa (vestibular) e interna (palatina/lingual).</p>
                    </div>
                  </div>

                  {voiceTranscript && (
                    <div className="pt-2.5 border-t border-emerald-500/10 flex items-center justify-between gap-2 bg-black/10 px-2.5 py-1.5 rounded-md">
                      <span className="text-[9.5px] text-slate-500 dark:text-slate-400 font-bold font-mono uppercase tracking-wide">Último dictado capturado:</span>
                      <span className="bg-emerald-500 text-white font-black px-2 py-0.5 rounded font-mono text-[10px] shadow-sm tracking-wide">
                        "{voiceTranscript}"
                      </span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-emerald-500/10 flex flex-wrap gap-2 text-[10px]">
                    <span className="text-slate-400 font-sans">Celda Seleccionada por Voz:</span>
                    <span className="bg-slate-800 text-white dark:bg-slate-900 border border-slate-700 px-2 py-0.5 rounded font-bold uppercase font-mono">
                      Pieza {selectedTooth} - {inputSurface} - {inputPosition} ({inputMetric === "pocket" ? "Sondaje" : "Recesión"})
                    </span>
                  </div>
                </motion.div>
              )}

              {/* ESQUEMA CLÍNICO DE NIVEL ÓSEO Y MARGEN GINGIVAL (Estilo PerioTools / Universidad de Berna) */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-teal-600 dark:text-teal-400">
                      Esquema Gráfico de Soporte Alveolar
                    </span>
                    <h4 className="text-sm font-display font-black text-slate-800 dark:text-slate-100">
                      Nivel Óseo y Margen Gingival ({activeArch === "upper" ? "Arcada Superior" : "Arcada Inferior"})
                    </h4>
                  </div>
                  <div className="flex items-center gap-3 text-[9px] font-medium text-slate-400">
                    <div className="flex items-center gap-1">
                      <span className="w-2.5 h-0.5 bg-teal-500 rounded-full inline-block" />
                      <span>Encía (Gingival)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-2.5 h-0.5 bg-rose-500 rounded-full inline-block" />
                      <span>Fondo Bolsa</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-rose-500/20 border border-rose-500/40 rounded inline-block" />
                      <span>Bolsa &ge;4mm</span>
                    </div>
                  </div>
                </div>

                {/* SVG CONTAINER - Scrollable on mobile */}
                <div className="w-full overflow-x-auto scrollbar-thin pb-2">
                  <div className="min-w-[920px] select-none">
                    <svg viewBox="0 0 920 220" className="w-full h-[220px] bg-slate-50/50 dark:bg-slate-950/40 rounded-xl border border-slate-100 dark:border-slate-800/60">
                      <defs>
                        {/* Shading gradients */}
                        <linearGradient id="toothGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#94a3b8" stopOpacity="0.1" />
                          <stop offset="100%" stopColor="#cbd5e1" stopOpacity="0.25" />
                        </linearGradient>
                        <linearGradient id="activeToothGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.15" />
                          <stop offset="100%" stopColor="#0d9488" stopOpacity="0.35" />
                        </linearGradient>
                        <pattern id="bonePattern" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                          <line x1="0" y1="0" x2="0" y2="4" stroke="#94a3b8" strokeWidth="0.5" strokeOpacity="0.15" />
                        </pattern>
                      </defs>

                      {/* 1. CEJ Base (Línea Cero / Cementoenamel Junction) */}
                      <line x1="10" y1="110" x2="910" y2="110" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,3" strokeOpacity="0.4" />
                      <text x="15" y="106" className="text-[8px] font-mono fill-slate-400 font-bold" opacity="0.6">LÍNEA CEJ (0mm)</text>

                      {/* 2. BACKGROUND TEETH SHAPES */}
                      {teethList.map((num, i) => {
                        const isSelected = selectedTooth === num;
                        const isMissing = odontogram?.[num]?.condition === "ausente";
                        const isImplant = odontogram?.[num]?.condition === "implante";
                        const xC = i * 56 + 32;
                        const lastDigit = num % 10;
                        const family = lastDigit >= 6 ? "molar" : lastDigit === 4 || lastDigit === 5 ? "premolar" : lastDigit === 3 ? "canine" : "incisor";

                        if (isMissing) return null;

                        return (
                          <g key={`bg-tooth-${num}`} className="transition-all duration-300">
                            {/* Roots */}
                            {activeArch === "upper" ? (
                              family === "molar" ? (
                                <path 
                                  d={`M ${xC - 14},110 C ${xC - 14},60 ${xC - 22},40 ${xC - 16},25 C ${xC - 10},40 ${xC - 8},60 ${xC},110 C ${xC + 8},60 ${xC + 10},40 ${xC + 16},25 C ${xC + 22},40 ${xC + 14},60 ${xC + 14},110 Z`} 
                                  fill={isSelected ? "url(#activeToothGradient)" : "url(#toothGradient)"} 
                                  stroke={isSelected ? "#14b8a6" : "#cbd5e1"} 
                                  strokeWidth={isSelected ? "1.5" : "1"} 
                                  strokeOpacity={isSelected ? "0.8" : "0.35"} 
                                />
                              ) : family === "premolar" ? (
                                <path 
                                  d={`M ${xC - 10},110 C ${xC - 10},70 ${xC - 12},50 ${xC - 6},30 C ${xC},50 ${xC + 10},70 ${xC + 10},110 Z`} 
                                  fill={isSelected ? "url(#activeToothGradient)" : "url(#toothGradient)"} 
                                  stroke={isSelected ? "#14b8a6" : "#cbd5e1"} 
                                  strokeWidth={isSelected ? "1.5" : "1"} 
                                  strokeOpacity={isSelected ? "0.8" : "0.35"} 
                                />
                              ) : (
                                <path 
                                  d={`M ${xC - 9},110 C ${xC - 9},70 ${xC - 4},50 ${xC},20 C ${xC + 4},50 ${xC + 9},70 ${xC + 9},110 Z`} 
                                  fill={isSelected ? "url(#activeToothGradient)" : "url(#toothGradient)"} 
                                  stroke={isSelected ? "#14b8a6" : "#cbd5e1"} 
                                  strokeWidth={isSelected ? "1.5" : "1"} 
                                  strokeOpacity={isSelected ? "0.8" : "0.35"} 
                                />
                              )
                            ) : (
                              family === "molar" ? (
                                <path 
                                  d={`M ${xC - 14},110 C ${xC - 14},160 ${xC - 22},180 ${xC - 16},195 C ${xC - 10},180 ${xC - 8},160 ${xC},110 C ${xC + 8},160 ${xC + 10},180 ${xC + 16},195 C ${xC + 22},180 ${xC + 14},160 ${xC + 14},110 Z`} 
                                  fill={isSelected ? "url(#activeToothGradient)" : "url(#toothGradient)"} 
                                  stroke={isSelected ? "#14b8a6" : "#cbd5e1"} 
                                  strokeWidth={isSelected ? "1.5" : "1"} 
                                  strokeOpacity={isSelected ? "0.8" : "0.35"} 
                                />
                              ) : family === "premolar" ? (
                                <path 
                                  d={`M ${xC - 10},110 C ${xC - 10},150 ${xC - 12},170 ${xC - 6},190 C ${xC},170 ${xC + 10},150 ${xC + 10},110 Z`} 
                                  fill={isSelected ? "url(#activeToothGradient)" : "url(#toothGradient)"} 
                                  stroke={isSelected ? "#14b8a6" : "#cbd5e1"} 
                                  strokeWidth={isSelected ? "1.5" : "1"} 
                                  strokeOpacity={isSelected ? "0.8" : "0.35"} 
                                />
                              ) : (
                                <path 
                                  d={`M ${xC - 9},110 C ${xC - 9},150 ${xC - 4},170 ${xC},200 C ${xC + 4},170 ${xC + 9},150 ${xC + 9},110 Z`} 
                                  fill={isSelected ? "url(#activeToothGradient)" : "url(#toothGradient)"} 
                                  stroke={isSelected ? "#14b8a6" : "#cbd5e1"} 
                                  strokeWidth={isSelected ? "1.5" : "1"} 
                                  strokeOpacity={isSelected ? "0.8" : "0.35"} 
                                />
                              )
                            )}

                            {/* Crown */}
                            {activeArch === "upper" ? (
                              family === "molar" ? (
                                <path 
                                  d={`M ${xC - 16},110 Q ${xC - 16},155 ${xC},158 Q ${xC + 16},155 ${xC + 16},110 Z`} 
                                  fill={isImplant ? "rgba(6, 182, 212, 0.08)" : (isSelected ? "rgba(20, 184, 166, 0.1)" : "rgba(255, 255, 255, 0.65)")} 
                                  stroke={isImplant ? "#06b6d4" : (isSelected ? "#14b8a6" : "#94a3b8")} 
                                  strokeWidth={isSelected ? "1.5" : "1"} 
                                  strokeOpacity={isSelected ? "1" : "0.5"} 
                                />
                              ) : family === "premolar" ? (
                                <path 
                                  d={`M ${xC - 12},110 Q ${xC - 12},150 ${xC},154 Q ${xC + 12},150 ${xC + 12},110 Z`} 
                                  fill={isImplant ? "rgba(6, 182, 212, 0.08)" : (isSelected ? "rgba(20, 184, 166, 0.1)" : "rgba(255, 255, 255, 0.65)")} 
                                  stroke={isImplant ? "#06b6d4" : (isSelected ? "#14b8a6" : "#94a3b8")} 
                                  strokeWidth={isSelected ? "1.5" : "1"} 
                                  strokeOpacity={isSelected ? "1" : "0.5"} 
                                />
                              ) : family === "canine" ? (
                                <path 
                                  d={`M ${xC - 10},110 Q ${xC - 10},150 ${xC},158 Q ${xC + 10},150 ${xC + 10},110 Z`} 
                                  fill={isImplant ? "rgba(6, 182, 212, 0.08)" : (isSelected ? "rgba(20, 184, 166, 0.1)" : "rgba(255, 255, 255, 0.65)")} 
                                  stroke={isImplant ? "#06b6d4" : (isSelected ? "#14b8a6" : "#94a3b8")} 
                                  strokeWidth={isSelected ? "1.5" : "1"} 
                                  strokeOpacity={isSelected ? "1" : "0.5"} 
                                />
                              ) : (
                                <path 
                                  d={`M ${xC - 12},110 L ${xC - 10},154 L ${xC + 10},154 L ${xC + 12},110 Z`} 
                                  fill={isImplant ? "rgba(6, 182, 212, 0.08)" : (isSelected ? "rgba(20, 184, 166, 0.1)" : "rgba(255, 255, 255, 0.65)")} 
                                  stroke={isImplant ? "#06b6d4" : (isSelected ? "#14b8a6" : "#94a3b8")} 
                                  strokeWidth={isSelected ? "1.5" : "1"} 
                                  strokeOpacity={isSelected ? "1" : "0.5"} 
                                />
                              )
                            ) : (
                              family === "molar" ? (
                                <path 
                                  d={`M ${xC - 16},110 Q ${xC - 16},65 ${xC},62 Q ${xC + 16},65 ${xC + 16},110 Z`} 
                                  fill={isImplant ? "rgba(6, 182, 212, 0.08)" : (isSelected ? "rgba(20, 184, 166, 0.1)" : "rgba(255, 255, 255, 0.65)")} 
                                  stroke={isImplant ? "#06b6d4" : (isSelected ? "#14b8a6" : "#94a3b8")} 
                                  strokeWidth={isSelected ? "1.5" : "1"} 
                                  strokeOpacity={isSelected ? "1" : "0.5"} 
                                />
                              ) : family === "premolar" ? (
                                <path 
                                  d={`M ${xC - 12},110 Q ${xC - 12},70 ${xC},66 Q ${xC + 12},70 ${xC + 12},110 Z`} 
                                  fill={isImplant ? "rgba(6, 182, 212, 0.08)" : (isSelected ? "rgba(20, 184, 166, 0.1)" : "rgba(255, 255, 255, 0.65)")} 
                                  stroke={isImplant ? "#06b6d4" : (isSelected ? "#14b8a6" : "#94a3b8")} 
                                  strokeWidth={isSelected ? "1.5" : "1"} 
                                  strokeOpacity={isSelected ? "1" : "0.5"} 
                                />
                              ) : family === "canine" ? (
                                <path 
                                  d={`M ${xC - 10},110 Q ${xC - 10},70 ${xC},62 Q ${xC + 10},70 ${xC + 10},110 Z`} 
                                  fill={isImplant ? "rgba(6, 182, 212, 0.08)" : (isSelected ? "rgba(20, 184, 166, 0.1)" : "rgba(255, 255, 255, 0.65)")} 
                                  stroke={isImplant ? "#06b6d4" : (isSelected ? "#14b8a6" : "#94a3b8")} 
                                  strokeWidth={isSelected ? "1.5" : "1"} 
                                  strokeOpacity={isSelected ? "1" : "0.5"} 
                                />
                              ) : (
                                <path 
                                  d={`M ${xC - 12},110 L ${xC - 10},66 L ${xC + 10},66 L ${xC + 12},110 Z`} 
                                  fill={isImplant ? "rgba(6, 182, 212, 0.08)" : (isSelected ? "rgba(20, 184, 166, 0.1)" : "rgba(255, 255, 255, 0.65)")} 
                                  stroke={isImplant ? "#06b6d4" : (isSelected ? "#14b8a6" : "#94a3b8")} 
                                  strokeWidth={isSelected ? "1.5" : "1"} 
                                  strokeOpacity={isSelected ? "1" : "0.5"} 
                                />
                              )
                            )}

                            {/* Label of active implants */}
                            {isImplant && (
                              <text x={xC} y={activeArch === "upper" ? 134 : 86} textAnchor="middle" className="text-[7.5px] font-mono fill-cyan-500 font-extrabold">IMPLANT</text>
                            )}
                          </g>
                        );
                      })}

                      {/* 3. BONE FILL / ALVEOLAR SUPPORT PROFILE */}
                      {(() => {
                        const bonePoints: string[] = [];
                        teethList.forEach((num, i) => {
                          const isMissing = odontogram?.[num]?.condition === "ausente";
                          const xL = i * 56 + 18;
                          const xC = i * 56 + 32;
                          const xR = i * 56 + 46;
                          const yCEJ = 110;

                          if (isMissing) {
                            bonePoints.push(`${xL},${yCEJ}`, `${xC},${yCEJ}`, `${xR},${yCEJ}`);
                          } else {
                            const metrics = getToothMetrics(num);
                            const yBL = activeArch === "upper" ? 110 - (metrics.left.recess + metrics.left.pocket) * 6 : 110 + (metrics.left.recess + metrics.left.pocket) * 6;
                            const yBC = activeArch === "upper" ? 110 - (metrics.central.recess + metrics.central.pocket) * 6 : 110 + (metrics.central.recess + metrics.central.pocket) * 6;
                            const yBR = activeArch === "upper" ? 110 - (metrics.right.recess + metrics.right.pocket) * 6 : 110 + (metrics.right.recess + metrics.right.pocket) * 6;
                            bonePoints.push(`${xL},${yBL}`, `${xC},${yBC}`, `${xR},${yBR}`);
                          }
                        });

                        const edgeY = activeArch === "upper" ? 10 : 210;
                        const boneFillPath = `M 18,${edgeY} L 902,${edgeY} L 902,${bonePoints[bonePoints.length - 1].split(',')[1]} ${bonePoints.slice().reverse().map(p => "L " + p).join(" ")} Z`;

                        return (
                          <path 
                            d={boneFillPath} 
                            fill="url(#bonePattern)" 
                            className="fill-slate-300/10 dark:fill-slate-400/5" 
                            stroke="#cbd5e1" 
                            strokeWidth="1" 
                            strokeDasharray="2,2" 
                            strokeOpacity="0.15" 
                          />
                        );
                      })()}

                      {/* 4. PERIODONTAL POCKET DISEASES HIGHLIGHTS (BOLSAS >= 4mm) */}
                      {teethList.map((num, i) => {
                        const isMissing = odontogram?.[num]?.condition === "ausente";
                        if (isMissing) return null;

                        const xL = i * 56 + 18;
                        const xC = i * 56 + 32;
                        const xR = i * 56 + 46;

                        const metrics = getToothMetrics(num);
                        const yGL = activeArch === "upper" ? 110 - metrics.left.recess * 6 : 110 + metrics.left.recess * 6;
                        const yGC = activeArch === "upper" ? 110 - metrics.central.recess * 6 : 110 + metrics.central.recess * 6;
                        const yGR = activeArch === "upper" ? 110 - metrics.right.recess * 6 : 110 + metrics.right.recess * 6;

                        const yBL = activeArch === "upper" ? 110 - (metrics.left.recess + metrics.left.pocket) * 6 : 110 + (metrics.left.recess + metrics.left.pocket) * 6;
                        const yBC = activeArch === "upper" ? 110 - (metrics.central.recess + metrics.central.pocket) * 6 : 110 + (metrics.central.recess + metrics.central.pocket) * 6;
                        const yBR = activeArch === "upper" ? 110 - (metrics.right.recess + metrics.right.pocket) * 6 : 110 + (metrics.right.recess + metrics.right.pocket) * 6;

                        const hasSeverePocket = metrics.left.pocket >= 4 || metrics.central.pocket >= 4 || metrics.right.pocket >= 4;

                        return (
                          <path
                            key={`pocket-fill-${num}`}
                            d={`M ${xL},${yGL} L ${xC},${yGC} L ${xR},${yGR} L ${xR},${yBR} L ${xC},${yBC} L ${xL},${yBL} Z`}
                            fill={hasSeverePocket ? "rgba(239, 68, 68, 0.2)" : "rgba(20, 184, 166, 0.05)"}
                            stroke={hasSeverePocket ? "rgba(239, 68, 68, 0.35)" : "rgba(20, 184, 166, 0.15)"}
                            strokeWidth="1"
                            strokeDasharray={hasSeverePocket ? "2,1" : "none"}
                          />
                        );
                      })}

                      {/* 5. CONTINUOUS GINGIVAL MARGIN LINE (Línea de la Encía) */}
                      {(() => {
                        const gingivalPoints: string[] = [];
                        teethList.forEach((num, i) => {
                          const isMissing = odontogram?.[num]?.condition === "ausente";
                          const xL = i * 56 + 18;
                          const xC = i * 56 + 32;
                          const xR = i * 56 + 46;
                          const yCEJ = 110;

                          if (isMissing) {
                            gingivalPoints.push(`${xL},${yCEJ}`, `${xC},${yCEJ}`, `${xR},${yCEJ}`);
                          } else {
                            const metrics = getToothMetrics(num);
                            const yGL = activeArch === "upper" ? 110 - metrics.left.recess * 6 : 110 + metrics.left.recess * 6;
                            const yGC = activeArch === "upper" ? 110 - metrics.central.recess * 6 : 110 + metrics.central.recess * 6;
                            const yGR = activeArch === "upper" ? 110 - metrics.right.recess * 6 : 110 + metrics.right.recess * 6;
                            gingivalPoints.push(`${xL},${yGL}`, `${xC},${yGC}`, `${xR},${yGR}`);
                          }
                        });

                        return (
                          <path 
                            d={`M ${gingivalPoints.join(" L ")}`} 
                            fill="none" 
                            stroke="#14b8a6" 
                            strokeWidth="2.5" 
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        );
                      })()}

                      {/* 6. CONTINUOUS BONE LEVEL LINE (Fondo de Bolsa / Margen Óseo) */}
                      {(() => {
                        const bonePoints: string[] = [];
                        teethList.forEach((num, i) => {
                          const isMissing = odontogram?.[num]?.condition === "ausente";
                          const xL = i * 56 + 18;
                          const xC = i * 56 + 32;
                          const xR = i * 56 + 46;
                          const yCEJ = 110;

                          if (isMissing) {
                            bonePoints.push(`${xL},${yCEJ}`, `${xC},${yCEJ}`, `${xR},${yCEJ}`);
                          } else {
                            const metrics = getToothMetrics(num);
                            const yBL = activeArch === "upper" ? 110 - (metrics.left.recess + metrics.left.pocket) * 6 : 110 + (metrics.left.recess + metrics.left.pocket) * 6;
                            const yBC = activeArch === "upper" ? 110 - (metrics.central.recess + metrics.central.pocket) * 6 : 110 + (metrics.central.recess + metrics.central.pocket) * 6;
                            const yBR = activeArch === "upper" ? 110 - (metrics.right.recess + metrics.right.pocket) * 6 : 110 + (metrics.right.recess + metrics.right.pocket) * 6;
                            bonePoints.push(`${xL},${yBL}`, `${xC},${yBC}`, `${xR},${yBR}`);
                          }
                        });

                        return (
                          <path 
                            d={`M ${bonePoints.join(" L ")}`} 
                            fill="none" 
                            stroke="#f43f5e" 
                            strokeWidth="2" 
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        );
                      })()}

                      {/* 7. INTERACTIVE NODES & POCKET VALUE TEXTS */}
                      {teethList.map((num, i) => {
                        const isSelected = selectedTooth === num;
                        const isMissing = odontogram?.[num]?.condition === "ausente";
                        if (isMissing) {
                          // Draw a subtle red X over missing teeth columns
                          const xC = i * 56 + 32;
                          return (
                            <g key={`missing-mark-${num}`} opacity="0.25">
                              <line x1={xC - 14} y1="35" x2={xC + 14} y2="185" stroke="#f43f5e" strokeWidth="2.5" />
                              <line x1={xC + 14} y1="35" x2={xC - 14} y2="185" stroke="#f43f5e" strokeWidth="2.5" />
                              <text x={xC} y="114" textAnchor="middle" className="text-[9px] font-bold fill-rose-500 font-sans tracking-widest">AUSENTE</text>
                            </g>
                          );
                        }

                        const xL = i * 56 + 18;
                        const xC = i * 56 + 32;
                        const xR = i * 56 + 46;

                        const metrics = getToothMetrics(num);

                        const yBL = activeArch === "upper" ? 110 - (metrics.left.recess + metrics.left.pocket) * 6 : 110 + (metrics.left.recess + metrics.left.pocket) * 6;
                        const yBC = activeArch === "upper" ? 110 - (metrics.central.recess + metrics.central.pocket) * 6 : 110 + (metrics.central.recess + metrics.central.pocket) * 6;
                        const yBR = activeArch === "upper" ? 110 - (metrics.right.recess + metrics.right.pocket) * 6 : 110 + (metrics.right.recess + metrics.right.pocket) * 6;

                        const valOffset = activeArch === "upper" ? -8 : 14;

                        return (
                          <g key={`nodes-${num}`} className="transition-all duration-200">
                            {/* Column Selection Border Highlighter */}
                            {isSelected && (
                              <rect 
                                x={i * 56 + 7} 
                                y="10" 
                                width="50" 
                                height="200" 
                                fill="none" 
                                stroke="#14b8a6" 
                                strokeWidth="2" 
                                rx="10" 
                                className="opacity-70"
                                strokeDasharray="3,1"
                              />
                            )}

                            {/* Node Left */}
                            <circle cx={xL} cy={yBL} r={isSelected && inputPosition === "mesial" ? "4.5" : "3.5"} className={`stroke-white stroke-1 ${metrics.left.pocket >= 4 ? 'fill-rose-500' : 'fill-teal-500'}`} />
                            <text x={xL} y={yBL + valOffset} textAnchor="middle" className={`text-[8.5px] font-mono font-black ${metrics.left.pocket >= 4 ? 'fill-rose-500 dark:fill-rose-400 font-extrabold' : 'fill-slate-600 dark:fill-slate-300'}`}>
                              {metrics.left.pocket}
                            </text>

                            {/* Node Central */}
                            <circle cx={xC} cy={yBC} r={isSelected && inputPosition === "central" ? "4.5" : "3.5"} className={`stroke-white stroke-1 ${metrics.central.pocket >= 4 ? 'fill-rose-500' : 'fill-teal-500'}`} />
                            <text x={xC} y={yBC + valOffset} textAnchor="middle" className={`text-[8.5px] font-mono font-black ${metrics.central.pocket >= 4 ? 'fill-rose-500 dark:fill-rose-400 font-extrabold' : 'fill-slate-600 dark:fill-slate-300'}`}>
                              {metrics.central.pocket}
                            </text>

                            {/* Node Right */}
                            <circle cx={xR} cy={yBR} r={isSelected && inputPosition === "distal" ? "4.5" : "3.5"} className={`stroke-white stroke-1 ${metrics.right.pocket >= 4 ? 'fill-rose-500' : 'fill-teal-500'}`} />
                            <text x={xR} y={yBR + valOffset} textAnchor="middle" className={`text-[8.5px] font-mono font-black ${metrics.right.pocket >= 4 ? 'fill-rose-500 dark:fill-rose-400 font-extrabold' : 'fill-slate-600 dark:fill-slate-300'}`}>
                              {metrics.right.pocket}
                            </text>

                            {/* Column Selection Trigger Backdrop */}
                            <rect 
                              x={i * 56 + 8} 
                              y="10" 
                              width="48" 
                              height="200" 
                              fill="transparent" 
                              className="cursor-pointer hover:fill-teal-500/5 transition-all duration-150" 
                              onClick={() => setSelectedTooth(num)} 
                            />

                            {/* Tooth FDI Number Header/Footer text */}
                            <text 
                              x={xC} 
                              y={activeArch === "upper" ? 212 : 18} 
                              textAnchor="middle" 
                              className={`text-[9.5px] font-mono font-black ${isSelected ? 'fill-teal-500 font-extrabold scale-110' : 'fill-slate-400 dark:fill-slate-500'}`}
                            >
                              {num}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                </div>

                {/* Micro instructions */}
                <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/30 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-ping" />
                    <span><strong>Interactivo:</strong> Haz clic sobre cualquier diente en el esquema para seleccionarlo e iniciar su edición de sondaje.</span>
                  </div>
                  <span className="font-mono font-bold text-[9px] bg-slate-200/50 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500">
                    FDI {selectedTooth} activo
                  </span>
                </div>
              </div>

            </div>

            {/* RIGHT AREA: Expanded Surgical Inputs for Vestibular/Palatino & Mobility (5 Cols) */}
            <div className="lg:col-span-5 space-y-4">
              
              {/* FACE SELECTOR BUTTONS */}
              <div className="bg-white dark:bg-slate-900 duration-200 border border-slate-100 dark:border-slate-800 p-1 rounded-xl flex">
                <button
                  onClick={() => setInputSurface("vestibular")}
                  className={`flex-1 text-center py-2 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                    inputSurface === "vestibular"
                      ? "bg-slate-900 border-slate-900 text-white dark:bg-slate-800 dark:text-white"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  Cara Vestibular (Externa)
                </button>
                <button
                  onClick={() => setInputSurface("palatino")}
                  className={`flex-1 text-center py-2 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                    inputSurface === "palatino"
                      ? "bg-slate-900 border-slate-900 text-white dark:bg-slate-800 dark:text-white"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  Cara Palatina/Lingual
                </button>
              </div>

              {/* INPUT VALUES PANEL */}
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 space-y-4 shadow-2xs">
                <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800/80 pb-2.5">
                  <span className="text-xs font-extrabold text-slate-800 dark:text-white uppercase tracking-wider block">
                    {inputSurface === "vestibular" ? "Parámetros Vestibulares" : "Parámetros Palatinos"}
                  </span>
                  <span className="bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 text-teal-600 dark:text-teal-400 font-mono font-bold py-0.5 px-2.5 rounded-md text-xs">
                    PIEZA {selectedTooth}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {(["mesial", "central", "distal"] as const).map((pos) => {
                    const pocketMetric = inputSurface === "vestibular" ? "vestibularPocket" : "palatinoPocket";
                    const recessMetric = inputSurface === "vestibular" ? "vestibularRecess" : "palatinoRecess";
                    const bopMetric = inputSurface === "vestibular" ? "sangradoVestibular" : "sangradoPalatino";
                    const plaqueMetric = inputSurface === "vestibular" ? "placaVestibular" : "placaPalatino";
                    const suppMetric = inputSurface === "vestibular" ? "supuracionVestibular" : "supuracionPalatino";

                    const pocketVal = activeToothData[pocketMetric]?.[pos] ?? 2;
                    const recessVal = activeToothData[recessMetric]?.[pos] ?? 0;
                    const bopActive = activeToothData[bopMetric]?.[pos] ?? false;
                    const plaqueActive = activeToothData[plaqueMetric]?.[pos] ?? false;
                    const suppActive = activeToothData[suppMetric]?.[pos] ?? false;

                    const calVal = pocketVal + recessVal;
                    const isSevere = pocketVal >= 4;
                    const activeShortCursor = keyboardMode && inputSurface === inputSurface && inputPosition === pos;

                    return (
                      <div 
                        key={`cell-${inputSurface}-${pos}`} 
                        className={`space-y-4 text-center p-2.5 rounded-xl border transition-all ${
                          activeShortCursor 
                            ? "bg-teal-500/5 border-teal-500 shadow-xs ring-1 ring-teal-500/20" 
                            : "bg-slate-50/50 dark:bg-slate-800/20 border-slate-100 dark:border-slate-800/50"
                        }`}
                      >
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                          {pos}
                        </span>
                        
                        {/* Pocket metric */}
                        <div className="space-y-1">
                          <label className="text-[9px] text-slate-400 font-extrabold uppercase tracking-tight block">
                            Sondaje (mm)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="15"
                            value={pocketVal}
                            onChange={(e) => handlePocketChange(selectedTooth, pocketMetric, pos, parseInt(e.target.value) || 0)}
                            className={`w-full py-2.5 sm:py-1.5 min-h-[44px] sm:min-h-[0] text-center font-display font-black text-base bg-white dark:bg-slate-800 rounded-lg border outline-none focus:ring-2 focus:ring-teal-500/20 transition-all ${
                              isSevere 
                                ? "border-rose-400 text-rose-500 bg-rose-50/10" 
                                : "border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                            }`}
                          />
                        </div>

                        {/* Gingival recession metric */}
                        <div className="space-y-1">
                          <label className="text-[9px] text-slate-400 font-extrabold uppercase tracking-tight block">
                            Recesión (mm)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="10"
                            value={recessVal}
                            onChange={(e) => handlePocketChange(selectedTooth, recessMetric, pos, parseInt(e.target.value) || 0)}
                            className="w-full py-2.5 sm:py-1.5 min-h-[44px] sm:min-h-[0] text-center font-display font-bold text-xs bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-teal-300/10"
                          />
                        </div>

                        {/* NIC Attachment Level calculations */}
                        <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 flex justify-between items-center px-0.5 text-[9.5px]">
                          <span className="text-slate-400 block">NIC (CAL):</span>
                          <span className={`font-mono font-bold ${calVal >= 5 ? 'text-rose-500' : 'text-slate-700 dark:text-slate-300'}`}>
                            {calVal}mm
                          </span>
                        </div>

                        {/* Interactive toggle buttons */}
                        <div className="flex flex-wrap justify-center gap-1.5 pt-1 border-t border-slate-105 dark:border-slate-800/50">
                          {/* Bleeding (BOP) */}
                          <button 
                            onClick={() => handleToggleFlag(selectedTooth, bopMetric, pos)}
                            className={`p-2.5 sm:p-1.5 min-w-[44px] sm:min-w-[0] min-h-[44px] sm:min-h-[0] rounded-lg transition-all border flex items-center justify-center shrink-0 cursor-pointer ${
                              bopActive 
                                ? "bg-red-500 text-white border-red-500 shadow-xs" 
                                : "bg-white dark:bg-slate-800 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 border-slate-200 dark:border-slate-800"
                            }`}
                            title="Hemorragia al sondaje (BOP)"
                          >
                            <Droplet className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                          </button>

                          {/* Suppuration / Pus (Yellow button) */}
                          <button 
                            onClick={() => handleToggleSupuracion(selectedTooth, suppMetric, pos)}
                            className={`p-2.5 sm:p-1.5 min-w-[44px] sm:min-w-[0] min-h-[44px] sm:min-h-[0] rounded-lg transition-all border flex items-center justify-center shrink-0 cursor-pointer ${
                              suppActive 
                                ? "bg-amber-400 text-slate-950 border-amber-400 shadow-xs" 
                                : "bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/15 border-slate-200 dark:border-slate-800"
                            }`}
                            title="Supuración activa / Exudado purulento (Pus)"
                          >
                            <CircleDot className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                          </button>

                          {/* Furca Involvement button */}
                          <button 
                            onClick={() => {
                              const currentGrade = activeToothData.furca || 0;
                              const nextGrade = ((currentGrade + 1) % 4) as 0 | 1 | 2 | 3;
                              handleNumberFlag(selectedTooth, "furca", nextGrade);
                            }}
                            className={`p-2.5 sm:p-1.5 min-w-[44px] sm:min-w-[0] min-h-[44px] sm:min-h-[0] rounded-lg transition-all border flex items-center justify-center shrink-0 cursor-pointer ${
                              activeToothData.furca === 1
                                ? "bg-indigo-500 text-white border-indigo-500 shadow-xs"
                                : activeToothData.furca === 2
                                ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                                : activeToothData.furca === 3
                                ? "bg-rose-600 text-white border-rose-600 shadow-xs ring-1 ring-rose-400"
                                : "bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-500/15 border-slate-200 dark:border-slate-800"
                            }`}
                            title={
                              activeToothData.furca > 0 
                                ? `Compromiso de Furca: Grado ${activeToothData.furca} (Hamp). Clic para cambiar grado.` 
                                : "Compromiso de Furca (Hamp): Clic para alternar Grados 0, I, II, III"
                            }
                          >
                            <span className="text-[10px] sm:text-[7.5px] font-sans font-bold block">
                              {activeToothData.furca > 0 ? `F${activeToothData.furca}` : "Furca"}
                            </span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Miller Mobility & Hamp Furca Involvement */}
              <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-100 dark:border-slate-800 space-y-3 shadow-2xs">
                {/* Mobility */}
                <div className="space-y-1.5">
                  <span className="text-[10px] text-slate-405 dark:text-slate-400 font-extrabold uppercase tracking-wider block">
                    Grado de Movilidad Unitaria (Miller modificada):
                  </span>
                  <div className="flex gap-1.5">
                    {([0, 1, 2, 3] as const).map((grade) => (
                      <button
                        key={`mov-${grade}`}
                        onClick={() => handleNumberFlag(selectedTooth, "movilidad", grade)}
                        className={`flex-1 py-1 px-2.5 text-xs font-mono font-bold rounded-lg border transition-all cursor-pointer ${
                          activeToothData.movilidad === grade
                            ? "bg-slate-900 border-slate-900 text-white dark:bg-white dark:text-slate-900 dark:border-white shadow-xs"
                            : "bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                        }`}
                      >
                        G{grade}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Furca Involvement */}
                <div className="space-y-1.5">
                  <span className="text-[10px] text-slate-405 dark:text-slate-400 font-extrabold uppercase tracking-wider block">
                    Lesión de Furca Radicular (Clasificación de Hamp):
                  </span>
                  <div className="flex gap-1.5">
                    {([0, 1, 2, 3] as const).map((grade) => (
                      <button
                        key={`furc-${grade}`}
                        onClick={() => handleNumberFlag(selectedTooth, "furca", grade)}
                        className={`flex-1 py-1 px-2.5 text-xs font-mono font-bold rounded-lg border transition-all cursor-pointer ${
                          activeToothData.furca === grade
                            ? "bg-slate-900 border-slate-900 text-white dark:bg-white dark:text-slate-900 dark:border-white shadow-xs"
                            : "bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                        }`}
                      >
                        F{grade}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LANG & TONETTI PERIODONTAL RISK ASSESSMENT (PRA) INTERACTIVE CALCULATOR */}
      <div className="bg-slate-900 dark:bg-slate-950 rounded-2xl border border-slate-800 p-6 text-white space-y-6 relative overflow-hidden">
        {/* Glow graphics background decoration */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/5 rounded-full filter blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-4">
          <div className="space-y-1">
            <span className="text-[10px] tracking-wider text-teal-400 font-mono font-bold uppercase block">
              Algoritmo de Valoración y Pronóstico Periodontal
            </span>
            <h4 className="text-base font-display font-black flex items-center gap-2">
              <Award className="w-5 h-5 text-teal-400 animate-pulse" />
              Evaluación de Riesgo de Lang & Tonetti (Universidad de Berna / PRA)
            </h4>
            <div className="text-[10px] text-teal-400 bg-teal-400/10 border border-teal-400/20 rounded-lg px-2.5 py-1 inline-flex items-center gap-2 mt-1.5">
              <span>💡</span>
              <span><strong>¡Nuevo!</strong> Accede a la pestaña superior <strong>&quot;Análisis de Riesgo PRA&quot;</strong> para interactuar con el Polígono de Araña Bernés tridimensional.</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 bg-black/30 px-4 py-2 rounded-xl border border-white/5">
            <span className="text-xs text-slate-400">Riesgo Global:</span>
            <span className={`text-sm font-black tracking-wide px-2.5 py-0.5 rounded-md font-mono ${
              overallRiskLevel === "ALTO" 
                ? "bg-red-500/20 text-red-400 border border-red-500/30" 
                : overallRiskLevel === "MODERADO" 
                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" 
                : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
            }`}>
              {overallRiskLevel}
            </span>
          </div>
        </div>

         {/* INTERACTIVE SIMULATORS FOR INSTANT PATIENT EVALUATION */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white/5 p-4 rounded-xl border border-white/10">
          {/* Smoking slider input */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wide flex justify-between">
              <span>Hábito Tabáquico:</span>
              <span className="text-teal-400 font-mono">{praSmoking} cigs/dia</span>
            </label>
            <input 
              type="range" 
              min="0" 
              max="30"
              value={praSmoking}
              onChange={(e) => handleSmokingChange(parseInt(e.target.value) || 0)}
              className="w-full accent-teal-400 font-bold"
            />
            <span className="text-[9px] text-slate-400 block font-light">
              &ge; 10 cig/día representa factor de alto riesgo según criterios Berna.
            </span>
          </div>

          {/* Diabetes status toggle */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wide block">
              Condición Metabólica (Diabetes):
            </label>
            <select 
              value={praDiabetes} 
              onChange={(e) => handleDiabetesChange(e.target.value as any)}
              className="w-full bg-slate-900 border border-white/15 rounded-lg py-1 px-2.5 text-xs outline-none text-white focus:border-teal-400"
            >
              <option value="none">Sano / Sin Diabetes</option>
              <option value="controlled">Diabetes Controlada (HbA1c &lt; 7.0%)</option>
              <option value="severe">Diabetes Descompensada (HbA1c &ge; 7.0%)</option>
            </select>
            <span className="text-[9px] text-slate-400 block font-light">
              Niveles HbA1c &ge; 7% aceleran gravemente la pérdida ósea alveolar.
            </span>
          </div>

          {/* Patient simulated age slider */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wide flex justify-between">
              <span>Edad del Paciente:</span>
              <span className="text-teal-400 font-mono">{praAge} años</span>
            </label>
            <input 
              type="range" 
              min="18" 
              max="95"
              value={praAge}
              onChange={(e) => handleAgeChange(parseInt(e.target.value) || 45)}
              className="w-full accent-teal-400"
            />
            <span className="text-[9px] text-slate-400 block font-light">
              Determina la relación entre pérdida ósea (NIC máx) y edad.
            </span>
          </div>
        </div>

        {/* 6 LANG AND TONETTI PILLARS DASHBOARD REPRESENTATION */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {/* BOP Pillar */}
          <div className="bg-black/40 border border-white/5 p-3 rounded-xl space-y-1 text-center">
            <span className="text-[9px] text-slate-400 uppercase font-mono block">1. Sangrado BOP</span>
            <div className={`text-base font-extrabold font-mono ${isBopHigh ? "text-red-400" : "text-emerald-400"}`}>
              {normalizedBop}%
            </div>
            <span className={`text-[9px] px-1.5 py-0.5 rounded-full inline-block font-mono ${
              isBopHigh ? "bg-red-500/10 text-red-300" : "bg-emerald-500/10 text-emerald-300"
            }`}>
              {isBopHigh ? "Alto Riesgo" : "Saludable"}
            </span>
          </div>

          {/* Residual Pockets Pillar */}
          <div className="bg-black/40 border border-white/5 p-3 rounded-xl space-y-1 text-center">
            <span className="text-[9px] text-slate-400 uppercase font-mono block">2. Bolsas &ge;5mm</span>
            <div className={`text-base font-extrabold font-mono ${isPocketsHigh ? "text-red-400" : "text-emerald-400"}`}>
              {pocketsGreaterEqual5} sitio(s)
            </div>
            <span className={`text-[9px] px-1.5 py-0.5 rounded-full inline-block font-mono ${
              isPocketsHigh ? "bg-red-500/10 text-red-300" : "bg-emerald-500/10 text-emerald-300"
            }`}>
              {isPocketsHigh ? "Alto Riesgo" : "Normal"}
            </span>
          </div>

          {/* Teeth Loss Pillar */}
          <div className="bg-black/40 border border-white/5 p-3 rounded-xl space-y-1 text-center">
            <span className="text-[9px] text-slate-400 uppercase font-mono block">3. Pérdida Dentaria</span>
            <div className={`text-base font-extrabold font-mono ${isMissingHigh ? "text-red-400" : "text-emerald-400"}`}>
              {missingTeethCount} perdida(s)
            </div>
            <span className={`text-[9px] px-1.5 py-0.5 rounded-full inline-block font-mono ${
              isMissingHigh ? "bg-red-500/10 text-red-300" : "bg-emerald-500/10 text-emerald-300"
            }`}>
              {isMissingHigh ? "Alto Riesgo" : "Normal"}
            </span>
          </div>

          {/* Bone loss / Age ratio Pillar */}
          <div className="bg-black/40 border border-white/5 p-3 rounded-xl space-y-1 text-center">
            <span className="text-[9px] text-slate-400 uppercase font-mono block">4. Alveolar/Edad</span>
            <div className={`text-base font-extrabold font-mono ${isBoneLossHigh ? "text-red-400" : "text-emerald-400"}`}>
              {praiseRatio.toFixed(2)}
            </div>
            <span className={`text-[9px] px-1.5 py-0.5 rounded-full inline-block font-mono ${
              isBoneLossHigh ? "bg-red-500/10 text-red-300" : "bg-emerald-500/10 text-emerald-300"
            }`}>
              {isBoneLossHigh ? "Alto Riesgo" : "Normal"}
            </span>
          </div>

          {/* Diabetes status Pillar */}
          <div className="bg-black/40 border border-white/5 p-3 rounded-xl space-y-1 text-center">
            <span className="text-[9px] text-slate-400 uppercase font-mono block">5. Diabetes</span>
            <div className={`text-xs font-mono font-bold truncate ${isDiabetesHigh ? "text-red-400" : "text-emerald-400"}`}>
              {praDiabetes === "none" ? "Sin diabetes" : praDiabetes === "controlled" ? "HbA1c < 7.0%" : "HbA1c ≥ 7.0%"}
            </div>
            <span className={`text-[9px] px-1.5 py-0.5 rounded-full inline-block font-mono ${
              isDiabetesHigh ? "bg-red-500/10 text-red-300" : "bg-emerald-500/10 text-emerald-300"
            }`}>
              {isDiabetesHigh ? "Alto Riesgo" : "Normal"}
            </span>
          </div>

          {/* Smoking status Pillar */}
          <div className="bg-black/40 border border-white/5 p-3 rounded-xl space-y-1 text-center">
            <span className="text-[9px] text-slate-400 uppercase font-mono block">6. Tabaquismo</span>
            <div className={`text-base font-extrabold font-mono ${isSmokingHigh ? "text-red-400" : "text-emerald-400"}`}>
              {praSmoking} al día
            </div>
            <span className={`text-[9px] px-1.5 py-0.5 rounded-full inline-block font-mono ${
              isSmokingHigh ? "bg-red-500/10 text-red-300" : "bg-emerald-500/10 text-emerald-300"
            }`}>
              {isSmokingHigh ? "Alto Riesgo" : "Normal"}
            </span>
          </div>
        </div>

        {/* CLINICAL DECISION SUPPORT & GUIDANCE REMARKS */}
        <div className="bg-white/[0.03] border border-white/10 p-5 rounded-xl space-y-3">
          <span className="text-xs font-bold text-teal-400 block uppercase tracking-wider">
            Recomendaciones Clínicas de Apoyo a la Decisión Periodontal:
          </span>
          
          <div className="text-xs text-slate-300 leading-relaxed font-light space-y-2">
            <p>
              {overallRiskLevel === "ALTO" ? (
                <span>
                  <strong>🚨 ACCIÓN INMEDIATA:</strong> El paciente experimenta una tasa de susceptibilidad periodontal crítica. Se sugiere programar terapia periodontal activa de fase I (raspado y alisado radicular) o derivación a especialista si persisten multi-furcas clase II o III. Es vital instruir reducción estricta del hábito tabáquico y control de glucosa HbA1c para estabilización de inserción.
                </span>
              ) : overallRiskLevel === "MODERADO" ? (
                <span>
                  <strong>⚠️ MONITORIZACIÓN CLÍNICA:</strong> Riesgo periodontal intermedio. Programar profilaxis clínica y descontaminación subgingival periodontal cada 3-6 meses. Reforzar uso de enjuagues periodontales antisépticos o cepillos interproximales en nichos de bolsas &ge; 4mm.
                </span>
              ) : (
                <span>
                  <strong>✅ MANTENIMIENTO:</strong> El paciente presenta un perfil de susceptibilidad periodontal controlado. Se sugiere agendar visitas de mantenimiento preventivo anuales. Conservar tácticas de motivación e higiene vigentes.
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Guide details panel */}
      <div className="bg-teal-50/20 dark:bg-slate-800/10 border border-teal-500/10 p-4 rounded-xl flex gap-3 text-xs text-teal-800 dark:text-teal-300">
        <Info className="w-5 h-5 text-teal-600 dark:text-teal-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h5 className="font-bold">Guía Clínica de Parámetros Periodontales</h5>
          <p className="font-light leading-relaxed">
            <strong>Sondaje (Profundidad de Bolsa PS):</strong> Valores habituales están entre &le; 3 mm de surco saludable. Un PS &ge; 4 mm representa pérdida clínica patológica que requiere instrumentación clínica. 
            <br />
            <strong>Nivel de Inserción Clínica (NIC / CAL):</strong> Sumatoria absoluta del Sondaje y la Recesión Gingival (PS + REC), definiendo con rigor científico el grado de soporte óseo remanente del diente tratado.
          </p>
        </div>
      </div>

      {/* Fast Probing Keyboard Bar */}
      <FastProbingBar
        isActive={isFastProbingActive}
        onClose={() => setIsFastProbingActive(false)}
        periodontogram={periodontogram}
        onUpdatePeriodontogram={onChange}
      />

      {/* Periodontogram Comparison Modal */}
      {patient && (
        <PeriodontogramComparisonModal
          isOpen={isComparisonModalOpen}
          onClose={() => setIsComparisonModalOpen(false)}
          patient={patient}
          onSaveCurrentSnapshot={(title) => {
            if (patient && onUpdatePatient) {
              const newSnapshot = {
                id: 'visit_' + Date.now(),
                date: new Date().toLocaleDateString('es-CL'),
                title,
                oLearyScore: normalizedOLeary,
                bopScore: normalizedBop,
                meanPocketDepth: 2.2, // calculated dynamically inside comparison
                periodontogram
              };
              const updatedHistory = [newSnapshot, ...(patient.periodontogramHistory || [])];
              onUpdatePatient({
                ...patient,
                periodontogramHistory: updatedHistory
              });
            }
          }}
        />
      )}

    </div>
  );
}

export default React.memo(PeriodontogramaComponent);
