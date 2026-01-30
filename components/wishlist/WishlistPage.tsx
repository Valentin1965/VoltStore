
import React from 'react';
import { useWishlist } from '../../contexts/WishlistContext';
import { useCart } from '../../contexts/CartContext';
import { useProducts } from '../../contexts/ProductsContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Heart, ShoppingCart, Trash2, Zap, Clock, ArrowRight } from 'lucide-react';
import { LocalizedText } from '../../types';

// Helper hook to handle LocalizedText objects
const useLocalizedText = () => {
  const { language } = useLanguage();
  return (text: LocalizedText | null | undefined): string => {
    if (!text) return "";
    if (typeof text === 'string') return text;
    return text[language] || text['en'] || Object.values(text)[0] || "";
  };
};

const IMAGE_FALLBACK = 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?q=80&w=400&auto=format&fit=crop';

export const WishlistPage: React.FC = () => {
  const { t } = useLanguage();
  const { wishlist, toggleWishlist, isInWishlist } = useWishlist();
  const { addItem } = useCart();
  const { products } = useProducts();
  const getLoc = useLocalizedText();

  const recommendations = products.slice(0, 4);

  const formatPrice = (price: any) => {
    if (price === null || price === undefined) return '0';
    const num = Number(price);
    if (isNaN(num)) return '0';
    return num.toLocaleString();
  };

  const getSafeImage = (img: string | null | undefined) => {
    if (!img || typeof img !== 'string' || img.trim() === '') return null;
    return img;
  };

  if (wishlist.length === 0) {
    return (
      <div className="animate-fade-in space-y-10 max-w-6xl mx-auto">
        <div className="text-center py-12 bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
            <Clock className="text-slate-300" size={32} />
          </div>
          <h2 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tighter break-words px-6">
            {t('booking_empty')}
          </h2>
          <p className="text-slate-500 text-xs max-w-md mx-auto font-medium leading-relaxed px-8 break-words">
            {t('booking_desc')}
          </p>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tighter flex items-center gap-2">
              <Zap className="text-yellow-500" size={16} /> {t('recommended_booking')}
            </h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {recommendations.map((item) => (
              <div key={item.id} className="group bg-white border border-slate-100 rounded-3xl p-4 hover:shadow-lg transition-all flex flex-col h-full border-b-2 border-transparent hover:border-b-yellow-400">
                <div className="aspect-square rounded-2xl overflow-hidden mb-3 bg-slate-50 relative border border-slate-50">
                  <img 
                    src={getSafeImage(item.image) || IMAGE_FALLBACK} 
                    /* Fix: Use getLoc to resolve LocalizedText to string for alt attribute */
                    alt={getLoc(item.name)} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    onError={(e) => { (e.target as HTMLImageElement).src = IMAGE_FALLBACK; }}
                  />
                  <button 
                    onClick={() => toggleWishlist(item)}
                    className="absolute top-2 right-2 p-2 bg-white/90 backdrop-blur-md rounded-xl shadow-sm text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <Heart size={14} fill={isInWishlist(item.id) ? "currentColor" : "none"} className={isInWishlist(item.id) ? "text-red-500" : ""} />
                  </button>
                </div>
                <div className="flex-1">
                  <div className="text-[8px] font-black text-yellow-600 uppercase tracking-widest mb-1">{item.category}</div>
                  /* Fix: Use getLoc to resolve LocalizedText to string for React element child */
                  <h4 className="font-bold text-slate-900 text-[11px] mb-2 line-clamp-1 uppercase tracking-tight">{getLoc(item.name)}</h4>
                </div>
                <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-50">
                  <span className="font-black text-slate-900 text-xs">₴{formatPrice(item.price)}</span>
                  <button 
                    onClick={() => toggleWishlist(item)}
                    className="text-[9px] font-black uppercase text-slate-900 hover:text-yellow-600 flex items-center gap-1 tracking-widest transition-colors"
                  >
                    {t('nav_wishlist')} <ArrowRight size={10} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-6xl mx-auto">
      <h2 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3 uppercase tracking-tighter">
        <Heart className="text-red-500 fill-red-500" size={24} /> {t('reserved_equipment')}
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {wishlist.map((item) => (
          <div key={item.id} className="group bg-white border border-slate-100 rounded-[2rem] p-4 flex gap-5 hover:shadow-xl transition-all">
            <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0 bg-slate-50 border border-slate-100">
              <img 
                src={getSafeImage(item.image) || IMAGE_FALLBACK} 
                /* Fix: Use getLoc to resolve LocalizedText to string for alt attribute */
                alt={getLoc(item.name)} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                onError={(e) => { (e.target as HTMLImageElement).src = IMAGE_FALLBACK; }}
              />
            </div>
            <div className="flex flex-col justify-between py-1 flex-1 min-w-0">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[9px] font-black uppercase text-yellow-600 tracking-widest">{item.category}</span>
                  <button onClick={() => toggleWishlist(item)} className="text-slate-300 hover:text-red-500 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
                /* Fix: Use getLoc to resolve LocalizedText to string for React element child */
                <h3 className="font-bold text-slate-900 text-xs truncate mt-1 uppercase tracking-tight">{getLoc(item.name)}</h3>
                <div className="text-base font-black text-slate-900 mt-1">₴{formatPrice(item.price)}</div>
              </div>
              <div className="pt-2">
                <button 
                  onClick={() => addItem(item)}
                  className="w-full bg-slate-900 text-white text-[9px] font-black py-2 rounded-xl hover:bg-yellow-400 hover:text-yellow-950 transition-all flex items-center justify-center gap-2 uppercase tracking-widest"
                >
                  <ShoppingCart size={12} />
                  {item.stock === 0 ? t('order_now') : t('add_to_cart')}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
