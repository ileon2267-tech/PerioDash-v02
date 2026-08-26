export interface ToothState {
  toothNumber: number;
  surfaces: {
    vestibular: "sano" | "caries" | "obturado";
    occlusal: "sano" | "caries" | "obturado"; // or incisal
    lingual: "sano" | "caries" | "obturado";  // or palatino
    mesial: "sano" | "caries" | "obturado";
    distal: "sano" | "caries" | "obturado";
  };
  condition: "sano" | "ausente" | "corona" | "endodoncia" | "implante";
}

export interface PeriodonState {
  toothNumber: number;
  // Pocket depth (sondaje)
  vestibularPocket: { mesial: number; central: number; distal: number; };
  palatinoPocket: { mesial: number; central: number; distal: number; };
  // Gingival recession (recesion)
  vestibularRecess: { mesial: number; central: number; distal: number; };
  palatinoRecess: { mesial: number; central: number; distal: number; };
  // Sangrado al sondaje (true/false index for mesial, central, distal surfaces)
  sangradoVestibular: { mesial: boolean; central: boolean; distal: boolean };
  sangradoPalatino: { mesial: boolean; central: boolean; distal: boolean };
  // Supuration
  supuracionVestibular: { mesial: boolean; central: boolean; distal: boolean };
  supuracionPalatino: { mesial: boolean; central: boolean; distal: boolean };
  // Placa bacteriana
  placaVestibular: { mesial: boolean; central: boolean; distal: boolean };
  placaPalatino: { mesial: boolean; central: boolean; distal: boolean };
  
  movilidad: 0 | 1 | 2 | 3;
  furca: 0 | 1 | 2 | 3; // furcation involvement
}

export interface OLearyState {
  toothNumber: number;
  mesial: boolean;
  distal: boolean;
  vestibular: boolean;
  lingual: boolean;
}

export interface Anamnesis {
  motivoConsulta?: string;
  historiaMotivoConsulta?: string;
  hta: boolean;
  diabetes: boolean;
  cardiopatia?: boolean;
  diabetesStatus?: "none" | "controlled" | "severe";
  tabaquismo: number; // cigarrillos/dia
  alergias: string;
  farmacos?: string;
  dolorActual: "ninguno" | "leve" | "pulsatil" | "agudo";
  notasSistemicas: string;
  edadSimulada?: number;

  // Parámetros Críticos de Seguridad Clínica y Bioseguridad Multidisciplinaria
  anticoagulantes?: boolean;
  tipoAnticoagulante?: string; // e.g. "Warfarina", "Sintrom", "Rivaroxabán", "Aspirina"
  valorINR?: string; // Valor de INR (e.g. "2.3", alerta si > 3.0 para cirugía/sondaje)
  bifosfonatos?: boolean;
  viaBifosfonatos?: "oral" | "intravenoso" | "ninguno"; // Alerta Roja de Osteonecrosis (MRONJ)
  profilaxisAntibiotica?: boolean;
  razonProfilaxis?: string; // e.g. "Prótesis valvular", "Cardiopatía congénita", "Prótesis articular"
  presionSistolica?: number; // mmHg (e.g. 120, alerta si >= 140)
  presionDiastolica?: number; // mmHg (e.g. 80, alerta si >= 90)
  alergiaAnestesia?: string; // e.g. "Lidocaína", "Articaína", "Epinefrina/Bisulfito", "Ninguna"
  alergiaLatex?: boolean;
  embarazo?: boolean;
  trimestreEmbarazo?: 1 | 2 | 3;
  biotipoPeriodontal?: "fino" | "medio" | "grueso"; // Para riesgo de recesión e implantes
}

export interface XRayImage {
  id: string;
  url: string;
  date: string;
  type: "panoramica" | "periapical" | "bite-wing";
  notes: string;
}

export interface InformedConsentRecord {
  accepted: boolean;
  acceptedAt: string;
  patientName?: string;
  patientDocumentId?: string;
  signatureDataUrl?: string; // Digital signature canvas URL
  photoEvidenceUrl?: string; // Camera snapshot or file upload
  verificationMethod: 'signature' | 'camera' | 'both' | 'mobile_qr';
  notes?: string;
  templateCategory?: string;
  customClauses?: string;
  customRisks?: string;
  shareToken?: string;
}

export interface TreatmentProcedure {
  id: string;
  phase: "Diagnostico" | "Saneamiento" | "Rehabilitacion" | "Mantenimiento";
  description: string;
  cost: number;
  completed: boolean;
  tooth?: string; // e.g. "1.4" or "Arcada Superior"
  surface?: string; // e.g. "Mesial", "Vestibular", "Todas"
  discount?: number; // percentage
  informedConsent?: InformedConsentRecord;
}

export interface TreatmentPlan {
  procedures: TreatmentProcedure[];
  financing: {
    months: number;
    downPayment: number;
    interestRate: number; // annual percentage
  };
}

export interface Evolution {
  id: string;
  date: string;
  description: string;
  professional: string;
}

export interface Consentimiento {
  id: string;
  date: string;
  documentType: string;
  signature: string | null; // null if not signed
}

export interface PeriodontogramVisit {
  id: string;
  date: string;
  title: string;
  oLearyScore: number;
  bopScore: number; // Bleeding on Probing %
  meanPocketDepth: number; // Average sondaje in mm
  notes?: string;
  periodontogram: Record<number, PeriodonState>;
}

export type PatientStatus = 'evaluacion' | 'en_tratamiento' | 'mantenimiento' | 'alta' | 'inactivo';

export type ClinicalFlowStatus = 'programado' | 'espera' | 'en_sillon' | 'atendido' | 'completado' | 'ausente' | 'cancelado';

export interface PeriodontalRisk {
  stage: 'I' | 'II' | 'III' | 'IV';
  grade: 'A' | 'B' | 'C';
  riskLevel: 'bajo' | 'medio' | 'alto';
}

export interface CustomSpecialtyMarker {
  id: string;
  specialty: string; // 'endodoncia' | 'ortodoncia' | 'odontopediatria' | 'cirugia' | 'estetica' | 'periodoncia'
  title: string;
  toothNumber?: number;
  severityLevel: 'normal' | 'leve' | 'moderado' | 'severo' | 'critico';
  color: string; // Tailwind color token or hex
  scoreValue?: number;
  scaleMax?: number;
  notes?: string;
  createdAt: string;
}

export interface ClinicalPhoto {
  id: string;
  url: string;
  date: string;
  category: "facial" | "intraoral" | "oclusal" | "perfil" | "sonrisa" | "antes_despues";
  tag: "antes" | "despues" | "seguimiento";
  notes?: string;
}

export interface PatientCommunication {
  id: string;
  date: string;
  type: "whatsapp" | "email" | "sms";
  template: "recordatorio_cita" | "postoperatorio" | "presupuesto" | "higiene_mantenimiento" | "custom";
  recipient: string;
  message: string;
  status: "sent" | "failed" | "queued";
}

export interface PaymentTransaction {
  id: string;
  patientId: string;
  patientName: string;
  date: string;
  amount: number;
  method: "webpay" | "mercadopago" | "stripe" | "transferencia" | "efectivo" | "tarjeta_pos";
  status: "completed" | "pending" | "failed";
  concept: string;
  receiptNumber?: string;
  transactionRef?: string;
  paymentGateway?: string;
}

export interface Patient {
  id: string;
  name: string;
  rut?: string;
  dni?: string;
  phone: string;
  email: string;
  notes: string;
  birthdate: string;
  createdAt: string;
  status?: PatientStatus;
  flowStatus?: ClinicalFlowStatus;
  chairAssigned?: string; // e.g. "Sillón 1", "Sillón 2", "Gabinete Quirúrgico"
  checkInTime?: string; // e.g. "15:10"
  statusUpdatedAt?: string;
  clinicId?: string; // Specific clinical office / branch
  assignedDoctorId?: string; // Treating doctor ID
  periodontalRisk?: PeriodontalRisk;
  lastVisitDate?: string;
  odontogram: Record<number, ToothState>;
  periodontogram: Record<number, PeriodonState>;
  periodontogramHistory?: PeriodontogramVisit[];
  oLeary: Record<number, OLearyState>;
  anamnesis: Anamnesis;
  xRays: XRayImage[];
  clinicalPhotos?: ClinicalPhoto[];
  communications?: PatientCommunication[];
  treatmentPlan: TreatmentPlan;
  evolutions: Evolution[];
  consentimientos?: Consentimiento[];
  payments?: PaymentTransaction[];
  activeSpecialty?: string;
  specialtyData?: Record<string, any>;
  customSpecialtyMarkers?: CustomSpecialtyMarker[];
  hipaaConsent?: HipaaConsent;
}

export interface HipaaConsent {
  signed: boolean;
  signedDate?: string;
  nppAcknowledged: boolean; // Notice of Privacy Practices
  disclosureAuthorized: boolean;
  signerName?: string;
  signatureUrl?: string;
  version: string;
  emergencyAccessAuthorized?: boolean;
}

export type HipaaActionType = 
  | 'LOGIN'
  | 'LOGOUT'
  | 'VIEW_PATIENT_RECORD'
  | 'VIEW_PATIENT_SECTION'
  | 'VIEW_CLINICAL_PHOTO'
  | 'VIEW_XRAY_IMAGE'
  | 'VIEW_TREATMENT_PLAN'
  | 'VIEW_PRA_ASSESSMENT'
  | 'VIEW_PERIODONTOGRAM'
  | 'VIEW_OLEARY_INDEX'
  | 'COMPARE_PERIODONTOGRAM'
  | 'CREATE_PATIENT'
  | 'UPDATE_PATIENT_INFO'
  | 'UPDATE_PATIENT_RECORD'
  | 'UPDATE_ODONTOGRAM'
  | 'UPDATE_PERIODONTOGRAM'
  | 'UPDATE_ANAMNESIS'
  | 'UPDATE_TREATMENT_PLAN'
  | 'DELETE_TREATMENT_PROCEDURE'
  | 'CREATE_CONSENT_FORM'
  | 'SIGN_CONSENT_FORM'
  | 'DELETE_CONSENT_FORM'
  | 'UPLOAD_CLINICAL_PHOTO'
  | 'DELETE_CLINICAL_PHOTO'
  | 'UPLOAD_XRAY_IMAGE'
  | 'DELETE_XRAY_IMAGE'
  | 'AI_XRAY_ANALYSIS'
  | 'AI_ASSIST_EVALUATION'
  | 'COMMUNICATION_SENT'
  | 'PRINT_EXPORT_PATIENT'
  | 'EXPORT_PATIENT_RECORD'
  | 'DATA_EXPORT'
  | 'SYSTEM_RESTORE'
  | 'EXPORT_EHR_JSON'
  | 'EXPORT_EHR_CSV'
  | 'EXPORT_PDF_REPORT'
  | 'DELETE_PATIENT'
  | 'CONSENT_SIGNED'
  | 'KIOSK_ANAMNESIS_COMPLETED'
  | 'GENERATE_PRESCRIPTION'
  | 'GENERATE_REFERRAL'
  | 'HIPAA_CONSENT_SIGNED'
  | 'HIPAA_CONSENT_REVOKED'
  | 'SESSION_AUTO_LOCKED'
  | 'SESSION_UNLOCKED'
  | 'PRIVACY_MODE_TOGGLED'
  | 'VIEW_AUDIT_LOGS'
  | 'SECURITY_ALERT';

export interface HipaaAuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: string;
  action: HipaaActionType;
  patientId?: string;
  patientName?: string;
  resource: string;
  details: string;
  ipAddress?: string;
  severity: 'info' | 'warning' | 'critical';
  /**
   * SHA-256 Cryptographic Hash (Digest) of the accessed/mutated sensitive clinical data (ePHI/PII).
   * Ensures data integrity and audit trail non-repudiation for external auditors without storing plaintext sensitive data.
   */
  sensitiveDataHash?: string;
}


export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  treatment: string;
  status: 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';
  flowStatus?: ClinicalFlowStatus;
  clinicId?: string; // Office / branch identifier
  assignedDoctorId?: string;
  box?: string; // e.g., "Sillón 1", "Sillón 2", "Sillón 3"
  googleCalendarEventId?: string;
  googleCalendarSyncedAt?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export type ClinicalRole = 
  | 'superadmin' 
  | 'supervisor' 
  | 'odontologo' 
  | 'periodoncista' 
  | 'implantologo' 
  | 'higienista' 
  | 'asistente' 
  | 'recepcionista' 
  | 'admin' 
  | 'cliente';

export type UserPermission = 
  | 'read_patients'
  | 'write_patients'
  | 'delete_patients'
  | 'view_ephi'
  | 'edit_ephi'
  | 'audit_supervision'
  | 'billing_manage'
  | 'manage_users'
  | 'cross_office_access';

export interface ClinicalUser {
  id: string;
  name: string;
  email: string;
  password?: string;
  profile: 'particular' | 'clinica' | 'universidad' | 'cliente';
  role: ClinicalRole;
  clinicId?: string; // ID of the specific clinical office / branch (e.g. 'office_central')
  assignedOffices?: string[]; // Multiple authorized branches for roving doctors
  isSupervisor?: boolean; // Active clinical supervisor flag
  specialty?: string;
  permissions?: UserPermission[];
  status?: 'active' | 'suspended' | 'pending';
  createdAt: string;
}

