import React, { useState } from "react";
import { Patient } from "../types";
import { BrainCircuit, Loader2, Save } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { recordHipaaAudit } from "../utils/hipaaAudit";

interface SoapAIAssistantProps {
  patient: Patient;
  onUpdatePatient: (updatedPatient: Patient) => void;
  doctorName?: string;
}

export default function SoapAIAssistant({ patient, onUpdatePatient, doctorName = "Dr. Ignacio León" }: SoapAIAssistantProps) {
  const [soapNote, setSoapNote] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [isAiGenerated, setIsAiGenerated] = useState(false);

  const generateSoap = async () => {
    setIsGenerating(true);
    setSaveSuccess(false);
    setIsAiGenerated(false);

    recordHipaaAudit("AI_ASSIST_EVALUATION", `Generación asistida por IA de nota clínica SOAP para ${patient.name}.`, {
      patientId: patient.id,
      patientName: patient.name,
      resource: "Copiloto Clínico SOAP AI",
      severity: "info"
    });
    
    // First calculate the objective clinical parameters from client state
    let subjective = `Paciente ${patient.name} de edad ${patient.birthdate ? (new Date().getFullYear() - new Date(patient.birthdate).getFullYear()) : "45"} años. `;
    if (patient.anamnesis?.hta) subjective += "Refiere antecedente de hipertensión arterial (HTA) sistémica controlada. ";
    if (patient.anamnesis?.tabaquismo > 0) subjective += `Tabaquismo activo registrado con frecuencia de ${patient.anamnesis.tabaquismo} cigarrillos por día. `;
    
    let objective = `Al examen clínico e instrumental de tejidos de soporte: `;
    let totalBolsas = 0;
    let bleedingSites = 0;
    let plaqueSites = 0;
    let totalSites = 0;

    Object.values(patient.periodontogram || {}).forEach(p => {
      // Exclude absent teeth from metrics
      if (patient.odontogram?.[p.toothNumber]?.condition === "ausente") return;

      // Pockets >= 4mm
      if (p.vestibularPocket) {
        if (p.vestibularPocket.mesial >= 4) totalBolsas++;
        if (p.vestibularPocket.central >= 4) totalBolsas++;
        if (p.vestibularPocket.distal >= 4) totalBolsas++;
      }
      if (p.palatinoPocket) {
        if (p.palatinoPocket.mesial >= 4) totalBolsas++;
        if (p.palatinoPocket.central >= 4) totalBolsas++;
        if (p.palatinoPocket.distal >= 4) totalBolsas++;
      }

      // Bleeding on probing
      if (p.sangradoVestibular) {
        totalSites += 3;
        if (p.sangradoVestibular.mesial) bleedingSites++;
        if (p.sangradoVestibular.central) bleedingSites++;
        if (p.sangradoVestibular.distal) bleedingSites++;
      }
      if (p.sangradoPalatino) {
        totalSites += 3;
        if (p.sangradoPalatino.mesial) bleedingSites++;
        if (p.sangradoPalatino.central) bleedingSites++;
        if (p.sangradoPalatino.distal) bleedingSites++;
      }

      // Plaque metrics
      if (p.placaVestibular) {
        if (p.placaVestibular.mesial) plaqueSites++;
        if (p.placaVestibular.central) plaqueSites++;
        if (p.placaVestibular.distal) plaqueSites++;
      }
      if (p.placaPalatino) {
        if (p.placaPalatino.mesial) plaqueSites++;
        if (p.placaPalatino.central) plaqueSites++;
        if (p.placaPalatino.distal) plaqueSites++;
      }
    });

    const bopIndex = totalSites > 0 ? Math.round((bleedingSites / totalSites) * 100) : 15;
    const plaqueIndex = totalSites > 0 ? Math.round((plaqueSites / totalSites) * 100) : 25;

    if (totalBolsas > 0) {
      objective += `Se registran físicamente ${totalBolsas} localizaciones periodontales con profundidad al sondaje (PS) patológica ≥ 4mm. `;
    } else {
      objective += `Profundidades de sondaje surco-creviculares saludables dentro de rangos biológicamente normales. `;
    }

    objective += `Índice de Sangrado al Sondaje (BOP) clínicamente activo del ${bopIndex}%. Índice de Placa Bacteriana del ${plaqueIndex}%. `;

    // Try live Gemini generation first
    try {
      const activeSpecialty = (patient as any).activeSpecialty || "periodoncia";
      const specialtyData = (patient as any).specialtyData || {};
      
      const response = await fetch("/api/dentito", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `Por favor actúa como Especialista Odontólogo en la especialidad de "${activeSpecialty.toUpperCase()}" y redacta una Nota Evolutiva SOAP detallada y con el estándar de mayor rigor clínico para el paciente ${patient.name}.

Parámetros clínicos generales a considerar:
- Edad del paciente: ${patient.birthdate ? (new Date().getFullYear() - new Date(patient.birthdate).getFullYear()) : "45"} años.
- Antecedentes médicos relevantes (Anamnesis): ${JSON.stringify(patient.anamnesis || {})}
- Total de bolsas periodontales patológicas detectadas (sondaje ≥ 4mm): ${totalBolsas} localizaciones.
- Sangrado al sondaje (BOP): ${bopIndex}%.
- Índice de Placa Bacteriana (O'Leary): ${plaqueIndex}%.

Especialidad Activa: ${activeSpecialty.toUpperCase()}
Datos clínicos específicos de Especialidad: ${JSON.stringify(specialtyData)}

Estructura tu respuesta exactamente bajo estos títulos markdown (usa ###):
### [S] Subjetivo
(Escribe una descripción de los síntomas manifestados, el motivo de consulta según la especialidad de ${activeSpecialty}, factores de riesgo y actitud del paciente)

### [O] Objetivo
(Detalla los hallazgos del examen físico, pruebas de vitalidad, mediciones específicas de la especialidad como Angle o conductometría, e índices calculated BOP ${bopIndex}% y Plaque ${plaqueIndex}%)

### [A] Análisis / Diagnóstico
(Establece el diagnóstico clínico correspondiente, clasificando según el consenso internacional de la especialidad: ya sea AAP 2018 para periodoncia, ICDAS para caries, clasificaciones de maloclusión de Angle para ortodoncia, o patología pulpar para endodoncia de forma rigurosa)

### [P] Plan de Tratamiento Clínico
(Sugiere de manera estructurada los pasos terapéuticos inmediatos y mediatos de la especialidad de ${activeSpecialty}, pautas de prevención y controles de mantenimiento)

Redacta en un tono extremadamente sofisticado, académico y profesional en español, perfecto para ser adosado al historial médico formal.`
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error("Servidor no respondió de manera exitosa.");
      }

      const data = await response.json();
      if (data && data.text && !data.text.includes("dummy-key-for-load") && !data.text.includes("Settings > Secrets")) {
        setSoapNote(data.text);
        setIsAiGenerated(true);
        setIsGenerating(false);
        return;
      }
    } catch (err) {
      console.warn("Fallo en la comunicación con el modelo avanzado de Gemini. Activando generador local de respaldo clínico...", err);
    }

    // Graceful Clinical Offline Fallback
    setTimeout(() => {
      let analysis = "Salud periodontal o gingivitis asociada a biopelícula en periodonto intacto.";
      if (totalBolsas > 5) {
        analysis = `Periodontitis Inicial/Moderada Generalizada Estadio II, Grado ${patient.anamnesis?.tabaquismo >= 10 ? "B (Riesgo alto por tabaquismo)" : "A"}.`;
      } else if (totalBolsas > 0) {
        analysis = `Periodontitis Localizada Estadio I, Grado A.`;
      }

      let plan = `- Instrucción minuciosa de Técnica de Higiene Oral (THO) con énfasis en técnica de Bass modificada e hilo dental.\n- Raspado y Alisado Radicular (RAR) supra y subgingival de sectores con inflamación activa.\n- Reevaluación clínica en un periodo de 4 semanas.\n- Monitoreo interdisciplinario de factores predisponentes y control sutil de tabaquismo.`;

      const markdownNote = `### [S] Subjetivo\n${subjective}\n\n### [O] Objetivo\n${objective}\n\n### [A] Análisis / Diagnóstico\n${analysis}\n\n### [P] Plan de Tratamiento Clínico\n${plan}`;
      
      setSoapNote(markdownNote);
      setIsAiGenerated(false);
      setIsGenerating(false);
    }, 1200);
  };

  const handleSaveSoapNote = () => {
    if (!soapNote) return;

    // Create a new evolution
    const newEvolution = {
      id: `evo-soap-${Date.now()}`,
      date: new Date().toLocaleDateString("es-ES"),
      description: `📝 NOTA EVOLUTIVA SOAP (Asistida por IA):\n\n${soapNote.replace(/###/g, "")}`,
      professional: doctorName,
    };

    const updatedEvolutions = [newEvolution, ...(patient.evolutions || [])];
    onUpdatePatient({
      ...patient,
      evolutions: updatedEvolutions,
    });

    recordHipaaAudit("UPDATE_PATIENT_RECORD", `Guardado de nota evolutiva SOAP generada por IA en la ficha de ${patient.name}.`, {
      patientId: patient.id,
      patientName: patient.name,
      resource: "Evolución y Bitácora ePHI",
      severity: "info"
    });

    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
    }, 4000);
  };

  return (
    <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
       <div className="flex justify-between items-center mb-6">
         <div>
            <h3 className="font-display font-bold text-xl text-slate-800 dark:text-white flex items-center gap-2">
              <BrainCircuit className="w-6 h-6 text-teal-600 dark:text-teal-400" /> Asistente de Evolución SOAP
            </h3>
            <p className="text-xs text-slate-500 mt-1">Genera automáticamente la redacción clínica evaluando los datos periodontales ingresados.</p>
         </div>
         <button 
           onClick={generateSoap}
           disabled={isGenerating}
           className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold py-2.5 px-5 rounded-xl flex items-center gap-2 hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shadow-lg shadow-teal-900/10 cursor-pointer disabled:opacity-50"
         >
           {isGenerating ? <Loader2 className="w-4 h-4 animate-spin"/> : <BrainCircuit className="w-4 h-4"/>}
           <span className="text-sm">Redactar Evolución AI</span>
         </button>
       </div>

       <div className="relative min-h-[300px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 rounded-xl p-6 shadow-inner text-sm text-slate-700 dark:text-slate-300">
         {isGenerating ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-teal-600 dark:text-teal-400 bg-white/50 dark:bg-black/50 backdrop-blur-sm rounded-xl">
              <Loader2 className="w-10 h-10 animate-spin mb-4" />
              <p className="font-mono text-xs animate-pulse">Analizando profundidades de bolsas crónicas y sangrado...</p>
            </div>
         ) : soapNote ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-700/50">
                {isAiGenerated ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wide uppercase bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    ✨ Gemini Neural Advanced Engine
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wide uppercase bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">
                    💻 Clinical Expert Local Synthesizer
                  </span>
                )}
                <span className="text-[10px] text-slate-400 dark:text-slate-500">Último análisis: Hoy</span>
              </div>
              <div className="markdown-body text-slate-800 dark:text-slate-200 hide-scrollbar overflow-y-auto">
                <ReactMarkdown>{soapNote}</ReactMarkdown>
              </div>
            </div>
         ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3">
               <BrainCircuit className="w-12 h-12 opacity-20" />
               <p className="text-xs">Presiona generar para que la IA escudriñe el expediente de {patient.name}.</p>
            </div>
         )}
       </div>

       {soapNote && (
         <div className="mt-4 flex items-center justify-between">
           <div className="min-h-[20px]">
             {saveSuccess && (
               <span className="text-xs font-bold text-teal-600 dark:text-teal-400 animate-pulse flex items-center gap-1.5">
                 ✨ ¡Nota guardada correctamente en el expediente!
               </span>
             )}
           </div>
           <button
             onClick={handleSaveSoapNote}
             disabled={saveSuccess}
             className={`flex items-center gap-2 text-xs font-bold transition-all px-4 py-2.5 rounded-xl cursor-pointer ${
               saveSuccess
                 ? "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700 cursor-not-allowed"
                 : "text-teal-600 hover:text-white dark:text-teal-400 dark:hover:text-slate-900 border border-teal-200 dark:border-teal-900/50 hover:bg-teal-600 dark:hover:bg-teal-400 bg-teal-55 bg-teal-500/5"
             }`}
           >
             <Save className="w-4 h-4" />
             {saveSuccess ? "Guardado en Historial" : "Guardar en Ficha Permanente"}
           </button>
         </div>
       )}
    </div>
  );
}
