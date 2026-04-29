import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import clsx from 'clsx';

interface Props {
  onTranscript: (text: string) => void;
  isProcessing: boolean;
}

export function EduJarvisVoiceButton({ onTranscript, isProcessing }: Props) {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recog = new SpeechRecognition();
      recog.continuous = false;
      recog.interimResults = false;
      recog.lang = 'pt-BR';

      recog.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        onTranscript(transcript);
        setIsListening(false);
      };

      recog.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recog.onend = () => {
        setIsListening(false);
      };

      setRecognition(recog);
    }
  }, [onTranscript]);

  const toggleListening = () => {
    if (isListening) {
      recognition?.stop();
    } else {
      recognition?.start();
      setIsListening(true);
    }
  };

  if (!recognition) return null;

  return (
    <button
      onClick={toggleListening}
      disabled={isProcessing}
      className={clsx(
        "p-2 rounded-lg transition-all flex items-center justify-center",
        isListening 
          ? "bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/30" 
          : "bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700"
      )}
      title={isListening ? "Ouvindo..." : "Comando de voz"}
    >
      {isListening ? <Mic size={20} /> : <MicOff size={20} />}
    </button>
  );
}
