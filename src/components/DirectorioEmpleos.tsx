import React, { useState, useEffect } from 'react';
import { safeStorage } from '../utils/safeStorage';
import { 
  Briefcase, 
  Star, 
  MapPin, 
  ThumbsUp, 
  MessageSquare, 
  FileText, 
  Search, 
  Award,
  CheckCircle,
  Clock,
  User,
  X,
  Upload,
  Heart,
  Send,
  Calendar,
  DollarSign,
  Building,
  Check,
  Phone,
  Sparkles,
  Download,
  PlusCircle,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Structured interface for professional profiles
export interface ProfessionalProfile {
  id: string;
  name: string;
  specialty: string;
  location: string;
  rating: number;
  likes: number;
  reviews: number;
  experience: string;
  status: string;
  avatar: string;
  phone: string;
  email: string;
  about: string;
  skills: string[];
  education: string;
  certifications: string[];
  isMyProfile?: boolean;
  licenseNumber?: string;
  cvFileName?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'professional';
  text: string;
  timestamp: string;
}

export interface ClinicalInvitation {
  id: string;
  profId: string;
  profName: string;
  profSpecialty: string;
  type: string;
  location: string;
  compensation: string;
  date: string;
  message: string;
  status: 'Pendiente' | 'Aceptada' | 'En revisión';
  createdAt: string;
}

export interface JobOffer {
  id: string;
  title: string;
  specialty: string;
  clinicBranch: string;
  modality: string;
  salary: string;
  description: string;
  requirements: string[];
  postedAt: string;
  applicantsCount: number;
}

// Initial Mock data for professionals
const INITIAL_PROFESSIONALS: ProfessionalProfile[] = [
  {
    id: "prof-1",
    name: "Dra. Ana Silveira",
    specialty: "Periodoncia e Implantología",
    location: "Sede Centro, CDMX",
    rating: 4.9,
    likes: 124,
    reviews: 48,
    experience: "12 años",
    status: "Disponible",
    avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300",
    phone: "+52 55 1234 5678",
    email: "dra.ana.silveira@periodash.med",
    about: "Especialista en cirugía mucogingival, regeneración ósea guiada e implantes dentales osteointegrados. Egresada de la UNAM con maestría en rehabilitación oral avanzada y postgrado en periodoncia clínica.",
    skills: ["Cirugía Guiada 3D", "Regeneración Tisular (RTG)", "Láser Diodo", "Microcirugía Plástica"],
    education: "Maestría en Periodoncia - UNAM (2014) • Diplomado en Implantología Straumann",
    certifications: ["Certificación ITI Fellow", "Certificación en Sedación Consciente"]
  },
  {
    id: "prof-2",
    name: "Dr. Carlos Mendoza",
    specialty: "Ortodoncia y Ortopedia Maxilofacial",
    location: "Sede Sur, Monterrey",
    rating: 4.7,
    likes: 98,
    reviews: 32,
    experience: "8 años",
    status: "Buscando Oportunidades",
    avatar: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300",
    phone: "+52 81 8765 4321",
    email: "dr.carlos.mendoza@periodash.med",
    about: "Certificado Platinum en alineadores invisibles (Invisalign / Spark). Apasionado por la ortopedia interceptiva en pacientes pediátricos y manejo biomecánico con microtornillos de anclaje esqueletal.",
    skills: ["Ortodoncia Invisible", "Microtornillos CAD/CAM", "Cefalometría 3D", "Diseño Digital Smile"],
    education: "Especialidad en Ortodoncia - UANL (2018)",
    certifications: ["Invisalign Platinum Provider", "Certificado Damon System"]
  },
  {
    id: "prof-3",
    name: "Dra. Sofía Reyes",
    specialty: "Endodoncia Microscópica",
    location: "Guadalajara, Jalisco",
    rating: 4.8,
    likes: 156,
    reviews: 64,
    experience: "15 años",
    status: "Disponible",
    avatar: "https://images.unsplash.com/photo-1594824813589-40898a3952d7?auto=format&fit=crop&q=80&w=300",
    phone: "+52 33 2233 4455",
    email: "dra.sofia.reyes@periodash.med",
    about: "Manejo de casos altamente complejos, retratamientos endodónticos, retiro de instrumentos fracturados y microcirugía apical guiada. Más de 10,000 conductos tratados con éxito.",
    skills: ["Microscopio Zeiss", "Sistemas Reciprocantes", "Tomografía CBCT Endodóntica", "MTA / Biocerámicos"],
    education: "Especialidad en Endodoncia - UdeG (2011)",
    certifications: ["Miembro Asociación Mexicana de Endodoncia", "Certificación Zeiss Micro-Endo"]
  },
  {
    id: "prof-4",
    name: "Dr. Javier Orozco",
    specialty: "Odontopediatría Integral",
    location: "Sede Norte, CDMX",
    rating: 5.0,
    likes: 210,
    reviews: 89,
    experience: "10 años",
    status: "En Clínica (Medio Tiempo)",
    avatar: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=300",
    phone: "+52 55 9876 5432",
    email: "dr.javier.orozco@periodash.med",
    about: "Manejo compasivo y psicológico de pacientes infantiles y con necesidades especiales. Enfoque preventivo, odontología mínimamente invasiva y rehabilitación bajo óxido nitroso.",
    skills: ["Sedación Inhalatoria", "Coronas Zirconia Pediátricas", "Terapia Pulpar Vital", "Manejo de Conducta"],
    education: "Especialidad en Odontología Pediátrica - Hospital Infantil de México (2016)",
    certifications: ["Certificado BLS / PALS Pediátrico", "Sociedad Odontológica Pediátrica"]
  },
  {
    id: "prof-5",
    name: "Dra. Valeria Gómez",
    specialty: "Odontología General Integral",
    location: "Sede Centro, CDMX",
    rating: 4.9,
    likes: 142,
    reviews: 53,
    experience: "7 años",
    status: "Disponible",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300",
    phone: "+52 55 3344 5566",
    email: "dra.valeria.gomez@periodash.med",
    about: "Práctica enfocada en odontología general integral, odontología preventiva, restauraciones adhesivas con resina estratificada, endodoncia básica, profilaxis ultrasónica y control de urgencias en gabinete.",
    skills: ["Odontología General", "Operatoria Dental (Resinas)", "Profilaxis & Detartraje", "Blanqueamiento Dental", "Prótesis Removible", "Urgencias Odontológicas"],
    education: "Licenciatura en Cirujano Dentista - UNAM (2018) • Diplomado en Odontología Restauradora y Estética Adhesiva",
    certifications: ["Miembro Asociación Dental Mexicana (ADM)", "Certificación en Soporte Vital Básico (BLS)"]
  }
];

const INITIAL_JOB_OFFERS: JobOffer[] = [
  {
    id: "job-1",
    title: "Periodoncista Quirúrgico para Interconsultas",
    specialty: "Periodoncia",
    clinicBranch: "Sede Principal Centro & Sucursal Polanco",
    modality: "Por Honorarios / Casos Programados",
    salary: "50% - 60% por procedimiento quirúrgico",
    description: "Buscamos especialista en Periodoncia para realizar cirugías de alargamiento de corona, colocación de implantes, raspados periodontales y regeneraciones óseas 2 días por semana.",
    requirements: ["Cédula de Especialidad", "Mínimo 3 años de experiencia", "Manejo de motor de implantes y piezoeléctrico"],
    postedAt: "Hace 2 días",
    applicantsCount: 4
  },
  {
    id: "job-2",
    title: "Ortodoncista Titular de Turno Vespertino",
    specialty: "Ortodoncia",
    clinicBranch: "Sede Sur - Monterrey",
    modality: "Tiempo Completo (Lunes a Viernes)",
    salary: "$28,000 - $38,000 MXN / mes + Comisiones",
    description: "Responsable del control de casos de ortodoncia convencional, autoligado y alineadores transparentes con flujo digital en gabinete.",
    requirements: ["Cédula de Especialista", "Certificación en Alineadores", "Disponibilidad de horario"],
    postedAt: "Hace 5 días",
    applicantsCount: 7
  }
];

export default function DirectorioEmpleos() {
  const [activeTab, setActiveTab] = useState<'directorio' | 'ofertas' | 'invitaciones'>('directorio');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [professionals, setProfessionals] = useState<ProfessionalProfile[]>(() => {
    const saved = safeStorage.getItem('periodash_job_professionals');
    return saved ? JSON.parse(saved) : INITIAL_PROFESSIONALS;
  });

  const [selectedProfile, setSelectedProfile] = useState<ProfessionalProfile | null>(null);
  const [showMyProfile, setShowMyProfile] = useState(false);
  const [likedProfiles, setLikedProfiles] = useState<Record<string, boolean>>(() => {
    const saved = safeStorage.getItem('periodash_job_likes');
    return saved ? JSON.parse(saved) : {};
  });

  // Chat / Message Modal State
  const [activeChatProf, setActiveChatProf] = useState<ProfessionalProfile | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Record<string, ChatMessage[]>>(() => {
    const saved = safeStorage.getItem('periodash_job_chats');
    if (saved) {
      return JSON.parse(saved);
    }
    // Default initial mock messages
    return {
      "prof-1": [
        {
          id: "m-1",
          sender: "professional",
          text: "¡Hola! Con gusto puedo apoyarte en interconsultas periodontales o cirugías de implantes. ¿En qué caso clínico te gustaría colaborar?",
          timestamp: "10:30 AM"
        }
      ]
    };
  });

  // Invitation Modal State
  const [activeInviteProf, setActiveInviteProf] = useState<ProfessionalProfile | null>(null);
  const [invitations, setInvitations] = useState<ClinicalInvitation[]>(() => {
    const saved = safeStorage.getItem('periodash_job_invitations');
    return saved ? JSON.parse(saved) : [
      {
        id: "inv-1",
        profId: "prof-1",
        profName: "Dra. Ana Silveira",
        profSpecialty: "Periodoncia e Implantología",
        type: "Interconsulta Quirúrgica por Caso",
        location: "Sede Centro, CDMX",
        compensation: "50% por procedimiento quirúrgico",
        date: "Próximo Martes, 10:00 AM",
        message: "Estimada Dra. Ana, tenemos un paciente con periodontitis estadío III que requiere colgajo de regeneración ósea e implante en pieza 16.",
        status: "Pendiente",
        createdAt: "Hoy, 09:15 AM"
      }
    ];
  });

  const [inviteForm, setInviteForm] = useState({
    type: "Interconsulta Quirúrgica por Caso",
    location: "Sede Centro, CDMX",
    compensation: "50% por procedimiento",
    date: "",
    message: ""
  });

  // Job Offers State
  const [jobOffers, setJobOffers] = useState<JobOffer[]>(() => {
    const saved = safeStorage.getItem('periodash_job_offers');
    return saved ? JSON.parse(saved) : INITIAL_JOB_OFFERS;
  });
  const [showNewJobModal, setShowNewJobModal] = useState(false);
  const [newJobForm, setNewJobForm] = useState({
    title: "",
    specialty: "Periodoncia",
    clinicBranch: "Sede Principal Centro",
    modality: "Por Honorarios",
    salary: "",
    description: "",
    requirements: ""
  });

  // Toast State
  const [toastMessage, setToastMessage] = useState<{ title: string; desc: string; type: 'success' | 'info' } | null>(null);

  // My Profile State with safe storage persistence
  const [myProfileData, setMyProfileData] = useState(() => {
    const saved = safeStorage.getItem('periodash_my_profile');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return {
      name: "Dr. Ignacio León",
      specialty: "Periodoncia e Implantología Oral",
      licenseNumber: "CED. PROF. 11982734",
      location: "CDMX - Sede Principal",
      phone: "+52 55 4321 9876",
      email: "dr.ignacio.leon@periodash.med",
      experience: "11 años",
      status: "Disponible",
      compensation: "50% por procedimiento quirúrgico",
      avatar: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300",
      about: "Especialista en cirugía periodontal regenerativa, implantes de carga inmediata, elevación de seno maxilar y rehabilitación mínimamente invasiva con flujo digital.",
      skills: ["Cirugía Guiada 3D", "Regeneración Ósea Guiada", "Implantes Inmediatos", "Injertos Mucogingivales", "Láser Diodo", "Diagnóstico CBCT"],
      education: "Especialidad en Periodoncia e Implantología (UNAM) • Diplomado en Regeneración Tisular Avanzada",
      certifications: ["Miembro Activo Asociación Mexicana de Periodontología", "Certificación Straumann Guided Surgery", "Soporte Vital Básico (BLS)"],
      isPublished: true,
      cvFileName: "CV_Dr_Ignacio_Leon_Periodoncia.pdf"
    };
  });

  // Save changes to safeStorage
  useEffect(() => {
    safeStorage.setItem('periodash_job_professionals', JSON.stringify(professionals));
  }, [professionals]);

  useEffect(() => {
    safeStorage.setItem('periodash_my_profile', JSON.stringify(myProfileData));
  }, [myProfileData]);

  useEffect(() => {
    safeStorage.setItem('periodash_job_chats', JSON.stringify(chatMessages));
  }, [chatMessages]);

  useEffect(() => {
    safeStorage.setItem('periodash_job_invitations', JSON.stringify(invitations));
  }, [invitations]);

  useEffect(() => {
    safeStorage.setItem('periodash_job_likes', JSON.stringify(likedProfiles));
  }, [likedProfiles]);

  useEffect(() => {
    safeStorage.setItem('periodash_job_offers', JSON.stringify(jobOffers));
  }, [jobOffers]);

  // Handle Photo / Avatar Upload
  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        showToast("Archivo muy grande", "Por favor selecciona una imagen menor a 3MB.", "info");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setMyProfileData(prev => ({ ...prev, avatar: reader.result as string }));
          showToast("Foto Actualizada", "Tu imagen de perfil ha sido cargada correctamente.", "success");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle CV Document Upload
  const handleCVFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMyProfileData(prev => ({
        ...prev,
        cvFileName: file.name
      }));
      showToast("Currículum Adjuntado", `Se cargó el archivo ${file.name} exitosamente.`, "success");
    }
  };

  // Save / Publish Profile
  const handleSaveAndPublishProfile = (publish: boolean) => {
    if (!myProfileData.name.trim()) {
      showToast("Nombre requerido", "Por favor ingresa tu nombre profesional.", "info");
      return;
    }

    const updatedProfileState = {
      ...myProfileData,
      isPublished: publish
    };

    setMyProfileData(updatedProfileState);

    const myProfileObject: ProfessionalProfile = {
      id: "prof-my-user",
      name: myProfileData.name,
      specialty: myProfileData.specialty,
      location: myProfileData.location,
      rating: 5.0,
      likes: 18,
      reviews: 6,
      experience: myProfileData.experience || "10+ años",
      status: myProfileData.status,
      avatar: myProfileData.avatar || "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300",
      phone: myProfileData.phone || "+52 55 4321 9876",
      email: myProfileData.email || "mi.perfil@periodash.med",
      about: myProfileData.about || "Especialista clínico enfocado en excelencia y tratamientos de vanguardia.",
      skills: myProfileData.skills.length > 0 ? myProfileData.skills : ["Periodoncia", "Cirugía Digital", "Rehabilitación"],
      education: myProfileData.education || "Especialidad en Odontología Quirúrgica",
      certifications: myProfileData.certifications.length > 0 ? myProfileData.certifications : ["Certificación Oficial Odontológica"],
      isMyProfile: true,
      licenseNumber: myProfileData.licenseNumber,
      cvFileName: myProfileData.cvFileName
    };

    if (publish) {
      setProfessionals(prev => {
        const withoutMe = prev.filter(p => p.id !== 'prof-my-user');
        return [myProfileObject, ...withoutMe];
      });
      setShowMyProfile(false);
      showToast("¡Perfil Publicado!", "Tu perfil ya está activo y visible en la Bolsa de Empleo y Directorio Clínico.", "success");
    } else {
      setProfessionals(prev => prev.filter(p => p.id !== 'prof-my-user'));
      setShowMyProfile(false);
      showToast("Perfil Guardado en Borrador", "Tu perfil se guardó localmente y no está visible en el directorio.", "info");
    }
  };

  // Quick skill toggle or add
  const handleToggleSkill = (skill: string) => {
    setMyProfileData(prev => {
      const exists = prev.skills.includes(skill);
      if (exists) {
        return { ...prev, skills: prev.skills.filter(s => s !== skill) };
      } else {
        return { ...prev, skills: [...prev.skills, skill] };
      }
    });
  };

  const showToast = (title: string, desc: string, type: 'success' | 'info' = 'success') => {
    setToastMessage({ title, desc, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Toggle Like/Favorite
  const handleToggleLike = (profId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const isLiked = !likedProfiles[profId];
    setLikedProfiles(prev => ({ ...prev, [profId]: isLiked }));
    setProfessionals(prev => prev.map(p => {
      if (p.id === profId) {
        return { ...p, likes: isLiked ? p.likes + 1 : p.likes - 1 };
      }
      return p;
    }));
    showToast(
      isLiked ? "Añadido a Especialistas Favoritos" : "Eliminado de Favoritos",
      "Tu lista de contactos clínicos ha sido actualizada.",
      "info"
    );
  };

  // Open Message Chat with a professional
  const handleOpenMessage = (prof: ProfessionalProfile, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setActiveChatProf(prof);
    // Initialize default greeting if no chat exists yet
    if (!chatMessages[prof.id] || chatMessages[prof.id].length === 0) {
      setChatMessages(prev => ({
        ...prev,
        [prof.id]: [
          {
            id: `msg-${Date.now()}-init`,
            sender: "professional",
            text: `¡Hola! Soy ${prof.name}, especialista en ${prof.specialty}. ¿En qué caso clínico o interconsulta puedo colaborarte hoy?`,
            timestamp: "Ahora"
          }
        ]
      }));
    }
  };

  // Send a chat message
  const handleSendMessage = () => {
    if (!activeChatProf || !chatInput.trim()) return;

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: "user",
      text: chatInput.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const profId = activeChatProf.id;
    const profName = activeChatProf.name;

    setChatMessages(prev => ({
      ...prev,
      [profId]: [...(prev[profId] || []), newMsg]
    }));

    setChatInput('');

    // Simulated quick professional response
    setTimeout(() => {
      const replies = [
        `Excelente doctor, tengo disponibilidad para coordinar este caso. Déjame revisar mi agenda y te confirmo fecha exacta.`,
        `Perfecto. Cuento con todo el instrumental y magnificación necesaria para el procedimiento. ¿Cuentas con las radiografías o tomografía del paciente?`,
        `Recibido con gusto. Me interesa colaborar en su clínica para esta especialidad. ¿Gustas que nos coordinemos por llamada o WhatsApp?`
      ];
      const randomReply = replies[Math.floor(Math.random() * replies.length)];

      const autoReply: ChatMessage = {
        id: `msg-rep-${Date.now()}`,
        sender: "professional",
        text: autoReplyFormat(profName, randomReply),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setChatMessages(prev => ({
        ...prev,
        [profId]: [...(prev[profId] || []), autoReply]
      }));
    }, 1000);
  };

  const autoReplyFormat = (name: string, text: string) => {
    return `${text}`;
  };

  // Quick message chip click
  const handleQuickMessage = (text: string) => {
    setChatInput(text);
  };

  // Send message via external WhatsApp
  const handleSendViaWhatsApp = (prof: ProfessionalProfile) => {
    const defaultText = `Hola ${prof.name}, me pongo en contacto desde la plataforma PerioDash para consultar su disponibilidad sobre interconsultas de ${prof.specialty}.`;
    const cleanPhone = prof.phone.replace(/[^0-9]/g, '');
    const url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(defaultText)}`;
    window.open(url, '_blank');
  };

  // Open Invitation Form Modal
  const handleOpenInvite = (prof: ProfessionalProfile, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setActiveInviteProf(prof);
    setInviteForm({
      type: "Interconsulta Quirúrgica por Caso",
      location: prof.location.includes("CDMX") ? "Sede Centro, CDMX" : "Sede Principal",
      compensation: "50% por procedimiento quirúrgico",
      date: "Próxima semana a convenir",
      message: `Estimado(a) ${prof.name}, nos gustaría invitarle a colaborar con nuestro equipo clínico en procedimientos de ${prof.specialty}.`
    });
  };

  // Submit formal invitation
  const handleSubmitInvitation = () => {
    if (!activeInviteProf) return;

    const newInvitation: ClinicalInvitation = {
      id: `inv-${Date.now()}`,
      profId: activeInviteProf.id,
      profName: activeInviteProf.name,
      profSpecialty: activeInviteProf.specialty,
      type: inviteForm.type,
      location: inviteForm.location,
      compensation: inviteForm.compensation,
      date: inviteForm.date || "Fecha por acordar",
      message: inviteForm.message,
      status: "Pendiente",
      createdAt: "Hoy, " + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setInvitations(prev => [newInvitation, ...prev]);
    const invitedName = activeInviteProf.name;
    setActiveInviteProf(null);

    showToast(
      "¡Invitación Clínica Enviada!",
      `Se ha enviado la propuesta formal a ${invitedName}. Podrás monitorear la respuesta en la pestaña de Invitaciones.`,
      "success"
    );
  };

  // Download CV as formatted text file
  const handleDownloadCV = (prof: ProfessionalProfile, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const cvText = `======================================================
FICHA CURRICULAR PROFESIONAL - PERIODASH RED CLÍNICA
======================================================
Nombre: ${prof.name}
Especialidad: ${prof.specialty}
Ubicación: ${prof.location}
Experiencia Clínica: ${prof.experience}
Calificación Pacientes: ${prof.rating} / 5.0 (${prof.reviews} reseñas verificadas)
Estado Laboral: ${prof.status}

CONTACTO DIRECTO:
Teléfono: ${prof.phone}
Email: ${prof.email}

RESUMEN PROFESIONAL:
${prof.about}

FORMACIÓN ACADÉMICA:
${prof.education}

CERTIFICACIONES Y MEMBRESÍAS:
${prof.certifications.map(c => `• ${c}`).join('\n')}

HABILIDADES CLÍNICAS DESTACADAS:
${prof.skills.map(s => `• ${s}`).join('\n')}

======================================================
Verificado por la Red de Especialistas PerioDash v15 Pro
Fecha de emisión: ${new Date().toLocaleDateString()}
======================================================`;

    const blob = new Blob([cvText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `CV_${prof.name.replace(/\s+/g, '_')}_PerioDash.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast("Ficha Curricular Descargada", `Se descargó el expediente profesional de ${prof.name}`, "info");
  };

  // Create new job offer
  const handleCreateJobOffer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJobForm.title.trim()) return;

    const newOffer: JobOffer = {
      id: `job-${Date.now()}`,
      title: newJobForm.title,
      specialty: newJobForm.specialty,
      clinicBranch: newJobForm.clinicBranch,
      modality: newJobForm.modality,
      salary: newJobForm.salary || "Honorarios competitivos a convenir",
      description: newJobForm.description || "Oportunidad para integrarse a nuestro equipo clínico multidisciplinario con tecnología de punta.",
      requirements: newJobForm.requirements ? newJobForm.requirements.split(',').map(r => r.trim()) : ["Cédula profesional", "Experiencia comprobable"],
      postedAt: "Recién publicado",
      applicantsCount: 0
    };

    setJobOffers(prev => [newOffer, ...prev]);
    setShowNewJobModal(false);
    setNewJobForm({
      title: "",
      specialty: "Periodoncia",
      clinicBranch: "Sede Principal Centro",
      modality: "Por Honorarios",
      salary: "",
      description: "",
      requirements: ""
    });

    showToast("Oferta Laboral Publicada", "Tu vacante ya está visible para los especialistas de la red.", "success");
  };

  // Filter professionals
  const filteredProfessionals = professionals.filter(prof => {
    const matchesSearch = prof.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          prof.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          prof.skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesFilter = activeFilter === 'All' ? true : 
                          prof.specialty.toLowerCase().includes(activeFilter.toLowerCase()) || 
                          prof.status.toLowerCase().includes(activeFilter.toLowerCase());
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="flex flex-col h-full gap-4 relative font-sans text-slate-800 dark:text-slate-100">
      
      {/* TOAST NOTIFICATION BANNER */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-6 right-6 z-[120] max-w-md p-4 rounded-2xl shadow-2xl border flex items-start gap-3 backdrop-blur-xl ${
              toastMessage.type === 'success' 
                ? 'bg-emerald-950/90 border-emerald-500/50 text-white' 
                : 'bg-slate-900/90 border-teal-500/50 text-white'
            }`}
          >
            <div className={`p-2 rounded-xl shrink-0 ${toastMessage.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-teal-500/20 text-teal-400'}`}>
              <CheckCircle className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-sm leading-tight">{toastMessage.title}</h4>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{toastMessage.desc}</p>
            </div>
            <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white p-1">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 relative z-10">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-white flex items-center gap-2.5">
            <div className="p-2 bg-teal-500/10 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 rounded-xl border border-teal-500/20">
              <Briefcase className="w-6 h-6" />
            </div>
            Bolsa de Empleo y Directorio Clínico
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Conecta directamente con especialistas calificados para interconsultas quirúrgicas, vacantes de plantilla o alianzas clínicas. Envía mensajes o invitaciones formales al instante.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Buscar especialista, técnica, ciudad..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2.5 w-60 sm:w-72 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 outline-none dark:text-white transition-all focus:border-teal-500/50 focus:ring-2 focus:ring-teal-500/10 shadow-xs"
            />
          </div>

          <button 
            onClick={() => setShowMyProfile(true)}
            className={`px-4 py-2.5 text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer shadow-xs border transition-all shrink-0 ${
              myProfileData.isPublished 
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/90' 
                : 'text-white bg-slate-800 hover:bg-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 border-slate-700'
            }`}
          >
            <User className="w-4 h-4 text-teal-400" />
            {myProfileData.isPublished ? 'Mi Perfil (Publicado ✓)' : 'Subir Mi Perfil'}
          </button>

          <button 
            onClick={() => setShowNewJobModal(true)}
            className="px-4 py-2.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-500 rounded-xl flex items-center gap-2 cursor-pointer shadow-md transition-all shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            Publicar Vacante
          </button>
        </div>
      </div>

      {/* SUB-TABS NAVIGATION */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800/80 pb-2">
        <button
          onClick={() => setActiveTab('directorio')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'directorio'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <User className="w-4 h-4" />
          Directorio de Especialistas ({professionals.length})
        </button>

        <button
          onClick={() => setActiveTab('invitaciones')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'invitaciones'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          Invitaciones y Mensajes
          {invitations.length > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] bg-teal-400/20 dark:bg-teal-400/30 text-teal-800 dark:text-teal-200 rounded-full font-black">
              {invitations.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('ofertas')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'ofertas'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Building className="w-4 h-4" />
          Ofertas de la Clínica ({jobOffers.length})
        </button>
      </div>

      {/* TAB 1: DIRECTORIO DE ESPECIALISTAS */}
      {activeTab === 'directorio' && (
        <>
          {/* BANNER CTA: SUBIR MI PERFIL */}
          <div className="bg-gradient-to-r from-teal-900/30 via-slate-900/50 to-emerald-950/30 border border-teal-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  {myProfileData.isPublished ? '✓ Tu perfil profesional está activo en la Bolsa de Empleo' : '¿Eres especialista odontológico? Sube tu perfil profesional'}
                  {myProfileData.isPublished && (
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-md border border-emerald-500/40">
                      Visible en red
                    </span>
                  )}
                </h4>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  {myProfileData.isPublished 
                    ? `Publicado como "${myProfileData.name}" (${myProfileData.specialty}). Clínicas y colegas pueden contactarte para interconsultas.`
                    : 'Regístrate para recibir invitaciones a cirugías, interconsultas especializadas y vacantes de clínicas asociadas.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <button
                onClick={() => setShowMyProfile(true)}
                className="px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                {myProfileData.isPublished ? 'Editar Mi Perfil' : 'Subir Mi Perfil Ahora'}
              </button>
            </div>
          </div>

          {/* HORIZONTAL SPECIALTY FILTERS */}
          <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1">
            {[
              { label: "Todos los Especialistas", value: "All" },
              { label: "Odontología General", value: "Odontología General" },
              { label: "Periodoncia e Implantes", value: "Periodoncia" },
              { label: "Ortodoncia y Ortopedia", value: "Ortodoncia" },
              { label: "Endodoncia Microscópica", value: "Endodoncia" },
              { label: "Odontopediatría", value: "Odontopediatría" },
              { label: "Rehabilitación Oral", value: "Rehabilitación" },
              { label: "Buscando Oportunidades", value: "Buscando" },
              { label: "Disponibles para Interconsulta", value: "Disponible" }
            ].map(filter => (
              <button
                key={filter.value}
                onClick={() => setActiveFilter(filter.value)}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all border cursor-pointer ${
                  activeFilter === filter.value 
                    ? "bg-teal-50 dark:bg-teal-900/30 border-teal-300 dark:border-teal-700 text-teal-700 dark:text-teal-300 shadow-xs" 
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* MAIN SPECIALIST GRID */}
          <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
            {filteredProfessionals.length === 0 ? (
              <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
                <Search className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                <h3 className="font-bold text-base text-slate-700 dark:text-slate-300">No se encontraron especialistas</h3>
                <p className="text-xs text-slate-500 mt-1">Prueba cambiando el criterio de búsqueda o los filtros de especialidad.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <AnimatePresence>
                  {filteredProfessionals.map((prof, index) => {
                    const isLiked = !!likedProfiles[prof.id];
                    const isMine = prof.id === 'prof-my-user' || !!prof.isMyProfile;
                    return (
                      <motion.div
                        key={prof.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2, delay: index * 0.04 }}
                        className={`bg-white dark:bg-slate-900 border rounded-3xl p-5 flex flex-col hover:shadow-xl transition-all cursor-pointer group relative ${
                          isMine 
                            ? 'border-teal-500/60 ring-2 ring-teal-500/20 bg-gradient-to-b from-teal-950/10 to-transparent' 
                            : 'border-slate-200 dark:border-slate-800 hover:border-teal-400/50 dark:hover:border-teal-500/40'
                        }`}
                        onClick={() => setSelectedProfile(prof)}
                      >
                        {/* Status Badge & Like */}
                        <div className="flex justify-between items-center mb-3">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[9.5px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border ${
                              prof.status.includes('Disponible') ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' :
                              prof.status.includes('Buscando') ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20' :
                              'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20'
                            }`}>
                              {prof.status}
                            </span>
                            {isMine && (
                              <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-teal-500/20 text-teal-400 rounded-md border border-teal-500/40">
                                Mi Perfil
                              </span>
                            )}
                          </div>
                          <button 
                            onClick={(e) => handleToggleLike(prof.id, e)}
                            className={`p-1.5 rounded-full transition-colors ${isLiked ? 'text-rose-500 bg-rose-50 dark:bg-rose-950/30' : 'text-slate-400 hover:text-rose-500'}`}
                            title={isLiked ? "Quitar de favoritos" : "Guardar en favoritos"}
                          >
                            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                          </button>
                        </div>

                        {/* Avatar & Main Info */}
                        <div className="flex flex-col items-center text-center mb-4">
                          <div className="w-20 h-20 rounded-2xl border-2 border-teal-500/20 shadow-md mb-3 group-hover:scale-105 transition-transform overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                            <img 
                              src={prof.avatar} 
                              alt={prof.name} 
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                // Fallback if image fails
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                            <User className="w-8 h-8 text-slate-400" />
                          </div>
                          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base flex items-center gap-1.5">
                            {prof.name}
                            <CheckCircle className="w-4 h-4 text-teal-500 shrink-0" />
                          </h3>
                          <p className="text-teal-600 dark:text-teal-400 text-xs font-semibold mb-1">{prof.specialty}</p>
                          <p className="text-slate-500 dark:text-slate-400 text-[11px] flex items-center justify-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" /> {prof.location}
                          </p>
                        </div>

                        {/* Metric Pills */}
                        <div className="grid grid-cols-3 gap-2 border-t border-b border-slate-100 dark:border-slate-800/80 py-2.5 mb-4 text-center">
                          <div>
                            <div className="flex items-center justify-center gap-1 text-amber-500 font-black text-xs">
                              <Star className="w-3 h-3 fill-current" /> {prof.rating}
                            </div>
                            <span className="text-[9px] text-slate-400 uppercase font-semibold">Rating</span>
                          </div>
                          <div className="border-l border-r border-slate-100 dark:border-slate-800">
                            <div className="flex items-center justify-center gap-1 text-slate-700 dark:text-slate-200 font-black text-xs">
                              <Clock className="w-3 h-3 text-teal-500" /> {prof.experience}
                            </div>
                            <span className="text-[9px] text-slate-400 uppercase font-semibold">Exp.</span>
                          </div>
                          <div>
                            <div className="flex items-center justify-center gap-1 text-slate-700 dark:text-slate-200 font-black text-xs">
                              <ThumbsUp className="w-3 h-3 text-emerald-500" /> {prof.likes}
                            </div>
                            <span className="text-[9px] text-slate-400 uppercase font-semibold">Recom.</span>
                          </div>
                        </div>

                        {/* Skills Chips */}
                        <div className="flex flex-wrap gap-1 mb-4 h-12 overflow-hidden">
                          {prof.skills.slice(0, 3).map((skill, i) => (
                            <span key={i} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-semibold rounded-md">
                              {skill}
                            </span>
                          ))}
                        </div>

                        {/* Primary Functional Action Buttons */}
                        <div className="mt-auto grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                          <button 
                            onClick={(e) => handleOpenMessage(prof, e)}
                            className="py-2 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs"
                            title="Enviar Mensaje directo al especialista"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                            Mensaje
                          </button>

                          <button 
                            onClick={(e) => handleOpenInvite(prof, e)}
                            className="py-2 px-3 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md"
                            title="Invitar a interconsulta o vacante formal"
                          >
                            <Briefcase className="w-3.5 h-3.5" />
                            Invitar
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        </>
      )}

      {/* TAB 2: INVITACIONES Y MENSAJES */}
      {activeTab === 'invitaciones' && (
        <div className="flex-1 overflow-y-auto pr-1 space-y-6 custom-scrollbar">
          {/* Section: Active Invitations */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-teal-500" />
                Invitaciones Clínicas Emitidas ({invitations.length})
              </h3>
            </div>

            {invitations.length === 0 ? (
              <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
                <p className="text-xs text-slate-400">No has enviado ninguna invitación todavía. Explora el directorio de especialistas para enviar una propuesta.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {invitations.map((inv) => (
                  <div key={inv.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <h4 className="font-bold text-sm text-slate-800 dark:text-white">{inv.profName}</h4>
                          <p className="text-xs text-teal-600 dark:text-teal-400 font-semibold">{inv.profSpecialty}</p>
                        </div>
                        <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-lg border ${
                          inv.status === 'Aceptada' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' :
                          inv.status === 'Pendiente' ? 'bg-amber-500/10 text-amber-500 border-amber-500/30' :
                          'bg-slate-500/10 text-slate-400 border-slate-500/30'
                        }`}>
                          {inv.status}
                        </span>
                      </div>

                      <div className="space-y-1.5 my-3 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl">
                        <p><strong className="text-slate-800 dark:text-slate-100">Modalidad:</strong> {inv.type}</p>
                        <p><strong className="text-slate-800 dark:text-slate-100">Sede:</strong> {inv.location}</p>
                        <p><strong className="text-slate-800 dark:text-slate-100">Honorarios:</strong> {inv.compensation}</p>
                        <p className="italic text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-700">"{inv.message}"</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
                      <span>Emitida: {inv.createdAt}</span>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            const prof = professionals.find(p => p.id === inv.profId);
                            if (prof) handleOpenMessage(prof);
                          }}
                          className="px-3 py-1 bg-teal-600 text-white rounded-lg font-bold text-xs hover:bg-teal-500 transition-colors"
                        >
                          Abrir Chat
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section: Chat Threads */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-teal-500" />
                Conversaciones Activas
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {professionals.filter(p => chatMessages[p.id] && chatMessages[p.id].length > 0).map(prof => {
                const msgs = chatMessages[prof.id];
                const lastMsg = msgs[msgs.length - 1];
                return (
                  <div 
                    key={prof.id} 
                    onClick={() => handleOpenMessage(prof)}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 cursor-pointer hover:border-teal-400 dark:hover:border-teal-500 transition-all flex items-center gap-3.5 shadow-xs"
                  >
                    <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 border border-teal-500/30">
                      <img src={prof.avatar} alt={prof.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-xs text-slate-800 dark:text-white truncate">{prof.name}</h4>
                        <span className="text-[9px] text-slate-400 shrink-0">{lastMsg?.timestamp}</span>
                      </div>
                      <p className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold">{prof.specialty}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {lastMsg ? (lastMsg.sender === 'user' ? 'Tú: ' : '') + lastMsg.text : 'Iniciar conversación...'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: OFERTAS LABORALES PUBLICADAS */}
      {activeTab === 'ofertas' && (
        <div className="flex-1 overflow-y-auto pr-1 space-y-4 custom-scrollbar">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Vacantes e interconsultas quirúrgicas publicadas por tu clínica para captar especialistas.
            </p>
            <button 
              onClick={() => setShowNewJobModal(true)}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              Nueva Oferta
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {jobOffers.map(job => (
              <div key={job.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <span className="text-[10px] font-black uppercase px-2.5 py-1 bg-teal-500/10 text-teal-600 dark:text-teal-400 rounded-lg border border-teal-500/20">
                      {job.specialty}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">{job.postedAt}</span>
                  </div>

                  <h3 className="font-bold text-base text-slate-800 dark:text-white mb-1">{job.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-3">
                    <Building className="w-3.5 h-3.5 text-teal-500" /> {job.clinicBranch} • <span className="font-semibold text-slate-700 dark:text-slate-300">{job.modality}</span>
                  </p>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl mb-3 text-xs text-slate-600 dark:text-slate-300">
                    <p className="mb-2">{job.description}</p>
                    <p className="font-bold text-teal-600 dark:text-teal-400 flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5" /> {job.salary}
                    </p>
                  </div>

                  <div className="space-y-1 mb-4">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Requisitos:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {job.requirements.map((req, i) => (
                        <span key={i} className="text-[10.5px] px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md text-slate-600 dark:text-slate-300">
                          ✓ {req}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-teal-500" /> {job.applicantsCount} Especialistas postulados
                  </span>
                  <button 
                    onClick={() => {
                      setActiveTab('directorio');
                      setActiveFilter(job.specialty);
                    }}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold transition-colors"
                  >
                    Buscar Candidatos
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: SPECIALIST PROFILE DETAIL */}
      {/* ------------------------------------------------------------- */}
      <AnimatePresence>
        {selectedProfile && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto"
            onClick={() => setSelectedProfile(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800 my-auto"
            >
              {/* Header Cover Bar (Sticky Top) */}
              <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-emerald-800 px-6 py-4 flex items-center justify-between shrink-0 shadow-md">
                <div className="flex items-center gap-2 px-3 py-1 bg-black/25 backdrop-blur-xs rounded-full text-white text-xs font-semibold border border-white/10">
                  <User className="w-3.5 h-3.5 text-teal-300" />
                  <span>Expediente del Especialista</span>
                </div>
                <button 
                  onClick={() => setSelectedProfile(null)}
                  className="p-2 bg-black/30 hover:bg-black/50 text-white rounded-full transition-colors cursor-pointer"
                  title="Cerrar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Profile Main Content */}
              <div className="p-6 md:p-8 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
                
                {/* Profile Identity Card */}
                <div className="flex flex-col sm:flex-row gap-5 items-start bg-slate-50 dark:bg-slate-800/60 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-700/60">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-2xl border-2 border-teal-500/40 shadow-lg bg-slate-200 dark:bg-slate-800 overflow-hidden shrink-0">
                    <img 
                      src={selectedProfile.avatar} 
                      alt={selectedProfile.name} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0 w-full">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="min-w-0">
                        <h2 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                          <span>{selectedProfile.name}</span>
                          <CheckCircle className="w-5 h-5 text-teal-500 shrink-0" />
                        </h2>
                        <p className="text-teal-600 dark:text-teal-400 font-bold text-sm tracking-wide mt-0.5">{selectedProfile.specialty}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400 text-xs font-medium whitespace-nowrap">
                            <MapPin className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                            {selectedProfile.location}
                          </span>
                          <span className="text-slate-300 dark:text-slate-600 select-none">•</span>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            {selectedProfile.status}
                          </span>
                        </div>
                      </div>
                      
                      {/* Functional Action Buttons */}
                      <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
                        <button 
                          onClick={() => {
                            const prof = selectedProfile;
                            setSelectedProfile(null);
                            handleOpenMessage(prof);
                          }}
                          className="px-4 py-2.5 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-xs border border-slate-200 dark:border-slate-700 cursor-pointer whitespace-nowrap"
                        >
                          <MessageSquare className="w-4 h-4 text-teal-500" /> Mensaje
                        </button>

                        <button 
                          onClick={() => {
                            const prof = selectedProfile;
                            setSelectedProfile(null);
                            handleOpenInvite(prof);
                          }}
                          className="px-4 sm:px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer whitespace-nowrap"
                        >
                          <Briefcase className="w-4 h-4" /> Invitar a la Clínica
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Left Column (2 cols) */}
                  <div className="md:col-span-2 space-y-6">
                    <section>
                      <h3 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                        <User className="w-4 h-4 text-teal-600" /> Acerca del Especialista
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                        {selectedProfile.about}
                      </p>
                    </section>

                    <section>
                      <h3 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                        <Award className="w-4 h-4 text-teal-600" /> Habilidades Clínicas & Procedimientos
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedProfile.skills.map((skill: string, i: number) => (
                          <span key={i} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </section>

                    <section>
                      <h3 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-teal-600" /> Formación y Certificaciones
                      </h3>
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{selectedProfile.education}</p>
                        <div className="space-y-1">
                          {selectedProfile.certifications.map((cert, idx) => (
                            <p key={idx} className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                              <Check className="w-3.5 h-3.5 text-teal-500 shrink-0" /> {cert}
                            </p>
                          ))}
                        </div>
                      </div>
                    </section>
                    
                    <section>
                      <h3 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                        <Download className="w-4 h-4 text-teal-600" /> Curriculum Vitae (Expediente)
                      </h3>
                      <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-white dark:bg-slate-700 rounded-xl shadow-xs text-teal-600 dark:text-teal-400">
                            <FileText className="w-6 h-6" />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs">CV_{selectedProfile.name.replace(/\s+/g, '_')}_PerioDash.pdf</h4>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Expediente Verificado • Actualizado 2026</p>
                          </div>
                        </div>
                        <button 
                          onClick={(e) => handleDownloadCV(selectedProfile, e)}
                          className="px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:text-teal-600 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                        >
                          <Download className="w-3.5 h-3.5" /> Descargar
                        </button>
                      </div>
                    </section>
                  </div>

                  {/* Right Column (Widget info) */}
                  <div className="space-y-4">
                    <div className="bg-slate-50 dark:bg-slate-800/80 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 space-y-3.5">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl shadow-xs text-amber-500">
                          <Star className="w-4 h-4 fill-current" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Calificación Pacientes</p>
                          <p className="font-black text-slate-800 dark:text-white text-base">{selectedProfile.rating} <span className="text-xs font-medium text-slate-400">/ 5.0 ({selectedProfile.reviews})</span></p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl shadow-xs text-teal-500">
                          <Clock className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Experiencia Clínica</p>
                          <p className="font-black text-slate-800 dark:text-white text-xs">{selectedProfile.experience}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl shadow-xs text-emerald-500">
                          <Phone className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Contacto Directo</p>
                          <p className="font-black text-slate-800 dark:text-white text-xs">{selectedProfile.phone}</p>
                        </div>
                      </div>

                      <button 
                        onClick={() => handleSendViaWhatsApp(selectedProfile)}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5" /> Abrir en WhatsApp
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ------------------------------------------------------------- */}
      {/* MODAL: CHAT / MENSAJERÍA DIRECTA CON EL ESPECIALISTA */}
      {/* ------------------------------------------------------------- */}
      <AnimatePresence>
        {activeChatProf && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto"
            onClick={() => setActiveChatProf(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-xl h-[85vh] max-h-[680px] overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800 my-auto"
            >
              {/* Chat Header */}
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl overflow-hidden border-2 border-teal-500/40 bg-slate-200 shrink-0">
                    <img src={activeChatProf.avatar} alt={activeChatProf.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-1.5">
                      {activeChatProf.name}
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    </h3>
                    <p className="text-[11px] text-teal-600 dark:text-teal-400 font-semibold">{activeChatProf.specialty} • En línea</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleSendViaWhatsApp(activeChatProf)}
                    className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl transition-colors"
                    title="Chatear por WhatsApp"
                  >
                    <Phone className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setActiveChatProf(null)}
                    className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Chat Quick Chips */}
              <div className="px-4 py-2 bg-slate-100/70 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto hide-scrollbar">
                <span className="text-[10px] font-bold text-slate-400 shrink-0 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-teal-500" /> Plantillas:
                </span>
                {[
                  "¿Disponibilidad para cirugía esta semana?",
                  "Interconsulta de caso periodontal complejo",
                  "Coordinar entrevista para vacante en clínica",
                  "¿Cuál es tu tarifa por procedimiento?"
                ].map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleQuickMessage(chip)}
                    className="px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-900/30 text-slate-600 dark:text-slate-300 text-[10.5px] rounded-lg border border-slate-200 dark:border-slate-700 whitespace-nowrap transition-colors"
                  >
                    {chip}
                  </button>
                ))}
              </div>

              {/* Messages Body */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {(chatMessages[activeChatProf.id] || []).map((msg) => {
                  const isUser = msg.sender === 'user';
                  return (
                    <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs ${
                        isUser 
                          ? 'bg-teal-600 text-white rounded-br-none shadow-sm' 
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-none border border-slate-200 dark:border-slate-700'
                      }`}>
                        <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                        <span className={`text-[9px] block text-right mt-1 ${isUser ? 'text-teal-200' : 'text-slate-400'}`}>
                          {msg.timestamp}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Chat Input */}
              <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2">
                <input 
                  type="text"
                  placeholder={`Escribe un mensaje a ${activeChatProf.name}...`}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-teal-500 dark:text-white"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!chatInput.trim()}
                  className="p-2.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white rounded-xl shadow-md transition-all cursor-pointer shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ------------------------------------------------------------- */}
      {/* MODAL: INVITACIÓN CLÍNICA / OFERTA LABORAL FORMAL */}
      {/* ------------------------------------------------------------- */}
      <AnimatePresence>
        {activeInviteProf && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto"
            onClick={() => setActiveInviteProf(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800 my-auto"
            >
              <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-teal-600/10 via-transparent to-transparent flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                    Enviar Invitación a {activeInviteProf.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Propuesta formal de interconsulta, sustitución o contratación para tu clínica.
                  </p>
                </div>
                <button 
                  onClick={() => setActiveInviteProf(null)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Tipo de Propuesta</label>
                  <select 
                    value={inviteForm.type}
                    onChange={(e) => setInviteForm({ ...inviteForm, type: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:border-teal-500"
                  >
                    <option value="Interconsulta Quirúrgica por Caso">Interconsulta Quirúrgica por Caso Clínico</option>
                    <option value="Incorporación a Plantilla (Tiempo Completo)">Incorporación a Plantilla (Tiempo Completo)</option>
                    <option value="Incorporación a Plantilla (Medio Tiempo)">Incorporación a Plantilla (Medio Tiempo / Turnos)</option>
                    <option value="Sustitución / Guardia de Urgencia">Sustitución Temporal / Guardia</option>
                    <option value="Alianza / Red Multidisciplinaria">Alianza / Red Multidisciplinaria</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Sede / Sucursal</label>
                    <input 
                      type="text"
                      value={inviteForm.location}
                      onChange={(e) => setInviteForm({ ...inviteForm, location: e.target.value })}
                      placeholder="Ej. Sede Centro, CDMX"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Esquema de Honorarios Propuesto</label>
                    <input 
                      type="text"
                      value={inviteForm.compensation}
                      onChange={(e) => setInviteForm({ ...inviteForm, compensation: e.target.value })}
                      placeholder="Ej. 50% por procedimiento / $30k mes"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Fecha / Horario Propuesto</label>
                  <input 
                    type="text"
                    value={inviteForm.date}
                    onChange={(e) => setInviteForm({ ...inviteForm, date: e.target.value })}
                    placeholder="Ej. Martes y Jueves a convenir, o inicio 1ro del mes"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Mensaje o Detalles del Caso</label>
                  <textarea 
                    rows={4}
                    value={inviteForm.message}
                    onChange={(e) => setInviteForm({ ...inviteForm, message: e.target.value })}
                    placeholder="Describe los requerimientos del caso, tecnología disponible en clínica (RX, escáner, instrumental) y objetivos."
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:border-teal-500 resize-none"
                  ></textarea>
                </div>
              </div>

              <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2.5 bg-slate-50 dark:bg-slate-800">
                <button 
                  onClick={() => setActiveInviteProf(null)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl font-bold transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSubmitInvitation}
                  className="px-6 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-bold shadow-md transition-all flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Enviar Invitación Formal
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ------------------------------------------------------------- */}
      {/* MODAL: PUBLICAR NUEVA VACANTE / OFERTA DE EMPLEO */}
      {/* ------------------------------------------------------------- */}
      <AnimatePresence>
        {showNewJobModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto"
            onClick={() => setShowNewJobModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800 my-auto"
            >
              <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2">
                    <Building className="w-5 h-5 text-teal-600" />
                    Publicar Nueva Oferta de Empleo
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Tu vacante será visible para todos los especialistas en la red PerioDash.
                  </p>
                </div>
                <button 
                  onClick={() => setShowNewJobModal(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateJobOffer} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Título de la Oferta / Puesto</label>
                  <input 
                    type="text"
                    required
                    value={newJobForm.title}
                    onChange={(e) => setNewJobForm({ ...newJobForm, title: e.target.value })}
                    placeholder="Ej. Cirujano Maxilofacial para Sede Norte"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:border-teal-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Especialidad Requerida</label>
                    <select 
                      value={newJobForm.specialty}
                      onChange={(e) => setNewJobForm({ ...newJobForm, specialty: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:border-teal-500"
                    >
                      <option value="Odontología General">Odontología General Integral</option>
                      <option value="Periodoncia">Periodoncia e Implantes</option>
                      <option value="Ortodoncia">Ortodoncia y Ortopedia</option>
                      <option value="Endodoncia">Endodoncia Microscópica</option>
                      <option value="Odontopediatría">Odontopediatría</option>
                      <option value="Rehabilitación Oral">Rehabilitación Oral</option>
                      <option value="Cirugía Maxilofacial">Cirugía Maxilofacial</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Modalidad</label>
                    <select 
                      value={newJobForm.modality}
                      onChange={(e) => setNewJobForm({ ...newJobForm, modality: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:border-teal-500"
                    >
                      <option value="Por Honorarios / Casos">Por Honorarios / Casos</option>
                      <option value="Tiempo Completo">Tiempo Completo</option>
                      <option value="Medio Tiempo">Medio Tiempo</option>
                      <option value="Turnos / Guardias">Turnos / Guardias</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Sede / Sucursal</label>
                    <input 
                      type="text"
                      value={newJobForm.clinicBranch}
                      onChange={(e) => setNewJobForm({ ...newJobForm, clinicBranch: e.target.value })}
                      placeholder="Ej. Sede Principal Centro"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Rango Salarial / Honorarios</label>
                    <input 
                      type="text"
                      value={newJobForm.salary}
                      onChange={(e) => setNewJobForm({ ...newJobForm, salary: e.target.value })}
                      placeholder="Ej. 50% por cirugía ó $30,000/mes"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Descripción del Puesto</label>
                  <textarea 
                    rows={3}
                    value={newJobForm.description}
                    onChange={(e) => setNewJobForm({ ...newJobForm, description: e.target.value })}
                    placeholder="Detalla las actividades, tipo de pacientes y equipamiento disponible en la clínica..."
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:border-teal-500 resize-none"
                  ></textarea>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Requisitos (separados por coma)</label>
                  <input 
                    type="text"
                    value={newJobForm.requirements}
                    onChange={(e) => setNewJobForm({ ...newJobForm, requirements: e.target.value })}
                    placeholder="Ej. Cédula de especialista, Manejo de piezoeléctrico, 3 años de experiencia"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:border-teal-500"
                  />
                </div>

                <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2.5 bg-slate-50 dark:bg-slate-800 -mx-6 -mb-6 mt-6">
                  <button 
                    type="button"
                    onClick={() => setShowNewJobModal(false)}
                    className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl font-bold transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="px-6 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-bold shadow-md transition-all flex items-center gap-2"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Publicar Oferta
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ------------------------------------------------------------- */}
      {/* MODAL: SUBIR Y PUBLICAR MI PERFIL PROFESIONAL */}
      {/* ------------------------------------------------------------- */}
      <AnimatePresence>
        {showMyProfile && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto"
            onClick={() => setShowMyProfile(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800 my-auto"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-teal-900/20 via-slate-900/40 to-transparent flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-teal-500/20 text-teal-400 rounded-2xl border border-teal-500/30">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                      Subir y Publicar Mi Perfil Profesional
                      {myProfileData.isPublished ? (
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-md border border-emerald-500/30">
                          Publicado en Directorio
                        </span>
                      ) : (
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded-md border border-amber-500/30">
                          Borrador Privado
                        </span>
                      )}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Completa tu expediente clínico para ser contactado por clínicas y especialistas de la red.
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowMyProfile(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-white rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Scroll Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs custom-scrollbar">
                
                {/* SECTION 1: FOTO DE PERFIL / AVATAR & CV */}
                <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                  <h3 className="font-bold text-slate-800 dark:text-white uppercase tracking-wider text-[11px] flex items-center gap-2">
                    <User className="w-4 h-4 text-teal-500" />
                    1. Fotografía y Currículum Vitae
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                    {/* Avatar Upload */}
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 rounded-2xl border-2 border-teal-500/40 bg-slate-200 dark:bg-slate-800 overflow-hidden shrink-0 shadow-md flex items-center justify-center relative group">
                        {myProfileData.avatar ? (
                          <img src={myProfileData.avatar} alt={myProfileData.name} className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-8 h-8 text-slate-400" />
                        )}
                      </div>
                      <div className="space-y-1.5 flex-1">
                        <label className="block font-bold text-slate-700 dark:text-slate-300">Foto del Especialista</label>
                        <div className="flex flex-wrap gap-2 items-center">
                          <label className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-[11px] rounded-xl cursor-pointer flex items-center gap-1.5 transition-colors shadow-xs">
                            <Upload className="w-3.5 h-3.5" /> Subir Foto
                            <input type="file" accept="image/*" onChange={handleAvatarFileChange} className="hidden" />
                          </label>
                          {myProfileData.avatar && (
                            <button 
                              type="button" 
                              onClick={() => setMyProfileData(prev => ({ ...prev, avatar: "" }))}
                              className="px-2.5 py-1.5 text-rose-500 hover:bg-rose-500/10 rounded-xl text-[11px] font-bold"
                            >
                              Eliminar
                            </button>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400">JPG o PNG hasta 3MB. Rostro visible con vestimenta clínica.</p>
                      </div>
                    </div>

                    {/* CV Document Upload */}
                    <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between h-full">
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <FileText className="w-4 h-4 text-teal-500" /> Curriculum Vitae (PDF)
                        </label>
                        {myProfileData.cvFileName && (
                          <span className="text-[9px] font-black uppercase text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">Cargado</span>
                        )}
                      </div>
                      <p className="text-[10.5px] text-slate-400 truncate mb-2">
                        {myProfileData.cvFileName ? myProfileData.cvFileName : "Aún no has adjuntado tu archivo de CV."}
                      </p>
                      <label className="w-full py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold text-[11px] rounded-xl cursor-pointer flex items-center justify-center gap-1.5 transition-colors">
                        <Upload className="w-3.5 h-3.5 text-teal-500" />
                        {myProfileData.cvFileName ? "Cambiar Archivo de CV" : "Adjuntar CV (PDF / DOC)"}
                        <input type="file" accept=".pdf,.doc,.docx" onChange={handleCVFileChange} className="hidden" />
                      </label>
                    </div>
                  </div>
                </div>

                {/* SECTION 2: DATOS PERSONALES & CONTACTO */}
                <div className="space-y-3">
                  <h3 className="font-bold text-slate-800 dark:text-white uppercase tracking-wider text-[11px] flex items-center gap-2">
                    <Award className="w-4 h-4 text-teal-500" />
                    2. Información Profesional & Especialidad
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nombre Completo con Título</label>
                      <input 
                        type="text" 
                        value={myProfileData.name}
                        onChange={(e) => setMyProfileData({...myProfileData, name: e.target.value})}
                        placeholder="Ej. Dr. Ignacio León"
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:border-teal-500 dark:text-white font-medium"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Especialidad Principal</label>
                      <select 
                        value={myProfileData.specialty}
                        onChange={(e) => setMyProfileData({...myProfileData, specialty: e.target.value})}
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:border-teal-500 dark:text-white font-medium"
                      >
                        <option value="Odontología General Integral">Odontología General Integral</option>
                        <option value="Odontología General y Práctica Privada">Odontología General y Práctica Privada</option>
                        <option value="Odontología General y Preventiva">Odontología General y Preventiva</option>
                        <option value="Periodoncia e Implantología Oral">Periodoncia e Implantología Oral</option>
                        <option value="Ortodoncia y Ortopedia Maxilofacial">Ortodoncia y Ortopedia Maxilofacial</option>
                        <option value="Endodoncia Microscópica">Endodoncia Microscópica</option>
                        <option value="Odontopediatría Integral">Odontopediatría Integral</option>
                        <option value="Rehabilitación Oral y Estética">Rehabilitación Oral y Estética</option>
                        <option value="Cirugía Bucal y Maxilofacial">Cirugía Bucal y Maxilofacial</option>
                        <option value="Odontología Integral y Diagnóstico 3D">Odontología Integral y Diagnóstico 3D</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Cédula / Matrícula Profesional</label>
                      <input 
                        type="text" 
                        value={myProfileData.licenseNumber || ""}
                        onChange={(e) => setMyProfileData({...myProfileData, licenseNumber: e.target.value})}
                        placeholder="Ej. CED. PROF. 11982734"
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:border-teal-500 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Años de Experiencia Clínica</label>
                      <input 
                        type="text" 
                        value={myProfileData.experience || ""}
                        onChange={(e) => setMyProfileData({...myProfileData, experience: e.target.value})}
                        placeholder="Ej. 11 años"
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:border-teal-500 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Ciudad y Sede</label>
                      <input 
                        type="text" 
                        value={myProfileData.location}
                        onChange={(e) => setMyProfileData({...myProfileData, location: e.target.value})}
                        placeholder="Ej. CDMX - Sede Principal"
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:border-teal-500 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Disponibilidad Actual</label>
                      <select 
                        value={myProfileData.status}
                        onChange={(e) => setMyProfileData({...myProfileData, status: e.target.value})}
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:border-teal-500 dark:text-white font-medium"
                      >
                        <option value="Disponible">Disponible para interconsultas quirúrgicas</option>
                        <option value="Buscando Oportunidades">Buscando nuevas oportunidades laborales</option>
                        <option value="En Clínica (Medio Tiempo)">En clínica (Disponible turnos / medio tiempo)</option>
                        <option value="Consultor por Caso">Consultor externo por caso clínico</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Teléfono / WhatsApp</label>
                      <input 
                        type="text" 
                        value={myProfileData.phone || ""}
                        onChange={(e) => setMyProfileData({...myProfileData, phone: e.target.value})}
                        placeholder="Ej. +52 55 4321 9876"
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:border-teal-500 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Correo Electrónico de Contacto</label>
                      <input 
                        type="email" 
                        value={myProfileData.email || ""}
                        onChange={(e) => setMyProfileData({...myProfileData, email: e.target.value})}
                        placeholder="Ej. dr.ignacio@clinica.com"
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:border-teal-500 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION 3: RESUMEN PROFESIONAL */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Resumen Profesional y Enfoque Quirúrgico</label>
                  <textarea 
                    rows={3}
                    value={myProfileData.about}
                    onChange={(e) => setMyProfileData({...myProfileData, about: e.target.value})}
                    placeholder="Describe tu trayectoria, casos destacados y filosofía clínica..."
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:border-teal-500 resize-none dark:text-white"
                  ></textarea>
                </div>

                {/* SECTION 4: HABILIDADES & PROCEDIMIENTOS CLÍNICOS */}
                <div className="space-y-2">
                  <label className="block font-bold text-slate-700 dark:text-slate-300">
                    Habilidades y Procedimientos Clínicos (Haz clic para seleccionar o añadir)
                  </label>
                  
                  {/* Quick suggested chips */}
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      "Odontología General",
                      "Operatoria Dental (Resinas)",
                      "Profilaxis & Detartraje",
                      "Blanqueamiento Dental",
                      "Prótesis Fija / Removible",
                      "Urgencias Odontológicas",
                      "Cirugía Guiada 3D",
                      "Regeneración Ósea Guiada",
                      "Implantes Inmediatos",
                      "Injertos Mucogingivales",
                      "Láser Diodo",
                      "Diagnóstico CBCT",
                      "Elevación de Seno",
                      "Invisalign Provider",
                      "Microscopía Zeiss",
                      "Sedación Consciente",
                      "Rehabilitación Digital CAD/CAM"
                    ].map((chip) => {
                      const isSelected = myProfileData.skills.includes(chip);
                      return (
                        <button
                          key={chip}
                          type="button"
                          onClick={() => handleToggleSkill(chip)}
                          className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                            isSelected 
                              ? "bg-teal-600 text-white border-teal-500 shadow-xs" 
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-teal-500/50"
                          }`}
                        >
                          {isSelected ? `✓ ${chip}` : `+ ${chip}`}
                        </button>
                      );
                    })}
                  </div>

                  <input 
                    type="text" 
                    placeholder="Otras habilidades separadas por comas (ej. Bichectomía, Diseño de Sonrisa)..."
                    value={myProfileData.skills.join(', ')}
                    onChange={(e) => setMyProfileData({...myProfileData, skills: e.target.value.split(',').map(s=>s.trim()).filter(Boolean)})}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:border-teal-500 dark:text-white mt-2"
                  />
                </div>

                {/* SECTION 5: FORMACIÓN & CERTIFICACIONES */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Formación Académica</label>
                    <input 
                      type="text" 
                      value={myProfileData.education || ""}
                      onChange={(e) => setMyProfileData({...myProfileData, education: e.target.value})}
                      placeholder="Ej. Especialidad en Periodoncia (UNAM)"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:border-teal-500 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Certificaciones y Membresías (por comas)</label>
                    <input 
                      type="text" 
                      value={(myProfileData.certifications || []).join(', ')}
                      onChange={(e) => setMyProfileData({...myProfileData, certifications: e.target.value.split(',').map(c=>c.trim()).filter(Boolean)})}
                      placeholder="Ej. ITI Member, Certificación Straumann"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:border-teal-500 dark:text-white"
                    />
                  </div>
                </div>

                {/* SECTION 6: VISIBILITY NOTICE & SWITCH */}
                <div className="p-4 bg-teal-500/10 border border-teal-500/30 rounded-2xl flex items-start gap-3">
                  <div className="p-2 bg-teal-500/20 text-teal-400 rounded-xl shrink-0 mt-0.5">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="text-slate-700 dark:text-slate-300 space-y-1 flex-1">
                    <h5 className="font-bold text-xs text-slate-800 dark:text-white">Visibilidad en la Red Clínica PerioDash</h5>
                    <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                      Al pulsar <strong>"Subir y Publicar en la Bolsa"</strong>, tu perfil se agregará inmediatamente al Directorio de Especialistas. Podrás pausar o retirar tu publicación cuando lo desees.
                    </p>
                  </div>
                </div>

              </div>

              {/* Modal Footer Controls */}
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800">
                <div>
                  {myProfileData.isPublished && (
                    <button 
                      type="button"
                      onClick={() => handleSaveAndPublishProfile(false)}
                      className="px-3.5 py-2 text-rose-500 hover:bg-rose-500/10 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                    >
                      Pausar / Retirar de la Bolsa
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2.5 ml-auto">
                  <button 
                    type="button"
                    onClick={() => setShowMyProfile(false)}
                    className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl font-bold transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  
                  <button 
                    type="button"
                    onClick={() => handleSaveAndPublishProfile(false)}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                  >
                    Guardar Borrador
                  </button>

                  <button 
                    type="button"
                    onClick={() => handleSaveAndPublishProfile(true)}
                    className="px-6 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    Subir y Publicar en la Bolsa
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
