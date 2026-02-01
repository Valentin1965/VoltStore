
import React, { useState, useMemo, useEffect } from 'react';
import { useNotification } from '../../contexts/NotificationContext';
import { useCart } from '../../contexts/CartContext';
import { useProducts } from '../../contexts/ProductsContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { 
  Sparkles, RotateCcw, Check, Loader2, ShieldCheck, 
  Activity, Cpu, Zap, Settings2, RefreshCw, ChevronRight, Target, Wallet 
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { KitComponent, Alternative, Product } from '../../types';

const OFFLINE_TEMPLATES = {
  economy: {
    en: { title: "Essential Power Kit", description: "Budget-friendly solution focused on basic reliability and core energy needs." },
    da: { title: "Essential Power Kit", description: "Prisbillig løsning med fokus på grundlæggende pålidelighed." }
  },
  optimal: {
    en: { title: "Optimal Energy System Pro", description: "Our most popular configuration balancing performance, price, and long-term efficiency." },
    da: { title: "Optimalt Energisystem Pro", description: "Vores mest populære konfiguration, der balancerer ydelse og pris." }
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
  const [editingCompId, setEditingCompId] = useState<string | null>(null);
  
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

  // Смарт-підбір товарів без AI
  const useFallback = () => {
    const lang = (language === 'da' || language === 'en') ? language : 'en';
    const budgetKey = config.budget.toLowerCase() as 'economy' | 'optimal' | 'premium';
    const template = OFFLINE_TEMPLATES[budgetKey]?.[lang] || OFFLINE_TEMPLATES.optimal[lang];
    
    setResult({ title: template.title, description: template.description });

    // Сортуємо товари за ціною для вибору згідно бюджету
    const sortedInverters = [...products.filter(p => p.category === 'Inverters' && (p.stock || 0) > 0)].sort((a, b) => a.price - b.price);
    const sortedBatteries = [...products.filter(p => p.category === 'Batteries' && (p.stock || 0) > 0)].sort((a, b) => a.price - b.price);

    let selectedInverter: Product;
    let selectedBattery: Product;

    if (config.budget === 'Economy') {
      selectedInverter = sortedInverters[0] || { id: 'def-inv-eco', name: 'Basic Inverter 3kW', price: 850 } as Product;
      selectedBattery = sortedBatteries[0] || { id: 'def-bat-eco', name: 'Battery 2.5kWh', price: 900 } as Product;
    } else if (config.budget === 'Premium') {
      selectedInverter = sortedInverters[sortedInverters.length - 1] || { id: 'def-inv-pre', name: 'Premium Hybrid 12kW', price: 2800 } as Product;
      selectedBattery = sortedBatteries[sortedBatteries.length - 1] || { id: 'def-bat-pre', name: 'High-Cap Battery 15kWh', price: 3400 } as Product;
    } else {
      const midInv = Math.floor(sortedInverters.length / 2);
      const midBat = Math.floor(sortedBatteries.length / 2);
      selectedInverter = sortedInverters[midInv] || { id: 'def-inv-opt', name: 'Smart Hybrid 5kW', price: 1450 } as Product;
      selectedBattery = sortedBatteries[midBat] || { id: 'def-bat-opt', name: 'Storage 5kWh', price: 1800 } as Product;
    }

    // Кількість залежить від об'єкта
    const multiplier = config.objectType === 'Business' ? 2 : 1;

    const components: KitComponent[] = [
      { 
        id: selectedInverter.id, 
        name: (typeof selectedInverter.name === 'string' ? selectedInverter.name : selectedInverter.name.en) || 'Inverter Unit', 
        price: selectedInverter.price, 
        quantity: 1, 
        alternatives: [] 
      },
      { 
        id: selectedBattery.id, 
        name: (typeof selectedBattery.name === 'string' ? selectedBattery.name : selectedBattery.name.en) || 'Battery Unit', 
        price: selectedBattery.price, 
        quantity: multiplier, 
        alternatives: [] 
      }
    ];

    setActiveComponents(components);
    setStep(3);
  };

  const handleCalculate = async () => {
    const apiKey = process.env.API_KEY;
    
    if (!apiKey || apiKey === 'undefined' || apiKey.length < 10) {
      useFallback();
      return;
    }

    setLoading(true);
    try {
      // Даємо AI контекст товарів
      const inventoryContext = products
        .filter(p => (p.stock || 0) > 0)
        .slice(0, 15)
        .map(p => `ID: ${p.id}, Name: ${typeof p.name === 'string' ? p.name : p.name.en}, Price: ${p.price} EUR, Category: ${p.category}`)
        .join('\n');

      const ai = new GoogleGenAI({ apiKey });
      const prompt = `As an energy engineer, design a solar kit for a client.
      CLIENT CONFIG:
      - Object: ${config.objectType}
      - Monthly Consumption: ${config.monthlyUsage}
      - Purpose: ${config.purpose}
      - Budget preference: ${config.budget}
      
      INVENTORY (Pick actual IDs if possible):
      ${inventoryContext}

      JSON response required:
      {
        "title": "Short creative title",
        "description": "Short reasoning",
        "components": [
          {"id": "from_inventory_id", "name": "display_name", "price": number, "quantity": number, "alternatives": []}
        ]
      }`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      const data = JSON.parse(response.text || '{}');
      
      if (data.components && data.components.length > 0) {
        setResult({ title: data.title || 'Custom Power Solution', description: data.description || '' });
        setActiveComponents(data.components);
        setStep(3);
      } else {
        useFallback();
      }
    } catch (err) {
      console.error("AI Calc Error:", err);
      useFallback();
    } finally { 
      setLoading(false); 
    }
  };

  const totalPrice = useMemo(() => 
    activeComponents.reduce((s, c) => s + (c.price * c.quantity), 0)
  , [activeComponents]);

  const handleAddToCart = () => {
    if (!result) return;
    
    // Передаємо комплект як один товар з під-частинами (parts)
    addItem({
      id: 'ai-config-' + Date.now(),
      name: result.title,
      description: result.description,
      price: totalPrice,
      category: 'Kits',
      image: 'https://images.unsplash.com/photo-1509391366360-fe5bb58583bb?q=80&w=800&auto=format&fit=crop',
      stock: 1,
      is_active: true
    }, activeComponents.map(ac => ({
      id: ac.id,
      name: ac.name,
      price: ac.price,
      quantity: ac.quantity
    })));
    
    addNotification('Custom system configuration added to cart', 'success');
  };

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
            {value === opt && <Check size={14} className="text-yellow-600 animate-in zoom-in" />}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto py-6 animate-fade-in pb-20 px-4">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 bg-slate-900 text-yellow-400 px-5 py-2 rounded-full text-[10px] font-black uppercase mb-4 shadow-xl">
          <Cpu size={14} /> Energy Constructor
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 uppercase tracking-tighter mb-4 leading-none">
          System Parameters
        </h1>
      </div>

      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-[0_32px_120px_-20px_rgba(0,0,0,0.08)] overflow-hidden relative">
        {loading && (
          <div className="absolute inset-0 z-[60] bg-white/95 backdrop-blur-md flex flex-col items-center justify-center gap-6 animate-fade-in">
            <Loader2 className="text-yellow-500 animate-spin" size={56} />
            <div className="text-center">
              <p className="text-xs font-black uppercase text-slate-900 tracking-widest animate-pulse">{t('ai_generating')}</p>
              <p className="text-[9px] text-slate-400 uppercase mt-2 font-bold tracking-widest">Matching inventory to your needs</p>
            </div>
          </div>
        )}

        <div className="p-8 md:p-12">
          {step === 1 ? (
            <div className="space-y-10">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <Selector label="Object" icon={Settings2} value={config.objectType} options={['Private House', 'Business']} onChange={(v:any)=>setConfig({...config, objectType:v})}/>
                <Selector label="Usage" icon={Activity} value={config.monthlyUsage} options={['< 300 kWh', '300-600 kWh', '600+ kWh']} onChange={(v:any)=>setConfig({...config, monthlyUsage:v})}/>
                <Selector label="Goal" icon={Target} value={config.purpose} options={['Backup', 'Autonomy', 'Savings']} onChange={(v:any)=>setConfig({...config, purpose:v})}/>
                <Selector label="Budget" icon={Wallet} value={config.budget} options={['Economy', 'Optimal', 'Premium']} onChange={(v:any)=>setConfig({...config, budget:v})}/>
              </div>
              
              <div className="flex justify-center pt-6">
                <button 
                  onClick={handleCalculate} 
                  className="w-full max-w-lg bg-slate-900 text-white py-6 rounded-[2rem] font-black uppercase tracking-widest text-[13px] hover:bg-yellow-400 hover:text-yellow-950 transition-all shadow-2xl flex items-center justify-center gap-4 group"
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
                <button 
                  onClick={() => setStep(1)} 
                  className="px-6 py-3 bg-slate-50 rounded-2xl text-[10px] font-black uppercase text-slate-400 hover:text-yellow-600 hover:bg-yellow-50 transition-all flex items-center gap-2"
                >
                  <RotateCcw size={12}/> Edit Parameters
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex items-center gap-2 mb-2 px-2">
                    <ShieldCheck className="text-emerald-500" size={16} />
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Matched Components</span>
                  </div>

                  {activeComponents.map(c => (
                    <div key={c.id} className="p-6 bg-white rounded-[2rem] border border-slate-100 flex justify-between items-center group hover:border-yellow-400 transition-all shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-yellow-400 group-hover:text-yellow-950 transition-all">
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

                <div className="space-y-6">
                  <div className="bg-slate-950 p-10 rounded-[3rem] text-center text-white shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                    <div className="relative z-10">
                       <div className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4">Total System Cost</div>
                       <div className="text-4xl font-black text-yellow-400 mb-8 tracking-tighter leading-none">{formatPrice(totalPrice)}</div>
                       <button 
                         onClick={handleAddToCart}
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
