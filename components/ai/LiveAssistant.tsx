
import React, { useState, useRef, useEffect } from 'react';
import { X, Zap, Send, Loader2, MessageSquare, AlertCircle } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { GoogleGenAI } from "@google/genai";

export const LiveAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string; isError?: boolean }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    // Sanitize API Key
    const rawKey = process.env.API_KEY || "";
    const key = rawKey.trim().replace(/['"]/g, '');
    
    if (!key || key === "undefined" || key === "") {
      setMessages(prev => [...prev, 
        { role: 'user', text: input },
        { role: 'ai', text: "API key is missing. Check environment variables.", isError: true }
      ]);
      setInput('');
      return;
    }

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: key });
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: userMsg,
        config: {
          systemInstruction: `You are VoltStore Technical Support Specialist. You MUST speak and respond in UKRAINIAN language only. Answer technical questions about solar energy, batteries, and inverters professionally and helpfully.`
        }
      });

      const aiText = response.text || "Вибачте, сталася помилка при обробці вашого запиту.";
      setMessages(prev => [...prev, { role: 'ai', text: aiText }]);
    } catch (err: any) {
      console.error('AI Chat Error:', err);
      let errorMsg = "Помилка підключення.";
      
      if (err.message?.includes('429')) {
        const delayMatch = err.message.match(/retry in ([\d.]+)s/);
        const waitTime = delayMatch ? Math.ceil(parseFloat(delayMatch[1])) : 60;
        errorMsg = `Ліміт запитів вичерпано (429). Зачекайте ${waitTime}с.`;
      } else if (err.message?.includes('404')) {
        errorMsg = "Модель не знайдена (404). Спробуйте пізніше.";
      } else if (err.message?.includes('400')) {
        errorMsg = "Помилка ключа API (400). Перевірте налаштування.";
      }
      
      setMessages(prev => [...prev, { role: 'ai', text: errorMsg, isError: true }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      {!isOpen ? (
        <button 
          onClick={() => setIsOpen(true)}
          className="p-4 rounded-full shadow-2xl hover:scale-110 transition-all flex items-center gap-2 group bg-slate-900 text-white"
        >
          <div className="p-1.5 rounded-full bg-yellow-400 group-hover:rotate-12 transition-transform">
            <Zap size={18} className="text-yellow-950 fill-yellow-950" />
          </div>
          <span className="font-bold text-xs pr-2">Volt AI Expert</span>
        </button>
      ) : (
        <div className="bg-white w-[350px] h-[500px] rounded-[2.5rem] shadow-[0_30px_90px_-15px_rgba(0,0,0,0.3)] border border-slate-100 overflow-hidden animate-fade-in flex flex-col">
          <div className="bg-slate-900 p-6 flex justify-between items-center text-white shrink-0">
            <div className="flex items-center gap-2">
              <div className="bg-yellow-400 p-1 rounded-lg">
                <Zap size={14} className="text-slate-900 fill-slate-900" />
              </div>
              <span className="font-black text-[10px] uppercase tracking-widest">Expert Assistant (Flash 3)</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition-colors"><X size={18}/></button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-slate-50/50">
            {messages.length === 0 && (
              <div className="text-center py-10 space-y-4">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-sm text-slate-300">
                  <MessageSquare size={24} />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-6">Запитуйте що завгодно про сонячні системи!</p>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-4 rounded-2xl text-[11px] font-medium leading-relaxed ${
                  m.role === 'user' 
                    ? 'bg-slate-900 text-white rounded-tr-none' 
                    : m.isError 
                    ? 'bg-rose-50 border border-rose-100 text-rose-600 rounded-tl-none' 
                    : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none shadow-sm'
                }`}>
                  {m.isError && <AlertCircle size={12} className="inline mr-1 mb-0.5" />}
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-100 p-4 rounded-2xl rounded-tl-none shadow-sm">
                  <Loader2 size={16} className="animate-spin text-emerald-500" />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="p-4 bg-white border-t border-slate-100">
            <div className="relative group">
              <input 
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && handleSend()}
                placeholder="Напишіть повідомлення..."
                disabled={loading}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl pl-4 pr-12 py-3 text-[11px] font-black outline-none focus:border-emerald-400 focus:bg-white transition-all disabled:opacity-50"
              />
              <button 
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-slate-900 text-white p-2 rounded-lg hover:bg-emerald-500 transition-all shadow-md active:scale-95 disabled:opacity-50"
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
