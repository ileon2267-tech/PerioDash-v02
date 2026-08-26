import React, { useState, useRef, useEffect } from "react";
import { Patient, ClinicalPhoto } from "../types";
import { 
  Camera, 
  Upload, 
  Trash2, 
  SplitSquareVertical, 
  Sparkles, 
  Eye, 
  Sliders, 
  Calendar, 
  Tag, 
  Check, 
  Image as ImageIcon, 
  Layers, 
  Maximize2,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { recordHipaaAudit } from "../utils/hipaaAudit";

interface ClinicalPhotographyProps {
  patient: Patient;
  onUpdatePatient: (updated: Patient) => void;
}

const SAMPLE_DEFAULT_PHOTOS: ClinicalPhoto[] = [
  {
    id: "photo-before-1",
    url: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?q=80&w=1200&auto=format&fit=crop",
    date: "2026-02-10",
    category: "intraoral",
    tag: "antes",
    notes: "Registro inicial pre-tratamiento: presencia de tinciones y biofilm cervical."
  },
  {
    id: "photo-after-1",
    url: "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?q=80&w=1200&auto=format&fit=crop",
    date: "2026-03-01",
    category: "intraoral",
    tag: "despues",
    notes: "Control post-destartraje supragingival y profilaxis con ultrasonido y pulido."
  }
];

export default function ClinicalPhotography({ patient, onUpdatePatient }: ClinicalPhotographyProps) {
  const photos = (patient.clinicalPhotos && patient.clinicalPhotos.length > 0)
    ? patient.clinicalPhotos 
    : SAMPLE_DEFAULT_PHOTOS;

  const [filterCategory, setFilterCategory] = useState<string>("todos");
  const [sliderPosition, setSliderPosition] = useState<number>(50);
  const [isComparing, setIsComparing] = useState<boolean>(true);
  const [selectedBeforeId, setSelectedBeforeId] = useState<string>(photos.find(p => p.tag === "antes")?.id || photos[0]?.id || "");
  const [selectedAfterId, setSelectedAfterId] = useState<string>(photos.find(p => p.tag === "despues")?.id || photos[1]?.id || "");
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [selectedPhotoDetail, setSelectedPhotoDetail] = useState<ClinicalPhoto | null>(null);

  // Escape key listener for modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showUploadModal) setShowUploadModal(false);
        if (selectedPhotoDetail) setSelectedPhotoDetail(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showUploadModal, selectedPhotoDetail]);

  // New photo form state
  const [newPhotoUrl, setNewPhotoUrl] = useState<string>("");
  const [newPhotoCategory, setNewPhotoCategory] = useState<ClinicalPhoto["category"]>("intraoral");
  const [newPhotoTag, setNewPhotoTag] = useState<ClinicalPhoto["tag"]>("antes");
  const [newPhotoNotes, setNewPhotoNotes] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const beforePhoto = photos.find(p => p.id === selectedBeforeId) || photos.find(p => p.tag === "antes") || photos[0];
  const afterPhoto = photos.find(p => p.id === selectedAfterId) || photos.find(p => p.tag === "despues") || photos[1] || photos[0];

  const filteredPhotos = filterCategory === "todos" 
    ? photos 
    : photos.filter(p => p.category === filterCategory);

  // Log HIPAA audit when inspecting full photo details
  useEffect(() => {
    if (selectedPhotoDetail) {
      recordHipaaAudit("VIEW_CLINICAL_PHOTO", `Inspección de fotografía clínica (${selectedPhotoDetail.category} - ${selectedPhotoDetail.tag}) de ${patient.name}.`, {
        patientId: patient.id,
        patientName: patient.name,
        resource: "Fotografía Clínica ePHI",
        severity: "info"
      });
    }
  }, [selectedPhotoDetail?.id]);

  const handleAddPhoto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhotoUrl.trim()) return;

    const newPhoto: ClinicalPhoto = {
      id: `photo-${Date.now()}`,
      url: newPhotoUrl.trim(),
      date: new Date().toISOString().split("T")[0],
      category: newPhotoCategory,
      tag: newPhotoTag,
      notes: newPhotoNotes.trim()
    };

    const updatedPhotos = [newPhoto, ...photos];
    onUpdatePatient({
      ...patient,
      clinicalPhotos: updatedPhotos
    });

    if (newPhotoTag === "antes") setSelectedBeforeId(newPhoto.id);
    if (newPhotoTag === "despues") setSelectedAfterId(newPhoto.id);

    setNewPhotoUrl("");
    setNewPhotoNotes("");
    setShowUploadModal(false);

    recordHipaaAudit("UPLOAD_CLINICAL_PHOTO", `Carga de fotografía clínica (${newPhoto.category} - ${newPhoto.tag}) para ${patient.name}.`, {
      patientId: patient.id,
      patientName: patient.name,
      resource: "Fotografía Clínica ePHI",
      severity: "info"
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (loadEvt) => {
        const base64Url = loadEvt.target?.result as string;
        if (base64Url) {
          setNewPhotoUrl(base64Url);
          setShowUploadModal(true);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeletePhoto = (id: string) => {
    const updated = photos.filter(p => p.id !== id);
    onUpdatePatient({
      ...patient,
      clinicalPhotos: updated
    });
    if (selectedPhotoDetail?.id === id) setSelectedPhotoDetail(null);

    recordHipaaAudit("DELETE_CLINICAL_PHOTO", `Eliminación de fotografía clínica (ID: ${id}) de ${patient.name}.`, {
      patientId: patient.id,
      patientName: patient.name,
      resource: "Fotografía Clínica ePHI",
      severity: "warning"
    });
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header & Controls */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
              <Camera className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-display font-black text-slate-900 dark:text-white">
                Fotografía Clínica & Comparador Antes / Después
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Seguimiento visual de estética dental, periodoncia, blanqueamientos y ortodoncia con comparador deslizante interactivo.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => setIsComparing(!isComparing)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border ${
              isComparing 
                ? "bg-teal-600 border-teal-600 text-white shadow-xs" 
                : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
            }`}
          >
            <SplitSquareVertical className="w-4 h-4" />
            <span>{isComparing ? "Modo Comparador Activo" : "Ver Comparador"}</span>
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <Upload className="w-4 h-4" />
            <span>Subir Fotografía</span>
          </button>
        </div>
      </div>

      {/* Interactive Before / After Split Slider */}
      {isComparing && beforePhoto && afterPhoto && (
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-md space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/60 dark:border-slate-800/60">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-teal-600 dark:text-teal-400 bg-teal-500/10 px-2.5 py-1 rounded-md border border-teal-500/20">
                Slider Fotogramétrico
              </span>
              <h3 className="text-lg font-display font-bold text-slate-900 dark:text-white mt-1">
                Evolución Clínica Comparativa
              </h3>
            </div>

            <div className="flex items-center gap-4 text-xs font-medium text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500" />
                <span>Antes ({beforePhoto.date})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-teal-500" />
                <span>Después ({afterPhoto.date})</span>
              </div>
            </div>
          </div>

          {/* Canvas Wrapper */}
          <div className="relative w-full aspect-video md:aspect-[21/9] rounded-2xl overflow-hidden bg-slate-950 select-none shadow-2xl border border-slate-300 dark:border-slate-800">
            {/* After Image (Background) */}
            <img
              src={afterPhoto.url}
              alt="Después"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute top-4 right-4 bg-teal-600/90 text-white font-black text-xs px-3 py-1 rounded-lg backdrop-blur-md shadow-md">
              DESPUÉS: {afterPhoto.date}
            </div>

            {/* Before Image (Foreground Clipped) */}
            <div
              className="absolute inset-y-0 left-0 overflow-hidden"
              style={{ width: `${sliderPosition}%` }}
            >
              <img
                src={beforePhoto.url}
                alt="Antes"
                className="absolute inset-0 w-full h-full object-cover max-w-none"
                style={{ width: "100%", height: "100%" }}
              />
              <div className="absolute top-4 left-4 bg-rose-600/90 text-white font-black text-xs px-3 py-1 rounded-lg backdrop-blur-md shadow-md">
                ANTES: {beforePhoto.date}
              </div>
            </div>

            {/* Divider Line */}
            <div
              className="absolute inset-y-0 w-1 bg-white shadow-[0_0_12px_rgba(0,0,0,0.8)] cursor-ew-resize flex items-center justify-center pointer-events-none"
              style={{ left: `${sliderPosition}%` }}
            >
              <div className="w-8 h-8 rounded-full bg-white text-slate-900 flex items-center justify-center shadow-xl border border-slate-300">
                <Sliders className="w-4 h-4 rotate-90 text-teal-700" />
              </div>
            </div>

            {/* Hidden native range slider for precision mouse & touch gestures */}
            <input
              type="range"
              min="0"
              max="100"
              value={sliderPosition}
              onChange={(e) => setSliderPosition(Number(e.target.value))}
              className="absolute inset-0 opacity-0 cursor-ew-resize w-full h-full z-20"
              aria-label="Deslizar para comparar antes y después"
            />
          </div>

          {/* Quick Selector for comparison slots */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Foto "Antes"
              </label>
              <select
                value={selectedBeforeId}
                onChange={(e) => setSelectedBeforeId(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                {photos.map(p => (
                  <option key={p.id} value={p.id}>
                    [{p.tag.toUpperCase()}] {p.category} - {p.date} ({p.notes ? p.notes.slice(0, 30) + '...' : 'Sin notas'})
                  </option>
                ))}
              </select>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Foto "Después"
              </label>
              <select
                value={selectedAfterId}
                onChange={(e) => setSelectedAfterId(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                {photos.map(p => (
                  <option key={p.id} value={p.id}>
                    [{p.tag.toUpperCase()}] {p.category} - {p.date} ({p.notes ? p.notes.slice(0, 30) + '...' : 'Sin notas'})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Gallery Grid & Categories */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            Galería Fotográfica del Paciente ({photos.length})
          </h3>

          <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar max-w-full">
            {[
              { id: "todos", label: "Todas" },
              { id: "intraoral", label: "Intraorales" },
              { id: "facial", label: "Faciales" },
              { id: "sonrisa", label: "Sonrisa" },
              { id: "oclusal", label: "Oclusal" },
              { id: "perfil", label: "Perfil" }
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setFilterCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filterCategory === cat.id
                    ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {filteredPhotos.length === 0 ? (
          <div className="text-center py-12 text-slate-400 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
            <Camera className="w-12 h-12 mx-auto mb-2 opacity-40" />
            <p className="font-bold text-sm">No hay fotografías en esta categoría</p>
            <p className="text-xs text-slate-400 mt-1">Haz clic en "Subir Fotografía" para agregar registros fotográficos.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredPhotos.map(photo => (
              <div
                key={photo.id}
                className="group relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 shadow-sm hover:shadow-md transition-all flex flex-col"
              >
                <div className="relative aspect-square overflow-hidden bg-slate-900 cursor-pointer" onClick={() => setSelectedPhotoDetail(photo)}>
                  <img
                    src={photo.url}
                    alt={photo.notes || "Foto clínica"}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90 group-hover:opacity-100"
                  />
                  <div className="absolute top-2 left-2 flex gap-1">
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md shadow-xs ${
                      photo.tag === "antes" 
                        ? "bg-rose-600 text-white" 
                        : photo.tag === "despues" 
                        ? "bg-teal-600 text-white" 
                        : "bg-blue-600 text-white"
                    }`}>
                      {photo.tag}
                    </span>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-black/60 text-white backdrop-blur-xs">
                      {photo.category}
                    </span>
                  </div>

                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPhotoDetail(photo);
                      }}
                      className="p-2 bg-white text-slate-900 rounded-xl hover:scale-110 transition-transform shadow-md"
                      title="Ver Detalle"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePhoto(photo.id);
                      }}
                      className="p-2 bg-red-600 text-white rounded-xl hover:scale-110 transition-transform shadow-md"
                      title="Eliminar Foto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-white dark:bg-slate-900 flex-1 flex flex-col justify-between">
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-medium line-clamp-2">
                    {photo.notes || "Sin observaciones adicionales"}
                  </p>
                  <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400">
                    <span className="font-mono flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {photo.date}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Manual Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowUploadModal(false)}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-[300] flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 relative max-h-[90vh] overflow-y-auto my-auto flex flex-col"
            >
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 pr-8">
                <h3 className="font-display font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Camera className="w-5 h-5 text-teal-600" /> Adjuntar Fotografía Clínica
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full cursor-pointer transition-all duration-150"
                title="Cerrar ventana"
                aria-label="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>

              {newPhotoUrl && (
                <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-black">
                  <img src={newPhotoUrl} alt="Vista previa" className="w-full h-full object-cover" />
                </div>
              )}

              <form onSubmit={handleAddPhoto} className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    URL de la Imagen o Archivo
                  </label>
                  <input
                    type="text"
                    required
                    value={newPhotoUrl}
                    onChange={(e) => setNewPhotoUrl(e.target.value)}
                    placeholder="https://... o selecciona archivo"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Categoría Anatómica
                    </label>
                    <select
                      value={newPhotoCategory}
                      onChange={(e) => setNewPhotoCategory(e.target.value as any)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      <option value="intraoral">Intraoral</option>
                      <option value="facial">Facial Frontal</option>
                      <option value="sonrisa">Sonrisa</option>
                      <option value="oclusal">Oclusal / Arco</option>
                      <option value="perfil">Perfil / Sagital</option>
                      <option value="antes_despues">Antes / Después</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Etiqueta Evolutiva
                    </label>
                    <select
                      value={newPhotoTag}
                      onChange={(e) => setNewPhotoTag(e.target.value as any)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                    >
                      <option value="antes">Fase Inicial (Antes)</option>
                      <option value="despues">Fase Final (Después)</option>
                      <option value="seguimiento">Control / Seguimiento</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Notas Clínicas / Hallazgos
                  </label>
                  <textarea
                    rows={3}
                    value={newPhotoNotes}
                    onChange={(e) => setNewPhotoNotes(e.target.value)}
                    placeholder="Eje: Estado gingival previo, colorímetro Vita A2, etc."
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition-all shadow-xs cursor-pointer text-center"
                  >
                    Guardar Fotografía
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(false)}
                    className="px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {/* Photo Detail Modal */}
        {selectedPhotoDetail && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[320] flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setSelectedPhotoDetail(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl text-white relative max-h-[90vh] flex flex-col my-auto"
            >
              <div className="relative aspect-video bg-black flex items-center justify-center">
                <img
                  src={selectedPhotoDetail.url}
                  alt="Detalle"
                  className="max-h-full max-w-full object-contain"
                />
                <button
                  type="button"
                  onClick={() => setSelectedPhotoDetail(null)}
                  className="absolute top-4 right-4 bg-black/60 hover:bg-black/90 text-white p-2.5 rounded-full backdrop-blur-xs cursor-pointer transition-all duration-150"
                  title="Cerrar vista previa"
                  aria-label="Cerrar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-md text-xs font-black uppercase bg-teal-600 text-white">
                      {selectedPhotoDetail.tag}
                    </span>
                    <span className="px-2.5 py-1 rounded-md text-xs font-bold uppercase bg-slate-800 text-slate-300">
                      {selectedPhotoDetail.category}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-slate-400">
                    Fecha: {selectedPhotoDetail.date}
                  </span>
                </div>
                <p className="text-sm text-slate-300">
                  {selectedPhotoDetail.notes || "Sin notas registradas para este archivo fotográfico."}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
