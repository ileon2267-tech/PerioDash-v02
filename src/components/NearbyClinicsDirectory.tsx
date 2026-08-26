import React, { useState } from 'react';
import { 
  Building2, 
  MapPin, 
  Star, 
  Phone, 
  MessageSquare, 
  Calendar, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  Filter, 
  Search, 
  Clock, 
  ExternalLink, 
  ChevronRight, 
  Award, 
  User, 
  Stethoscope, 
  Check, 
  X,
  Compass,
  Navigation
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Patient } from '../types';

export interface ClinicItem {
  id: string;
  name: string;
  brandSubtitle: string;
  address: string;
  commune: string;
  city: string;
  distanceKm: number;
  rating: number;
  reviewsCount: number;
  phone: string;
  whatsapp: string;
  hours: string;
  imageUrl: string;
  specialties: string[];
  features: string[];
  isEmergency24h?: boolean;
  perioDashCertified: boolean;
}

export interface SpecialistItem {
  id: string;
  name: string;
  specialty: string;
  clinicAffiliation: string;
  location: string;
  rating: number;
  reviewsCount: number;
  experience: string;
  avatarUrl: string;
  phone: string;
  email: string;
  skills: string[];
  education: string;
  availableDays: string;
}

const NETWORK_CLINICS: ClinicItem[] = [
  {
    id: "clinic-1",
    name: "Clínica Odontológica PerioCentral",
    brandSubtitle: "Centro Avanzado de Periodoncia e Implantes",
    address: "Av. Providencia 1208, Piso 4, Of. 402",
    commune: "Providencia",
    city: "Santiago",
    distanceKm: 0.8,
    rating: 4.9,
    reviewsCount: 142,
    phone: "+56 2 2345 6789",
    whatsapp: "+56 9 8765 4321",
    hours: "Lun a Vie: 08:30 - 19:30 | Sáb: 09:00 - 14:00",
    imageUrl: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=600",
    specialties: ["Periodoncia Digital", "Implantes Dentales", "Regeneración Tisular", "Rehabilitación Oral"],
    features: ["Sillones PerioDash v15 Pro", "Tomografía CBCT 3D", "Sedación Consciente", "Estacionamiento Gratuito"],
    isEmergency24h: false,
    perioDashCertified: true
  },
  {
    id: "clinic-2",
    name: "DentalElite & Estética Facial",
    brandSubtitle: "Ortodoncia Invisible y Diseño de Sonrisa",
    address: "Av. Apoquindo 4500, Torre B, Piso 12",
    commune: "Las Condes",
    city: "Santiago",
    distanceKm: 2.4,
    rating: 4.8,
    reviewsCount: 98,
    phone: "+56 2 2987 6543",
    whatsapp: "+56 9 9123 4567",
    hours: "Lun a Vie: 09:00 - 20:00 | Sáb: 09:00 - 15:00",
    imageUrl: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=600",
    specialties: ["Ortodoncia Invisible", "Periodontograma 6 Puntos", "Carillas Cerámicas", "Blanqueamiento Láser"],
    features: ["Escaner Intraoral 3D", "Financiamiento Online", "Cafetería Premium"],
    isEmergency24h: false,
    perioDashCertified: true
  },
  {
    id: "clinic-3",
    name: "Centro Odontológico San Cristóbal",
    brandSubtitle: "Urgencias Odontológicas y Cirugía Maxilofacial 24/7",
    address: "Av. Recoleta 450 (Metro Cerro Blanco)",
    commune: "Recoleta",
    city: "Santiago",
    distanceKm: 3.1,
    rating: 4.7,
    reviewsCount: 215,
    phone: "+56 2 2456 7890",
    whatsapp: "+56 9 7654 3210",
    hours: "Atención Continua 24 Horas / 7 Días",
    imageUrl: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&q=80&w=600",
    specialties: ["Urgencias Dentales 24/7", "Cirugía Maxilofacial", "Endodoncia Inmediata", "Trauma Dentoalveolar"],
    features: ["Pabellón Quirúrgico Acreditado", "Farmacia Clínica", "Atención Fonasa e Isapres"],
    isEmergency24h: true,
    perioDashCertified: true
  },
  {
    id: "clinic-4",
    name: "PerioSur Especialidades Odontológicas",
    brandSubtitle: "Clínica Dental Docente y Asistencial",
    address: "Calle O'Higgins 780, Piso 3",
    commune: "Concepción Centro",
    city: "Concepción",
    distanceKm: 5.6,
    rating: 4.9,
    reviewsCount: 86,
    phone: "+56 41 234 5678",
    whatsapp: "+56 9 6543 2109",
    hours: "Lun a Vie: 08:30 - 19:00",
    imageUrl: "https://images.unsplash.com/photo-1629909615184-74f495363b67?auto=format&fit=crop&q=80&w=600",
    specialties: ["Periodoncia Avanzada", "Implantología Guiada", "Odontogeriatría", "Endodoncia Microscópica"],
    features: ["Microscopio Clínico Zeiss", "Radiología Digital Panorámica", "Acceso Universal"],
    isEmergency24h: false,
    perioDashCertified: true
  },
  {
    id: "clinic-5",
    name: "Clínica OdontoMar Viña",
    brandSubtitle: "Rehabilitación Oral y Odontopediatría Integral",
    address: "Av. Libertad 1120, Edificio Marina del Sol",
    commune: "Viña del Mar",
    city: "Valparaíso / Viña",
    distanceKm: 4.2,
    rating: 4.8,
    reviewsCount: 110,
    phone: "+56 32 265 4321",
    whatsapp: "+56 9 5432 1098",
    hours: "Lun a Sáb: 09:00 - 18:30",
    imageUrl: "https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&q=80&w=600",
    specialties: ["Odontopediatría", "Rehabilitación Oral", "Periodoncia Preventiva", "Ortodoncia"],
    features: ["Sala Lúdica Infantil", "Sedación Óxido Nitroso", "WiFi Pacientes"],
    isEmergency24h: false,
    perioDashCertified: true
  }
];

const NETWORK_SPECIALISTS: SpecialistItem[] = [
  {
    id: "spec-1",
    name: "Dra. Macarena Valenzuela",
    specialty: "Periodoncia e Implantología Quirúrgica",
    clinicAffiliation: "Clínica Odontológica PerioCentral (Providencia)",
    location: "Providencia, Santiago",
    rating: 5.0,
    reviewsCount: 68,
    experience: "14 años",
    avatarUrl: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300",
    phone: "+56 2 2345 6789",
    email: "dra.valenzuela@periocentral.cl",
    skills: ["Cirugía Mucogingival", "Sondaje 6 Puntos PerioDash", "Regeneración Ósea Guiada", "Implantes Neodent/Straumann"],
    education: "Universidad de Chile • Magíster en Periodoncia e Implantología",
    availableDays: "Lunes, Miércoles y Viernes"
  },
  {
    id: "spec-2",
    name: "Dr. Rodrigo Alarcón",
    specialty: "Ortodoncia y Alineadores Invisibles",
    clinicAffiliation: "DentalElite Las Condes",
    location: "Las Condes, Santiago",
    rating: 4.9,
    reviewsCount: 54,
    experience: "10 años",
    avatarUrl: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300",
    phone: "+56 2 2987 6543",
    email: "dr.alarcon@dentalelite.cl",
    skills: ["Invisalign Diamond Provider", "Anclaje Esquelético", "Ortopedia Funcional", "Diseño Digital Smile"],
    education: "Universidad de los Andes • Especialista en Ortodoncia",
    availableDays: "Martes, Jueves y Sábados"
  },
  {
    id: "spec-3",
    name: "Dra. Claudia Sepúlveda",
    specialty: "Endodoncia Microscópica y Manejo de Dolor",
    clinicAffiliation: "Centro Odontológico San Cristóbal",
    location: "Recoleta, Santiago",
    rating: 4.8,
    reviewsCount: 89,
    experience: "12 años",
    avatarUrl: "https://images.unsplash.com/photo-1594824813589-40898a3952d7?auto=format&fit=crop&q=80&w=300",
    phone: "+56 2 2456 7890",
    email: "dra.sepulveda@sancristobal.cl",
    skills: ["Microscopía Zeiss", "Retratamiento Complejo", "Urgencias Pulpíticas", "Tomografía Endodóntica"],
    education: "Universidad de Concepción • Especialidad en Endodoncia",
    availableDays: "Lunes a Viernes (Turno Urgencias)"
  },
  {
    id: "spec-4",
    name: "Dr. Tomás Echeverría",
    specialty: "Rehabilitación Oral y Estética Adhesiva",
    clinicAffiliation: "Clínica OdontoMar Viña",
    location: "Viña del Mar",
    rating: 4.9,
    reviewsCount: 72,
    experience: "11 años",
    avatarUrl: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=300",
    phone: "+56 32 265 4321",
    email: "dr.echeverria@odontomar.cl",
    skills: ["Carillas de Disilicato", "Rehabilitación sobre Implantes", "Prótesis Fija Digital", "Oclusión Funcional"],
    education: "Universidad de Valparaíso • Diplomado en Estética Dental",
    availableDays: "Lunes, Martes y Jueves"
  }
];

export interface NearbyClinicsDirectoryProps {
  patient?: Patient | null;
  isDarkMode?: boolean;
}

export default function NearbyClinicsDirectory({ patient, isDarkMode = true }: NearbyClinicsDirectoryProps) {
  const [viewMode, setViewMode] = useState<'clinics' | 'specialists'>('clinics');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('ALL');
  const [selectedCommune, setSelectedCommune] = useState('ALL');
  const [only24h, setOnly24h] = useState(false);
  
  // Appointment Request Modal
  const [selectedTarget, setSelectedTarget] = useState<{ type: 'clinic' | 'specialist'; item: ClinicItem | SpecialistItem } | null>(null);
  const [reqPatientName, setReqPatientName] = useState(patient?.name || '');
  const [reqPatientPhone, setReqPatientPhone] = useState(patient?.phone || '');
  const [reqReason, setReqReason] = useState('Evaluación Periodontal y Diagnóstico');
  const [reqDate, setReqDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Filter clinics
  const filteredClinics = NETWORK_CLINICS.filter(clinic => {
    if (only24h && !clinic.isEmergency24h) return false;
    if (selectedCommune !== 'ALL' && clinic.commune !== selectedCommune && clinic.city !== selectedCommune) return false;
    if (selectedSpecialty !== 'ALL') {
      const hasSpec = clinic.specialties.some(s => s.toLowerCase().includes(selectedSpecialty.toLowerCase()));
      if (!hasSpec) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = clinic.name.toLowerCase().includes(q);
      const matchAddress = clinic.address.toLowerCase().includes(q);
      const matchSpec = clinic.specialties.some(s => s.toLowerCase().includes(q));
      if (!matchName && !matchAddress && !matchSpec) return false;
    }
    return true;
  });

  // Filter specialists
  const filteredSpecialists = NETWORK_SPECIALISTS.filter(spec => {
    if (selectedSpecialty !== 'ALL') {
      if (!spec.specialty.toLowerCase().includes(selectedSpecialty.toLowerCase())) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = spec.name.toLowerCase().includes(q);
      const matchSpec = spec.specialty.toLowerCase().includes(q);
      const matchClinic = spec.clinicAffiliation.toLowerCase().includes(q);
      if (!matchName && !matchSpec && !matchClinic) return false;
    }
    return true;
  });

  const handleSendBookingRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setBookingSuccess(true);
      setTimeout(() => {
        setBookingSuccess(false);
        setSelectedTarget(null);
      }, 2500);
    }, 900);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Red PerioDash Verified Network */}
      <div className={`p-6 sm:p-8 rounded-3xl border relative overflow-hidden transition-all ${
        isDarkMode 
          ? "bg-gradient-to-br from-slate-900 via-teal-950/40 to-slate-900 border-teal-500/20 shadow-2xl" 
          : "bg-gradient-to-br from-teal-50 via-white to-emerald-50/50 border-teal-200 shadow-sm"
      }`}>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                Red Interoperable PerioDash
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                isDarkMode ? "bg-slate-800 text-slate-400" : "bg-slate-200 text-slate-700"
              }`}>
                Fichas Clínicas Sincronizadas
              </span>
            </div>
            <h2 className={`text-xl sm:text-2xl font-black ${isDarkMode ? "text-white" : "text-slate-900"}`}>
              Clínicas y Profesionales Dentales Acreditados
            </h2>
            <p className={`text-xs sm:text-sm leading-relaxed ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>
              Encuentra centros dentales de excelencia y especialistas con periodontograma digital y fichas interoperables cerca de ti. Puedes solicitar citas directas o transferir tu expediente de forma 100% segura.
            </p>
          </div>

          {/* Quick Stats / Emergency Box */}
          <div className={`p-4 rounded-2xl border shrink-0 text-center space-y-1.5 ${
            isDarkMode ? "bg-slate-950/80 border-slate-800" : "bg-white border-slate-200 shadow-sm"
          }`}>
            <div className="flex items-center justify-center gap-1.5 text-rose-400 font-bold text-xs">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span>Urgencias 24 Horas</span>
            </div>
            <p className={`text-[11px] font-medium ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
              Centros con atención continua activa
            </p>
            <button
              type="button"
              onClick={() => {
                setOnly24h(!only24h);
                setViewMode('clinics');
              }}
              className={`w-full py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                only24h 
                  ? "bg-rose-600 text-white shadow-md shadow-rose-600/30" 
                  : isDarkMode ? "bg-slate-850 hover:bg-slate-800 text-slate-300 border border-slate-700" : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
            >
              {only24h ? "✓ Filtrando Urgencias 24h" : "Ver Clínicas de Urgencia"}
            </button>
          </div>
        </div>
      </div>

      {/* Control Bar: View Toggle, Search & Filters */}
      <div className={`p-4 rounded-2xl border space-y-4 ${
        isDarkMode ? "bg-slate-900/90 border-slate-800" : "bg-white border-slate-200 shadow-sm"
      }`}>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Segmented Mode Picker */}
          <div className={`p-1 rounded-xl flex items-center gap-1 w-full sm:w-auto ${
            isDarkMode ? "bg-slate-950 border border-slate-800" : "bg-slate-100 border border-slate-200"
          }`}>
            <button
              type="button"
              onClick={() => setViewMode('clinics')}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                viewMode === 'clinics'
                  ? "bg-teal-600 text-white shadow-md"
                  : isDarkMode ? "text-slate-400 hover:text-white" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Clínicas & Centros ({filteredClinics.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('specialists')}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                viewMode === 'specialists'
                  ? "bg-teal-600 text-white shadow-md"
                  : isDarkMode ? "text-slate-400 hover:text-white" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <User className="w-4 h-4" />
              <span>Especialistas ({filteredSpecialists.length})</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <Search className={`w-4 h-4 absolute left-3 top-2.5 ${isDarkMode ? "text-slate-500" : "text-slate-400"}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={viewMode === 'clinics' ? "Buscar por nombre, comuna o servicio..." : "Buscar especialista o especialidad..."}
              className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border outline-none transition-all ${
                isDarkMode 
                  ? "bg-slate-950 border-slate-800 text-white focus:border-teal-500 placeholder:text-slate-600" 
                  : "bg-slate-50 border-slate-300 text-slate-900 focus:border-teal-600 placeholder:text-slate-400"
              }`}
            />
          </div>
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-800/40 text-xs">
          <div className="flex items-center gap-1.5 text-slate-400 font-semibold mr-1">
            <Filter className="w-3.5 h-3.5 text-teal-400" />
            <span>Filtros:</span>
          </div>

          <select
            value={selectedSpecialty}
            onChange={(e) => setSelectedSpecialty(e.target.value)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold outline-none transition-all ${
              isDarkMode 
                ? "bg-slate-950 border-slate-800 text-slate-200 focus:border-teal-500" 
                : "bg-slate-50 border-slate-300 text-slate-800 focus:border-teal-600"
            }`}
          >
            <option value="ALL">Todas las Especialidades</option>
            <option value="Periodoncia">Periodoncia & Encías</option>
            <option value="Implantes">Implantes Dentales</option>
            <option value="Ortodoncia">Ortodoncia & Alineadores</option>
            <option value="Endodoncia">Endodoncia (Conducto)</option>
            <option value="Odontopediatría">Odontopediatría</option>
            <option value="Rehabilitación">Rehabilitación Oral</option>
            <option value="Urgencias">Urgencias Odontológicas</option>
          </select>

          {viewMode === 'clinics' && (
            <select
              value={selectedCommune}
              onChange={(e) => setSelectedCommune(e.target.value)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold outline-none transition-all ${
                isDarkMode 
                  ? "bg-slate-950 border-slate-800 text-slate-200 focus:border-teal-500" 
                  : "bg-slate-50 border-slate-300 text-slate-800 focus:border-teal-600"
              }`}
            >
              <option value="ALL">Todas las Ubicaciones / Comunas</option>
              <option value="Providencia">Providencia</option>
              <option value="Las Condes">Las Condes</option>
              <option value="Recoleta">Recoleta / Santiago Norte</option>
              <option value="Viña del Mar">Viña del Mar / Valparaíso</option>
              <option value="Concepción">Concepción</option>
            </select>
          )}

          {(searchQuery || selectedSpecialty !== 'ALL' || selectedCommune !== 'ALL' || only24h) && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedSpecialty('ALL');
                setSelectedCommune('ALL');
                setOnly24h(false);
              }}
              className="text-[11px] font-bold text-teal-400 hover:text-teal-300 ml-auto cursor-pointer"
            >
              Limpiar Filtros
            </button>
          )}
        </div>
      </div>

      {/* VIEW: CLINICS DIRECTORY */}
      {viewMode === 'clinics' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredClinics.map((clinic) => (
            <div
              key={clinic.id}
              className={`rounded-3xl border overflow-hidden flex flex-col justify-between transition-all group hover:shadow-xl ${
                isDarkMode 
                  ? "bg-slate-900/90 border-slate-800 hover:border-teal-500/40" 
                  : "bg-white border-slate-200 hover:border-teal-400 shadow-sm"
              }`}
            >
              {/* Image & Header */}
              <div>
                <div className="h-44 w-full relative overflow-hidden bg-slate-950">
                  <img
                    src={clinic.imageUrl}
                    alt={clinic.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                  
                  {/* Badges on Top */}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    {clinic.perioDashCertified && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-teal-600/90 text-white backdrop-blur-md shadow-md flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-300" />
                        Acreditada PerioDash
                      </span>
                    )}
                    {clinic.isEmergency24h && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white backdrop-blur-md shadow-md">
                        24 Horas
                      </span>
                    )}
                  </div>

                  {/* Distance & Rating */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs">
                    <span className="flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md font-mono text-[11px]">
                      <Navigation className="w-3 h-3 text-teal-400" />
                      A ~{clinic.distanceKm} km de ti
                    </span>
                    <span className="flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md font-bold text-amber-300 text-[11px]">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      {clinic.rating} ({clinic.reviewsCount})
                    </span>
                  </div>
                </div>

                {/* Content Details */}
                <div className="p-5 space-y-3">
                  <div>
                    <h3 className={`text-base font-black ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                      {clinic.name}
                    </h3>
                    <p className={`text-xs font-semibold ${isDarkMode ? "text-teal-400" : "text-teal-700"}`}>
                      {clinic.brandSubtitle}
                    </p>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className={`flex items-start gap-2 ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>
                      <MapPin className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" />
                      <span>{clinic.address}, {clinic.commune}</span>
                    </div>

                    <div className={`flex items-center gap-2 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                      <Clock className="w-4 h-4 text-slate-500 shrink-0" />
                      <span className="text-[11px]">{clinic.hours}</span>
                    </div>
                  </div>

                  {/* Specialties Pills */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {clinic.specialties.map((spec, i) => (
                      <span
                        key={i}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${
                          isDarkMode 
                            ? "bg-slate-950 border-slate-800 text-slate-300" 
                            : "bg-slate-100 border-slate-200 text-slate-700"
                        }`}
                      >
                        {spec}
                      </span>
                    ))}
                  </div>

                  {/* Features */}
                  <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-slate-800/40 text-[11px]">
                    {clinic.features.map((feat, i) => (
                      <div key={i} className={`flex items-center gap-1.5 ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                        <Check className="w-3 h-3 text-teal-400 shrink-0" />
                        <span className="truncate">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className={`p-4 pt-3 border-t flex items-center gap-2 ${
                isDarkMode ? "border-slate-800/80 bg-slate-950/40" : "border-slate-100 bg-slate-50"
              }`}>
                <a
                  href={`tel:${clinic.phone.replace(/[^0-9+]/g, '')}`}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center transition-all ${
                    isDarkMode 
                      ? "bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800" 
                      : "bg-white border-slate-300 text-slate-700 hover:bg-slate-100"
                  }`}
                  title="Llamar directo a recepción"
                >
                  <Phone className="w-4 h-4 text-teal-400" />
                </a>

                <a
                  href={`https://wa.me/${clinic.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hola, soy paciente y deseo consultar disponibilidad en ${clinic.name}`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center transition-all ${
                    isDarkMode 
                      ? "bg-slate-900 border-slate-700 text-emerald-400 hover:bg-slate-800" 
                      : "bg-white border-slate-300 text-emerald-600 hover:bg-slate-100"
                  }`}
                  title="Escribir por WhatsApp"
                >
                  <MessageSquare className="w-4 h-4" />
                </a>

                <button
                  type="button"
                  onClick={() => setSelectedTarget({ type: 'clinic', item: clinic })}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Solicitar Cita en Clínica</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* VIEW: SPECIALISTS DIRECTORY */}
      {viewMode === 'specialists' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredSpecialists.map((spec) => (
            <div
              key={spec.id}
              className={`rounded-3xl border p-5 flex flex-col justify-between transition-all group hover:shadow-xl ${
                isDarkMode 
                  ? "bg-slate-900/90 border-slate-800 hover:border-teal-500/40" 
                  : "bg-white border-slate-200 hover:border-teal-400 shadow-sm"
              }`}
            >
              <div className="space-y-4">
                {/* Header Profile */}
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-950 border border-teal-500/30 shrink-0 shadow-md">
                    <img
                      src={spec.avatarUrl}
                      alt={spec.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className={`text-sm font-black truncate ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                        {spec.name}
                      </h3>
                      <Award className="w-4 h-4 text-teal-400 shrink-0" />
                    </div>

                    <p className="text-xs font-bold text-teal-400 truncate">
                      {spec.specialty}
                    </p>

                    <p className={`text-[11px] truncate mt-0.5 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                      {spec.clinicAffiliation}
                    </p>

                    <div className="flex items-center gap-3 mt-1.5 text-[11px]">
                      <span className="flex items-center gap-1 font-bold text-amber-400 font-mono">
                        <Star className="w-3 h-3 fill-amber-400" />
                        {spec.rating} ({spec.reviewsCount})
                      </span>
                      <span className={isDarkMode ? "text-slate-500" : "text-slate-400"}>•</span>
                      <span className={`font-medium ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>
                        {spec.experience} de experiencia
                      </span>
                    </div>
                  </div>
                </div>

                {/* Education & Bio */}
                <div className={`p-3 rounded-2xl border text-xs space-y-1 ${
                  isDarkMode ? "bg-slate-950/70 border-slate-800" : "bg-slate-50 border-slate-200"
                }`}>
                  <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400">
                    <Stethoscope className="w-3.5 h-3.5 text-teal-400" />
                    <span>Formación: {spec.education}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>Días de atención: <strong className="text-slate-300">{spec.availableDays}</strong></span>
                  </div>
                </div>

                {/* Skills Tags */}
                <div className="flex flex-wrap gap-1.5">
                  {spec.skills.map((skill, i) => (
                    <span
                      key={i}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${
                        isDarkMode 
                          ? "bg-slate-950 border-slate-800 text-slate-300" 
                          : "bg-slate-100 border-slate-200 text-slate-700"
                      }`}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 mt-4 border-t border-slate-800/60 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTarget({ type: 'specialist', item: spec })}
                  className="w-full py-2.5 px-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Agendar Consulta con Especialista</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Appointment Request Modal */}
      <AnimatePresence>
        {selectedTarget && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`max-w-lg w-full rounded-3xl border p-6 space-y-4 shadow-2xl ${
                isDarkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
              }`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black">
                      Solicitar Cita Odontológica
                    </h3>
                    <p className={`text-[11px] ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                      {selectedTarget.type === 'clinic' ? selectedTarget.item.name : `Dr(a). ${(selectedTarget.item as SpecialistItem).name}`}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedTarget(null)}
                  className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {bookingSuccess ? (
                <div className="py-8 text-center space-y-2">
                  <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                  <h4 className="text-base font-black text-emerald-400">¡Solicitud Transmitida con Éxito!</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    El centro médico y el doctor han recibido tu solicitud. Te contactarán por teléfono o WhatsApp para confirmar tu bloque horario definitivo.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSendBookingRequest} className="space-y-3.5 text-xs">
                  <div>
                    <label className="font-bold text-slate-400 block mb-1">Nombre Completo del Paciente:</label>
                    <input
                      type="text"
                      value={reqPatientName}
                      onChange={(e) => setReqPatientName(e.target.value)}
                      placeholder="Ej. Carlos Mendoza"
                      required
                      className={`w-full px-3 py-2 rounded-xl border text-xs outline-none ${
                        isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-300 text-slate-900"
                      }`}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-400 block mb-1">Teléfono Móvil / WhatsApp:</label>
                      <input
                        type="tel"
                        value={reqPatientPhone}
                        onChange={(e) => setReqPatientPhone(e.target.value)}
                        placeholder="+56 9 1234 5678"
                        required
                        className={`w-full px-3 py-2 rounded-xl border text-xs outline-none ${
                          isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-300 text-slate-900"
                        }`}
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-400 block mb-1">Fecha Sugerida:</label>
                      <input
                        type="date"
                        value={reqDate}
                        onChange={(e) => setReqDate(e.target.value)}
                        required
                        className={`w-full px-3 py-2 rounded-xl border text-xs outline-none ${
                          isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-300 text-slate-900"
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-400 block mb-1">Motivo de Consulta o Tratamiento Requerido:</label>
                    <select
                      value={reqReason}
                      onChange={(e) => setReqReason(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold outline-none ${
                        isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-300 text-slate-900"
                      }`}
                    >
                      <option value="Evaluación Periodontal y Diagnóstico">Evaluación Periodontal y Diagnóstico</option>
                      <option value="Limpieza Dental / Destartraje">Limpieza Dental / Destartraje Ultrasonido</option>
                      <option value="Evaluación de Implantes Dentales">Evaluación de Implantes Dentales</option>
                      <option value="Ortodoncia y Alineadores">Ortodoncia y Alineadores</option>
                      <option value="Urgencia por Dolor o Inflamación">Urgencia por Dolor o Inflamación</option>
                      <option value="Segunda Opinión / Interconsulta">Segunda Opinión / Interconsulta Médica</option>
                    </select>
                  </div>

                  <div className={`p-3 rounded-xl border text-[11px] flex items-center gap-2 ${
                    isDarkMode ? "bg-slate-950/70 border-slate-800 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-600"
                  }`}>
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Tu información de contacto se procesa bajo consentimiento seguro y cifrado clínico.</span>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setSelectedTarget(null)}
                      className={`px-4 py-2 rounded-xl border font-bold text-xs ${
                        isDarkMode ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700" : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg cursor-pointer flex items-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Transmitiendo...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Enviar Solicitud</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
