import React, { useState } from "react";
import { Patient } from "../types";
import { Printer, ShieldCheck, User, Pill, FileSignature, FileText, CheckCircle } from "lucide-react";
import Logo from "./Logo";
import Odontograma from "./Odontograma";
import Periodontograma from "./Periodontograma";
import OLearyControl from "./OLearyControl";
import { recordHipaaAudit } from "../utils/hipaaAudit";

interface PrintReportProps {
  activePatient: Patient | null;
  doctorName: string;
  clinicName: string;
}

type PrintTemplateType = "completo" | "presupuesto" | "receta" | "consentimiento";

export default function PrintReport({ activePatient, doctorName, clinicName }: PrintReportProps) {
  const [templateType, setTemplateType] = useState<PrintTemplateType>("completo");
  const [prescriptionNotes, setPrescriptionNotes] = useState<string>(
    "1. Amoxicilina 875mg + Ácido Clavulánico 125mg: Tomar 1 comprimido cada 12 horas por 7 días vía oral.\n2. Ketorolaco 10mg sublingual: Tomar 1 comprimido cada 8 horas por 3 días en caso de dolor o inflamación moderada.\n3. Clorhexidina 0.12%: Realizar enjuagues de 15ml durante 30 segundos, 2 veces al día por 10 días tras el cepillado."
  );

  if (!activePatient) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-500 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
        <Printer className="w-12 h-12 mb-4 text-slate-300 dark:text-slate-700" />
        <h3 className="text-xl font-bold font-display">Sin Paciente para Imprimir</h3>
        <p className="text-xs text-slate-400 mt-1">Selecciona un paciente del directorio para emitir reportes clínicos oficiales.</p>
      </div>
    );
  }

  const handlePrint = () => {
    if (activePatient) {
      recordHipaaAudit("PRINT_EXPORT_PATIENT", `Emisión o exportación a PDF de informe clínico (${templateType}) para ${activePatient.name}.`, {
        patientId: activePatient.id,
        patientName: activePatient.name,
        resource: `Informe Impreso: ${templateType.toUpperCase()} ePHI`,
        severity: "warning"
      });
    }
    window.print();
  };

  const oLearyPct = () => {
    let totals = 0;
    let withPlaque = 0;
    
    const UPPER_TEETH = {
      right: [18, 17, 16, 15, 14, 13, 12, 11],
      left: [21, 22, 23, 24, 25, 26, 27, 28]
    };
    const LOWER_TEETH = {
      right: [48, 47, 46, 45, 44, 43, 42, 41],
      left: [31, 32, 33, 34, 35, 36, 37, 38]
    };
    const allTeeth = [...Object.values(UPPER_TEETH).flat(), ...Object.values(LOWER_TEETH).flat()];

    allTeeth.forEach(toothNum => {
      const isAbsent = activePatient.odontogram?.[toothNum]?.condition === "ausente";
      if (!isAbsent) {
        totals += 4;
        const f = activePatient.oLeary?.[toothNum];
        if (f) {
          if (f.mesial) withPlaque++;
          if (f.distal) withPlaque++;
          if (f.vestibular) withPlaque++;
          if (f.lingual) withPlaque++;
        }
      }
    });

    if (totals === 0) return 0;
    return Math.round((withPlaque / totals) * 100);
  };

  const totalPresupuesto = activePatient.treatmentPlan?.procedures?.reduce((acc, p) => {
    const discountValue = p.discount || 0;
    return acc + Math.round(p.cost * (1 - (discountValue / 100)));
  }, 0) || 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto w-full">
      {/* Non-Printable Header Config */}
      <div className="no-print bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xs">
        <div>
          <h2 className="text-xl font-display font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
             <Printer className="w-6 h-6 text-teal-600 dark:text-teal-400" /> Generador de Documentos Clínicos A4 & PDF
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Selecciona el formato de impresión oficial para exportar en PDF o enviar a impresora.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Template Selectors */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setTemplateType("completo")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                templateType === "completo" ? "bg-white dark:bg-slate-900 text-teal-600 shadow-xs" : "text-slate-600 dark:text-slate-400"
              }`}
            >
              Ficha Integral
            </button>
            <button
              onClick={() => setTemplateType("presupuesto")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                templateType === "presupuesto" ? "bg-white dark:bg-slate-900 text-teal-600 shadow-xs" : "text-slate-600 dark:text-slate-400"
              }`}
            >
              Presupuesto
            </button>
            <button
              onClick={() => setTemplateType("receta")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                templateType === "receta" ? "bg-white dark:bg-slate-900 text-teal-600 shadow-xs" : "text-slate-600 dark:text-slate-400"
              }`}
            >
              Receta Médica
            </button>
            <button
              onClick={() => setTemplateType("consentimiento")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                templateType === "consentimiento" ? "bg-white dark:bg-slate-900 text-teal-600 shadow-xs" : "text-slate-600 dark:text-slate-400"
              }`}
            >
              Consentimiento
            </button>
          </div>

          <button 
            onClick={handlePrint} 
            className="bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs py-2.5 px-5 rounded-xl flex items-center gap-2 cursor-pointer transition-all shadow-sm active:scale-95"
          >
            <Printer className="w-4 h-4"/> Imprimir / Guardar PDF
          </button>
        </div>
      </div>

      {/* A4 Document Simulation */}
      <div className="bg-white text-black p-8 md:p-12 print:p-0 rounded-3xl shadow-2xl print:shadow-none border border-slate-200 print:border-none min-h-[1056px] relative" id="print-document">
         
         {/* Clinic Header */}
         <div className="border-b-2 border-slate-900 pb-6 mb-6 flex justify-between items-end gap-4">
            <div className="flex items-center gap-4">
              <Logo size="md" subtitle="Software Odontológico Profesional" />
              <div className="border-l-2 border-slate-200 pl-4">
                <h1 className="text-xl font-display font-black tracking-tight uppercase text-slate-900 leading-tight">
                  {clinicName || "PerioClinic Pro"}
                </h1>
                <p className="text-slate-600 font-mono mt-0.5 flex items-center gap-1.5 text-xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-700"/>
                  {templateType === "receta" 
                    ? "Recetario Médico Odontológico" 
                    : templateType === "presupuesto" 
                    ? "Presupuesto Odontológico Formal" 
                    : templateType === "consentimiento"
                    ? "Consentimiento Informado Clínico & Quirúrgico"
                    : "Ficha Clínica & Diagnóstico Integral"}
                </p>
              </div>
            </div>
            <div className="text-right text-xs leading-relaxed shrink-0">
              <p className="font-bold text-base text-slate-900">{doctorName || "Dr. Titular"}</p>
              <p className="font-mono text-slate-500">Fecha: {new Date().toLocaleDateString('es-ES')}</p>
            </div>
         </div>

         {/* Patient Demographics */}
         <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl mb-6 flex gap-6 items-center">
            <User className="w-12 h-12 text-slate-400 bg-white rounded-lg border border-slate-200 p-2 shrink-0"/>
            <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">Paciente</p>
                <p className="font-bold text-sm text-slate-900">{activePatient.name}</p>
              </div>
              <div>
                <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">RUT / DNI / ID</p>
                <p className="font-mono">{activePatient.rut || activePatient.dni || activePatient.id.toUpperCase()}</p>
              </div>
              <div>
                <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">Fecha Nto.</p>
                <p>{activePatient.birthdate}</p>
              </div>
              <div>
                <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">Teléfono</p>
                <p className="font-mono">{activePatient.phone}</p>
              </div>
            </div>
         </div>

         {/* Medical Warnings */}
         <div className="mb-6 p-3 border-l-4 border-rose-500 bg-rose-50 rounded-r-lg">
            <h3 className="font-bold text-rose-900 uppercase tracking-widest text-[10px] mb-1">Alertas Sistémicas & Alergias</h3>
            <div className="flex flex-wrap gap-4 font-mono text-rose-800 text-xs">
              {activePatient.anamnesis?.hta && <span>[!] Hipertensión</span>}
              {activePatient.anamnesis?.diabetes && <span>[!] Diabetes</span>}
              {activePatient.anamnesis?.tabaquismo > 0 && <span>Tabaquismo: {activePatient.anamnesis.tabaquismo} cigs/día</span>}
              {activePatient.anamnesis?.alergias && <span>Alergias: {activePatient.anamnesis.alergias}</span>}
              {!activePatient.anamnesis?.hta && !activePatient.anamnesis?.diabetes && !activePatient.anamnesis?.alergias && (
                <span className="text-slate-600 font-sans">Sin antecedentes patológicos relevantes declarados.</span>
              )}
            </div>
         </div>

         {/* TEMPLATE: PRESCRIPCIÓN MÉDICA */}
         {templateType === "receta" && (
           <div className="space-y-6 my-8">
             <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
               <h3 className="font-bold text-sm uppercase tracking-wider text-slate-900 mb-3 flex items-center gap-2">
                 <Pill className="w-4 h-4 text-teal-600" /> Indicación Farmacológica (Rp.)
               </h3>
               <textarea
                 rows={10}
                 value={prescriptionNotes}
                 onChange={(e) => setPrescriptionNotes(e.target.value)}
                 className="w-full bg-white p-4 border border-slate-300 rounded-lg text-xs font-mono leading-relaxed resize-none focus:outline-none"
               />
             </div>
             <p className="text-[11px] text-slate-500 italic">
               * Válido por 30 días a contar de la fecha de emisión. Presentar en farmacia en caso de requerir receta médica retenida.
             </p>
           </div>
         )}

         {/* TEMPLATE: PRESUPUESTO FORMAL */}
         {templateType === "presupuesto" && (
           <div className="space-y-6 my-6">
             <h3 className="font-bold text-base border-b border-slate-300 pb-2 font-display text-slate-900">
               Desglose de Tratamientos & Presupuesto
             </h3>
             <table className="w-full text-left border-collapse text-xs">
               <thead>
                 <tr className="bg-slate-100">
                   <th className="border border-slate-300 p-2 uppercase text-[10px] font-bold w-28">Fase</th>
                   <th className="border border-slate-300 p-2 uppercase text-[10px] font-bold w-16 text-center">Pieza</th>
                   <th className="border border-slate-300 p-2 uppercase text-[10px] font-bold">Procedimiento Clínico</th>
                   <th className="border border-slate-300 p-2 uppercase text-[10px] font-bold w-24 text-right">Valor Base</th>
                   <th className="border border-slate-300 p-2 uppercase text-[10px] font-bold w-16 text-right">Dto</th>
                   <th className="border border-slate-300 p-2 uppercase text-[10px] font-bold w-24 text-right">Total</th>
                 </tr>
               </thead>
               <tbody>
                  {activePatient.treatmentPlan?.procedures.map(p => {
                    const discountValue = p.discount || 0;
                    const subtotal = Math.round(p.cost * (1 - (discountValue / 100)));
                    return (
                    <tr key={p.id}>
                      <td className="border border-slate-300 p-2 text-slate-600">{p.phase}</td>
                      <td className="border border-slate-300 p-2 font-mono text-center font-bold">{p.tooth || '-'}</td>
                      <td className="border border-slate-300 p-2 font-medium">{p.description} {p.surface ? `(${p.surface})` : ''}</td>
                      <td className="border border-slate-300 p-2 font-mono text-right text-slate-500">${p.cost.toLocaleString('es-CL')}</td>
                      <td className="border border-slate-300 p-2 font-mono text-right text-rose-600">{discountValue > 0 ? `-${discountValue}%` : '-'}</td>
                      <td className="border border-slate-300 p-2 font-mono text-right font-bold">${subtotal.toLocaleString('es-CL')}</td>
                    </tr>
                    );
                  })}
               </tbody>
               <tfoot>
                 <tr className="bg-slate-50 font-bold">
                   <td colSpan={5} className="border border-slate-300 p-3 text-right uppercase text-xs text-slate-700">Total Presupuestado:</td>
                   <td className="border border-slate-300 p-3 font-mono text-right text-sm text-teal-800">${totalPresupuesto.toLocaleString('es-CL')}</td>
                 </tr>
               </tfoot>
             </table>

             <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600 space-y-1">
               <p className="font-bold">Condiciones Comerciales:</p>
               <p>• Presupuesto con validez de 30 días corridos.</p>
               <p>• Facilidades de pago: Tarjeta de Crédito, Transferencia Bancaria y financiamiento en cuotas.</p>
             </div>
           </div>
         )}

         {/* TEMPLATE: CONSENTIMIENTO INFORMADO */}
         {templateType === "consentimiento" && (
           <div className="space-y-6 my-6 text-xs leading-relaxed">
             <h3 className="font-bold text-base border-b border-slate-300 pb-2 font-display text-slate-900 flex items-center gap-2">
               <FileSignature className="w-5 h-5 text-teal-700" />
               Documento Oficial de Consentimiento Informado Quirúrgico & Periodontal
             </h3>

             <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-slate-700">
               <p>
                 Yo, <strong>{activePatient.name}</strong>, identificado(a) con RUT/ID <strong>{activePatient.rut || activePatient.dni || activePatient.id}</strong>, en pleno uso de mis facultades mentales, declaro que el profesional tratante <strong>{doctorName || "Cirujano Dentista"}</strong> me ha explicado en forma clara, comprensible y detallada:
               </p>
               <ol className="list-decimal pl-5 space-y-1.5 font-medium">
                 <li>La naturaleza de mi diagnóstico clínico actual y las consecuencias previsibles de no recibir tratamiento oportuno.</li>
                 <li>Los objetivos y etapas del plan terapéutico propuesto (procedimientos periodontales, quirúrgicos, rehabilitadores o profilácticos).</li>
                 <li>Los riesgos inherentes y eventuales molestias postoperatorias transitorias (sensibilidad térmica, inflamación local o hematomas leves).</li>
                 <li>Las alternativas terapéuticas disponibles y la importancia de mi colaboración activa en la higiene bucal y controles periódicos.</li>
               </ol>
               <p className="text-[11px] text-slate-600">
                 He tenido la oportunidad de formular todas las preguntas necesarias, las cuales han sido respondidas a mi entera satisfacción. Por tanto, otorgo libre y voluntariamente mi consentimiento para la ejecución de los procedimientos clínicos planificados.
               </p>
             </div>

             <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg text-[11px] text-teal-950 font-medium">
               ✓ Emitido conforme a la legislación de Derechos y Deberes de los Pacientes y normativas de confidencialidad de la información de salud (HIPAA / GDPR).
             </div>
           </div>
         )}

         {/* TEMPLATE: FICHA COMPLETA INTEGRAL */}
         {templateType === "completo" && (
           <div className="space-y-10">
             <section>
               <h3 className="font-bold text-base border-b border-slate-200 pb-2 mb-4 font-display text-slate-900">
                 1. Odontograma de Diagnóstico
               </h3>
               <div className="scale-90 origin-top-left">
                 <Odontograma 
                   odontogram={activePatient.odontogram} 
                   onChange={() => {}} 
                 />
               </div>
             </section>

             <section className="print:break-before-page">
               <div className="flex justify-between items-end border-b border-slate-200 pb-2 mb-6">
                  <h3 className="font-bold text-base font-display text-slate-900">2. Parámetros Periodontales Biométricos</h3>
                  <span className="font-mono bg-teal-100 text-teal-800 px-3 py-1 rounded text-xs font-bold">
                    Índice Placa: {oLearyPct()}%
                  </span>
               </div>
               
               <div className="pointer-events-none scale-90 origin-top-left -ml-4">
                  <Periodontograma 
                    periodontogram={activePatient.periodontogram}
                    odontogram={activePatient.odontogram}
                    onChange={() => {}}
                  />
               </div>
             </section>

             <section className="print:break-inside-avoid">
               <h3 className="font-bold text-base border-b border-slate-200 pb-2 mb-4 font-display text-slate-900">
                 3. Mapa de Higiene - Índice O'Leary
               </h3>
               <div className="pointer-events-none scale-90 origin-top-left -ml-4">
                  <OLearyControl 
                    patient={activePatient}
                    onUpdate={() => {}}
                  />
               </div>
             </section>

             <section className="print:break-inside-avoid">
               <h3 className="font-bold text-base border-b border-slate-200 pb-2 mb-4 font-display text-slate-900">
                 4. Resumen de Plan de Tratamiento
               </h3>
               <table className="w-full text-left border-collapse text-xs">
                 <thead>
                   <tr className="bg-slate-100">
                     <th className="border border-slate-300 p-2 uppercase text-[10px] font-bold w-24">Fase</th>
                     <th className="border border-slate-300 p-2 uppercase text-[10px] font-bold w-16 text-center">Pieza</th>
                     <th className="border border-slate-300 p-2 uppercase text-[10px] font-bold">Procedimiento</th>
                     <th className="border border-slate-300 p-2 uppercase text-[10px] font-bold w-24 text-right">Subtotal</th>
                   </tr>
                 </thead>
                 <tbody>
                    {activePatient.treatmentPlan?.procedures.map(p => {
                      const discountValue = p.discount || 0;
                      const subtotal = Math.round(p.cost * (1 - (discountValue / 100)));
                      return (
                      <tr key={p.id}>
                        <td className="border border-slate-300 p-2 text-slate-500">{p.phase}</td>
                        <td className="border border-slate-300 p-2 font-mono text-center">{p.tooth || '-'}</td>
                        <td className="border border-slate-300 p-2 font-medium">{p.description}</td>
                        <td className="border border-slate-300 p-2 font-mono text-right font-bold">${subtotal.toLocaleString('es-CL')}</td>
                      </tr>
                      );
                    })}
                 </tbody>
               </table>
             </section>
           </div>
         )}

         {/* Signature block with dual Doctor & Patient lines */}
         <div className="mt-16 pt-8 border-t border-slate-300 flex justify-between items-end print:break-inside-avoid text-xs">
           <div className="text-center w-48">
             <div className="border-b border-slate-800 h-12 mb-2"></div>
             <p className="font-bold uppercase tracking-wider text-slate-900">{activePatient.name}</p>
             <p className="text-[10px] text-slate-500">Firma del Paciente / Tutor</p>
           </div>

           <div className="text-center w-48">
             <div className="border-b border-slate-800 h-12 mb-2"></div>
             <p className="font-bold uppercase tracking-wider text-slate-900">{doctorName || "Firma Titular"}</p>
             <p className="text-[10px] text-slate-500">Reg. Médico Especialista</p>
           </div>
         </div>

      </div>
    </div>
  );
}
