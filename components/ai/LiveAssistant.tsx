
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';
import { Mic, MicOff, X, Zap, Loader2, ShieldAlert, Key, Send } from 'lucide-react';
import { useNotification } from '../../contexts/NotificationContext';
import { useLanguage } from '../../contexts/LanguageContext';

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

export const LiveAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isGeneratingText, setIsGeneratingText] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [transcription, setTranscription] = useState<string[]>([]);
  const { addNotification } = useNotification();
  const { isApiRestricted, language, checkAndPromptKey } = useLanguage();
  
  const audioContextsRef = useRef<{ input: AudioContext; output: AudioContext } | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcription]);

  const getFullLanguageName = (langCode: string) => {
    switch (langCode) {
      case 'da': return 'Danish (Dansk)';
      case 'no': return 'Norwegian (Norsk)';
      case 'sv': return 'Swedish (Svenska)';
      default: return 'English';
    }
  };

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() || isGeneratingText || isApiRestricted) return;

    const userMsg = textInput.trim();
    setTextInput('');
    setTranscription(prev => [...prev, `Q: ${userMsg}`]);
    setIsGeneratingText(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const currentLangName = getFullLanguageName(language);
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: userMsg,
        config: {
          systemInstruction: `You are an intelligent assistant for VoltStore Solar Distribution. Help customers select the right energy equipment. ALWAYS respond in ${currentLangName} language.`,
        }
      });

      const aiText = response.text;
      if (aiText) {
        setTranscription(prev => [...prev, aiText]);
      }
    } catch (err: any) {
      console.error("Text AI Error:", err);
      const errStr = String(err).toLowerCase();
      if (errStr.includes('429') || errStr.includes('quota')) {
        addNotification("Daily request limit exceeded. Try again later or select your own key.", "info");
        setTranscription(prev => [...prev, "Sorry, the free request limit for today has been reached. Please come back tomorrow or connect your own API key in the settings."]);
      } else if (errStr.includes('503')) {
        addNotification("AI service is temporarily overloaded (503). Try again later.", "info");
      } else {
        addNotification("Error sending request", "error");
      }
    } finally {
      setIsGeneratingText(false);
    }
  };

  const stopSession = () => {
    if (sessionRef.current) {
      try { sessionRef.current.close(); } catch (e) {}
      sessionRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextsRef.current) {
      audioContextsRef.current.input.close();
      audioContextsRef.current.output.close();
      audioContextsRef.current = null;
    }
    for (const source of sourcesRef.current) {
      try { source.stop(); } catch (e) {}
    }
    sourcesRef.current.clear();
    setIsActive(false);
    setIsConnecting(false);
  };

  const startSession = async () => {
    if (isApiRestricted) {
      addNotification("The current API key is restricted or leaked. Please select a valid key.", "error");
      await checkAndPromptKey();
      return;
    }

    setIsConnecting(true);
    try {
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextsRef.current = { input: inputCtx, output: outputCtx };
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const apiKey = process.env.API_KEY;
      const ai = new GoogleGenAI({ apiKey });
      const currentLangName = getFullLanguageName(language);

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setIsActive(true);
            setIsConnecting(false);
            
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              sessionPromise.then(session => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio && audioContextsRef.current) {
              const { output: ctx } = audioContextsRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(ctx.destination);
              source.addEventListener('ended', () => sourcesRef.current.delete(source));
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }

            if (message.serverContent?.outputTranscription?.text) {
              const text = message.serverContent.outputTranscription.text;
              setTranscription(prev => [...prev, text]);
            }
          },
          onerror: (e: any) => {
            const errStr = String(e).toLowerCase();
            console.error("Live Assistant Error:", errStr);
            if (errStr.includes('leaked') || errStr.includes('403')) {
               addNotification("API Key Blocked: Please select your own API Key.", "error");
            } else if (errStr.includes('429') || errStr.includes('quota')) {
               addNotification("Request limit exceeded.", "info");
            } else if (errStr.includes('503')) {
               addNotification("AI service temporarily unavailable (503).", "info");
            }
            stopSession();
          },
          onclose: () => stopSession(),
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } },
          },
          outputAudioTranscription: {},
          systemInstruction: `You are an intelligent assistant for VoltStore Solar Distribution. Help customers select the right energy equipment. IMPORTANT: ALWAYS respond in ${currentLangName} language. Even if they speak to you in another language, politely guide them using ${currentLangName}.`,
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (err: any) {
      console.error("Live AI Connection Error:", err);
      stopSession();
    }
  };

  useEffect(() => {
    return () => stopSession();
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      {!isOpen ? (
        <button 
          onClick={() => setIsOpen(true)}
          className={`p-4 rounded-full shadow-2xl hover:scale-110 transition-all flex items-center gap-2 group ${isApiRestricted ? 'bg-rose-500' : 'bg-slate-900'} text-white`}
        >
          <div className={`${isApiRestricted ? 'bg-rose-100' : 'bg-yellow-400'} p-1.5 rounded-full group-hover:rotate-12 transition-transform`}>
            {isApiRestricted ? <ShieldAlert size={18} className="text-rose-600" /> : <Zap size={18} className="text-yellow-950 fill-yellow-950" />}
          </div>
          <span className="font-bold text-xs pr-2">{isApiRestricted ? 'Blocked' : 'Questions?'}</span>
        </button>
      ) : (
        <div className="bg-white w-80 rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden animate-fade-in flex flex-col">
          <div className="bg-slate-900 p-6 flex justify-between items-center text-white shrink-0">
            <div className="flex items-center gap-2">
              <div className="bg-yellow-400 p-1 rounded-lg">
                <Zap size={14} className="text-slate-900 fill-slate-900" />
              </div>
              <span className="font-black text-[10px] uppercase tracking-widest">Volt Assistant</span>
            </div>
            <button onClick={() => { stopSession(); setIsOpen(false); }} className="text-slate-400 hover:text-white transition-colors"><X size={18}/></button>
          </div>
          
          <div ref={scrollRef} className="p-6 h-64 overflow-y-auto flex flex-col gap-3 bg-slate-50/50 custom-scrollbar">
            {isApiRestricted ? (
               <div className="flex flex-col items-center justify-center h-full text-center gap-4 px-4">
                  <ShieldAlert className="text-rose-400" size={40} />
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
                    API key blocked. <br/>
                    Please use your own key.
                  </p>
                  <button 
                    onClick={() => checkAndPromptKey()}
                    className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 transition-all"
                  >
                    <Key size={14} /> Select Key
                  </button>
               </div>
            ) : (
              <>
                {transcription.length === 0 && !isConnecting && !isGeneratingText && (
                  <p className="text-[10px] text-slate-400 text-center font-bold mt-12 px-4 leading-relaxed uppercase tracking-widest">
                    Welcome! Write a question or use voice communication.
                  </p>
                )}
                {isConnecting && (
                  <div className="flex flex-col items-center justify-center h-full gap-3">
                    <Loader2 className="animate-spin text-yellow-500" size={24} />
                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em]">Connecting...</p>
                  </div>
                )}
                {transcription.map((t, i) => (
                  <div key={i} className={`p-4 rounded-2xl text-[11px] font-medium shadow-sm border animate-fade-in leading-relaxed ${
                    t.startsWith('Q: ') ? 'bg-emerald-50 border-emerald-100 text-emerald-900 ml-4' : 'bg-white border-slate-100 text-slate-700 mr-4'
                  }`}>
                    {t.replace(/^Q: /, '')}
                  </div>
                ))}
                {isGeneratingText && (
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 animate-pulse flex items-center gap-2">
                    <div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce"></div>
                    <div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="p-4 bg-white border-t border-slate-100 space-y-4">
            <form onSubmit={handleTextSubmit} className="relative group">
              <input 
                type="text" 
                value={textInput}
                disabled={isApiRestricted || isGeneratingText}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Write a question..."
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-4 pr-12 py-3 text-[11px] font-medium outline-none focus:border-emerald-400 focus:bg-white transition-all disabled:opacity-50"
              />
              <button 
                type="submit"
                disabled={!textInput.trim() || isGeneratingText}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-emerald-500 disabled:opacity-30 transition-colors"
              >
                <Send size={16} />
              </button>
            </form>

            <div className="flex justify-center">
              <button 
                disabled={isConnecting || isApiRestricted || isGeneratingText}
                onClick={isActive ? stopSession : startSession}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-xl active:scale-90 ${
                  isActive ? 'bg-red-500 text-white animate-pulse' : 'bg-yellow-400 text-yellow-950 hover:bg-yellow-500'
                } disabled:opacity-30 disabled:grayscale`}
              >
                {isActive ? <MicOff size={18} /> : <Mic size={18} />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
