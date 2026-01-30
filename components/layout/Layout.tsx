
import React, { useState } from 'react';
import { ShoppingCart, LayoutGrid, Calculator, Heart, User, Search, Scale, X, RefreshCw, Info, MapPin, Phone, Mail, Lock, Coins } from 'lucide-react';
import { AppView } from '../../types';
import { useCart } from '../../contexts/CartContext';
import { useProducts } from '../../contexts/ProductsContext';
import { useLanguage, Language } from '../../contexts/LanguageContext';
import { CartDrawer } from '../cart/CartDrawer';

interface LayoutProps {
  children: React.ReactNode;
  currentView: AppView;
  setView: (view: AppView) => void;
}

const GreenLightLogo = () => (
  <svg width="40" height="40" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-lg">
    <path d="M50 85C50 90.5228 45.5228 95 40 95H60C54.4772 95 50 90.5228 50 85Z" fill="#065F46" />
    <rect x="40" y="80" width="20" height="4" rx="2" fill="#064E3B" />
    <rect x="42" y="74" width="16" height="4" rx="2" fill="#064E3B" />
    <path d="M50 10C30 10 15 25 15 45C15 65 35 75 40 85H60C65 75 85 65 85 45C85 25 70 10 50 10Z" fill="url(#bulbGrad)" />
    <path d="M50 70C50 70 48 50 40 40C32 30 20 28 20 28C20 28 30 35 35 48C40 61 42 75 42 75" fill="white" fillOpacity="0.8" />
    <path d="M50 70C50 70 55 55 65 48C75 41 85 40 85 40C85 40 75 45 70 55C65 65 62 80 62 80" fill="white" fillOpacity="0.4" />
    <defs>
      <linearGradient id="bulbGrad" x1="50" y1="10" x2="50" y2="85" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#34D399" />
        <stop offset="1" stopColor="#059669" />
      </linearGradient>
    </defs>
  </svg>
);

export const Layout: React.FC<LayoutProps> = ({ children, currentView, setView }) => {
  const { totalItems } = useCart();
  const { searchQuery, setSearchQuery } = useProducts();
  const { t, language, setLanguage, isLoadingRates, refreshRates, rates } = useLanguage();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSearchVisible, setIsSearchVisible] = useState(false);

  const navItems = [
    { id: AppView.ABOUT, label: t('nav_about'), icon: Info },
    { id: AppView.CATALOG, label: t('nav_catalog'), icon: LayoutGrid },
    { id: AppView.CALCULATOR, label: t('nav_architect'), icon: Calculator },
    { id: AppView.WISHLIST, label: t('nav_wishlist'), icon: Heart },
    { id: AppView.COMPARE, label: t('nav_compare'), icon: Scale },
  ];

  const languages: { code: Language; label: string }[] = [
    { code: 'en', label: 'EN' },
    { code: 'da', label: 'DA' },
    { code: 'no', label: 'NO' },
    { code: 'sv', label: 'SV' }
  ];

  const displayRates = [
    { code: 'USD', value: rates.USD },
    { code: 'DKK', value: rates.DKK },
    { code: 'NOK', value: rates.NOK },
    { code: 'SEK', value: rates.SEK },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="sticky top-0 z-[100] bg-white/80 backdrop-blur-xl border-b border-slate-100 px-4 md:px-6">
        <div className="container mx-auto h-20 md:h-24 flex items-center justify-between">
          <div className="flex items-center gap-6 shrink-0">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setView(AppView.ABOUT)}>
              <div className="group-hover:scale-110 transition-transform duration-500"><GreenLightLogo /></div>
              <div className="hidden sm:flex flex-col">
                <span className="text-2xl font-black tracking-tighter text-slate-900 uppercase leading-none">GREEN <span className="text-emerald-500">LIGHT</span></span>
                <span className="text-[8px] font-black text-slate-400 tracking-[0.3em] uppercase mt-1">Solar Distribution Group</span>
              </div>
            </div>
          </div>

          <nav className="hidden lg:flex items-center bg-slate-100/50 p-1.5 rounded-2xl border border-slate-100 mx-4">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${
                  currentView === item.id ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <item.icon size={12} className={currentView === item.id ? 'text-emerald-500' : ''} />
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2 md:gap-3 shrink-0 ml-auto justify-end">
            <div className="flex items-center gap-2 md:gap-2">
              <div className="hidden md:flex items-center relative">
                <div className={`flex items-center bg-slate-100 rounded-2xl transition-all duration-300 ease-in-out overflow-hidden ${isSearchVisible ? 'w-40 pr-2' : 'w-10'}`}>
                  <button onClick={() => { setIsSearchVisible(!isSearchVisible); if (isSearchVisible) setSearchQuery(''); }} className={`p-2.5 transition-colors shrink-0 ${isSearchVisible ? 'text-slate-900' : 'text-slate-400 hover:text-slate-900'}`}>
                    {isSearchVisible ? <X size={18} /> : <Search size={18} />}
                  </button>
                  <input type="text" placeholder={t('search_placeholder')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={`bg-transparent border-none py-2.5 outline-none text-[8px] font-black uppercase tracking-widest w-full transition-opacity duration-200 ${isSearchVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} />
                </div>
              </div>

              <button onClick={() => setView(AppView.CABINET)} className={`p-3 md:p-3.5 rounded-xl md:rounded-2xl transition-all shadow-lg active:scale-90 flex items-center justify-center ${currentView === AppView.CABINET ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white hover:bg-slate-800'}`} title={t('nav_cabinet')}>
                <User size={18} />
              </button>

              <button onClick={() => setView(AppView.CART)} className={`relative p-3 md:p-3.5 rounded-xl md:rounded-2xl transition-all shadow-lg active:scale-90 flex items-center justify-center ${currentView === AppView.CART ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white hover:bg-slate-800'}`}>
                <ShoppingCart size={18} />
                {totalItems > 0 && <span className="absolute -top-1 -right-1 bg-emerald-400 text-white text-[8px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-white animate-bounce-short">{totalItems}</span>}
              </button>
            </div>

            {/* Combined Vertical Rates and Language Switcher - Rates moved to the absolute right */}
            <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl md:rounded-2xl border border-slate-100 shrink-0">
              <div className="flex flex-col gap-0.5">
                <div className="flex flex-col gap-0.5">
                  {languages.map(lang => (
                    <button key={lang.code} onClick={() => setLanguage(lang.code)} className={`px-1.5 py-0.5 rounded-md text-[7px] font-black transition-all ${language === lang.code ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                      {lang.label}
                    </button>
                  ))}
                </div>
                <button onClick={() => refreshRates()} className={`mt-1 p-0.5 rounded hover:bg-white transition-all mx-auto ${isLoadingRates ? 'animate-spin text-emerald-500' : 'text-slate-300'}`} title="Refresh Rates"><RefreshCw size={8} /></button>
              </div>

              <div className="hidden xl:flex flex-col gap-0.5 border-l border-slate-200 pl-2 ml-0.5">
                {displayRates.map(rate => (
                  <div key={rate.code} className="flex items-center justify-between gap-2 min-w-[48px]">
                    <span className="text-[6.5px] font-black text-slate-400 uppercase leading-none">{rate.code}</span>
                    <span className="text-[7.5px] font-black text-slate-900 tabular-nums leading-none">{rate.value.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      <CartDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} onCheckout={() => setView(AppView.CHECKOUT)} />
      <main className="flex-1 container mx-auto px-4 md:px-6 py-6 md:py-10">{children}</main>

      <footer className="bg-white border-t border-slate-100 py-12 md:py-16 px-6 mt-auto">
        <div className="container mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="space-y-6">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView(AppView.ABOUT)}>
              <GreenLightLogo />
              <span className="text-2xl font-black tracking-tighter uppercase text-slate-900">GREEN <span className="text-emerald-500">LIGHT</span></span>
            </div>
            <div className="flex items-start gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-tight leading-relaxed">
              <MapPin size={14} className="text-emerald-500 shrink-0 mt-0.5" />
              <span>Green Light Scandinavia<br/>Øster Teglgårdsvej 6<br/>8800 Viborg, Danmark</span>
            </div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest leading-loose max-w-sm">{t('footer_tagline')}</p>
          </div>
          <div className="space-y-6 md:text-center">
            <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em]">Navigate</h4>
            <div className="flex flex-col md:items-center gap-4">
              <button onClick={() => setView(AppView.CATALOG)} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-emerald-600 transition-colors">{t('nav_catalog')}</button>
              <button onClick={() => setView(AppView.ABOUT)} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-emerald-600 transition-colors">{t('nav_about')}</button>
              <button onClick={() => setView(AppView.CALCULATOR)} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-emerald-600 transition-colors">{t('nav_architect')}</button>
              <button onClick={() => setView(AppView.ADMIN)} className={`text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2 ${currentView === AppView.ADMIN ? 'text-emerald-600' : 'text-slate-400 hover:text-emerald-600'}`}><Lock size={12} /> {t('nav_admin')}</button>
            </div>
          </div>
          <div className="space-y-6 md:text-right">
             <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em]">Support</h4>
             <div className="space-y-4">
               <a href="tel:+4531185819" className="text-xl font-black text-slate-900 hover:text-emerald-600 transition-colors tracking-tighter flex items-center md:justify-end gap-2"><Phone size={16} className="text-emerald-500" /> +45 31 18 58 19</a>
               <a href="mailto:info@glsolargroup.dk" className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-emerald-600 transition-colors flex items-center md:justify-end gap-2"><Mail size={14} className="text-emerald-500" /> info@glsolargroup.dk</a>
             </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
