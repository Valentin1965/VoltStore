
import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useProducts } from '../../contexts/ProductsContext';
import { useCart } from '../../contexts/CartContext';
import { useNotification } from '../../contexts/NotificationContext';
import { 
  Leaf, Users, Zap, Shield, Globe, Award, MapPin, Phone, Mail, CheckCircle2,
  Cpu, Battery, Sun, Layers, Flame, Crown, ShoppingCart
} from 'lucide-react';
import { AppView, Category, Product } from '../../types';
import { ProductCard, useLocalizedText } from '../catalog/CatalogSection';

interface AboutPageProps {
  onNavigateToCatalog?: (view: AppView) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigateToCatalog }) => {
  const { t } = useLanguage();
  const { products, setSelectedCategory } = useProducts();
  const { addItem } = useCart();
  const { addNotification } = useNotification();
  const getLoc = useLocalizedText();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const leaders = products.filter(p => p.is_leader === true).slice(0, 4);

  const categoryMenu = [
    { id: 'Inverters' as Category, label: 'Inverters', icon: Cpu },
    { id: 'Batteries' as Category, label: 'Batteries', icon: Battery },
    { id: 'Solar Panels' as Category, label: 'Solar Panels', icon: Sun },
    { id: 'Charging Stations' as Category, label: 'Charging Stations', icon: Zap },
    { id: 'Kits' as Category, label: 'Ready Kits', icon: Layers },
  ];

  const handleCategoryClick = (cat: Category) => {
    setSelectedCategory(cat);
    if (onNavigateToCatalog) {
      onNavigateToCatalog(AppView.CATALOG);
    }
  };

  const values = [
    { icon: Zap, title: "Innovation", desc: "We utilize latest AI technologies and engineering breakthroughs." },
    { icon: Shield, title: "Reliability", desc: "Our products are tested for the harshest Scandinavian conditions." },
    { icon: Leaf, title: "Sustainability", desc: "Every solution we provide reduces carbon footprint." },
    { icon: Users, title: "Client Focus", desc: "Expert support and personalized energy system design." }
  ];

  return (
    <div className="max-w-6xl mx-auto animate-fade-in pb-24">
      {/* Hero Section */}
      <div className="relative rounded-[3rem] bg-emerald-950 overflow-hidden min-h-[450px] flex items-center shadow-2xl mb-12 border border-white/10">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=2000&auto=format&fit=crop" 
            className="w-full h-full object-cover animate-slow-zoom opacity-60" 
            alt="Majestic Mountains" 
          />
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-950 via-emerald-950/70 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/40 via-transparent to-transparent"></div>
        </div>

        <div className="relative z-20 px-8 md:px-16 py-12 max-w-4xl">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-xl text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] mb-6 shadow-2xl border border-white/20 animate-fade-in">
            <Leaf size={12} className="text-emerald-400" /> Photovoltaic Specialists
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-[0.9] tracking-tighter uppercase drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
            GREEN <span className="text-emerald-400 italic">LIGHT</span> <br/>
            <span className="text-white/95">SOLAR GROUP</span>
          </h1>
          
          <div className="flex flex-wrap items-center gap-4 text-emerald-50 font-black text-[9px] md:text-[10px] uppercase tracking-[0.2em] opacity-80">
            <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div> ENERGY FROM NATURE</span>
            <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div> INNOVATION</span>
            <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div> INDEPENDENCE</span>
          </div>
        </div>
      </div>

      {/* Category Horizontal Menu with Illuminated Frames */}
      <div className="mb-20 px-4">
        <div className="flex flex-wrap justify-center gap-6">
          {categoryMenu.map((item) => (
            <button 
              key={item.id} 
              onClick={() => handleCategoryClick(item.id)}
              className="flex-1 min-w-[150px] max-w-[220px] h-[180px] bg-white border-2 border-emerald-100/80 rounded-[2.5rem] px-6 py-6 flex flex-col items-center justify-center gap-3 group hover:border-emerald-500 hover:shadow-[0_20px_40px_-15px_rgba(16,185,129,0.2)] hover:-translate-y-1 transition-all duration-500 shadow-sm relative overflow-hidden"
            >
              {/* Subtle background glow effect */}
              <div className="absolute inset-0 bg-emerald-50/0 group-hover:bg-emerald-50/40 transition-colors duration-500"></div>
              
              <div className="relative z-10 w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all duration-500 shadow-inner shrink-0">
                <item.icon size={24} />
              </div>
              
              <span className="relative z-10 text-[18px] font-black uppercase tracking-tighter text-slate-900 group-hover:text-emerald-600 transition-colors text-center leading-none">
                {item.label}
              </span>

              {/* Decorative corner light */}
              <div className="absolute top-0 right-0 w-8 h-8 bg-emerald-400/5 rounded-full -mr-4 -mt-4 blur-xl group-hover:bg-emerald-400/20 transition-all"></div>
            </button>
          ))}
        </div>
      </div>

      {/* Sales Leaders Section */}
      {leaders.length > 0 && (
        <div className="mb-24 px-4 space-y-10">
          <div className="flex flex-col items-center text-center space-y-2">
            <span className="text-amber-500 text-[9px] font-black uppercase tracking-[0.5em] flex items-center gap-2">
              <Crown size={14} className="fill-amber-500" /> Professional Grade
            </span>
            <h3 className="text-4xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-4">
              {t('sales_leader')} <Flame size={28} className="text-rose-500 animate-pulse" />
            </h3>
            <div className="w-20 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent mt-4"></div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {leaders.map((p, idx) => (
              <ProductCard 
                key={p.id} 
                product={p} 
                index={idx} 
                onSelect={setSelectedProduct} 
                onAddToCart={(e, prod) => { 
                  e.stopPropagation(); 
                  addItem(prod); 
                  addNotification(prod.stock === 0 ? t('preorder_added') : t('item_added'), 'success'); 
                }} 
              />
            ))}
          </div>
        </div>
      )}

      {/* Main Intro */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_0.6fr] gap-16 mb-24 items-center px-4">
        <div className="space-y-8">
          <div className="space-y-3">
            <span className="text-emerald-600 text-[10px] font-black uppercase tracking-[0.4em]">Our Philosophy</span>
            <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none">
              {t('about_title')}
            </h2>
          </div>
          
          <div className="prose prose-slate max-w-none">
            <p className="text-slate-600 text-base leading-relaxed font-medium">
              From the very beginning, our focus has been on providing solutions that draw energy from nature. 
              We are experts in the field of photovoltaic systems, and our goal is to help customers 
              reduce electricity costs and care for the environment by promoting renewable energy sources.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
             <div className="space-y-2">
               <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">{t('about_mission_title')}</h3>
               <p className="text-slate-500 text-[10px] leading-relaxed font-bold uppercase tracking-tight">
                 Solar energy is not only about saving money, it is an investment in the future of the entire planet.
               </p>
             </div>
             <div className="space-y-2">
               <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Our Vision</h3>
               <p className="text-slate-500 text-[10px] leading-relaxed font-bold uppercase tracking-tight">
                 Leading the transition to clean, decentralized power across Scandinavia and beyond.
               </p>
             </div>
          </div>

          <div className="bg-emerald-900 p-8 rounded-[2.5rem] text-white flex gap-6 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-400/10 rounded-full -mr-12 -mt-12 blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
            <div className="bg-emerald-500 p-4 rounded-2xl text-white shadow-xl shrink-0 h-fit">
              <Globe size={24} />
            </div>
            <p className="text-xs md:text-sm font-bold text-emerald-50 leading-relaxed italic relative z-10">
              "We believe that together we can build a more sustainable world, starting with small, daily changes in how we consume power."
            </p>
          </div>
        </div>
        
        <div className="relative group flex justify-center">
          <div className="absolute -inset-4 bg-slate-100 rounded-[3rem] -z-10 group-hover:bg-emerald-50 transition-colors duration-500"></div>
          <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl aspect-[4/5] border border-slate-200/50 w-full max-w-xs">
             <img 
              src="https://images.unsplash.com/photo-1473448912268-2022ce9509d8?q=80&w=1200&auto=format&fit=crop" 
              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
              alt="Sunlight in Forest"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          </div>
          
          <div className="absolute -bottom-4 -right-4 bg-white p-5 rounded-[2rem] shadow-2xl border border-slate-100 animate-bounce-short">
             <div className="text-center">
                <div className="text-xl font-black text-emerald-600 tracking-tighter leading-none">15+</div>
                <div className="text-[7px] font-black text-slate-400 uppercase tracking-widest mt-1">Years Expert</div>
             </div>
          </div>
        </div>
      </div>

      {/* Trust Section */}
      <div className="mb-24 px-4">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="text-emerald-600 text-[10px] font-black uppercase tracking-[0.4em]">Proven Reliability</span>
          <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">{t('about_trust_title')}</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { title: "Direct Distribution", desc: "We source directly from manufacturers like Deye and EcoFlow to ensure best pricing." },
            { title: "Scandinavian Quality", desc: "Our equipment is engineered specifically to perform in Northern climates." },
            { title: "Expert Support", desc: "Our certified engineers provide full technical assistance and system design." }
          ].map((item, i) => (
            <div key={i} className="p-10 bg-white rounded-[2.5rem] border-2 border-slate-50 shadow-sm text-center space-y-4 hover:shadow-2xl hover:border-emerald-100 hover:-translate-y-2 transition-all duration-500 group">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <CheckCircle2 size={24} />
              </div>
              <h4 className="font-black text-slate-900 uppercase text-[10px] tracking-widest">{item.title}</h4>
              <p className="text-slate-500 text-[9px] font-bold leading-relaxed uppercase tracking-tight">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Values Section */}
      <div className="bg-slate-900 rounded-[3rem] p-8 md:p-12 text-white relative overflow-hidden mx-4 shadow-2xl">
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-emerald-500/10 rounded-full -mr-32 -mt-32 blur-[80px]"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-400/5 rounded-full -ml-24 -mb-24 blur-[60px]"></div>
        
        <div className="relative z-10">
          <div className="mb-10">
            <span className="text-emerald-400 text-[8px] font-black uppercase tracking-[0.4em] mb-2 block">Our DNA</span>
            <h3 className="text-2xl font-black uppercase tracking-tighter">{t('about_values_title')}</h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((v, i) => (
              <div key={i} className="space-y-3 group">
                <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center group-hover:bg-emerald-500 transition-all duration-500 group-hover:scale-105">
                  <v.icon className="text-emerald-400 group-hover:text-white transition-colors" size={20} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-[10px] font-black uppercase tracking-widest group-hover:text-emerald-400 transition-colors">{v.title}</h4>
                  <p className="text-slate-400 text-[9px] font-bold uppercase tracking-tight leading-snug">{v.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
