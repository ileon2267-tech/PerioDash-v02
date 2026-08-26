import React, { useState } from "react";
import Logo from "./Logo";
import { 
  Search, 
  MapPin, 
  Clock, 
  Calendar, 
  MessageSquare, 
  ShieldAlert, 
  User, 
  Star, 
  Award, 
  Sparkles, 
  BookOpen, 
  LogOut, 
  Heart, 
  Activity, 
  Grid,
  FileCheck2,
  CheckCircle,
  HelpCircle,
  Send,
  Stethoscope
} from "lucide-react";
import { ClinicalUser, Appointment } from "../types";

interface PatientPortalProps {
  activeUser: ClinicalUser;
  onLogout: () => void;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  allAppointments: Appointment[];
  onAddAppointment: (app: Appointment) => void;
}

const CLINICS_DIRECTORY = [
  {
    id: "clinic-1",
    name: "PerioClinic Providencia",
    address: "Av. Providencia 1040, Of. 602, Santiago",
    rating: 4.9,
    reviews: 124,
    phone: "+56 2 2481 9000",
    specialties: ["Periodoncia Avanzada", "Implantes", "Rehabilitación Oral"],
    image: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=300&q=80"
  },
  {
    id: "clinic-2",
    name: "Centro Dental Las Condes",
    address: "Av. Apoquindo 4500, Las Condes, Santiago",
    rating: 4.8,
    reviews: 98,
    phone: "+56 2 2915 3200",
    specialties: ["Odontología General", "Estética Dental", "Endodoncia"],
    image: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=300&q=80"
  },
  {
    id: "clinic-3",
    name: "Clínica Dental Vitacura",
    address: "Camino El Huinganal 2900, Vitacura",
    rating: 5.0,
    reviews: 64,
    phone: "+56 2 2307 4100",
    specialties: ["Ortodoncia Invisible", "Odontopediatría", "Cirugía Maxilofacial"],
    image: "https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?auto=format&fit=crop&w=300&q=80"
  }
];

const CLINICIANS_DIRECTORY = [
  {
    id: "doc-1",
    name: "Dr. Ignacio León",
    specialty: "Especialista en Periodoncia e Implantología",
    clinic: "PerioClinic Providencia",
    rating: 4.9,
    experience: "12 años de trayectoria",
    availability: "Mañana y tarde",
    avatar: "IL"
  },
  {
    id: "doc-2",
    name: "Dra. Camila Silva",
    specialty: "Odontopediatría y Estética",
    clinic: "Centro Dental Las Condes",
    rating: 4.8,
    experience: "8 años de trayectoria",
    availability: "Tarde de Lunes a Jueves",
    avatar: "CS"
  },
  {
    id: "doc-3",
    name: "Dr. Sebastián Prado",
    specialty: "Cirujano Maxilofacial y Rehabilitador",
    clinic: "Clínica Dental Vitacura",
    rating: 5.0,
    experience: "15 años de trayectoria",
    availability: "Solo viernes por la mañana",
    avatar: "SP"
  }
];

export default function PatientPortal({ 
  activeUser, 
  onLogout, 
  allAppointments, 
  onAddAppointment 
}: PatientPortalProps) {
  
  const getTomorrowStr = (): string => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClinician, setSelectedClinician] = useState("");
  const [selectedDate, setSelectedDate] = useState(getTomorrowStr);
  const [selectedTime, setSelectedTime] = useState("10:00");
  const [selectedTreatment, setSelectedTreatment] = useState("Control Dental General");
  const [formSuccess, setFormSuccess] = useState(false);
  
  // Local active chat with Patient's personalized Assistant Dentito-Lite
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<Array<{role: "user" | "assistant", content: string}>>([
    {
      role: "assistant",
      content: `¡Hola, ${activeUser.name}! Soy Dentito 😊, tu asistente virtual. Estoy aquí para ayudarte a agendar horas o resolver dudas sobre tu salud dental. ¿En qué te puedo ayudar hoy?`
    }
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Filter clinician/clinic search
  const filteredClinicians = CLINICIANS_DIRECTORY.filter(doc => 
    doc.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    doc.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.clinic.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredClinics = CLINICS_DIRECTORY.filter(clinic => 
    clinic.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    clinic.specialties.some(s => s.toLowerCase().includes(searchQuery.toLowerCase())) ||
    clinic.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Client's specific upcoming appointments linked to their registered login email
  const myAppointments = allAppointments.filter(app => 
    app.patientName.toLowerCase() === activeUser.name.toLowerCase() ||
    app.patientId === "pat-client" ||
    (app.treatment.toLowerCase().includes("diagnóstico") && activeUser.profile === "cliente")
  );

  const handleBookAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClinician) return;

    const newApp: Appointment = {
      id: `app-client-${Date.now()}`,
      patientId: "pat-client",
      patientName: activeUser.name,
      date: selectedDate,
      time: selectedTime,
      treatment: `${selectedTreatment} - [Agendado Online]`,
      status: "Pending",
      box: "Consulta General"
    };

    onAddAppointment(newApp);
    setFormSuccess(true);
    
    setTimeout(() => {
      setFormSuccess(false);
    }, 4000);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    const userMsg = chatInput.trim();
    setChatInput("");
    setChatMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setIsChatLoading(true);

    try {
      const response = await fetch("/api/dentito", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            ...chatMessages.map(m => ({ role: m.role, content: m.content })),
            { role: "user", content: userMsg }
          ],
          context: `Paciente: ${activeUser.name}. Actúa súper amable y simple. Usa lenguaje coloquial y no médico. Recomienda cuidar su sonrisa.`
        })
      });

      const data = await response.json();
      if (data.text) {
        setChatMessages(prev => [...prev, { role: "assistant", content: data.text }]);
      } else {
        throw new Error(data.error || "Ocurrió un error");
      }
    } catch (e) {
      setTimeout(() => {
        setChatMessages(prev => [
          ...prev, 
          { 
            role: "assistant", 
            content: `Lo siento, mi conexión está un poco intermitente. Recuerda cepillarte los dientes siempre después de comer ✨. Si quieres pedir hora, usa el calendario aquí al ladito.` 
          }
        ]);
      }, 500);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="min-h-screen font-sans bg-slate-50 text-slate-800 pb-12 relative overflow-hidden">
      {/* Soft warm background gradients */}
      <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden bg-gradient-to-b from-teal-50/50 to-white">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-teal-200/40 blur-[120px] rounded-full" />
        <div className="absolute bottom-[20%] right-[-10%] w-[50%] h-[50%] bg-blue-200/30 blur-[130px] rounded-full" />
      </div>

      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-white/50 px-4 sm:px-6 py-3 sm:py-4 shadow-sm">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-teal-500/20">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-display font-black text-xl leading-none text-slate-800">Mi Sonrisa</h1>
              <span className="text-[10px] text-teal-600 font-bold uppercase tracking-widest">Portal de Pacientes</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-3 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-100">
              <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-sm">
                {activeUser.name.charAt(0)}
              </div>
              <div className="text-left pr-2">
                <p className="text-xs font-bold text-slate-800 leading-none">{activeUser.name}</p>
                <span className="text-[10px] font-medium text-slate-500">Paciente VIP</span>
              </div>
            </div>

            <button
              onClick={onLogout}
              className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-red-500 cursor-pointer transition-all flex items-center gap-2 font-bold text-xs shadow-sm"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden md:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 lg:space-y-8 mt-2 sm:mt-4">
        
        {/* Welcome Section */}
        <div className="bg-white rounded-2xl sm:rounded-[2rem] border border-white shadow-xl shadow-slate-200/50 p-5 sm:p-8 md:p-10 flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-64 h-64 bg-gradient-to-br from-teal-100/50 to-emerald-50/50 rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-700" />
          
          <div className="space-y-4 max-w-2xl text-center md:text-left relative z-10">
            <h2 className="text-3xl md:text-4xl font-display font-black text-slate-800 tracking-tight">
              ¡Qué bueno verte, <span className="text-teal-600">{activeUser.name}</span>! 👋
            </h2>
            <p className="text-sm md:text-base text-slate-500 leading-relaxed max-w-xl mx-auto md:mx-0">
              Bienvenido a tu portal personal. Aquí puedes ver tus próximas citas, buscar un especialista o pedir consejos a nuestro asistente virtual Dentito. ¡Cuidar tu sonrisa nunca fue tan fácil!
            </p>
          </div>
          
          <div className="flex gap-4 shrink-0">
            <div className="bg-gradient-to-b from-teal-50 to-white border border-teal-100 p-5 rounded-2xl flex flex-col items-center justify-center text-center w-32 shadow-sm">
              <Heart className="w-8 h-8 text-rose-400 mb-2 fill-rose-100" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tu Salud</span>
              <h4 className="text-lg font-black text-slate-800">Excelente</h4>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          
          {/* Main Content Area */}
          <div className="lg:col-span-8 space-y-6 lg:space-y-8">
            
            {/* BOOKING SECTION */}
            <div className="bg-white rounded-3xl p-4 sm:p-6 lg:p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
              <div className="mb-6">
                <h3 className="text-xl font-display font-black text-slate-800 flex items-center gap-3">
                  <Calendar className="w-6 h-6 text-teal-500 bg-teal-50 p-1 rounded-lg" />
                  Agendar una nueva cita
                </h3>
                <p className="text-sm text-slate-500 mt-1">Elige a tu especialista y un horario que te acomode.</p>
              </div>

              {formSuccess && (
                <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm rounded-2xl flex items-start gap-3 shadow-sm">
                  <CheckCircle className="w-5 h-5 shrink-0 text-emerald-500" />
                  <div>
                    <strong className="font-bold block">¡Reserva enviada con éxito!</strong>
                    Pronto nos comunicaremos contigo para confirmar los detalles.
                  </div>
                </div>
              )}

              <form onSubmit={handleBookAppointment} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">¿Con quién te gustaría atenderte?</label>
                  <select
                    value={selectedClinician}
                    onChange={(e) => setSelectedClinician(e.target.value)}
                    className="w-full text-sm p-4 bg-slate-50/50 border border-slate-200 rounded-2xl outline-none text-slate-700 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all font-medium"
                    required
                  >
                    <option value="">Selecciona un doctor...</option>
                    {CLINICIANS_DIRECTORY.map(doc => (
                      <option key={doc.id} value={doc.id}>{doc.name} - {doc.specialty}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">¿Qué necesitas?</label>
                  <select
                    value={selectedTreatment}
                    onChange={(e) => setSelectedTreatment(e.target.value)}
                    className="w-full text-sm p-4 bg-slate-50/50 border border-slate-200 rounded-2xl outline-none text-slate-700 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all font-medium"
                  >
                    <option value="Control Dental General">Revisión General / Presupuesto</option>
                    <option value="Limpieza Dental">Limpieza Dental</option>
                    <option value="Blanqueamiento">Blanqueamiento Dental</option>
                    <option value="Evaluación Ortodoncia">Evaluación para Frenillos</option>
                    <option value="Urgencia / Dolor">Urgencia / Tengo dolor</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">¿Qué día prefieres?</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full text-sm p-4 bg-slate-50/50 border border-slate-200 rounded-2xl outline-none text-slate-700 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all font-medium"
                    required
                  />
                </div>

                <div className="space-y-2 md:col-span-2 mt-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Horarios Disponibles</label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2">
                    {["09:00", "10:00", "11:00", "12:00", "15:00", "16:30", "18:00"].map(hr => {
                      const activeReservationsCount = allAppointments.filter(
                        app => app.date === selectedDate && app.time === hr && app.status !== "Cancelled"
                      ).length;
                      const trulyOccupied = activeReservationsCount > 0;

                      return (
                        <button
                          type="button"
                          key={hr}
                          disabled={trulyOccupied}
                          onClick={() => setSelectedTime(hr)}
                          className={`p-3 w-full text-sm font-bold rounded-2xl border transition-all ${
                            trulyOccupied 
                              ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-50" 
                              : selectedTime === hr 
                                ? "bg-teal-600 text-white border-teal-600 shadow-md shadow-teal-500/20 scale-105"
                                : "bg-white border-slate-200 text-slate-600 hover:border-teal-400 hover:shadow-sm cursor-pointer"
                          }`}
                        >
                          <span className="block">{hr}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="md:col-span-2 pt-4">
                  <button
                    type="submit"
                    className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm py-4 px-8 rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xl shadow-slate-900/10 hover:shadow-slate-900/20"
                  >
                    Confirmar mi hora
                    <Sparkles className="w-4 h-4 text-amber-300" />
                  </button>
                </div>
              </form>
            </div>

            {/* UPCOMING APPOINTMENTS */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-3xl p-4 sm:p-6 lg:p-8 border border-teal-100">
              <h3 className="text-xl font-display font-black text-slate-800 mb-6 flex items-center gap-3">
                <Clock className="w-6 h-6 text-teal-600" />
                Mis Próximas Horas
              </h3>

              {myAppointments.length === 0 ? (
                <div className="p-8 text-center bg-white/50 border border-dashed border-teal-200 rounded-2xl text-slate-500 font-medium">
                  <Calendar className="w-10 h-10 mx-auto text-teal-200 mb-3" />
                  <p>No tienes citas agendadas por el momento.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {myAppointments.map((app) => (
                    <div 
                      key={app.id}
                      className="p-5 bg-white rounded-2xl border border-teal-100 shadow-sm flex items-start gap-4"
                    >
                      <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-full flex flex-col items-center justify-center shrink-0">
                        <span className="text-[10px] font-bold uppercase">{app.date.split("-")[2]}</span>
                        <span className="text-sm font-black leading-none">{app.time}</span>
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 leading-tight">
                          {app.treatment.replace(" - [Agendado Online]", "").replace(" - [Solicitado por Portal de Cliente]", "")}
                        </p>
                        <p className="text-xs text-slate-500 mt-1 capitalize">{new Date(app.date).toLocaleDateString('es-ES', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                        <span className="inline-block mt-2 text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full">
                          {app.status === "Pending" ? "Verificando" : "Confirmada"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* CLINICS AND PROFESSIONALS DIRECTORY */}
            <div className="space-y-6 pt-4">
              <h3 className="text-xl font-display font-black text-slate-800 flex items-center gap-3">
                <MapPin className="w-6 h-6 text-rose-500 bg-rose-50 p-1 rounded-lg" />
                Red de Clínicas y Especialistas
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {CLINICS_DIRECTORY.map((clinic) => (
                  <div key={clinic.id} className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all group duration-300">
                    <div className="w-full h-32 rounded-2xl overflow-hidden mb-4 relative">
                      <img 
                        src={clinic.image} 
                        alt={clinic.name} 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm text-slate-800 text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1">
                        <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                        {clinic.rating}
                      </div>
                    </div>
                    <h4 className="font-bold text-slate-800 text-sm">{clinic.name}</h4>
                    <p className="text-xs text-slate-500 mt-1">{clinic.address}</p>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {clinic.specialties.slice(0, 2).map((s, i) => (
                        <span key={i} className="px-2 py-1 bg-slate-50 text-slate-600 text-[9px] rounded-md font-bold">{s}</span>
                      ))}
                      {clinic.specialties.length > 2 && (
                        <span className="px-2 py-1 bg-slate-50 text-slate-600 text-[9px] rounded-md font-bold">+{clinic.specialties.length - 2}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 border-t border-slate-100 pt-6">
                {CLINICIANS_DIRECTORY.map((doc) => (
                  <div key={doc.id} className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm flex items-center gap-4 hover:border-teal-200 transition-colors">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-teal-50 to-emerald-100 text-teal-600 flex items-center justify-center font-black text-lg border border-teal-200 shrink-0 shadow-inner">
                      {doc.avatar}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h5 className="font-bold text-slate-800 text-sm truncate">{doc.name}</h5>
                      </div>
                      <p className="text-[10px] text-teal-600 font-bold truncate">{doc.specialty}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md">
                          <Star className="w-3 h-3 fill-amber-500" /> {doc.rating}
                        </span>
                        <span className="text-[9px] text-slate-400 capitalize truncate flex items-center gap-1">
                          <MapPin className="w-2.5 h-2.5" />
                          {doc.clinic.split(" ")[0]}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
          </div>

          <div className="lg:col-span-4 space-y-6">
            
            {/* VIRTUAL ASSISTANT */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col h-[520px] overflow-hidden">
              <div className="bg-teal-600 p-5 flex items-center gap-4 text-white">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-2xl shadow-inner shadow-white/30">
                  🦷
                </div>
                <div>
                  <h4 className="font-bold text-lg leading-none">Dentito</h4>
                  <p className="text-teal-100 text-xs mt-1 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    En línea ahora
                  </p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/50">
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`p-4 rounded-2xl text-sm max-w-[85%] shadow-sm ${
                      msg.role === "user"
                        ? "bg-slate-800 text-white rounded-br-sm"
                        : "bg-white text-slate-700 rounded-bl-sm border border-slate-100"
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isChatLoading && (
                  <div className="flex justify-start">
                    <div className="p-4 bg-white border border-slate-100 rounded-2xl rounded-bl-sm text-sm text-slate-400 shadow-sm flex items-center gap-2">
                      <span className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" />
                      <span className="w-2 h-2 bg-teal-400 rounded-full animate-bounce delay-75" />
                      <span className="w-2 h-2 bg-teal-400 rounded-full animate-bounce delay-150" />
                    </div>
                  </div>
                )}
              </div>

              <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-100 flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Pregúntale a Dentito..."
                  className="w-full text-sm p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-slate-700 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                  disabled={isChatLoading}
                />
                <button
                  type="submit"
                  className="bg-teal-600 text-white p-4 rounded-2xl hover:bg-teal-700 transition-colors shrink-0 shadow-md shadow-teal-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isChatLoading}
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>

            {/* SIMPLE TIPS */}
            <div className="bg-rose-50 rounded-3xl p-6 border border-rose-100 text-center">
              <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center text-rose-500 mx-auto mb-3">
                <Sparkles className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-800 mb-2">¡Sonríe con confianza!</h4>
              <p className="text-sm text-slate-600">Cepilla tus dientes al menos 2 veces al día y recuerda usar hilo dental. Un hábito pequeño hace una gran diferencia.</p>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
