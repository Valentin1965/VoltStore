
import React, { useState } from 'react';
import { useCart } from '../../contexts/CartContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useUser } from '../../contexts/UserContext';
import { AppView } from '../../types';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, UserCheck, UserPlus, UserCircle, ChevronLeft } from 'lucide-react';
import { LocalizedText } from '../../types';

const useLocalizedText = () => {
  const { language } = useLanguage();
  return (text: LocalizedText | null | undefined): string => {
    if (!text) return "";
    if (typeof text === 'string') return text;
    return text[language] || text['en'] || Object.values(text)[0] || "";
  };
};

interface CartPageProps {
  onCheckout: () => void;
  // Note: We need a way to change views if user chooses Login or Register
}

const IMAGE_FALLBACK = 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?q=80&w=400&auto=format&fit=crop';

export const CartPage: React.FC<CartPageProps> = ({ onCheckout }) => {
  const { items, updateQuantity, removeItem, totalPrice } = useCart();
  const { t, formatPrice } = useLanguage();
  const { currentUser } = useUser();
  const getLoc = useLocalizedText();
  
  // State for the authorization prompt
  const [showAuthChoice, setShowAuthChoice] = useState(false);

  const getSafeImage = (img: string | null | undefined) => {
    if (!img || typeof img !== 'string' || img.trim() === '') return null;
    return img;
  };

  const handlePlaceOrder = () => {
    if (currentUser) {
      onCheckout(); // If already logged in, proceed straight to checkout
    } else {
      setShowAuthChoice(true); // Otherwise ask
    }
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-16 animate-fade-in bg-white rounded-3xl border border-slate-100 shadow-xl max-w-4xl mx-auto">
        <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
          <ShoppingBag className="text-slate-200" size={28} />
        </div>
        <h2 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tighter">{t('empty_cart')}</h2>
        <p className="text-slate-400 mb-6 max-w-xs mx-auto font-medium uppercase text-[9px] tracking-widest">
          {t('cart_empty_desc')}
        </p>
      </div>
    );
  }

  // Interstitial authorization view - Made significantly more compact
  if (showAuthChoice) {
    return (
      <div className="max-w-2xl mx-auto animate-fade-in py-6">
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-2xl text-center space-y-6">
          <button 
            onClick={() => setShowAuthChoice(false)}
            className="flex items-center gap-2 text-slate-400 hover:text-slate-900 font-black uppercase text-[10px] tracking-widest transition-all mb-2"
          >
            <ChevronLeft size={16} /> {t('back_to_cart')}
          </button>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Authorization</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.15em] leading-relaxed">
              We recommend using a profile for secure card payments and order history.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <button 
              onClick={onCheckout}
              className="group p-5 rounded-2xl border-2 border-slate-100 hover:border-emerald-500 hover:bg-emerald-50/20 transition-all flex items-center gap-4 text-left"
            >
              <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center shrink-0 group-hover:bg-emerald-500 transition-colors">
                <UserCircle size={22} />
              </div>
              <div>
                <div className="text-[12px] font-black text-slate-900 uppercase tracking-tight">Checkout as Guest</div>
                <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Direct invoice method</div>
              </div>
              <ArrowRight className="ml-auto text-slate-200 group-hover:translate-x-1 transition-transform" size={18} />
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
               <button 
                onClick={() => window.dispatchEvent(new CustomEvent('changeView', { detail: AppView.CABINET }))}
                className="group p-5 rounded-2xl border-2 border-slate-100 hover:border-blue-500 hover:bg-blue-50/20 transition-all flex flex-col gap-2 text-left"
               >
                 <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                    <UserCheck size={18} />
                 </div>
                 <div>
                   <div className="text-[11px] font-black text-slate-900 uppercase tracking-tight leading-none">Login</div>
                   <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Sync profile</div>
                 </div>
               </button>

               <button 
                onClick={() => window.dispatchEvent(new CustomEvent('changeView', { detail: AppView.CABINET }))}
                className="group p-5 rounded-2xl border-2 border-slate-100 hover:border-yellow-500 hover:bg-yellow-50/20 transition-all flex flex-col gap-2 text-left"
               >
                 <div className="w-8 h-8 bg-yellow-100 text-yellow-600 rounded-lg flex items-center justify-center">
                    <UserPlus size={18} />
                 </div>
                 <div>
                   <div className="text-[11px] font-black text-slate-900 uppercase tracking-tight leading-none">Register</div>
                   <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Save details</div>
                 </div>
               </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in pb-12 max-w-6xl mx-auto">
      <div className="lg:col-span-2 space-y-3">
        <h2 className="text-lg font-black text-slate-900 mb-2 flex items-center gap-3 uppercase tracking-tighter">
          <ShoppingBag className="text-yellow-500" size={18} /> {t('cart_title')}
        </h2>
        
        {items.map((item) => (
          <div key={item.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:border-yellow-400/50 transition-all group/item">
            <div className="p-3 flex gap-4 items-center">
              <div className="w-14 h-14 bg-slate-50 rounded-xl overflow-hidden shrink-0 border border-slate-100 flex items-center justify-center p-1">
                <img 
                  src={getSafeImage(item.image) || IMAGE_FALLBACK} 
                  alt={getLoc(item.name) || 'Product'} 
                  className="max-w-full max-h-full object-contain group-hover/item:scale-110 transition-transform" 
                  onError={(e) => { (e.target as HTMLImageElement).src = IMAGE_FALLBACK; }}
                />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="font-black text-slate-900 truncate text-[10px] uppercase tracking-tighter leading-none">{getLoc(item.name)}</h3>
                  {item.parts && (
                    <span className="bg-yellow-400 text-yellow-950 text-[6px] font-black uppercase px-1.5 py-0.5 rounded-full shrink-0 shadow-sm">{t('bundle')}</span>
                  )}
                </div>
                <p className="text-[7px] text-slate-400 mb-1.5 font-black uppercase tracking-widest">{item.category}</p>
                
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-slate-50 rounded-lg p-0.5 border border-slate-100">
                    <button 
                      onClick={() => updateQuantity(item.id, -1)}
                      className="w-6 h-6 flex items-center justify-center rounded bg-white border border-slate-200 text-slate-400 hover:text-yellow-600 transition-all shadow-sm active:scale-90"
                    >
                      <Minus size={8} />
                    </button>
                    <span className="w-5 text-center font-black text-[10px] text-slate-900">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.id, 1)}
                      className="w-6 h-6 flex items-center justify-center rounded bg-white border border-slate-200 text-slate-400 hover:text-yellow-600 transition-all shadow-sm active:scale-90"
                    >
                      <Plus size={8} />
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="text-right pr-2">
                <div className="text-xs font-black text-slate-900 tracking-tighter leading-none">{formatPrice((item.price ?? 0) * item.quantity)}</div>
                <button 
                  onClick={() => removeItem(item.id)}
                  className="text-slate-300 hover:text-red-500 p-1.5 transition-colors mt-1 bg-slate-50 rounded-lg border border-slate-100"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="lg:col-span-1">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 sticky top-32 shadow-xl">
          <h3 className="text-xs font-black text-slate-900 mb-3 uppercase tracking-tighter">{t('cart_summary')}</h3>
          <div className="space-y-2 mb-5">
            <div className="flex justify-between text-[8px] font-black text-slate-400 uppercase tracking-widest">
              <span>{t('cart_items_count')}</span>
              <span className="text-slate-900">{items.length} {t('units')}</span>
            </div>
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-0.5">
              <span className="font-black text-slate-400 uppercase text-[7px] tracking-widest">{t('cart_total_value')}</span>
              <span className="text-xl font-black text-slate-900 tracking-tighter">{formatPrice(totalPrice ?? 0)}</span>
            </div>
          </div>
          <button 
            onClick={handlePlaceOrder}
            className="w-full bg-slate-900 hover:bg-yellow-400 text-white hover:text-yellow-950 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-3 active:scale-95 group"
          >
            {t('cart_checkout_btn')}
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};
