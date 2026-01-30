
import React, { useState, useMemo, useEffect } from 'react';
import { useNotification } from '../../contexts/NotificationContext';
import { useCart } from '../../contexts/CartContext';
import { useProducts } from '../../contexts/ProductsContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { 
  Sparkles, 
  RotateCcw, 
  Check, 
  Loader2, 
  ShieldCheck, 
  Activity, 
  Cpu, 
  Zap, 
  Settings2,
  RefreshCw,
  ChevronRight,
  Target,
  Wallet,
  ShieldAlert,
  Key
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { KitComponent, Alternative, Product } from '../../types';

const OFFLINE_TEMPLATES = {
  optimal: {
    en: {
      title: "Optimal Energy System Pro",
      description: "Our engineers have pre-assembled this reliable set based on high-demand configurations. You can customize components below.",
    },
    da: {
      title: "Optimalt Energisystem Pro",
      description: "Vores ingeniører har forudmonteret dette pålidelige sæt baseret på konfigurationer med høj efterspørgsel. Du kan tilpasse komponenter nedenfor.",
    },
    sv: {
      title: "Optimalt Energisystem Pro",
      description: "Våra ingenjörer har förmonterat denna pålitliga uppsättning baserat på konfigurationer med hög efterfrågan. Du kan anpassa komponenter nedan.",
    },
    no: {
      title: "Optimalt Energisystem Pro",
      description: "Våre ingeniører har forhåndsmontert dette pålitelige settet basert på konfigurasjoner med høy etterspørsel. Du kan tilpasse komponenter nedenfor.",
    }
  }
};

export interface CalculatorProps {
  initialStep?: 1 | 2;
}

export const Calculator: React.FC<CalculatorProps> = ({ initialStep }) => {
  const [step, setStep] = useState<1 | 3>(1); 
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ title: string; description: string; } | null>(null);
  const [activeComponents, setActiveComponents] = useState<KitComponent[]>([]);
  const [editingCompId, setEditingCompId] = useState<string | null>(null);
  
  const { addNotification } = useNotification();
  const { addItem } = useCart();
  const { products } = useProducts();
  const { formatPrice, t, language, isApiRestricted, checkAndPromptKey } = useLanguage();
  
  const [config, setConfig] = useState({
    objectType: 'Private House',
    monthlyUsage: '300-600 kWh/month',
    purpose: 'Backup Power',
    budget: 'Optimal'
  });

  useEffect(() => {
    if (initialStep === 2) {
      useFallback();
    }
  }, [initialStep]);

  const useFallback = () => {
    const langKey = language as keyof typeof OFFLINE_TEMPLATES.optimal;
    const template = OFFLINE_TEMPLATES.optimal[langKey] || OFFLINE_TEMPLATES.optimal.en;
    setResult({ title: template.title, description: template.description });
    
    const inverter = products.find(p => p.category === 'Inverters' && p.stock && p.stock > 0) || 
                   { id: 'def-inv', name: 'Standard Hybrid Inverter 5kW', price: 1100 };
    const battery = products.find(p => p.category === 'Batteries' && p.stock && p.stock > 0) || 
                  { id: 'def-bat', name: 'LiFePO4 Battery 5.12kWh', price: 1450 };

    setActiveComponents([
      { 
        id: inverter.id, name: (typeof inverter.name === 'string' ? inverter.name : (inverter.name as any).en) || 'Inverter', 
        price: inverter.price, quantity: 1, alternatives: [] 
      },
      { 
        id: battery.id, name: (typeof battery.name === 'string' ? battery.name : (battery.name as any).en) || 'Battery Storage', 
        price: battery.price, quantity: 1, alternatives: [] 
      }
    ]);
    setStep(3);
  };

  const getFullLanguageName = (langCode: string) => {
    switch (langCode) {
      case 'da': return 'Danish (Dansk)';
      case 'no': return 'Norwegian (Norsk)';
      case 'sv': return 'Swedish (Svenska)';
      default: return 'English';
    }
  };

  const handleCalculate = async () => {
    if (isApiRestricted) {
       addNotification("API Key is restricted. Please select a valid key to use AI features.", "error");
       await checkAndPromptKey();
       return;
    }

    setLoading(true);
    try {
      const inventoryContext = products
        .filter(p => (p.stock || 0) > 0)
        .slice(0, 15)
        .map(p => `ID: ${p.id}, Name: ${p.name}, Category: ${p.category}, Price: ${p.price} EUR`)
        .join('\n');

      const apiKey = process.env.API_KEY;
      if (!apiKey || apiKey === 'undefined') throw new Error("Missing API Key");

      const ai = new GoogleGenAI({ apiKey });
      const currentFullLang = getFullLanguageName(language);

      const prompt = `Energy expert task for VoltStore. Assemble optimal equipment set: 
      Object: ${config.objectType}, Monthly Usage: ${config.monthlyUsage}, Goal: ${config.purpose}, Budget: ${config.budget}.
      Respond in ${currentFullLang}. All prices in EUR.
      CONTEXT (Inventory prices are in EUR):
      ${inventoryContext}
      JSON: {"title": "str", "description": "str", "components": [{"id": "str", "name": "str", "price": num, "quantity": 1, "alternatives": []}]}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      const data = JSON.parse(response.text || '{}');
      setResult({ title: data.title || 'Power System', description: data.description || '' });
      setActiveComponents(data.components || []);
      setStep(3);
      addNotification('Energy Constructor generated your solution', 'success');
    } catch (err: any) {
      const errStr = String(err).toLowerCase();
      if (errStr.includes('429') || errStr.includes('quota')) {
        addNotification("AI quota exceeded. Using engineer template.", "info");
      } else {
        console.error("Energy Constructor Error:", err);
      }
      useFallback();
    } finally {
      setLoading(false);
    }
  };

  const replaceComponent = (componentId: string, alt: Alternative) => {
    setActiveComponents(prev => prev.map(comp => {
      if (comp.id === componentId) {
        const currentAsAlt = { id: comp.id, name: comp.name, price: comp.price, quantity: comp.quantity };
        const newAlts = [currentAsAlt, ...comp.alternatives.filter(a => a.id !== alt.id)];
        return { 
          ...comp, 
          id: alt.id, 
          name: alt.name, 
          price: alt.price, 
          quantity: alt.quantity || comp.quantity, 
          alternatives: newAlts 
        };
      }
      return comp;
    }));
    setEditingCompId(null);
    addNotification('Component replaced', 'success');
  };

  const totalPrice = useMemo(() => 
    activeComponents.reduce((sum, c) => sum + ((c.price || 0) * (c.quantity || 0)), 0)
  , [activeComponents]);

  const Selector = ({ label, icon: Icon, value, options, onChange }: any) => (
    <div className="space-y-3">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2">
        <Icon size={12} className="text-yellow-500" /> {label}
      </label>
      <div className="grid grid-cols-1 gap-2">
        {options.map((opt: string) => (
          <button 
            key={opt} 
            onClick={() => onChange(opt)} 
            className={`p-4 rounded-2xl border-2 text-left font-bold transition-all flex justify-between items-center group ${value === opt ? 'border-yellow-400 bg-yellow-50 text-yellow-950 shadow-sm' : 'border-slate-50 bg-slate-50/50 text-slate-400 hover:border-slate-200'}`}
          >
            <span className="text-[10px] uppercase tracking-tight">{opt}</span>
            {value === opt && <Check size={14} className="text-yellow-600" />}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto py-6 animate-fade-in pb-20 px-4">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 bg-slate-900 text-yellow-400 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-4 shadow-xl">
          <Cpu size={14} className="animate-pulse" /> Energy Constructor
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase mb-4 leading-none">
          System Parameters
        </h1>
      </div>

      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-[0_32px_120px_-20px_rgba(0,0,0,0.08)] overflow-hidden relative">
        {isApiRestricted && step === 1 && (
           <div className="p-8 bg-rose-50 border-b border-rose-100 flex items-center justify-between text-rose-900">
              <div className="flex items-center gap-3">
                 <ShieldAlert size={20} />
                 <span className="text-[10px] font-black uppercase tracking-widest">AI Services Restricted (Key Leaked)</span>
              </div>
              <button 
                onClick={() => checkAndPromptKey()}
                className="bg-rose-500 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-rose-600 transition-all flex items-center gap-2"
              >
                <Key size={14} /> Select Key
              </button>
           </div>
        )}
        
        {loading && (
          <div className="absolute inset-0 z-[60] bg-white/95 backdrop-blur-md flex flex-col items-center justify-center gap-6 animate-fade-in">
            <Loader2 className="text-yellow-500 animate-spin" size={56} />
            <div className="text-center">
              <p className="text-xs font-black text-slate-900 uppercase tracking-[0.3em] animate-pulse">{t('ai_generating')}</p>
              <p className="text-[9px] text-slate-400 uppercase mt-2 tracking-widest">Analyzing inventory and matching components</p>
            </div>
          </div>
        )}

        <div className="p-8 md:p-12">
          {step === 1 && (
            <div className="space-y-10 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <Selector 
                  label="Object Type" 
                  icon={Settings2} 
                  value={config.objectType} 
                  options={['Private House', 'Apartment / Office', 'Business']} 
                  onChange={(v: any) => setConfig({...config, objectType: v})}
                />
                <Selector 
                  label="Consumption" 
                  icon={Activity} 
                  value={config.monthlyUsage} 
                  options={[
                    '< 300 kWh/month', 
                    '300-600 kWh/month', 
                    '600+ kWh/month'
                  ]} 
                  onChange={(v: any) => setConfig({...config, monthlyUsage: v})}
                />
                <Selector 
                  label="Goal" 
                  icon={Target} 
                  value={config.purpose} 
                  options={['Backup Power', 'Autonomy', 'Savings']} 
                  onChange={(v: any) => setConfig({...config, purpose: v})}
                />
                <Selector 
                  label="Budget" 
                  icon={Wallet} 
                  value={config.budget} 
                  options={['Economy', 'Optimal', 'Premium']} 
                  onChange={(v: any) => setConfig({...config, budget: v})}
                />
              </div>

              <div className="flex justify-center pt-6">
                <button 
                  onClick={handleCalculate} 
                  className="w-full max-w-lg bg-slate-900 text-white py-6 rounded-[2rem] font-black flex items-center justify-center gap-4 hover:bg-yellow-400 hover:text-yellow-950 transition-all shadow-2xl group uppercase tracking-widest text-[13px]"
                >
                  {t('generate_solution')} <Sparkles size={20} className="group-hover:rotate-12 transition-transform" />
                </button>
              </div>
            </div>
          )}

          {step === 3 && result && (
            <div className="animate-fade-in space-y-10">
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-6 border-b border-slate-100 pb-8">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none">{result.title}</h2>
                  <p className="text-[10px] text-slate-500 mt-2 uppercase font-bold tracking-wider max-w-xl">{result.description}</p>
                </div>
                <button 
                  onClick={() => setStep(1)} 
                  className="px-6 py-3 bg-slate-50 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-yellow-600 hover:bg-yellow-50 transition-all shadow-sm flex items-center gap-2"
                >
                  <div className="p-1 rounded bg-slate-200 group-hover:bg-yellow-400"><RotateCcw size={12}/></div> Back to parameters
                </button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex items-center gap-2 mb-2 px-2">
                    <ShieldCheck className="text-emerald-500" size={16} />
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Selected Assets</span>
                  </div>
                  
                  {activeComponents.map(c => (
                    <div key={c.id} className="flex flex-col gap-2">
                      <div className="p-6 bg-white rounded-[2rem] border border-slate-100 flex justify-between items-center group hover:border-yellow-300 transition-all shadow-sm">
                        <div className="flex items-center gap-4">
                          <div className="w-11 h-11 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-yellow-400 group-hover:text-yellow-950 transition-all">
                            <Zap size={20} />
                          </div>
                          <div>
                            <div className="font-black text-slate-900 text-[11px] uppercase truncate max-w-[200px] tracking-tight">{c.name}</div>
                            <div className="text-[9px] text-slate-400 font-bold uppercase tracking-tight mt-0.5">
                              {c.quantity} units • {formatPrice(c.price)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-5">
                          {c.alternatives && c.alternatives.length > 0 && (
                            <button 
                              onClick={() => setEditingCompId(editingCompId === c.id ? null : c.id)}
                              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${
                                editingCompId === c.id ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                              }`}
                            >
                              <RefreshCw size={12} className={editingCompId === c.id ? 'animate-spin' : ''} />
                              {editingCompId === c.id ? 'Close' : 'Replace'}
                            </button>
                          )}
                          <div className="font-black text-slate-900 text-right w-24 text-[13px] tracking-tighter">{formatPrice(c.price * c.quantity)}</div>
                        </div>
                      </div>

                      {editingCompId === c.id && c.alternatives && (
                        <div className="mx-4 p-4 bg-slate-50/50 rounded-3xl border border-slate-100 animate-fade-in space-y-2 shadow-inner">
                          <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2 px-2">Available Substitutes:</div>
                          {c.alternatives.map(alt => (
                            <button 
                              key={alt.id}
                              onClick={() => replaceComponent(c.id, alt)}
                              className="w-full flex justify-between items-center bg-white p-3.5 rounded-2xl border border-slate-200 hover:border-yellow-400 transition-all text-left group"
                            >
                              <div className="flex-1">
                                <span className="text-[10px] font-bold text-slate-800 uppercase tracking-tight group-hover:text-yellow-600">{alt.name}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-[10px] font-black text-slate-900">{formatPrice(alt.price)}</span>
                                <span className="text-[9px] font-bold text-slate-400">x{alt.quantity}</span>
                                <ChevronRight size={14} className="text-slate-200 group-hover:translate-x-1 transition-transform" />
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="space-y-6">
                  <div className="bg-slate-950 p-10 rounded-[3rem] text-center text-white shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-yellow-400/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                    <div className="relative z-10">
                       <div className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4">Total Budget</div>
                       <div className="text-4xl font-black text-yellow-400 mb-8 tracking-tighter">{formatPrice(totalPrice)}</div>
                       <button 
                         onClick={() => {
                           const selectedParts = activeComponents.map(ac => ({
                             id: ac.id,
                             name: ac.name,
                             price: ac.price,
                             quantity: ac.quantity
                           }));

                           addItem({
                             id: 'ai-kit-' + Date.now(),
                             name: result.title,
                             description: result.description,
                             price: totalPrice,
                             category: 'Kits',
                             image: 'https://images.unsplash.com/photo-1509391366360-fe5bb58583bb?auto=format&fit=crop&w=800',
                             stock: 1,
                             features: activeComponents.map(ac => ac.name)
                           }, selectedParts);
                           addNotification('System added to cart', 'success');
                         }}
                         className="w-full bg-yellow-400 text-yellow-950 py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-white transition-all shadow-xl active:scale-95"
                       >
                         Add System to Cart
                       </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
