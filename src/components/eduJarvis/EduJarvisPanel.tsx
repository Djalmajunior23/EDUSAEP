import React, { useState, useMemo, useRef } from 'react';
import { Send, Bot, PieChart, MessageSquare, Terminal, Image as ImageIcon, X } from 'lucide-react';
import { sendJarvisCommand } from '../../services/eduJarvisService';
import { EduJarvisMessageType, UserRole } from '../../types/eduJarvisTypes';
import { EduJarvisHeader } from './EduJarvisHeader';
import { EduJarvisChat } from './EduJarvisChat';
import { EduJarvisQuickActions, QuickAction } from './EduJarvisQuickActions';
import { EduJarvisVoiceButton } from './EduJarvisVoiceButton';
import { EduJarvisDashboard } from './EduJarvisDashboard';
import { EduJarvisCommandPalette } from './EduJarvisCommandPalette';
import { auth } from '../../firebase';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { baseInputSchema } from '../../utils/validation';

interface Props {
  userRole: UserRole;
  contextData?: any;
  isOpen: boolean;
  onClose: () => void;
}

type ViewMode = 'chat' | 'dashboard';

export function EduJarvisPanel({ userRole, contextData, isOpen, onClose }: Props) {
  const [messages, setMessages] = useState<EduJarvisMessageType[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('chat');
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const quickActions = useMemo<QuickAction[]>(() => {
    if (userRole === 'PROFESSOR' || userRole === 'ADMIN' || userRole === 'TEACHER') {
      return [
        { id: '1', label: 'Gerar Simulado', icon: '📝', prompt: '/criar-simulado' },
        { id: '2', label: 'Estudo de Caso', icon: '📁', prompt: '/criar-estudo-caso' },
        { id: '3', label: 'Aula Invertida', icon: '🔄', prompt: '/criar-aula-invertida' },
        { id: '4', label: 'Análise de Turma', icon: '📊', prompt: '/analisar-turma' },
        { id: '5', label: 'Plano de Aula', icon: '📅', prompt: '/gerar-plano' }
      ];
    }
    return [
      { id: '6', label: 'Explique Normalização', icon: '🔍', prompt: 'Explique normalização de banco de dados.' },
      { id: '7', label: 'Plano de Estudos', icon: '📖', prompt: '/gerar-trilha' },
      { id: '8', label: 'Meu Desempenho', icon: '📈', prompt: '/analisar-turma' }
    ];
  }, [userRole]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) {
        toast.error('Gêmeo: Imagem muito grande (máx 4MB)');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async (text: string) => {
    // Validate and sanitize input using Zod
    const validationResult = baseInputSchema.safeParse(text);
    
    if (!validationResult.success && !selectedImage) {
      toast.error('Por favor, insira uma mensagem válida.');
      return;
    }

    const sanitizedText = validationResult.success ? validationResult.data : text;

    if (isProcessing) return;

    const userMessage: EduJarvisMessageType = {
      id: Date.now().toString(),
      content: sanitizedText || "Análise de imagem",
      role: 'user',
      createdAt: new Date().toISOString()
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    const imageToSend = selectedImage;
    setSelectedImage(null);
    setIsProcessing(true);
    setIsCommandPaletteOpen(false);

    try {
      const response = await sendJarvisCommand({
        userRole,
        command: sanitizedText,
        image: imageToSend || undefined,
        context: {
          ...contextData,
          currentPath: window.location.pathname
        }
      });

      const assistantMessage: EduJarvisMessageType = {
        id: (Date.now() + 1).toString(),
        content: response.response,
        role: 'assistant',
        createdAt: new Date().toISOString()
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (response.action && response.data?.generatedId) {
        toast.success(`${response.action} gerado com sucesso! ID: ${response.data.generatedId}`);
      }
    } catch (error) {
      console.error(error);
      toast.error('Erro ao processar comando do EduJarvis.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className={clsx(
            "fixed bottom-24 right-6 z-50 flex flex-col bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200/60 dark:border-gray-700/60 overflow-hidden backdrop-blur-sm",
            isExpanded ? "w-[800px] h-[80vh] max-h-[800px]" : "w-[380px] h-[600px] max-h-[80vh]"
          )}
        >
          <EduJarvisHeader 
            onClose={onClose} 
            isExpanded={isExpanded} 
            onToggleExpand={() => setIsExpanded(!isExpanded)} 
          />

          <div className="flex bg-indigo-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 p-1">
            <button 
              onClick={() => setViewMode('chat')}
              className={clsx(
                "flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all",
                viewMode === 'chat' ? "bg-white dark:bg-gray-700 text-indigo-600 shadow-sm" : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
              )}
            >
              <MessageSquare size={14} />
              Chat EduJarvis
            </button>
            <button 
              onClick={() => setViewMode('dashboard')}
              className={clsx(
                "flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all",
                viewMode === 'dashboard' ? "bg-white dark:bg-gray-700 text-indigo-600 shadow-sm" : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
              )}
            >
              <PieChart size={14} />
              Dashboard IA
            </button>
          </div>

          <div className="flex-1 overflow-hidden flex flex-col relative">
            {viewMode === 'chat' ? (
              <>
                <EduJarvisChat messages={messages} isProcessing={isProcessing} />
                <EduJarvisQuickActions actions={quickActions} onSelectAction={handleSend} />
              </>
            ) : (
              <EduJarvisDashboard />
            )}
          </div>

          {viewMode === 'chat' && (
            <div className="p-3 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
              {selectedImage && (
                <div className="mb-2 relative inline-block">
                  <img src={selectedImage} alt="Preview" className="h-20 w-20 object-cover rounded-lg border-2 border-indigo-500 shadow-lg" />
                  <button 
                    onClick={() => setSelectedImage(null)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
              
              <EduJarvisCommandPalette 
                isOpen={isCommandPaletteOpen}
                onSelect={(cmd) => {
                  setInput(cmd);
                  setIsCommandPaletteOpen(false);
                }}
              />
              <div className="relative flex items-center gap-2">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleImageSelect}
                />
                
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                  title="Anexar imagem (Provas/Exercícios)"
                >
                  <ImageIcon size={20} />
                </button>

                <button
                  onClick={() => setIsCommandPaletteOpen(!isCommandPaletteOpen)}
                  className={clsx(
                    "p-2 rounded-lg transition-all",
                    isCommandPaletteOpen ? "bg-indigo-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-500"
                  )}
                  title="Comandos"
                >
                  <Terminal size={20} />
                </button>
                
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend(input);
                      }
                      if (e.key === '/') {
                        setIsCommandPaletteOpen(true);
                      }
                    }}
                    placeholder="Pergunte ao EduJarvis..."
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all"
                    disabled={isProcessing}
                  />
                  <button
                    onClick={() => handleSend(input)}
                    disabled={!input.trim() || isProcessing}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:text-gray-500 text-white rounded-lg transition-colors"
                  >
                    <Send size={16} />
                  </button>
                </div>

                <EduJarvisVoiceButton onTranscript={handleSend} isProcessing={isProcessing} />
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
