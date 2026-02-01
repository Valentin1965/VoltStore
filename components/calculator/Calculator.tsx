
import React, { useState, useMemo, useEffect } from 'react';
import { useNotification } from '../../contexts/NotificationContext';
import { useCart } from '../../contexts/CartContext';
import { useProducts } from '../../contexts/ProductsContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { 
  Sparkles, RotateCcw, Check, Loader2, ShieldCheck, 
  Activity, Cpu, Zap, Settings2, Target, Wallet 
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { KitComponent, Product } from '../../types';

const OFFLINE_TEMPLATES = {
  economy: {
    en: { title: "Essential Power Kit", description: "Budget-friendly solution focused on basic reliability and core energy needs." },
    da: { title: "Essential Power Kit", description: "Prisbillig løsning med fokus på grundlæggende pålidelighed." }
  },
  optimal: {
    en: { title: "Optimal Energy System Pro", description: "Our most popular configuration balancing performance, price, and long-term efficiency." },
    da: { title: "Optimalt Energisystem Pro", description: "Vores mest populäre konfiguration, der balancerer ydelse og pris." }
  },
  premium: {
    en: { title: "Premium Independence Suite", description: "Top-tier equipment for maximum autonomy and high-load commercial or residential requirements." },
    da: { title: "Premium Independence Suite", description: "Udstyr i topklasse for maksimal autonomi og høje krav." }
  }
};

export const Calculator: React.FC<{ initialStep?: 1 | 2 }> = ({ initialStep }) => {
  const [step, setStep] = useState<1 | 3>(1); 
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ title: string; description: string; } | null>(null);
  const [activeComponents, setActiveComponents] = useState<KitComponent[]>([]);
  
  const { addNotification } = useNotification();
  const { addItem } = useCart();
  const { products } = useProducts();
  const { formatPrice, t, language } = useLanguage();
  
  const [config, setConfig] = useState({ 
    objectType: 'Private House', 
    monthlyUsage: '300-600 kWh/month', 
    purpose: 'Backup Power', 
    budget: 'Optimal' 
  });

  useEffect(() => { 
    if (initialStep === 2) handleCalculate(); 
  }, [initialStep]);

  const useFallback = () => {
    const lang = (language === 'da' || language === 'en') ? language : 'en';
    const budgetKey = config.budget.toLowerCase() as 'economy' | 'optimal' | 'premium';
    const template = OFFLINE_TEMPLATES[budgetKey]?.[lang] || OFFLINE_TEMPLATES.optimal[lang];
    
    setResult({ title: template.title, description: template.description });

    const inverters = products.filter(p => p.category === 'Inverters' && (p.stock || 0) > 0);
    const batteries = products.filter(p => p.category === 'Batteries' && (p.stock || 0) > 0);

    let selectedInv: Product | any;
    let selectedBat: Product | any;

    if (config.budget === 'Economy') {
      selectedInv = [...inverters].sort((a,b) => a.price - b.price)[0];
      selectedBat = [...batteries].sort((a,b) => a.price - b.price)[0];
    } else if (config.budget === 'Premium') {
      selectedInv = [...inverters].sort((a,b) => b.price - a.price)[0];
      selectedBat = [...batteries].sort((a,b) => b.price - a.price)[0];
    } else {
      selectedInv = inverters[Math.floor(inverters.length / 2)];
      selectedBat = batteries[Math.floor(batteries.length / 2)];
    }

    const finalInv = selectedInv || { id: 'def-inv', name: 'Standard Inverter', price: 1200 };
    const finalBat = selectedBat || { id: 'def-bat', name: 'Lithium Battery', price: 1500 };

    let invQty = config.objectType === 'Business' ? 2 : 1;
    let batQty = config.monthlyUsage === '600+ kWh/month' ? 2 : 1;
    if (config.objectType === 'Business') batQty *= 2;

    setActiveComponents([
      { 
        id: finalInv.id, 
        name: (typeof finalInv.name === 'string' ? finalInv.name : finalInv.name[lang]) || 'Inverter Unit', 
        price: finalInv.price, 
        quantity: invQty, 
        alternatives: [] 
      },
      { 
        id: finalBat.id, 
        name: (typeof finalBat.name === 'string' ? finalBat.name : finalBat.name[lang]) || 'Battery Storage', 
        price: finalBat.price, 
        quantity: batQty, 
        alternatives: [] 
      }
    ]);
    setStep(3);
  };

  const handleCalculate = async () => {
    // Пріоритет ключів для Vercel та локального середовища
    const apiKey = process.env.API_KEY || import.meta.env.VITE_API_KEY || import.meta.env.VITE_GEMINI_API_KEY;
    
    if (!apiKey || apiKey === 'undefined' || apiKey === 'null' || apiKey.length < 10) {
      console.warn("Gemini API key not found. Using local logic.");
      useFallback();
      return;
    }

    setLoading(true);
    try {
      const inventoryContext = products
        .filter(p => (p.stock || 0) > 0)
        .slice(0, 15)
        .map(p => `ID: ${p.id}, Name: ${typeof p.name === 'string' ? p.name : p.name.en}, Price: ${p.price}`)
        .join('\n');

      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Design a professional solar kit. 
      Object: ${config.objectType}, Budget: ${config.budget}, Usage: ${config.monthlyUsage}. 
      Use actual inventory IDs: ${inventoryContext}. 
      Response MUST be JSON: {"title": "System Name", "description": "Short reasoning", "components": [{"id": "ID", "name": "Name", "price": number, "quantity": number, "alternatives": []}]}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      // ВАЖЛИВО: Використовуємо .text як властивість
      const rawText = response.text || '';
      const data = JSON.parse(rawText);
      
      if (data.components) {
        setResult({ title: data.title, description: data.description });
        setActiveComponents(data.components);
        setStep(3);
      } else {
        useFallback();
      }
    } catch (err) {
      console.error("Gemini Error:", err);
      useFallback();
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
            {value === opt && <Check size={14} className="text-emerald-600 animate-in zoom-in" />}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto py-6 animate-fade-in pb-20 px-4">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 bg-slate-900 text-emerald-400 px-5 py-2 rounded-full text-[10px] font-black uppercase mb-4 shadow-xl">
          <Cpu size={14} /> Energy Architect
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 uppercase tracking-tighter mb-4">System Parameters</h1>
      </div>

      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl overflow-hidden relative">
        {loading && (
          <div className="absolute inset-0 z-[60] bg-white/95 backdrop-blur-md flex flex-col items-center justify-center gap-6 animate-fade-in">
            <Loader2 className="text-emerald-500 animate-spin" size={56} />
            <div className="text-center">
              <p className="text-xs font-black uppercase text-slate-900 tracking-widest">{t('ai_generating')}</p>
              <p className="text-[9px] text-slate-400 uppercase font-bold mt-2">Analyzing warehouse stock...</p>
            </div>
          </div>
        )}

        <div className="p-8 md:p-12">
          {step === 1 ? (
            <div className="space-y-10">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <Selector label="Object" icon={Settings2} value={config.objectType} options={['Private House', 'Business']} onChange={(v:any)=>setConfig({...config, objectType:v})}/>
                <Selector label="Usage" icon={Activity} value={config.monthlyUsage} options={['< 300 kWh/month', '300-600 kWh/month', '600+ kWh/month']} onChange={(v:any)=>setConfig({...config, monthlyUsage:v})}/>
                <Selector label="Goal" icon={Target} value={config.purpose} options={['Backup Power', 'Autonomy', 'Savings']} onChange={(v:any)=>setConfig({...config, purpose:v})}/>
                <Selector label="Budget" icon={Wallet} value={config.budget} options={['Economy', 'Optimal', 'Premium']} onChange={(v:any)=>setConfig({...config, budget:v})}/>
              </div>
              <div className="flex justify-center pt-6">
                <button 
                  onClick={handleCalculate} 
                  className="w-full max-w-lg bg-slate-900 text-white py-6 rounded-[2rem] font-black uppercase tracking-widest text-[13px] hover:bg-emerald-600 transition-all shadow-2xl flex items-center justify-center gap-4 group"
                >
                  {t('generate_solution')} <Sparkles size={20} className="group-hover:rotate-12 transition-transform" />
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
                  <RotateCcw size={12}/> {t('back_to_cart')}
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2 space-y-4">
                  {activeComponents.map(c => (
                    <div key={c.id} className="p-6 bg-white rounded-[2rem] border border-slate-100 flex justify-between items-center group hover:border-emerald-400 transition-all shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                          <Zap size={20} />
                        </div>
                        <div>
                          <div className="font-black text-slate-900 text-[11px] uppercase tracking-tight">{c.name}</div>
                          <div className="text-[9px] text-slate-400 font-bold uppercase tracking-tight mt-0.5">{c.quantity} unit{c.quantity > 1 ? 's' : ''} • {formatPrice(c.price)}</div>
                        </div>
                      </div>
                      <div className="font-black text-slate-900 text-[13px] tracking-tighter">{formatPrice(c.price * c.quantity)}</div>
                    </div>
                  ))}
                </div>

                <div className="bg-slate-950 p-10 rounded-[3rem] text-center text-white shadow-2xl relative overflow-hidden h-fit">
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
                        }, activeComponents.map(ac => ({ id: ac.id, name: ac.name, price: ac.price, quantity: ac.quantity })));
                        addNotification('Custom configuration added to cart', 'success');
                     }}
                     className="w-full bg-emerald-500 text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-white hover:text-emerald-950 transition-all shadow-xl active:scale-95"
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
