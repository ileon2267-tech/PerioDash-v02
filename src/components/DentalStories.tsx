import React, { useState, useRef, useEffect } from "react";
import { 
  MessageSquare, 
  Share2, 
  Coins, 
  ArrowUpRight, 
  Upload, 
  Download, 
  FileText, 
  CheckCircle, 
  Search, 
  UserCheck, 
  Heart, 
  Sparkles, 
  Filter, 
  ChevronRight, 
  ChevronDown,
  ChevronUp,
  DollarSign, 
  Paperclip, 
  Trash2, 
  Image as ImageIcon, 
  Sparkle, 
  X,
  Send,
  CornerDownRight,
  ShieldCheck,
  Award,
  CheckCircle2,
  Clock
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { safeStorage } from "../utils/safeStorage";

// Interfaces
interface AttachedFile {
  name: string;
  size: string;
  type: string;
  dataUrl: string;
}

export interface ForumComment {
  id: string;
  postId: string;
  author: string;
  authorRole: string;
  content: string;
  likes: number;
  createdAt: string;
  hasLiked?: boolean;
  isDoctorVerified?: boolean;
  isOwn?: boolean;
  attachedFile?: AttachedFile | null;
}

interface ForumPost {
  id: string;
  author: string;
  authorRole?: string;
  title: string;
  category: string;
  content: string;
  likes: number;
  commentsCount: number;
  createdAt: string;
  hasLiked?: boolean;
  attachedFile?: AttachedFile | null;
}

interface SharedStudy {
  id: string;
  title: string;
  author: string;
  description: string;
  fileSize: string;
  price: number;
  purchases: number;
  rating: number;
  isUnlocked?: boolean;
  attachedFile?: AttachedFile | null;
}

const INITIAL_COMMENTS: Record<string, ForumComment[]> = {
  "post-1": [
    {
      id: "comm-1-1",
      postId: "post-1",
      author: "Dr. Felipe Morales",
      authorRole: "Implantólogo y Cirujano Bucal (UCh)",
      content: "En mi experiencia en furcas Clase III mandibulares, el pronóstico a largo plazo mejora notablemente si se realiza ferulización semirrígida durante los primeros 4 meses de osteointegración de la matriz. Excelente abordaje con la membrana reabsorbible de colágeno.",
      likes: 8,
      createdAt: "Hace 1 hora",
      hasLiked: false,
      isDoctorVerified: true
    },
    {
      id: "comm-1-2",
      postId: "post-1",
      author: "Dra. Marcela Garrido",
      authorRole: "Periodoncista AAP & Docente",
      content: "El CAL de 4mm a los 6 meses es un resultado formidable. ¿Realizaste control tomográfico CBCT de control para evaluar el llenado del defecto óseo interradicular antes de planificar la carga oclusal?",
      likes: 6,
      createdAt: "Hace 45 min",
      hasLiked: false,
      isDoctorVerified: true
    }
  ],
  "post-2": [
    {
      id: "comm-2-1",
      postId: "post-2",
      author: "Dr. Ignacio León",
      authorRole: "Periodoncista Clínico",
      content: "El esquema de Van Winkelhoff (Amoxicilina 500mg + Metronidazol 250mg c/8h por 7-8 días) sigue mostrando la mayor efectividad clínica para el control de A. actinomycetemcomitans. Fundamental recalcar el control de placa domiciliario con cepillos interproximales cónicos calibrados.",
      likes: 9,
      createdAt: "Hace 3 horas",
      hasLiked: false,
      isDoctorVerified: true
    },
    {
      id: "comm-2-2",
      postId: "post-2",
      author: "Dr. Rodrigo Alarcón",
      authorRole: "Rehabilitador Oral",
      content: "Excelente remisión de la inflamación gingival. Te sugiero mantener controles periodontales de soporte estrictos cada 3 meses durante el primer año post-terapia básica.",
      likes: 4,
      createdAt: "Hace 2 horas",
      hasLiked: false,
      isDoctorVerified: true
    }
  ],
  "post-3": [
    {
      id: "comm-3-1",
      postId: "post-3",
      author: "Dra. Sofía Riquelme",
      authorRole: "Odontopediatra & Preventiva",
      content: "La clorhexidina en gel al 0.2% aplicada con micromotor o microbrush directamente en el surco reduce el índice gingival sin generar la pigmentación extrínseca masiva del colutorio diario. Muy buen aporte clínico.",
      likes: 7,
      createdAt: "Ayer a las 18:30",
      hasLiked: false,
      isDoctorVerified: true
    }
  ]
};

export default function DentalStories() {
  const [activeTab, setActiveTab] = useState<"foro" | "estudios">("foro");
  
  // Custom refs for file inputs
  const forumFileInputRef = useRef<HTMLInputElement>(null);
  const commentFileInputRef = useRef<HTMLInputElement>(null);
  const studyFileInputRef = useRef<HTMLInputElement>(null);

  // Doctor Wallet State (using CLP values)
  const [earnings, setEarnings] = useState<number>(340000);
  const [walletHistory, setWalletHistory] = useState([
    { id: "w-1", desc: "Venta de Estudio: Regeneración Tisular Guiada", amount: 75000, date: "2026-06-06" },
    { id: "w-2", desc: "Venta de Guía: Diagnóstico de Crestas Alveolares", amount: 45000, date: "2026-06-05" },
    { id: "w-3", desc: "Venta de Estudio: Colgajo de Widman", amount: 30000, date: "2026-06-04" },
  ]);

  // Forum state
  const [posts, setPosts] = useState<ForumPost[]>([
    {
      id: "post-1",
      author: "Dr. Ignacio León",
      authorRole: "Periodoncista Clínico",
      category: "Cirugía Periodontal",
      title: "Manejo reconstructivo de furca Clase III en pieza 36",
      content: "Se presenta caso de paciente fumador con compromiso de furca Severo Clase III en la pieza 36. Llevamos a cabo raspado de campo abierto combinado con injerto óseo desmineralizado y membrana reabsorbible de colágeno. En la revaluación a los 6 meses obtuvimos un CAL estable de 4mm. ¿Recomendarían ferulización preventiva o carga de implante?",
      likes: 24,
      commentsCount: 2,
      createdAt: "Hace 2 horas",
      hasLiked: false
    },
    {
      id: "post-2",
      author: "Dra. Andrea Valenzuela",
      authorRole: "Periodoncia e Implantología",
      category: "Casos Clínicos",
      title: "Asociación de periodontitis agresiva incipiente en paciente de 24 años",
      content: "Paciente joven acude con recesiones localizadas y sangrado marginal severo. Índice de O'Leary inicial de 68%. Iniciamos terapia higiénica estricta combinada con antibioterapia (Amoxicilina + Metronidazol) por 7 días. El retroceso en la inflamación fue del 90% en la semana 3. Adjunto periodontograma.",
      likes: 18,
      commentsCount: 2,
      createdAt: "Hace 5 horas",
      hasLiked: false
    },
    {
      id: "post-3",
      author: "Dr. Carlos Soto",
      authorRole: "Especialista en Microbiología Oral",
      category: "Microbiología",
      title: "Índice de O'Leary de 72% - Protocolo clínico inmediato",
      content: "Revisados los índices de caries y placa, comparto mi protocolo de choque con clorhexidina en gel al 0.2% aplicado interproximal. Ideal para pacientes poco cooperadores con destreza motriz limitada.",
      likes: 11,
      commentsCount: 1,
      createdAt: "Ayer",
      hasLiked: false
    }
  ]);

  // Comments state with safeStorage persistence
  const [commentsMap, setCommentsMap] = useState<Record<string, ForumComment[]>>(() => {
    try {
      const saved = safeStorage.getItem("perio_forum_comments_v1");
      if (saved) {
        return { ...INITIAL_COMMENTS, ...JSON.parse(saved) };
      }
    } catch {}
    return INITIAL_COMMENTS;
  });

  // Expanded comments accordion per post
  const [expandedPosts, setExpandedPosts] = useState<Record<string, boolean>>({
    "post-1": true // Post 1 expanded by default to showcase active comments
  });

  // Draft comment inputs per post
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [commentDraftFiles, setCommentDraftFiles] = useState<Record<string, AttachedFile | null>>({});
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);

  // Filter & Search state for forum
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Todos");

  // Save comments map changes to safeStorage
  useEffect(() => {
    try {
      safeStorage.setItem("perio_forum_comments_v1", JSON.stringify(commentsMap));
    } catch {}
  }, [commentsMap]);

  // Sync post comment counts with commentsMap
  useEffect(() => {
    setPosts(prev => prev.map(p => ({
      ...p,
      commentsCount: (commentsMap[p.id] || []).length
    })));
  }, [commentsMap]);

  // Studies marketplace state
  const [studies, setStudies] = useState<SharedStudy[]>([
    {
      id: "study-1",
      title: "Atlas Clínico y Guía Quirúrgica de Regeneración Tisular Guiada (RTG)",
      author: "Dr. Ignacio León",
      description: "Contiene 12 casos documentados paso a paso con radiografías CBCT pre y post operatorias, diseños de colgajo y manejo posquirúrgico.",
      fileSize: "18.4 MB (PDF/DICOM)",
      price: 75000,
      purchases: 8,
      rating: 4.9,
      isUnlocked: true
    },
    {
      id: "study-2",
      title: "Guía de Diagnóstico Clínico de Crestas Alveolares Reabsorbidas",
      author: "Dr. Ignacio León",
      description: "Estudio de clasificación y toma de decisiones quirúrgicas previas a la colocación de implantes periodontales utilizando guías 3D.",
      fileSize: "12.1 MB (PDF)",
      price: 45000,
      purchases: 14,
      rating: 4.8,
      isUnlocked: false
    },
    {
      id: "study-3",
      title: "Colgajo de Widman Modificado en Bolsas Periodontales de ≥ 7mm",
      author: "Dra. Andrea Valenzuela",
      description: "Análisis retrospectivo multivariable del clearance de bacterias anaerobias estrictas y cicatrización epitelial en bolsas críticas en sector anterior.",
      fileSize: "6.5 MB (PDF/MP4)",
      price: 30000,
      purchases: 19,
      rating: 4.7,
      isUnlocked: false
    }
  ]);

  // Form states for adding posts/studies
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostCategory, setNewPostCategory] = useState("Casos Clínicos");
  const [newPostContent, setNewPostContent] = useState("");
  
  // Forum Attached File State
  const [forumAttachedFile, setForumAttachedFile] = useState<AttachedFile | null>(null);
  const [isForumDragging, setIsForumDragging] = useState(false);

  const [newStudyTitle, setNewStudyTitle] = useState("");
  const [newStudyDesc, setNewStudyDesc] = useState("");
  const [newStudyPrice, setNewStudyPrice] = useState("");
  const [newStudySize, setNewStudySize] = useState("4.8 MB (PDF)");
  
  // Study Attached File State
  const [studyAttachedFile, setStudyAttachedFile] = useState<AttachedFile | null>(null);
  const [isStudyDragging, setIsStudyDragging] = useState(false);
  
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Custom visual confirm and alert states
  const [buyingStudyId, setBuyingStudyId] = useState<string | null>(null);
  const [buyingStudyPrice, setBuyingStudyPrice] = useState<number>(0);
  const [buyingStudyTitle, setBuyingStudyTitle] = useState<string>("");
  const [unlockedSuccessText, setUnlockedSuccessText] = useState<string | null>(null);

  // File Handlers
  const handleForumFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processForumFile(file);
  };

  const processForumFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      setForumAttachedFile({
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        type: file.type,
        dataUrl: event.target?.result as string,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleStudyFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processStudyFile(file);
  };

  const processStudyFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      setStudyAttachedFile({
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        type: file.type,
        dataUrl: event.target?.result as string,
      });
      setNewStudySize(`${(file.size / (1024 * 1024)).toFixed(1)} MB (${file.type.split('/')[1]?.toUpperCase() || 'ZIP'})`);
    };
    reader.readAsDataURL(file);
  };

  // Handlers
  const handleLikePost = (postId: string) => {
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId) {
          const isL = !post.hasLiked;
          return {
            ...post,
            likes: isL ? post.likes + 1 : post.likes - 1,
            hasLiked: isL,
          };
        }
        return post;
      })
    );
  };

  const toggleExpandComments = (postId: string) => {
    setExpandedPosts((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  const handleAddComment = (postId: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = commentDrafts[postId]?.trim();
    if (!text) return;

    const newComment: ForumComment = {
      id: `comm-${Date.now()}`,
      postId,
      author: "Tú (Dr. Ignacio León)",
      authorRole: "Periodoncista Clínico AAP",
      content: text,
      likes: 0,
      createdAt: "Recién respondido",
      hasLiked: false,
      isDoctorVerified: true,
      isOwn: true,
      attachedFile: commentDraftFiles[postId] || null,
    };

    setCommentsMap((prev) => ({
      ...prev,
      [postId]: [...(prev[postId] || []), newComment],
    }));

    // Reset draft and draft file for this post
    setCommentDrafts((prev) => ({ ...prev, [postId]: "" }));
    setCommentDraftFiles((prev) => ({ ...prev, [postId]: null }));
    
    // Ensure the post is expanded
    setExpandedPosts((prev) => ({ ...prev, [postId]: true }));
  };

  const handleLikeComment = (postId: string, commentId: string) => {
    setCommentsMap((prev) => {
      const list = prev[postId] || [];
      const updated = list.map((c) => {
        if (c.id === commentId) {
          const isL = !c.hasLiked;
          return {
            ...c,
            likes: isL ? c.likes + 1 : Math.max(0, c.likes - 1),
            hasLiked: isL,
          };
        }
        return c;
      });
      return { ...prev, [postId]: updated };
    });
  };

  const handleDeleteComment = (postId: string, commentId: string) => {
    setCommentsMap((prev) => {
      const list = prev[postId] || [];
      return {
        ...prev,
        [postId]: list.filter((c) => c.id !== commentId),
      };
    });
  };

  const handleCommentFileChange = (postId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setCommentDraftFiles((prev) => ({
        ...prev,
        [postId]: {
          name: file.name,
          size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
          type: file.type,
          dataUrl: event.target?.result as string,
        },
      }));
    };
    reader.readAsDataURL(file);
  };

  const removeCommentFile = (postId: string) => {
    setCommentDraftFiles((prev) => ({ ...prev, [postId]: null }));
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostTitle.trim() || !newPostContent.trim()) return;

    const newPost: ForumPost = {
      id: `post-${Date.now()}`,
      author: "Tú (Dr. Ignacio León)",
      category: newPostCategory,
      title: newPostTitle,
      content: newPostContent,
      likes: 0,
      commentsCount: 0,
      createdAt: "Recién publicado",
      hasLiked: false,
      attachedFile: forumAttachedFile
    };

    setPosts([newPost, ...posts]);
    setNewPostTitle("");
    setNewPostContent("");
    setForumAttachedFile(null);
  };

  const handleUploadStudy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudyTitle.trim() || !newStudyDesc.trim() || !newStudyPrice) return;

    setIsUploading(true);

    setTimeout(() => {
      const priceNum = parseFloat(newStudyPrice) || 0;
      const newStudy: SharedStudy = {
        id: `study-${Date.now()}`,
        title: newStudyTitle,
        author: "Tú (Dr. Ignacio León)",
        description: newStudyDesc,
        fileSize: studyAttachedFile ? `${studyAttachedFile.size} (${studyAttachedFile.type.split('/')[1]?.toUpperCase() || 'ZIP'})` : newStudySize,
        price: priceNum,
        purchases: 0,
        rating: 5.0,
        isUnlocked: true, // uploaded studies are always unlocked for the author
        attachedFile: studyAttachedFile
      };

      setStudies([newStudy, ...studies]);
      setIsUploading(false);
      setUploadSuccess(true);
      
      // Add a dummy purchase / transaction visual log
      setTimeout(() => setUploadSuccess(false), 3000);

      // Clean inputs
      setNewStudyTitle("");
      setNewStudyDesc("");
      setNewStudyPrice("");
      setStudyAttachedFile(null);
    }, 1200);
  };

  // Escape key handler for buy confirmation modal
  useEffect(() => {
    if (!buyingStudyId) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setBuyingStudyId(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [buyingStudyId]);

  const handleBuyStudy = (studyId: string, price: number, title: string) => {
    setBuyingStudyId(studyId);
    setBuyingStudyPrice(price);
    setBuyingStudyTitle(title);
  };

  const executeBuyStudy = () => {
    if (!buyingStudyId) return;
    const studyId = buyingStudyId;
    const price = buyingStudyPrice;
    const title = buyingStudyTitle;

    setStudies((prev) =>
      prev.map((study) => {
        if (study.id === studyId) {
          return { ...study, isUnlocked: true, purchases: study.purchases + 1 };
        }
        return study;
      })
    );
    
    // Update balance & purchase logs
    setEarnings((prev) => Math.max(0, prev - price));
    setWalletHistory([
      { id: `w-${Date.now()}`, desc: `Compra de Estudio: ${title}`, amount: -price, date: "Hoy" },
      ...walletHistory
    ]);

    setBuyingStudyId(null);
    setUnlockedSuccessText(`¡Estudio clínico "${title}" desbloqueado con éxito! Ya puedes descargar los de forma completa.`);
    setTimeout(() => {
      setUnlockedSuccessText(null);
    }, 5000);
  };

  return (
    <div className="relative rounded-[2rem] p-[4px] group w-full" id="dentalstories-root">
      {/* Animated neon border background */}
      <div className="absolute inset-0 neon-rainbow-bg rounded-[2rem] pointer-events-none opacity-100" />
      <div className="absolute inset-0 neon-rainbow-bg rounded-[2rem] pointer-events-none blur-xl opacity-50 dark:opacity-70" />
      <div className="absolute inset-[4px] rounded-[calc(2rem-4px)] bg-[#f8fafc] dark:bg-[#09090b] z-0 pointer-events-none" />
      
      <div className="relative z-10 space-y-6 p-2 md:p-3 bg-transparent">
      
      {/* Sub header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-6 shadow-xs">
        <div>
          <h2 className="text-xl font-display font-bold text-slate-900 dark:text-white inline-flex items-center gap-2">
            <span>DentalStories & Study Hub</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">Conecta con médicos periodoncistas, revisa atlas clínicos o sube tus estudios odontológicos y obtén rentabilidad certificada</p>
        </div>

        {/* Sub Navigation pills */}
        <div className="bg-slate-50 dark:bg-slate-800 p-1 rounded-xl flex border border-slate-100 dark:border-slate-800 w-full md:w-auto relative">
          <button
            onClick={() => setActiveTab("foro")}
            className={`flex-1 md:flex-none text-xs py-2 px-4 rounded-lg font-semibold transition-all cursor-pointer ${
              activeTab === "foro"
                ? "bg-white dark:bg-slate-800 shadow-sm text-teal-600 dark:text-teal-400"
                : "text-slate-400 hover:text-slate-800 dark:hover:text-slate-100"
            }`}
          >
            Foro DentalStories
          </button>
          <button
            onClick={() => setActiveTab("estudios")}
            className={`flex-1 md:flex-none text-xs py-2 px-4 rounded-lg font-semibold transition-all cursor-pointer ${
              activeTab === "estudios"
                ? "bg-white dark:bg-slate-800 shadow-sm text-teal-600 dark:text-teal-400"
                : "text-slate-400 hover:text-slate-800 dark:hover:text-slate-100"
            }`}
          >
            Monetización & Estudios
          </button>
        </div>
      </div>

      {/* RENDER FORUM */}
      {activeTab === "foro" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Feed (Post Feed) */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* Search & Category Filter Bar */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row gap-2.5 items-center justify-between">
                <div className="relative w-full sm:w-72">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar casos, bioindicadores, furcas..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-xl outline-none text-slate-800 dark:text-slate-200"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto">
                  {["Todos", "Casos Clínicos", "Cirugía Periodontal", "Microbiología", "Docencia"].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                        selectedCategory === cat
                          ? "bg-teal-600 text-white shadow-xs"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Create Post Card */}
            <form onSubmit={handleCreatePost} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] bg-teal-50 dark:bg-teal-800/40 text-teal-700 dark:text-teal-400 border border-teal-500/10 font-bold uppercase tracking-wider py-1 px-2 rounded-md inline-flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-teal-500" />
                  <span>Nueva Publicación en Comunidad Médica</span>
                </span>
                <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  Anonimización HIPAA Activa
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Título del Caso Clínico o consulta..."
                  value={newPostTitle}
                  onChange={(e) => setNewPostTitle(e.target.value)}
                  className="md:col-span-2 p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-teal-500/10 text-slate-800 dark:text-slate-100"
                  required
                />
                <select
                  value={newPostCategory}
                  onChange={(e) => setNewPostCategory(e.target.value)}
                  className="p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl outline-none"
                >
                  <option value="Casos Clínicos">Casos Clínicos</option>
                  <option value="Cirugía Periodontal">Cirugía Periodontal</option>
                  <option value="Microbiología">Microbiología</option>
                  <option value="Docencia">Docencia / Tips</option>
                </select>
              </div>

              <textarea
                placeholder="Describe los bioindicadores, hallazgos radiográficos, el periodontograma, tipo de colgajo, medicaciones terapéuticas o dudas..."
                rows={3}
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                className="w-full p-2.5 text-xs bg-slate-50/75 dark:bg-slate-855 border border-slate-100 dark:border-slate-800 rounded-xl outline-none"
                required
              />

              {/* Drag and Drop Upload Area for Forum */}
              <div 
                onDragOver={(e) => { e.preventDefault(); setIsForumDragging(true); }}
                onDragLeave={() => setIsForumDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsForumDragging(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) processForumFile(file);
                }}
                className={`p-4 border-2 border-dashed rounded-xl transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                  isForumDragging 
                    ? "border-teal-500 bg-teal-500/10" 
                    : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 hover:border-teal-500/40 hover:bg-slate-50 dark:hover:bg-slate-950/30"
                }`}
                onClick={() => forumFileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={forumFileInputRef}
                  onChange={handleForumFileChange}
                  accept="image/*,.pdf,.doc,.docx,.zip,.rar"
                  className="hidden"
                />
                <Upload className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Arrastra un archivo aquí o haz clic para adjuntar foto o informe dental
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500">
                  Soporta imágenes (JPG, PNG) y documentos clínicos (PDF, DICOM ZIP) de hasta 10MB
                </span>
              </div>

              {/* Show forum attachments if they exist */}
              {forumAttachedFile && (
                <div className="flex items-center justify-between p-3 bg-teal-500/5 dark:bg-teal-950/10 border border-teal-500/10 rounded-xl animate-fade-in">
                  <div className="flex items-center gap-2.5 m-1 overflow-hidden truncate">
                    {forumAttachedFile.type.startsWith("image/") ? (
                      <div className="relative w-11 h-11 rounded-lg overflow-hidden border border-teal-500/20 shrink-0 bg-slate-100">
                        <img src={forumAttachedFile.dataUrl} className="w-full h-full object-cover" alt="Attachment Preview" />
                      </div>
                    ) : (
                      <div className="w-11 h-11 rounded-lg bg-teal-500/10 flex items-center justify-center border border-teal-500/20 shrink-0 text-teal-605">
                        <FileText className="w-5.5 h-5.5" />
                      </div>
                    )}
                    <div className="truncate">
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate max-w-[200px] md:max-w-xs">{forumAttachedFile.name}</p>
                      <p className="text-[10px] font-mono font-semibold text-teal-600 dark:text-teal-400">{forumAttachedFile.size} • Listo para adjuntar</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setForumAttachedFile(null);
                      if (forumFileInputRef.current) forumFileInputRef.current.value = "";
                    }}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-all cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="bg-slate-900 dark:bg-teal-600 hover:bg-slate-800 dark:hover:bg-teal-700 text-white font-semibold text-xs py-2 px-4 rounded-xl cursor-pointer shadow-xs inline-flex items-center gap-1.5 transition-all"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Publicar en Foro Médico</span>
                </button>
              </div>
            </form>

            {/* Post Feed List */}
            <div className="space-y-4">
              {posts
                .filter((p) => {
                  const matchesCat = selectedCategory === "Todos" || p.category === selectedCategory || (selectedCategory.startsWith("#") && (p.title.includes(selectedCategory.substring(1)) || p.content.includes(selectedCategory.substring(1))));
                  const matchesSearch = !searchQuery || p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.content.toLowerCase().includes(searchQuery.toLowerCase()) || p.author.toLowerCase().includes(searchQuery.toLowerCase());
                  return matchesCat && matchesSearch;
                })
                .map((post) => {
                  const postComments = commentsMap[post.id] || [];
                  const isExpanded = expandedPosts[post.id] ?? false;
                  const draftText = commentDrafts[post.id] || "";
                  const draftFile = commentDraftFiles[post.id] || null;

                  return (
                    <div key={post.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 space-y-4 hover:shadow-xs transition-all relative">
                      
                      {/* Category, Author & Date Row */}
                      <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                        <span className="font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-800/30 py-0.5 px-2 rounded">
                          {post.category}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1">
                            <span className="font-bold text-slate-700 dark:text-slate-300">{post.author}</span>
                            {post.authorRole && (
                              <span className="text-[9px] text-teal-600 dark:text-teal-400">({post.authorRole})</span>
                            )}
                          </span>
                          <span>•</span>
                          <span>{post.createdAt}</span>
                        </div>
                      </div>

                      {/* Title & Content */}
                      <div className="space-y-1.5">
                        <h3 className="text-sm font-semibold text-slate-800 dark:text-white leading-snug">
                          {post.title}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-300 leading-relaxed font-light whitespace-pre-line">
                          {post.content}
                        </p>

                        {/* Attached file output for the post */}
                        {post.attachedFile && (
                          <div className="mt-3.5 overflow-hidden rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-950/15">
                            {post.attachedFile.type.startsWith("image/") ? (
                              <div className="relative group max-h-80 overflow-hidden bg-black/5 flex items-center justify-center">
                                <img 
                                  src={post.attachedFile.dataUrl} 
                                  className="w-full max-h-80 object-contain hover:scale-[1.01] transition-transform duration-300" 
                                  alt={post.attachedFile.name} 
                                />
                                <a 
                                  href={post.attachedFile.dataUrl} 
                                  download={post.attachedFile.name}
                                  className="absolute top-2.5 right-2.5 bg-black/70 hover:bg-teal-600 text-white p-2 rounded-xl border border-white/10 backdrop-blur-md transition-all scale-95 opacity-80 group-hover:opacity-100 flex items-center gap-1.5 text-[10px] font-bold"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  Guardar Foto
                                </a>
                              </div>
                            ) : (
                              <div className="p-3 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2.5 truncate">
                                  <div className="p-2 bg-teal-500/10 border border-teal-500/20 text-teal-600 dark:text-teal-400 rounded-xl shrink-0">
                                    <FileText className="w-5 h-5" />
                                  </div>
                                  <div className="truncate">
                                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{post.attachedFile.name}</p>
                                    <p className="text-[10px] text-slate-400 font-mono">{post.attachedFile.size} • Adjunto Clínico</p>
                                  </div>
                                </div>
                                <a
                                  href={post.attachedFile.dataUrl}
                                  download={post.attachedFile.name}
                                  className="flex items-center gap-1 py-1.5 px-3 bg-teal-50 hover:bg-teal-100 dark:bg-teal-900/30 dark:hover:bg-teal-900/60 border border-teal-500/20 text-teal-700 dark:text-teal-400 text-[10px] font-black uppercase rounded-lg transition-all"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  Bajar
                                </a>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Likes and comments toggle footer */}
                      <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-3">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleLikePost(post.id)}
                            className={`text-[11px] font-bold py-1 px-2.5 rounded-lg border transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                              post.hasLiked
                                ? "bg-red-50 dark:bg-red-950/30 text-red-500 border-red-200 dark:border-red-800"
                                : "bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-transparent hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-750"
                            }`}
                          >
                            <Heart className={`w-3.5 h-3.5 ${post.hasLiked ? "fill-red-500" : ""}`} />
                            <span>{post.likes} Doctor{post.likes !== 1 ? 'es' : ''}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => toggleExpandComments(post.id)}
                            className={`text-[11px] font-bold py-1 px-3 rounded-lg border transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                              isExpanded
                                ? "bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800"
                                : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-transparent hover:bg-teal-50 dark:hover:bg-teal-950/20 hover:text-teal-600"
                            }`}
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>{postComments.length} {postComments.length === 1 ? "Respuesta Médica" : "Respuestas Médicas"}</span>
                            {isExpanded ? (
                              <ChevronUp className="w-3 h-3 ml-0.5 text-teal-600 dark:text-teal-400" />
                            ) : (
                              <ChevronDown className="w-3 h-3 ml-0.5 text-slate-400" />
                            )}
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            if (!isExpanded) toggleExpandComments(post.id);
                            // Focus comment input
                            const el = document.getElementById(`comment-input-${post.id}`);
                            if (el) el.focus();
                          }}
                          className="text-[11px] text-teal-600 dark:text-teal-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <CornerDownRight className="w-3 h-3" />
                          <span>Responder caso</span>
                        </button>
                      </div>

                      {/* EXPANDABLE COMMENTS THREAD */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800 overflow-hidden"
                          >
                            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400 px-1">
                              <span className="flex items-center gap-1.5">
                                <MessageSquare className="w-3.5 h-3.5 text-teal-500" />
                                Discusión Clínica y Evidencia ({postComments.length})
                              </span>
                              <span className="text-[10px] text-slate-400 font-normal">
                                Visibilidad exclusiva para odontólogos colegiados
                              </span>
                            </div>

                            {/* List of existing comments */}
                            <div className="space-y-2.5">
                              {postComments.length === 0 ? (
                                <div className="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
                                  Aún no hay respuestas en este caso. ¡Sé el primer especialista en opinar!
                                </div>
                              ) : (
                                postComments.map((comment) => (
                                  <div
                                    key={comment.id}
                                    className="p-3.5 bg-slate-50/80 dark:bg-slate-950/60 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2 relative group/comm"
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-teal-600/10 dark:bg-teal-400/20 text-teal-600 dark:text-teal-300 font-bold text-[10px] flex items-center justify-center border border-teal-500/20">
                                          {comment.author.charAt(0)}
                                        </div>
                                        <div>
                                          <div className="flex items-center gap-1.5">
                                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                              {comment.author}
                                            </span>
                                            {comment.isDoctorVerified && (
                                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20" title="Especialista Certificado">
                                                <CheckCircle2 className="w-2.5 h-2.5" />
                                                Verificado
                                              </span>
                                            )}
                                          </div>
                                          <span className="text-[10px] text-slate-400 block -mt-0.5">
                                            {comment.authorRole}
                                          </span>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                                          <Clock className="w-3 h-3 text-slate-400" />
                                          {comment.createdAt}
                                        </span>
                                        {comment.isOwn && (
                                          <button
                                            type="button"
                                            onClick={() => handleDeleteComment(post.id, comment.id)}
                                            className="opacity-0 group-hover/comm:opacity-100 p-1 text-slate-400 hover:text-red-500 rounded transition-all cursor-pointer"
                                            title="Eliminar mi respuesta"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        )}
                                      </div>
                                    </div>

                                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-light pl-8 whitespace-pre-line">
                                      {comment.content}
                                    </p>

                                    {/* Comment attached file */}
                                    {comment.attachedFile && (
                                      <div className="pl-8 pt-1">
                                        {comment.attachedFile.type.startsWith("image/") ? (
                                          <div className="max-w-xs rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800">
                                            <img src={comment.attachedFile.dataUrl} alt={comment.attachedFile.name} className="w-full max-h-48 object-cover" />
                                          </div>
                                        ) : (
                                          <a
                                            href={comment.attachedFile.dataUrl}
                                            download={comment.attachedFile.name}
                                            className="inline-flex items-center gap-2 p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 text-[10px] font-bold text-teal-600 hover:underline"
                                          >
                                            <FileText className="w-3.5 h-3.5" />
                                            <span>{comment.attachedFile.name} ({comment.attachedFile.size})</span>
                                          </a>
                                        )}
                                      </div>
                                    )}

                                    {/* Like comment button */}
                                    <div className="pl-8 pt-1 flex items-center gap-3">
                                      <button
                                        type="button"
                                        onClick={() => handleLikeComment(post.id, comment.id)}
                                        className={`text-[10px] font-bold py-0.5 px-2 rounded-md border transition-all cursor-pointer inline-flex items-center gap-1 ${
                                          comment.hasLiked
                                            ? "bg-red-50 dark:bg-red-950/30 text-red-500 border-red-200 dark:border-red-800"
                                            : "bg-white dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-800 hover:text-red-500"
                                        }`}
                                      >
                                        <Heart className={`w-3 h-3 ${comment.hasLiked ? "fill-red-500" : ""}`} />
                                        <span>{comment.likes}</span>
                                      </button>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>

                            {/* Active Comment Input Form */}
                            <form
                              onSubmit={(e) => handleAddComment(post.id, e)}
                              className="p-3 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 shadow-xs"
                            >
                              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                                <span className="flex items-center gap-1.5">
                                  <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                                  Aportar criterio clínico como Dr. Ignacio León
                                </span>
                                <span className="text-[10px] text-slate-400">Ctrl + Enter para enviar</span>
                              </div>

                              <textarea
                                id={`comment-input-${post.id}`}
                                rows={2}
                                placeholder="Escribe tu observación periodontal, sugerencia de colgajo, medicación, bibliografía o criterio terapéutico..."
                                value={draftText}
                                onChange={(e) => setCommentDrafts((prev) => ({ ...prev, [post.id]: e.target.value }))}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                                    e.preventDefault();
                                    handleAddComment(post.id);
                                  }
                                }}
                                className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-teal-500/20 text-slate-800 dark:text-slate-100 resize-y"
                              />

                              {/* Attachment preview in draft */}
                              {draftFile && (
                                <div className="flex items-center justify-between p-2 bg-teal-500/10 border border-teal-500/20 rounded-lg text-xs">
                                  <span className="truncate max-w-xs text-slate-700 dark:text-slate-200 font-bold text-[11px]">
                                    📎 {draftFile.name} ({draftFile.size})
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => removeCommentFile(post.id)}
                                    className="text-slate-400 hover:text-red-500 p-1"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}

                              <div className="flex items-center justify-between pt-1">
                                <div className="flex items-center gap-2">
                                  <input
                                    type="file"
                                    id={`file-input-${post.id}`}
                                    onChange={(e) => handleCommentFileChange(post.id, e)}
                                    accept="image/*,.pdf,.doc,.docx"
                                    className="hidden"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const el = document.getElementById(`file-input-${post.id}`);
                                      if (el) el.click();
                                    }}
                                    className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-[11px] font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                                  >
                                    <Paperclip className="w-3 h-3" />
                                    <span>Adjuntar Rx/Foto</span>
                                  </button>
                                </div>

                                <button
                                  type="submit"
                                  disabled={!draftText.trim()}
                                  className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                                >
                                  <Send className="w-3 h-3" />
                                  <span>Publicar Respuesta</span>
                                </button>
                              </div>
                            </form>
                          </motion.div>
                        )}
                      </AnimatePresence>

                    </div>
                  );
                })}
            </div>

          </div>

          {/* Forum Sidebar (Guideline info / community rules) */}
          <div className="space-y-4">
            
            <div className="bg-gradient-to-br from-slate-900 to-teal-800 text-white rounded-2xl p-5 border border-slate-800 shadow-lg space-y-4">
              <div className="p-1 px-1.5 bg-teal-500/20 text-teal-400 border border-teal-400/20 rounded-xl inline-flex self-start">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <h4 className="font-display font-semibold text-xs uppercase text-teal-300 tracking-widest">Garantía PerioSaaS</h4>
                <p className="text-[11px] text-slate-300 leading-relaxed font-light">
                  Todos los debates publicados en este foro respetan la confidencialidad de la ficha clínica de acuerdo con estándares HIPAA mundiales. Los nombres de los pacientes oclusales de PerioDash son anonimizados automáticamente en el feed.
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 space-y-3.5">
              <h5 className="text-xs font-bold font-sans uppercase tracking-wider text-slate-400">Canales Especializados</h5>
              <div className="space-y-2 text-xs">
                {[
                  { tag: "AAP Clasificación 2018", count: 48 },
                  { tag: "Injerción de Tejido Conectivo", count: 32 },
                  { tag: "Biochips y Diagnóstico Genético", count: 14 }
                ].map((ch) => (
                  <div 
                    key={ch.tag} 
                    onClick={() => {
                      setSelectedCategory(selectedCategory === `#${ch.tag}` ? "Todos" : `#${ch.tag}`);
                    }}
                    className={`flex justify-between items-center p-2.5 rounded-xl transition-colors cursor-pointer ${
                      selectedCategory === `#${ch.tag}`
                        ? "bg-teal-600/10 border border-teal-500/30 text-teal-600 dark:text-teal-400"
                        : "bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <span className="font-semibold text-slate-800 dark:text-slate-200">#{ch.tag}</span>
                    <span className="font-mono text-[10px] text-slate-400 font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">{ch.count}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      ) : (
        /* RENDER MARKETPLACE & MONETIZATION HUB */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main List & Upload form */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* Upload form */}
            <form onSubmit={handleUploadStudy} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-xs">
              <span className="text-[10px] bg-teal-50 dark:bg-teal-800/40 text-teal-700 dark:text-teal-400 border border-teal-500/10 font-bold uppercase tracking-wider py-1 px-2.5 rounded-md inline-flex items-center gap-1">
                <Upload className="w-3.5 h-3.5" />
                <span>Monetizar tus Estudios Clínicos</span>
              </span>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 block ml-0.5">Título del Documento o Set CBCT:</label>
                  <input
                    type="text"
                    placeholder="P. ej., Anatomía de Senos Maxilares en Injertos Alveolares"
                    value={newStudyTitle}
                    onChange={(e) => setNewStudyTitle(e.target.value)}
                    className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-teal-500/10 text-slate-800 dark:text-slate-100"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-400 block ml-0.5">Precio de Licencia (CLP):</label>
                    <input
                      type="number"
                      placeholder="P. ej., 45000"
                      value={newStudyPrice}
                      onChange={(e) => setNewStudyPrice(e.target.value)}
                      min="0"
                      className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl outline-none"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-400 block ml-0.5">Formato & Peso:</label>
                    <select
                      value={newStudySize}
                      onChange={(e) => setNewStudySize(e.target.value)}
                      className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl outline-none"
                    >
                      <option value="4.8 MB (PDF)">4.8 MB (PDF)</option>
                      <option value="12.5 MB (DICOM)">12.5 MB (DICOM)</option>
                      <option value="22.1 MB (ZIP/CBCT)">22.1 MB (Radiografías/ZIP)</option>
                    </select>
                  </div>
                </div>

                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 block ml-0.5">Descripción Quirúrgica / Resumen de Contenidos:</label>
                  <textarea
                    placeholder="Describe el cuadro clínico de la periodontitis o cirugía, muestras tisulares, hallazgos óseos y valor clínico de tus archivos..."
                    rows={2}
                    value={newStudyDesc}
                    onChange={(e) => setNewStudyDesc(e.target.value)}
                    className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl outline-none"
                    required
                  />
                </div>

                {/* Drag and Drop Upload Area for Studies */}
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 block ml-0.5">Subir Fichero del Estudio Clínico (PDF, DICOM o ZIP):</label>
                  <div 
                    onDragOver={(e) => { e.preventDefault(); setIsStudyDragging(true); }}
                    onDragLeave={() => setIsStudyDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsStudyDragging(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) processStudyFile(file);
                    }}
                    className={`p-4 border-2 border-dashed rounded-xl transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                      isStudyDragging 
                        ? "border-teal-500 bg-teal-500/10" 
                        : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 hover:border-teal-500/40 hover:bg-slate-50 dark:hover:bg-slate-950/30"
                    }`}
                    onClick={() => studyFileInputRef.current?.click()}
                  >
                    <input
                      type="file"
                      ref={studyFileInputRef}
                      onChange={handleStudyFileChange}
                      accept=".pdf,.zip,.dicom,.rar,image/*"
                      className="hidden"
                    />
                    <Upload className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Arrastra tu archivo aquí o haz clic para subir set de radiografías o PDF
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">
                      Soporta PDF, ZIP (con sets DICOM), RAR o imágenes clínicas de hasta 25MB
                    </span>
                  </div>

                  {/* Show study attachments preview if existing */}
                  {studyAttachedFile && (
                    <div className="flex items-center justify-between p-3 bg-teal-500/5 dark:bg-teal-950/10 border border-teal-500/10 rounded-xl animate-fade-in">
                      <div className="flex items-center gap-2.5 overflow-hidden truncate">
                        <div className="w-10 h-10 rounded-lg bg-teal-500/10 flex items-center justify-center border border-teal-500/20 text-teal-600 shrink-0">
                          <FileText className="w-5.5 h-5.5" />
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{studyAttachedFile.name}</p>
                          <p className="text-[10px] font-mono text-teal-600 dark:text-teal-400">{studyAttachedFile.size} • Listo para empaquetar y monetizar</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setStudyAttachedFile(null);
                          if (studyFileInputRef.current) studyFileInputRef.current.value = "";
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-all cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-1 items-center gap-4">
                {uploadSuccess && (
                  <span className="text-[11px] text-emerald-500 font-bold inline-flex items-center gap-1 animate-pulse">
                    <CheckCircle className="w-4 h-4" /> ¡Estudio monetizable publicado con éxito!
                  </span>
                )}
                
                <button
                  type="submit"
                  disabled={isUploading}
                  className="bg-teal-600 hover:bg-teal-750 text-white font-semibold text-xs py-2 px-4 rounded-xl cursor-pointer shadow-md inline-flex items-center gap-1.5 transition-all"
                >
                  {isUploading ? (
                    <span className="w-3.5 h-3.5 rounded-full border border-t-transparent border-white animate-spin" />
                  ) : (
                    <Coins className="w-3.5 h-3.5" />
                  )}
                  <span>Cargar y Configurar Cobro</span>
                </button>
              </div>
            </form>

            {/* Marketplace list */}
            <div className="space-y-4">
              <h3 className="text-xs uppercase font-sans font-bold tracking-wider text-slate-400">Archivos e Informes Clínicos en Venta ({studies.length})</h3>
              
              {studies.map((study) => (
                <div key={study.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-5 hover:border-slate-300 dark:hover:border-slate-700 transition-all">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      <span className="inline-flex items-center gap-1 font-mono font-medium bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-100 dark:border-slate-800/80">
                        <FileText className="w-3.5 h-3.5 text-teal-600" />
                        {study.fileSize}
                      </span>
                      <span>•</span>
                      <span>Autor: {study.author}</span>
                      <span>•</span>
                      <span className="text-amber-500">★ {study.rating}</span>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white leading-tight">{study.title}</h4>
                      <p className="text-xs text-slate-400 max-w-xl font-light font-sans">{study.description}</p>
                    </div>

                    <div className="text-[10px] text-slate-400">
                      Licencia activa para <strong>{study.purchases} doctores</strong> de la comunidad odontológica.
                    </div>
                  </div>

                  {/* Actions column pricing */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100/50 dark:hover:bg-slate-800/80 rounded-xl border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center text-center gap-2 md:w-44 self-start md:self-center shrink-0">
                    <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Acceso Clínico</div>
                    <div className="text-2xl font-display font-bold text-slate-800 dark:text-slate-100">${Math.round(study.price).toLocaleString("es-CL")} <span className="text-[11px] text-teal-600 font-bold">CLP</span></div>
                    
                    {study.isUnlocked ? (
                      study.attachedFile ? (
                        <a 
                          href={study.attachedFile.dataUrl}
                          download={study.attachedFile.name}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs py-2 rounded-lg cursor-pointer transition-all inline-flex items-center justify-center gap-1"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Descargar Original</span>
                        </a>
                      ) : (
                        <button 
                          onClick={() => {
                            const link = document.createElement("a");
                            link.href = "#";
                            link.onclick = (e) => e.preventDefault();
                            alert("Su descarga del estudio clínico/DICOM ha sido iniciada con éxito por PerioDash Secure Transfer.");
                          }}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs py-2 rounded-lg cursor-pointer transition-all inline-flex items-center justify-center gap-1"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Descargar Demo</span>
                        </button>
                      )
                    ) : (
                      <button 
                        onClick={() => handleBuyStudy(study.id, study.price, study.title)}
                        className="w-full bg-slate-900 dark:bg-teal-600 hover:bg-slate-800 dark:hover:bg-teal-700 text-white font-semibold text-xs py-2 rounded-lg cursor-pointer transition-all inline-flex items-center justify-center gap-1"
                      >
                        <Coins className="w-3.5 h-3.5" />
                        <span>Desbloquear</span>
                      </button>
                    )}
                  </div>

                </div>
              ))}
            </div>

          </div>

          {/* Wallet and stats row sidebar */}
          <div className="space-y-4">
            
            {/* Wallet panel */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 space-y-4 shadow-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-50 dark:border-slate-800">
                <span className="text-xs uppercase font-extrabold text-slate-400 tracking-wider inline-flex items-center gap-1.5">
                  <Coins className="w-4.5 h-4.5 text-teal-600 animate-spin" />
                  <span>Billetera PerioPay Wallet</span>
                </span>
                <span className="text-[10px] bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded text-emerald-500 font-bold border border-slate-100 dark:border-slate-800">
                  Activa
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-bold block ml-0.5">FONDOS TOTALES ACUMULADOS POR ESTUDIOS:</span>
                <h3 className="text-3xl font-display font-semibold text-teal-600 dark:text-teal-400 tracking-tight">${Math.round(earnings).toLocaleString("es-CL")} CLP</h3>
              </div>

              <div className="p-3 bg-emerald-500/10 text-emerald-650 dark:text-emerald-400 border border-emerald-500/10 rounded-xl text-[10px] leading-relaxed font-light">
                Tus cobros acumulados son transferidos automáticamente a tu cuenta clínica los días 25 de cada mes de forma recurrente.
              </div>

              {/* Transactions log */}
              <div className="space-y-2.5">
                <span className="text-[10px] font-bold text-slate-400 block tracking-wider">Historial de Cobros Recientes:</span>
                <div className="divide-y divide-slate-100 dark:divide-slate-800 text-[11px] font-sans">
                  {walletHistory.map((item) => (
                    <div key={item.id} className="py-2 flex justify-between items-center">
                      <div className="truncate pr-4 flex-1">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 block truncate">{item.desc}</span>
                        <span className="text-[10px] text-slate-400 font-normal block">{item.date}</span>
                      </div>
                      <span className={`font-mono font-bold shrink-0 ${item.amount < 0 ? "text-red-500" : "text-emerald-600"}`}>
                        {item.amount < 0 ? "" : "+"}${Math.round(Math.abs(item.amount)).toLocaleString("es-CL")} CLP
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>

        </div>
      )}
      </div>

      {/* Custom Buy Confirmation Dialog Overlay */}
      <AnimatePresence>
        {buyingStudyId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setBuyingStudyId(null)}
            className="fixed inset-0 bg-[#09090b]/80 backdrop-blur-md z-[210] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-[#09090b] border border-slate-200 dark:border-slate-800/80 rounded-[2rem] max-w-md w-full p-6 shadow-2xl relative"
            >
              <button
                type="button"
                onClick={() => setBuyingStudyId(null)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-100 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full cursor-pointer transition-all duration-150"
                title="Cerrar ventana"
                aria-label="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="space-y-4">
                <div className="w-12 h-12 bg-teal-500/10 text-teal-600 dark:text-teal-400 rounded-2xl flex items-center justify-center border border-teal-500/20">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                </div>
                <div>
                  <h3 className="font-display font-black text-lg text-slate-900 dark:text-white">¿Licenciar Estudio Clínico?</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                    ¿Deseas desbloquear <strong className="text-slate-950 dark:text-teal-300 font-bold">"{buyingStudyTitle}"</strong> por <span className="font-mono font-bold text-teal-600 dark:text-teal-400">${buyingStudyPrice.toLocaleString("es-CL")} CLP</span> de tus fondos de PerioPay?
                  </p>
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={executeBuyStudy}
                    className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs py-3 rounded-xl transition-all cursor-pointer shadow-md shadow-teal-600/10 active:scale-95"
                  >
                    Confirmar Compra
                  </button>
                  <button
                    onClick={() => setBuyingStudyId(null)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs py-3 rounded-xl transition-all cursor-pointer border border-slate-200 dark:border-slate-700/60 active:scale-95"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Success Alert Toast */}
      <AnimatePresence>
        {unlockedSuccessText && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-[250] bg-zinc-950/90 text-white border border-teal-500/30 p-4 rounded-2xl shadow-2xl max-w-sm flex items-start gap-3 backdrop-blur-md"
          >
            <div className="p-1 bg-teal-500/20 text-teal-400 rounded-lg shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
            </div>
            <div>
              <p className="text-xs font-bold text-teal-400">¡Caso Desbloqueado!</p>
              <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">{unlockedSuccessText}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
