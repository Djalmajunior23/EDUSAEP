import React, { useState, useEffect, useCallback } from 'react';
import { 
  FolderPlus, 
  Upload, 
  File, 
  FileText, 
  Image as ImageIcon, 
  Video, 
  Link as LinkIcon, 
  MoreVertical, 
  Search, 
  Filter, 
  Share2, 
  Download, 
  Eye, 
  Trash2, 
  X, 
  Plus, 
  ChevronRight,
  Folder,
  Tag,
  Loader2,
  AlertCircle,
  ExternalLink,
  BarChart2,
  Play,
  Copy,
  FileSpreadsheet
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useDropzone } from 'react-dropzone';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp, 
  orderBy,
  increment
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytesResumable, 
  getDownloadURL 
} from 'firebase/storage';
import { db, storage } from '../../firebase';
import { toast } from 'sonner';
import { DidacticResource, UserProfile, Class } from '../../types';
import { cn } from '../../lib/utils';

interface ResourcesManagerViewProps {
  user: any;
  userProfile: UserProfile;
}

export function ResourcesManagerView({ user, userProfile }: ResourcesManagerViewProps) {
  const [resources, setResources] = useState<DidacticResource[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showResourceDetails, setShowResourceDetails] = useState<DidacticResource | null>(null);

  const fetchResources = useCallback(async () => {
    try {
      const q = query(
        collection(db, 'resources'),
        where('ownerId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as DidacticResource[];
      setResources(list);
    } catch (e) {
      console.error("Error fetching resources:", e);
      // toast.error("Erro ao carregar recursos.");
    } finally {
      setLoading(false);
    }
  }, [user.uid]);

  const fetchClasses = useCallback(async () => {
    try {
      const snap = await getDocs(collection(db, 'classes'));
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Class[];
      setClasses(list);
    } catch (e) {
      console.error("Error fetching classes:", e);
    }
  }, []);

  useEffect(() => {
    fetchResources();
    fetchClasses();
  }, [fetchResources, fetchClasses]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    setUploading(true);
    setUploadProgress(0);

    for (const file of acceptedFiles) {
      const storageInstance = storage.current;
      if (!storageInstance) {
        toast.error("Serviço de armazenamento (Firebase Storage) não está disponível. Por favor, utilize links externos.");
        setUploading(false);
        return;
      }
      try {
        const fileType = getFileType(file.name);
        const storagePath = `resources/${user.uid}/${Date.now()}_${file.name}`;
        const storageRef = ref(storageInstance, storagePath);
        
        const uploadTask = uploadBytesResumable(storageRef, file);

        await new Promise((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setUploadProgress(progress);
            },
            (error) => {
              console.error("Upload error:", error);
              reject(error);
            },
            async () => {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              
              const newResource: Omit<DidacticResource, 'id'> = {
                title: file.name,
                type: fileType as any,
                origin: 'UPLOAD_INTERNO',
                storagePath,
                externalUrl: downloadURL,
                ownerId: user.uid,
                sharedWithClasses: [],
                tags: [],
                stats: {
                  views: 0,
                  downloads: 0
                },
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
              };

              await addDoc(collection(db, 'resources'), newResource);
              resolve(true);
            }
          );
        });
      } catch (error) {
        toast.error(`Erro ao enviar ${file.name}`);
      }
    }

    setUploading(false);
    setUploadProgress(0);
    setShowUploadModal(false);
    toast.success("Arquivos enviados com sucesso!");
    fetchResources();
  }, [user.uid, fetchResources]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const getFileType = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return 'PDF';
    if (ext === 'ppt' || ext === 'pptx') return 'Slides';
    if (ext === 'doc' || ext === 'docx') return 'DOC';
    if (ext === 'xls' || ext === 'xlsx') return 'XLS';
    if (['jpg', 'jpeg', 'png', 'svg', 'webp'].includes(ext || '')) return 'Image';
    if (['mp4', 'mov', 'avi'].includes(ext || '')) return 'Video';
    return 'Other';
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'PDF': return <FileText className="text-red-500" />;
      case 'Slides': return <ImageIcon className="text-orange-500" />;
      case 'DOC': return <File className="text-blue-500" />;
      case 'XLS': return <FileSpreadsheet className="text-emerald-500" />;
      case 'Image': return <ImageIcon className="text-purple-500" />;
      case 'Video': return <Video className="text-indigo-500" />;
      case 'Link': return <LinkIcon className="text-slate-500" />;
      default: return <File className="text-gray-500" />;
    }
  };

  const handleDelete = async (resource: DidacticResource) => {
    if (!resource.id) return;
    if (!window.confirm(`Deseja realmente excluir "${resource.title}"?`)) return;

    try {
      await deleteDoc(doc(db, 'resources', resource.id));
      // In a real app we'd also delete from Firebase Storage if it's UPLOAD_INTERNO
      toast.success("Recurso removido.");
      fetchResources();
    } catch (e) {
      toast.error("Erro ao remover recurso.");
    }
  };

  const handleShare = async (resource: DidacticResource, classIds: string[]) => {
    if (!resource.id) return;
    try {
      await updateDoc(doc(db, 'resources', resource.id), {
        sharedWithClasses: classIds,
        updatedAt: serverTimestamp()
      });
      toast.success("Configurações de compartilhamento atualizadas.");
      fetchResources();
    } catch (e) {
      toast.error("Erro ao atualizar compartilhamento.");
    }
  };

  const trackView = async (resource: DidacticResource) => {
    if (!resource.id) return;
    try {
      await updateDoc(doc(db, 'resources', resource.id), {
        'stats.views': increment(1)
      });
    } catch (e) {
      console.error(e);
    }
  };

  const filteredResources = resources.filter(r => {
    const matchesSearch = r.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || r.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-3xl font-black text-gray-900 flex items-center gap-3">
            <FolderPlus className="text-indigo-600" size={32} /> Gestão de Recursos Didáticos
          </h2>
          <p className="text-gray-500 mt-1">Materiais de apoio, slides, trilhas e documentos pedagógicos.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowUploadModal(true)}
            className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center gap-2"
          >
            <Plus size={20} /> Adicionar Recurso
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total de Arquivos', value: resources.length, icon: File, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Visualizações', value: resources.reduce((acc, r) => acc + (r.stats?.views || 0), 0), icon: Eye, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Downloads', value: resources.reduce((acc, r) => acc + (r.stats?.downloads || 0), 0), icon: Download, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Classes Atendidas', value: new Set(resources.flatMap(r => r.sharedWithClasses)).size, icon: Share2, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className={cn("p-3 rounded-2xl", stat.bg, stat.color)}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase">{stat.label}</p>
              <p className="text-2xl font-black text-gray-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text"
            placeholder="Buscar por título ou tag..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
        <select 
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-gray-600"
        >
          <option value="all">Todos os Tipos</option>
          <option value="PDF">PDF</option>
          <option value="Slides">Slides</option>
          <option value="Video">Vídeo</option>
          <option value="Image">Imagem</option>
          <option value="Link">Links</option>
        </select>
      </div>

      {/* Resources Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-20 space-y-4">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
          <p className="text-gray-500 font-medium">Carregando seus recursos didáticos...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredResources.map((resource) => (
            <motion.div 
              layout
              key={resource.id}
              className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all group overflow-hidden"
            >
              {/* Asset Header/Preview */}
              <div className="h-32 bg-gray-50 flex items-center justify-center relative group">
                <div className="transform scale-[2] opacity-20 group-hover:opacity-40 transition-opacity">
                  {getFileIcon(resource.type)}
                </div>
                {resource.type === 'Image' && resource.externalUrl && (
                  <img src={resource.externalUrl} className="absolute inset-0 w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                )}
                {resource.type === 'Video' && (
                  <Play size={40} className="text-indigo-600 absolute z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                  <button onClick={() => setShowResourceDetails(resource)} className="p-2 bg-white/80 backdrop-blur-sm rounded-xl text-gray-600 hover:text-indigo-600 shadow-sm">
                    <Eye size={18} />
                  </button>
                  <button onClick={() => handleDelete(resource)} className="p-2 bg-white/80 backdrop-blur-sm rounded-xl text-gray-600 hover:text-red-600 shadow-sm">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              {/* Asset Info */}
              <div className="p-5 space-y-3">
                <div>
                  <h3 className="font-bold text-gray-900 truncate" title={resource.title}>{resource.title}</h3>
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest flex items-center gap-1 mt-1">
                    {getFileIcon(resource.type)} {resource.type} • {resource.origin.replace('_', ' ')}
                  </p>
                </div>

                <div className="flex gap-1 flex-wrap">
                  {resource.tags.map(tag => (
                    <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-md text-[9px] font-black uppercase">{tag}</span>
                  ))}
                  {resource.sharedWithClasses.length > 0 && (
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-md text-[9px] font-black uppercase">
                      Compartilhado
                    </span>
                  )}
                </div>

                <div className="pt-3 border-t border-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-[10px] text-gray-400 font-bold">
                    <span className="flex items-center gap-1"><Eye size={12} /> {resource.stats.views}</span>
                    <span className="flex items-center gap-1"><Download size={12} /> {resource.stats.downloads}</span>
                  </div>
                  <a 
                    href={resource.externalUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    onClick={() => trackView(resource)}
                    className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                  >
                    <Download size={16} />
                  </a>
                </div>
              </div>
            </motion.div>
          ))}

          {filteredResources.length === 0 && (
            <div className="col-span-full py-20 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200">
              <Folder size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-bold text-gray-900">Nenhum recurso encontrado</h3>
              <p className="text-gray-500">Adicione novos arquivos ou ajuste sua busca.</p>
            </div>
          )}
        </div>
      )}

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-gray-900 w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b dark:border-gray-800 flex items-center justify-between">
                <h3 className="text-xl font-bold dark:text-white flex items-center gap-2">
                  <Upload size={24} className="text-indigo-600" /> Upload de Recursos
                </h3>
                <button onClick={() => setShowUploadModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                  <X size={20} className="text-gray-400" />
                </button>
              </div>

              <div className="p-8 space-y-6">
                <div 
                  {...getRootProps()} 
                  className={cn(
                    "border-4 border-dashed rounded-3xl p-12 text-center transition-all cursor-pointer",
                    isDragActive ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20" : "border-gray-100 dark:border-gray-800 hover:border-indigo-300"
                  )}
                >
                  <input {...getInputProps()} />
                  <Upload size={48} className={cn("mx-auto mb-4 transition-colors", isDragActive ? "text-indigo-600" : "text-gray-300")} />
                  <p className="text-lg font-bold text-gray-700 dark:text-gray-300">Arraste seus arquivos aqui</p>
                  <p className="text-sm text-gray-400 mt-1">Ou clique para selecionar de pastas locais</p>
                  <div className="mt-6 flex justify-center gap-3">
                    <span className="px-3 py-1 bg-gray-50 dark:bg-gray-800 text-[10px] text-gray-400 font-bold uppercase rounded-lg border border-gray-100 dark:border-gray-700 font-mono">PDF</span>
                    <span className="px-3 py-1 bg-gray-50 dark:bg-gray-800 text-[10px] text-gray-400 font-bold uppercase rounded-lg border border-gray-100 dark:border-gray-700 font-mono">XLSX</span>
                    <span className="px-3 py-1 bg-gray-50 dark:bg-gray-800 text-[10px] text-gray-400 font-bold uppercase rounded-lg border border-gray-100 dark:border-gray-700 font-mono">PPTX</span>
                  </div>
                </div>

                {uploading && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold text-gray-500">
                      <span>Processando arquivos...</span>
                      <span>{Math.round(uploadProgress)}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadProgress}%` }}
                        className="h-full bg-indigo-600" 
                      />
                    </div>
                  </div>
                )}

                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex gap-3 text-amber-700 dark:text-amber-400">
                  <AlertCircle size={18} className="shrink-0" />
                  <p className="text-xs font-medium leading-relaxed">
                    Certifique-se de que os materiais respeitem as diretrizes de direitos autorais institucionais. Arquivos acima de 50MB não são permitidos.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Resource Details / Sharing Modal */}
      <AnimatePresence>
        {showResourceDetails && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-gray-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b dark:border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl text-indigo-600">
                    {getFileIcon(showResourceDetails.type)}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold dark:text-white truncate max-w-md">{showResourceDetails.title}</h3>
                    <p className="text-xs text-gray-400">Enviado em {new Date(showResourceDetails.createdAt?.toDate?.() || showResourceDetails.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <button onClick={() => setShowResourceDetails(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                  <X size={20} className="text-gray-400" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                {/* Stats & Actions */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl text-center">
                    <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Visualizações</p>
                    <p className="text-xl font-black text-gray-900 dark:text-white">{showResourceDetails.stats.views}</p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl text-center">
                    <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Engajamento</p>
                    <p className="text-xl font-black text-emerald-600">84%</p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl text-center">
                    <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Downloads</p>
                    <p className="text-xl font-black text-indigo-600">{showResourceDetails.stats.downloads}</p>
                  </div>
                </div>

                {/* Sharing */}
                <div className="space-y-4">
                  <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Share2 size={18} className="text-indigo-600" /> Compartilhamento por Turma
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {classes.map(cls => (
                      <button
                        key={cls.id}
                        onClick={() => {
                          const current = showResourceDetails.sharedWithClasses || [];
                          const updated = current.includes(cls.id) 
                            ? current.filter(id => id !== cls.id)
                            : [...current, cls.id];
                          handleShare(showResourceDetails, updated);
                          setShowResourceDetails({ ...showResourceDetails, sharedWithClasses: updated });
                        }}
                        className={cn(
                          "px-4 py-3 rounded-2xl border text-sm font-bold transition-all flex items-center justify-between",
                          showResourceDetails.sharedWithClasses.includes(cls.id)
                            ? "bg-indigo-600 border-indigo-600 text-white shadow-md"
                            : "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-indigo-200"
                        )}
                      >
                        {cls.name}
                        {showResourceDetails.sharedWithClasses.includes(cls.id) && <Plus size={16} className="rotate-45" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* External Links */}
                <div className="space-y-4">
                  <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <ExternalLink size={18} className="text-indigo-600" /> Links de Acesso
                  </h4>
                  <div className="p-4 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 flex items-center justify-between">
                    <div className="flex-1 truncate pr-4 text-xs font-mono text-indigo-700 dark:text-indigo-400">
                      {showResourceDetails.externalUrl}
                    </div>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(showResourceDetails.externalUrl || '');
                        toast.success("Link copiado!");
                      }}
                      className="p-2 bg-white dark:bg-gray-800 rounded-xl text-indigo-600 shadow-sm"
                    >
                      <Copy size={16} />
                    </button>
                  </div>
                </div>

                {/* Tags */}
                <div className="space-y-4">
                  <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Tag size={18} className="text-indigo-600" /> Tags Pedagógicas
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {showResourceDetails.tags.map(tag => (
                      <span key={tag} className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-xl text-xs font-bold">
                        {tag}
                      </span>
                    ))}
                    <button className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-xl text-xs font-bold border border-dashed border-indigo-200 flex items-center gap-1">
                      <Plus size={12} /> Adicionar Tag
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t dark:border-gray-800 flex justify-end gap-3 bg-gray-50/30 dark:bg-gray-900/30">
                <button onClick={() => setShowResourceDetails(null)} className="px-6 py-2 rounded-xl font-bold bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">Fechar</button>
                <a 
                  href={showResourceDetails.externalUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 flex items-center gap-2"
                >
                  <Eye size={18} /> Visualizar Recurso
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
