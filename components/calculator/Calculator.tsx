
import React, { useState, useMemo } from 'react';
import { useNotification } from '../../contexts/NotificationContext';
import { useCart } from '../../contexts/CartContext';
import { useProducts } from '../../contexts/ProductsContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { GoogleGenAI, Type } from "@google/genai";
import { 
  RotateCcw, Check, ShieldCheck, 
  Activity, Cpu, Zap, Settings2, Target, Wallet, Sparkles
} from 'lucide-react';
import { KitComponent } from '../../types';

interface CalculatorProps {
  initialStep?: 1 | 3;
}

export const Calculator: React.FC<CalculatorProps> = ({ initialStep = 1 }) => {
  const [step, setStep] = useState<1 | 3>(initialStep as 1 | 3); 
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ title: string; description: string; } | null>(null);
  const [activeComponents, setActiveComponents] = useState<KitComponent[]>([]);
  
  const { addNotification } = useNotification();
  const { addItem } = useCart();
  const { formatPrice, t, language } = useLanguage();
  
  const [config, setConfig] = useState({ 
    objectType: 'Private House', 
    monthlyUsage: '300-600 kWh/month', 
    purpose: 'Backup Power', 
    budget: 'Optimal'
  });

  const generateAiSolution = async () => {
    // Robust key retrieval
    const apiKey = (import.meta.env.VITE_API_KEY || process.env.API_KEY || "").trim().replace(/['"]/g, '');
    
    if (!apiKey) {
      addNotification("Critical: API Key is missing. Check Vercel/Local settings.", "error");
      return;
    }

    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey });
      
      const prompt = `
        As a Solar Energy Expert, design a system for:
        Object: ${config.objectType}, Monthly Usage: ${config.monthlyUsage}, 
        Primary Goal: ${config.purpose}, Budget Level: ${config.budget}.
        
        IMPORTANT: Return the "title" and "description" in UKRAINIAN language.
        Components names should remain in English technical terms.
        
        Available stock items: Inverters, Batteries, Solar Panels.
        Return a valid JSON object matching the requested schema.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { 
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "System name in Ukrainian" },
              description: { type: Type.STRING, description: "Brief explanation of benefits in Ukrainian" },
              components: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    price: { type: Type.NUMBER, description: "Estimated price in EUR" },
                    quantity: { type: Type.NUMBER }
                  },
                  required: ["name", "price", "quantity"]
                }
              }
            },
            required: ["title", "description", "components"]
          }
        }
      });

      const text = response.text;
      if (!text) throw new Error("Empty response from AI");
      
      const data = JSON.parse(text);
      setResult({ title: data.title, description: data.description });
      
      const components: KitComponent[] = (data.components || []).map((c: any) => ({
        id: `ai-${Math.random().toString(36).substr(2, 9)}`,
        name: c.name,
        price: c.price,
        quantity: c.quantity,
        alternatives: []
      }));

      setActiveComponents(components);
      setStep(3);
      addNotification("System designed by AI Expert", "success");
    } catch (err: any) {
      console.error('AI Calculation Error:', err);
      
      let errorMsg = "AI Service temporarily unavailable.";
      if (err.message?.includes('429')) {
        errorMsg = "Limit reached (429). Please wait 60s.";
      } else if (err.message?.includes('400')) {
        errorMsg = "Invalid API Key or project restriction.";
      }
      
      addNotification(errorMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  const totalPrice = useMemo(() => 
    activeComponents.reduce((s, c) => s + (c.price * c.quantity), 0)
  , [activeComponents]);

  const Selector = ({ label, icon: Icon, value, options, onChange }: any) => (
    <div className="space-y-3">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2">
        <Icon size={12} className="text-emerald-500" /> {label}
      </label>
      <div className="grid grid-cols-1 gap-2">
        {options.map((opt: string) => (
          <button 
            key={opt} 
            onClick={() => onChange(opt)} 
            className={`p-4 rounded-2xl border-2 text-left font-bold transition-all flex justify-between items-center ${value === opt ? 'border-emerald-400 bg-emerald-50 text-emerald-950 shadow-sm' : 'border-slate-50 bg-slate-50/50 text-slate-400 hover:border-slate-200'}`}
          >
            <span className="text-[10px] uppercase tracking-tight">{opt}</span>
            {value === opt && <Check size={14} className="text-emerald-600" />}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto py-6 animate-fade-in pb-20 px-4">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 bg-slate-900 text-emerald-400 px-5 py-2 rounded-full text-[10px] font-black uppercase mb-4 shadow-xl">
          <Sparkles size={14} /> AI Architect
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 uppercase tracking-tighter mb-4">Energy Solution</h1>
      </div>

      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl overflow-hidden relative min-h-[400px]">
        {loading && (
          <div className="absolute inset-0 z-[60] bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[10px] font-black uppercase text-slate-900 tracking-widest">Architect is thinking...</p>
          </div>
        )}

        <div className="p-8 md:p-12">
          {step === 1 ? (
            <div className="space-y-10">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <Selector label="Object" icon={Settings2} value={config.objectType} options={['Private House', 'Business', 'Apartment']} onChange={(v:any)=>setConfig({...config, objectType:v})}/>
                <Selector label="Usage" icon={Activity} value={config.monthlyUsage} options={['< 300 kWh', '300-600 kWh', '600+ kWh']} onChange={(v:any)=>setConfig({...config, monthlyUsage:v})}/>
                <Selector label="Goal" icon={Target} value={config.purpose} options={['Backup', 'Autonomy', 'Savings']} onChange={(v:any)=>setConfig({...config, purpose:v})}/>
                <Selector label="Budget" icon={Wallet} value={config.budget} options={['Economy', 'Optimal', 'Premium']} onChange={(v:any)=>setConfig({...config, budget:v})}/>
              </div>
              
              <div className="flex flex-col items-center pt-6">
                <button 
                  onClick={generateAiSolution} 
                  className="w-full max-w-lg bg-slate-900 text-white py-6 rounded-[2rem] font-black uppercase tracking-widest text-[13px] hover:bg-emerald-600 transition-all shadow-2xl flex items-center justify-center gap-4 group"
                >
                  {t('generate_solution')} <Zap size={20} className="text-emerald-400" />
                </button>
              </div>
            </div>
          ) : result && (
            <div className="animate-fade-in space-y-10">
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-6 border-b border-slate-100 pb-8">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none">{result.title}</h2>
                  <p className="text-[10px] text-slate-500 uppercase font-bold mt-2 tracking-widest max-w-xl">{result.description}</p>
                </div>
                <button onClick={() => setStep(1)} className="px-6 py-3 bg-slate-50 rounded-2xl text-[10px] font-black uppercase text-slate-400 hover:text-emerald-600 transition-all flex items-center gap-2">
                  <RotateCcw size={12}/> New Design
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2 space-y-4">
                  {activeComponents.map((c, i) => (
                    <div key={i} className="p-6 bg-white rounded-[2rem] border border-slate-100 flex justify-between items-center group hover:border-emerald-400 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                          <Zap size={20} />
                        </div>
                        <div>
                          <div className="font-black text-slate-900 text-[11px] uppercase tracking-tight">{c.name}</div>
                          <div className="text-[9px] text-slate-400 font-bold uppercase tracking-tight mt-0.5">{c.quantity} unit{c.quantity > 1 ? 's' : ''}</div>
                        </div>
                      </div>
                      <div className="font-black text-slate-900 text-[13px] tracking-tighter">{formatPrice(c.price * c.quantity)}</div>
                    </div>
                  ))}
                </div>

                <div className="bg-slate-950 p-10 rounded-[3rem] text-center text-white shadow-2xl h-fit">
                   <div className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4">Total System Cost</div>
                   <div className="text-4xl font-black text-emerald-400 mb-8 tracking-tighter leading-none">{formatPrice(totalPrice)}</div>
                   <button 
                     onClick={() => {
                        addItem({
                          id: 'kit-' + Date.now(),
                          name: result.title,
                          description: result.description,
                          price: totalPrice,
                          category: 'Kits',
                          image: null,
                          stock: 1
                        });
                        addNotification('AI Configuration added to cart', 'success');
                     }}
                     className="w-full bg-emerald-500 text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-white hover:text-emerald-950 transition-all shadow-xl"
                   >
                     {t('add_to_cart')}
                   </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
