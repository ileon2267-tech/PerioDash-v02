import { Patient, ActiveTab } from "../types";

export type ClinicalSubView = 
  | "ficha" 
  | "odontograma" 
  | "periodontograma" 
  | "pra" 
  | "oleary" 
  | "xrays" 
  | "soap" 
  | "presupuesto" 
  | "especialidad";

export type VoiceActionType =
  | "NAVIGATE_TAB"
  | "NAVIGATE_CLINICAL_SUBVIEW"
  | "SELECT_PATIENT"
  | "CLEAR_PATIENT"
  | "SET_DARK_MODE"
  | "TOGGLE_DARK_MODE"
  | "SET_ZEN_MODE"
  | "SET_CHAIR_MODE"
  | "OPEN_NEW_PATIENT"
  | "OPEN_SEARCH"
  | "OPEN_DENTITO"
  | "OPEN_APP_LAUNCHER"
  | "CLOSE_APP_LAUNCHER"
  | "OPEN_HIPAA"
  | "TOGGLE_PRIVACY"
  | "OPEN_VOICE_HELP"
  | "TOGGLE_HANDS_FREE"
  | "UNKNOWN";

export interface VoiceCommandResult {
  action: VoiceActionType;
  feedbackText: string;
  speechResponse?: string;
  tab?: ActiveTab;
  subView?: ClinicalSubView;
  patientId?: string;
  patientName?: string;
  boolValue?: boolean;
}

/**
 * Clean and normalize Spanish text removing diacritics, punctuation, and extra spaces.
 */
export function normalizeVoiceText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents/tildes
    .replace(/[¿?¡!.,;:_()\-+"']/g, " ") // remove punctuation
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Fuzzy phonetic match for patient names.
 */
export function findMatchingPatient(
  query: string,
  patients: Patient[]
): Patient | null {
  if (!query || patients.length === 0) return null;
  const cleanQuery = normalizeVoiceText(query);
  if (!cleanQuery) return null;

  // 1. Direct includes match on full name or RUT or ID
  const directMatch = patients.find((p) => {
    const cleanName = normalizeVoiceText(p.name);
    const cleanRut = p.rut ? normalizeVoiceText(p.rut) : "";
    const cleanId = normalizeVoiceText(p.id);

    return (
      cleanName === cleanQuery ||
      cleanName.includes(cleanQuery) ||
      cleanQuery.includes(cleanName) ||
      (cleanRut && cleanRut.includes(cleanQuery)) ||
      (cleanId && cleanId.includes(cleanQuery))
    );
  });
  if (directMatch) return directMatch;

  // 2. Tokenized word match (e.g. user said "carlos" or "gonzalez")
  const queryTokens = cleanQuery.split(" ").filter((w) => w.length >= 3);
  if (queryTokens.length > 0) {
    let bestPatient: Patient | null = null;
    let maxMatches = 0;

    for (const patient of patients) {
      const nameTokens = normalizeVoiceText(patient.name).split(" ");
      let matches = 0;
      for (const qToken of queryTokens) {
        if (nameTokens.some((nToken) => nToken.includes(qToken) || qToken.includes(nToken))) {
          matches++;
        }
      }
      if (matches > maxMatches) {
        maxMatches = matches;
        bestPatient = patient;
      }
    }

    if (bestPatient && maxMatches > 0) {
      return bestPatient;
    }
  }

  return null;
}

/**
 * Main NLP rule parser for PerioDash Voice Control.
 */
export function parseVoiceCommand(
  rawTranscript: string,
  patients: Patient[] = []
): VoiceCommandResult {
  const clean = normalizeVoiceText(rawTranscript);

  if (!clean) {
    return {
      action: "UNKNOWN",
      feedbackText: "No se reconoció ninguna instrucción clara.",
    };
  }

  // -------------------------------------------------------------------------
  // 1. MODO OSCURO / CLARO / TEMA
  // -------------------------------------------------------------------------
  if (
    clean.includes("modo oscuro") ||
    clean.includes("tema oscuro") ||
    clean.includes("pantalla oscura") ||
    clean.includes("poner oscuro") ||
    clean.includes("activar oscuro") ||
    clean.includes("modo noche") ||
    clean.includes("activar noche") ||
    clean.includes("poner noche") ||
    clean === "oscuro" ||
    clean === "noche"
  ) {
    return {
      action: "SET_DARK_MODE",
      boolValue: true,
      feedbackText: "🌙 Modo oscuro activado",
      speechResponse: "Modo oscuro activado",
    };
  }

  if (
    clean.includes("modo claro") ||
    clean.includes("tema claro") ||
    clean.includes("pantalla clara") ||
    clean.includes("poner claro") ||
    clean.includes("activar claro") ||
    clean.includes("modo dia") ||
    clean.includes("activar dia") ||
    clean.includes("poner dia") ||
    clean.includes("modo luz") ||
    clean === "claro" ||
    clean === "dia"
  ) {
    return {
      action: "SET_DARK_MODE",
      boolValue: false,
      feedbackText: "☀️ Modo claro activado",
      speechResponse: "Modo claro activado",
    };
  }

  if (
    clean.includes("cambiar tema") ||
    clean.includes("alternar tema") ||
    clean.includes("invertir tema") ||
    clean.includes("cambiar a modo oscuro o claro")
  ) {
    return {
      action: "TOGGLE_DARK_MODE",
      feedbackText: "🌗 Alternando tema de visualización",
      speechResponse: "Tema alternado",
    };
  }

  // -------------------------------------------------------------------------
  // 2. MODO ZEN (Pantalla limpia sin barras distractoras)
  // -------------------------------------------------------------------------
  if (
    clean.includes("modo zen") ||
    clean.includes("activar zen") ||
    clean.includes("entrar a zen") ||
    clean.includes("pantalla limpia") ||
    clean.includes("pantalla completa") ||
    clean.includes("maximizar pantalla") ||
    clean === "zen"
  ) {
    return {
      action: "SET_ZEN_MODE",
      boolValue: true,
      feedbackText: "🧘 Modo Zen activado (pantalla limpia para intervención)",
      speechResponse: "Modo Zen activado",
    };
  }

  if (
    clean.includes("salir de zen") ||
    clean.includes("quitar zen") ||
    clean.includes("desactivar zen") ||
    clean.includes("cerrar zen") ||
    clean.includes("mostrar barras") ||
    clean.includes("volver a normal")
  ) {
    return {
      action: "SET_ZEN_MODE",
      boolValue: false,
      feedbackText: "🖥️ Saliendo del Modo Zen",
      speechResponse: "Saliendo del Modo Zen",
    };
  }

  // -------------------------------------------------------------------------
  // 3. MODO SILLÓN CLÍNICO (Chairside)
  // -------------------------------------------------------------------------
  if (
    clean.includes("modo sillon") ||
    clean.includes("sillon clinico") ||
    clean.includes("abrir sillon") ||
    clean.includes("activar sillon") ||
    clean.includes("entrar a modo sillon") ||
    clean.includes("entrar al sillon") ||
    clean.includes("chair mode") ||
    clean === "sillon"
  ) {
    return {
      action: "SET_CHAIR_MODE",
      boolValue: true,
      feedbackText: "💺 Activando Modo Sillón con botones XL",
      speechResponse: "Modo Sillón activado",
    };
  }

  if (
    clean.includes("cerrar sillon") ||
    clean.includes("salir del sillon") ||
    clean.includes("salir de sillon") ||
    clean.includes("apagar sillon")
  ) {
    return {
      action: "SET_CHAIR_MODE",
      boolValue: false,
      feedbackText: "Cerrando Modo Sillón",
      speechResponse: "Modo Sillón cerrado",
    };
  }

  // -------------------------------------------------------------------------
  // 4. BÚSQUEDA Y SELECCIÓN DE PACIENTE / EXPEDIENTE
  // -------------------------------------------------------------------------
  // Comprobar si el usuario pide cerrar o cambiar paciente
  if (
    clean.includes("cerrar paciente") ||
    clean.includes("cerrar ficha") ||
    clean.includes("deseleccionar paciente") ||
    clean.includes("cambiar paciente") ||
    clean.includes("quitar paciente") ||
    clean.includes("volver al selector") ||
    clean === "cerrar expediente"
  ) {
    return {
      action: "CLEAR_PATIENT",
      tab: "clinica",
      subView: "ficha",
      feedbackText: "📋 Expediente deseleccionado. Selector de pacientes activo.",
      speechResponse: "Expediente cerrado. Selector clínico activo.",
    };
  }

  // Patrones para abrir paciente
  const patientTriggers = [
    "ficha de",
    "abrir ficha de",
    "abrir expediente de",
    "expediente de",
    "buscar paciente",
    "buscar a",
    "encontrar paciente",
    "cargar paciente",
    "atender a",
    "seleccionar paciente",
    "seleccionar a",
    "paciente",
    "abrir paciente",
    "ver paciente",
  ];

  for (const trigger of patientTriggers) {
    if (clean.includes(trigger)) {
      const queryPart = clean.substring(clean.indexOf(trigger) + trigger.length).trim();
      if (queryPart) {
        const match = findMatchingPatient(queryPart, patients);
        if (match) {
          return {
            action: "SELECT_PATIENT",
            tab: "clinica",
            subView: "ficha",
            patientId: match.id,
            patientName: match.name,
            feedbackText: `📂 Expediente de ${match.name} cargado`,
            speechResponse: `Abriendo expediente de ${match.name}`,
          };
        }
      }
    }
  }

  // Si dice directamente el nombre de un paciente existente en la lista
  for (const p of patients) {
    const normName = normalizeVoiceText(p.name);
    if (clean === normName || clean === `abrir ${normName}` || clean === `ver ${normName}`) {
      return {
        action: "SELECT_PATIENT",
        tab: "clinica",
        subView: "ficha",
        patientId: p.id,
        patientName: p.name,
        feedbackText: `📂 Expediente de ${p.name} cargado`,
        speechResponse: `Abriendo expediente de ${p.name}`,
      };
    }
  }

  // -------------------------------------------------------------------------
  // 5. APARTADOS CLÍNICOS Y SUBVISTAS ODONTOLÓGICAS
  // -------------------------------------------------------------------------
  // Odontograma
  if (
    clean.includes("odontograma") ||
    clean.includes("dientes") ||
    clean.includes("mapa dental") ||
    clean.includes("ver piezas dentales")
  ) {
    return {
      action: "NAVIGATE_CLINICAL_SUBVIEW",
      tab: "clinica",
      subView: "odontograma",
      feedbackText: "🦷 Abriendo Odontograma Anatómico",
      speechResponse: "Abriendo Odontograma",
    };
  }

  // Periodontograma / Sondaje
  if (
    clean.includes("periodontograma") ||
    clean.includes("sondaje") ||
    clean.includes("perio") ||
    clean.includes("bolsas periodontales") ||
    clean.includes("examen periodontal")
  ) {
    return {
      action: "NAVIGATE_CLINICAL_SUBVIEW",
      tab: "clinica",
      subView: "periodontograma",
      feedbackText: "📏 Abriendo Periodontograma Paramétrico a 6 Puntos",
      speechResponse: "Abriendo Periodontograma",
    };
  }

  // Radiografías / Rayos X
  if (
    clean.includes("radiografia") ||
    clean.includes("radiografias") ||
    clean.includes("rayos x") ||
    clean.includes("placas") ||
    clean.includes("galeria de rayos x")
  ) {
    return {
      action: "NAVIGATE_CLINICAL_SUBVIEW",
      tab: "clinica",
      subView: "xrays",
      feedbackText: "🩻 Abriendo Galería de Radiografías",
      speechResponse: "Abriendo Radiografías",
    };
  }

  // Presupuesto / Plan de tratamiento
  if (
    clean.includes("presupuesto") ||
    clean.includes("presupuestos") ||
    clean.includes("plan de tratamiento") ||
    clean.includes("arancel") ||
    clean.includes("cotizacion")
  ) {
    return {
      action: "NAVIGATE_CLINICAL_SUBVIEW",
      tab: "clinica",
      subView: "presupuesto",
      feedbackText: "💰 Abriendo Plan de Tratamiento y Presupuestos",
      speechResponse: "Abriendo Presupuestos",
    };
  }

  // Notas SOAP / Evolución
  if (
    clean.includes("soap") ||
    clean.includes("evolucion") ||
    clean.includes("notas de evolucion") ||
    clean.includes("historial clinico") ||
    clean.includes("anotaciones clinicas")
  ) {
    return {
      action: "NAVIGATE_CLINICAL_SUBVIEW",
      tab: "clinica",
      subView: "soap",
      feedbackText: "📝 Abriendo Notas Clínicas SOAP",
      speechResponse: "Abriendo Notas SOAP",
    };
  }

  // O'Leary / Control de placa
  if (
    clean.includes("oleary") ||
    clean.includes("o leary") ||
    clean.includes("indice de placa") ||
    clean.includes("placa bacteriana") ||
    clean.includes("control de placa")
  ) {
    return {
      action: "NAVIGATE_CLINICAL_SUBVIEW",
      tab: "clinica",
      subView: "oleary",
      feedbackText: "🔬 Abriendo Control de Placa de O'Leary",
      speechResponse: "Abriendo Índice de O'Leary",
    };
  }

  // Evaluación PRA / Riesgo Periodontal
  if (
    clean.includes("pra") ||
    clean.includes("riesgo periodontal") ||
    clean.includes("evaluacion de riesgo")
  ) {
    return {
      action: "NAVIGATE_CLINICAL_SUBVIEW",
      tab: "clinica",
      subView: "pra",
      feedbackText: "📊 Abriendo Evaluación de Riesgo Periodontal (PRA)",
      speechResponse: "Abriendo Evaluación PRA",
    };
  }

  // Ficha Médica
  if (
    clean.includes("ficha medica") ||
    clean.includes("anamnesis") ||
    clean.includes("antecedentes medicos") ||
    clean.includes("datos del paciente")
  ) {
    return {
      action: "NAVIGATE_CLINICAL_SUBVIEW",
      tab: "clinica",
      subView: "ficha",
      feedbackText: "📋 Abriendo Ficha Médica y Anamnesis",
      speechResponse: "Abriendo Ficha Médica",
    };
  }

  // Especialidad
  if (
    clean.includes("especialidad") ||
    clean.includes("herramientas de especialidad")
  ) {
    return {
      action: "NAVIGATE_CLINICAL_SUBVIEW",
      tab: "clinica",
      subView: "especialidad",
      feedbackText: "🩺 Abriendo Suite de Especialidad",
      speechResponse: "Abriendo Especialidad",
    };
  }

  // Estación Clínica General
  if (
    clean.includes("ir a clinica") ||
    clean.includes("abrir clinica") ||
    clean.includes("ver clinica") ||
    clean === "clinica" ||
    clean === "estacion clinica"
  ) {
    return {
      action: "NAVIGATE_TAB",
      tab: "clinica",
      subView: "ficha",
      feedbackText: "🏥 Abriendo Estación Clínica",
      speechResponse: "Abriendo Estación Clínica",
    };
  }

  // -------------------------------------------------------------------------
  // 6. NAVEGACIÓN A MÓDULOS PRINCIPALES
  // -------------------------------------------------------------------------
  // Pacientes / Directorio
  if (
    clean.includes("ir a pacientes") ||
    clean.includes("ver pacientes") ||
    clean.includes("abrir pacientes") ||
    clean.includes("lista de pacientes") ||
    clean.includes("directorio de pacientes") ||
    clean === "pacientes" ||
    clean === "expedientes"
  ) {
    return {
      action: "NAVIGATE_TAB",
      tab: "pacientes",
      feedbackText: "👥 Abriendo Directorio de Pacientes",
      speechResponse: "Abriendo Expedientes de Pacientes",
    };
  }

  // Agenda / Citas
  if (
    clean.includes("ir a agenda") ||
    clean.includes("ver agenda") ||
    clean.includes("abrir agenda") ||
    clean.includes("calendario") ||
    clean.includes("citas de hoy") ||
    clean.includes("proximas citas") ||
    clean === "agenda" ||
    clean === "citas"
  ) {
    return {
      action: "NAVIGATE_TAB",
      tab: "agenda",
      feedbackText: "📅 Abriendo Agenda Médica y Citas",
      speechResponse: "Abriendo Agenda Médica",
    };
  }

  // Dashboard / Pantalla Principal
  if (
    clean.includes("dashboard") ||
    clean.includes("inicio") ||
    clean.includes("pantalla principal") ||
    clean.includes("volver al inicio") ||
    clean.includes("ir a inicio") ||
    clean.includes("resumen general") ||
    clean === "panel"
  ) {
    return {
      action: "NAVIGATE_TAB",
      tab: "dashboard",
      feedbackText: "🏠 Regresando al Panel de Control Principal",
      speechResponse: "Abriendo Panel Principal",
    };
  }

  // Flujo & Sillones
  if (
    clean.includes("flujo") ||
    clean.includes("sillones") ||
    clean.includes("sala de espera") ||
    clean.includes("flujo de pacientes")
  ) {
    return {
      action: "NAVIGATE_TAB",
      tab: "flujo",
      feedbackText: "💺 Abriendo Flujo Clínico & Sillones",
      speechResponse: "Abriendo Flujo Clínico",
    };
  }

  // Finanzas / Caja
  if (
    clean.includes("finanzas") ||
    clean.includes("caja diaria") ||
    clean.includes("ingresos") ||
    clean.includes("reportes financieros") ||
    clean.includes("pagos")
  ) {
    return {
      action: "NAVIGATE_TAB",
      tab: "finanzas",
      feedbackText: "💳 Abriendo Módulo de Finanzas & Caja",
      speechResponse: "Abriendo Finanzas",
    };
  }

  // Reportes / Estadísticas
  if (
    clean.includes("reportes") ||
    clean.includes("estadisticas") ||
    clean.includes("metricas") ||
    clean.includes("kpi")
  ) {
    return {
      action: "NAVIGATE_TAB",
      tab: "reportes",
      feedbackText: "📊 Abriendo Reportes Clínicos y KPIs",
      speechResponse: "Abriendo Reportes",
    };
  }

  // Ajustes / Configuración
  if (
    clean.includes("ajustes") ||
    clean.includes("configuracion") ||
    clean.includes("opciones") ||
    clean.includes("preferencias")
  ) {
    return {
      action: "NAVIGATE_TAB",
      tab: "ajustes",
      feedbackText: "⚙️ Abriendo Centro de Ajustes del Sistema",
      speechResponse: "Abriendo Ajustes",
    };
  }

  // Historias / Dental Stories
  if (
    clean.includes("dental stories") ||
    clean.includes("historias") ||
    clean.includes("casos clinicos")
  ) {
    return {
      action: "NAVIGATE_TAB",
      tab: "dentalstories",
      feedbackText: "📸 Abriendo Dental Stories",
      speechResponse: "Abriendo Historias Clínicas",
    };
  }

  // Tienda / Suministros
  if (
    clean.includes("tienda") ||
    clean.includes("market") ||
    clean.includes("suministros") ||
    clean.includes("compras")
  ) {
    return {
      action: "NAVIGATE_TAB",
      tab: "tienda",
      feedbackText: "🛒 Abriendo Dental Marketplace & Insumos",
      speechResponse: "Abriendo Tienda",
    };
  }

  // Bolsa de Empleo
  if (
    clean.includes("bolsa de empleo") ||
    clean.includes("empleos") ||
    clean.includes("trabajo dental")
  ) {
    return {
      action: "NAVIGATE_TAB",
      tab: "bolsa-empleo",
      feedbackText: "💼 Abriendo Directorio y Bolsa de Empleo",
      speechResponse: "Abriendo Bolsa de Empleo",
    };
  }

  // -------------------------------------------------------------------------
  // 7. ACCIONES RÁPIDAS Y HERRAMIENTAS
  // -------------------------------------------------------------------------
  // Registrar nuevo paciente
  if (
    clean.includes("nuevo paciente") ||
    clean.includes("registrar paciente") ||
    clean.includes("crear paciente") ||
    clean.includes("agregar paciente") ||
    clean.includes("nuevo expediente")
  ) {
    return {
      action: "OPEN_NEW_PATIENT",
      feedbackText: "➕ Abriendo Formulario de Registro de Paciente",
      speechResponse: "Abriendo Registro de Paciente",
    };
  }

  // Abrir Buscador / Spotlight
  if (
    clean.includes("buscar") ||
    clean.includes("abrir buscador") ||
    clean.includes("buscador") ||
    clean.includes("busqueda rapida") ||
    clean.includes("spotlight")
  ) {
    return {
      action: "OPEN_SEARCH",
      feedbackText: "🔍 Abriendo Buscador Universal",
      speechResponse: "Buscador abierto",
    };
  }

  // Copiloto Dentito (IA)
  if (
    clean.includes("dentito") ||
    clean.includes("copiloto") ||
    clean.includes("hablar con dentito") ||
    clean.includes("asistente") ||
    clean.includes("abrir chat") ||
    clean.includes("abrir ia")
  ) {
    return {
      action: "OPEN_DENTITO",
      feedbackText: "🤖 Conectando con Copiloto Dentito IA",
      speechResponse: "Hola doctor, aquí está Dentito a su servicio",
    };
  }

  // Cajón de Aplicaciones
  if (
    clean.includes("cajon de aplicaciones") ||
    clean.includes("abrir apps") ||
    clean.includes("menu de aplicaciones") ||
    clean.includes("abrir cajon")
  ) {
    return {
      action: "OPEN_APP_LAUNCHER",
      feedbackText: "📦 Abriendo Cajón de Aplicaciones",
      speechResponse: "Cajón de aplicaciones abierto",
    };
  }

  if (
    clean.includes("cerrar apps") ||
    clean.includes("cerrar cajon") ||
    clean.includes("ocultar apps")
  ) {
    return {
      action: "CLOSE_APP_LAUNCHER",
      feedbackText: "Cerrando Cajón de Aplicaciones",
      speechResponse: "Cerrando aplicaciones",
    };
  }

  // Seguridad & HIPAA
  if (
    clean.includes("seguridad") ||
    clean.includes("hipaa") ||
    clean.includes("centro hipaa") ||
    clean.includes("proteccion de datos")
  ) {
    return {
      action: "OPEN_HIPAA",
      feedbackText: "🛡️ Abriendo Centro de Seguridad & Cumplimiento HIPAA",
      speechResponse: "Abriendo Centro HIPAA",
    };
  }

  // Modo Privacidad
  if (
    clean.includes("modo privacidad") ||
    clean.includes("activar privacidad") ||
    clean.includes("enmascarar datos") ||
    clean.includes("ocultar datos sensibles")
  ) {
    return {
      action: "TOGGLE_PRIVACY",
      feedbackText: "🔒 Alternando Modo de Privacidad y Enmascaramiento",
      speechResponse: "Modo Privacidad alternado",
    };
  }

  // Guía de Comandos de Voz / Ayuda
  if (
    clean.includes("ayuda de voz") ||
    clean.includes("comandos de voz") ||
    clean.includes("que puedo decir") ||
    clean.includes("instrucciones de voz") ||
    clean.includes("guia de voz") ||
    clean.includes("ayuda")
  ) {
    return {
      action: "OPEN_VOICE_HELP",
      feedbackText: "🎙️ Mostrando Guía de Comandos por Voz",
      speechResponse: "Mostrando comandos de voz disponibles",
    };
  }

  // Pausar o silenciar reconocimiento de voz
  if (
    clean.includes("silencio") ||
    clean.includes("apagar microfono") ||
    clean.includes("desactivar voz") ||
    clean.includes("pausar voz") ||
    clean.includes("apagar voz")
  ) {
    return {
      action: "TOGGLE_HANDS_FREE",
      boolValue: false,
      feedbackText: "🔇 Reconocimiento de voz en pausa",
      speechResponse: "Reconocimiento de voz pausado",
    };
  }

  return {
    action: "UNKNOWN",
    feedbackText: `Escuchado: "${rawTranscript}". Di "comandos de voz" para ver las opciones.`,
  };
}
