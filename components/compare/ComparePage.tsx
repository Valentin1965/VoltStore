
import React from 'react';
import { useCompare } from '../../contexts/CompareContext';
import { useCart } from '../../contexts/CartContext';
import { useProducts } from '../../contexts/ProductsContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Scale, ShoppingCart, Zap, X, CheckCircle2 } from 'lucide-react';
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

export const ComparePage: React.FC = () => {
  const { t } = useLanguage();
  const { compareList, toggleCompare, clearCompare, isInCompare } = useCompare();
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
    if (!img || typeof img !== 'string' || img.trim() === '') return IMAGE_FALLBACK;
    return img;
  };

  if (compareList.length === 0) {
    return (
      <div className="animate-fade-in space-y-12 max-w-6xl mx-auto">
        <div className="text-center py-12 bg-white rounded-[2.5rem] border border-slate-100 shadow-lg overflow-hidden">
          <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-100">
            <Scale className="text-slate-300" size={32} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-3 uppercase tracking-tighter break-words px-6">{t('no_compare_selected')}</h2>
          <p className="text-slate-400 mb-2 max-w-sm mx-auto font-medium uppercase text-[10px] tracking-widest leading-relaxed px-8 break-words">
            {t('compare_desc')}
          </p>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tighter flex items-center gap-2">
              <Zap className="text-yellow-500" size={16} /> {t('select_items_compare')}
            </h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {recommendations.map((item) => (
              <div key={item.id} className="group bg-white border border-slate-100 rounded-3xl p-5 hover:shadow-lg transition-all flex flex-col border-b-2 border-transparent hover:border-b-yellow-400 h-full">
                <div className="aspect-square rounded-2xl overflow-hidden mb-4 bg-slate-50 relative border border-slate-50">
                  <img 
                    src={getSafeImage(item.image)} 
                    /* Fix: Use getLoc to resolve LocalizedText to string for alt attribute */
                    alt={getLoc(item.name)} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    onError={(e) => { (e.target as HTMLImageElement).src = IMAGE_FALLBACK; }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[8px] font-black text-yellow-600 uppercase tracking-widest mb-1">{item.category}</div>
                  /* Fix: Use getLoc to resolve LocalizedText to string for React element child */
                  <h4 className="font-bold text-slate-900 text-[11px] mb-2 line-clamp-1 uppercase tracking-tight leading-snug">{getLoc(item.name)}</h4>
                </div>
                <div className="space-y-3">
                  <div className="text-base font-black text-slate-900">₴{formatPrice(item.price)}</div>
                  <button 
                    onClick={() => toggleCompare(item)}
                    className={`w-full py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 border-2 ${
                      isInCompare(item.id) 
                      ? 'bg-blue-500 border-blue-500 text-white' 
                      : 'bg-white border-slate-100 text-slate-500 hover:border-yellow-400 hover:text-yellow-950'
                    }`}
                  >
                    <Scale size={12} /> {isInCompare(item.id) ? t('active_status') : t('nav_compare')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const allFeatures = Array.from(new Set(compareList.flatMap(p => p.features || [])));

  return (
    <div className="animate-fade-in pb-32 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3 uppercase tracking-tighter">
          <Scale className="text-yellow-500" size={28} /> {t('performance_matrix')}
        </h2>
        <button 
          onClick={clearCompare}
          className="px-6 py-2 bg-slate-100 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all"
        >
          {t('clear_all')}
        </button>
      </div>

      <div className="overflow-x-auto scrollbar-hide pb-4">
        <table className="w-full bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-xl table-fixed">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="p-6 w-48 bg-slate-50/50"></th>
              {compareList.map(product => (
                <th key={product.id} className="p-6 min-w-[200px] group">
                  <div className="relative mb-4">
                    <img 
                      src={getSafeImage(product.image)} 
                      className="w-32 h-32 mx-auto rounded-2xl object-cover shadow-md border border-slate-50 group-hover:scale-105 transition-transform" 
                      alt="" 
                      onError={(e) => { (e.target as HTMLImageElement).src = IMAGE_FALLBACK; }}
                    />
                    <button 
                      onClick={() => toggleCompare(product)}
                      className="absolute -top-2 -right-2 p-2 bg-white text-slate-400 hover:text-red-500 rounded-xl shadow-lg border border-slate-100 transition-all active:scale-90"
                    >
                      <X size={12} />
                    </button>
                  </div>
                  <div className="text-[8px] font-black text-yellow-600 uppercase tracking-widest mb-1">{product.category}</div>
                  /* Fix: Use getLoc to resolve LocalizedText to string for React element child */
                  <h3 className="font-black text-slate-900 uppercase text-[11px] tracking-tighter line-clamp-1">{getLoc(product.name)}</h3>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            <tr>
              <td className="p-6 bg-slate-50/50 text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('price')}</td>
              {compareList.map(p => (
                <td key={p.id} className="p-6 text-center">
                  <div className="text-lg font-black text-slate-900 tracking-tighter">₴{formatPrice(p.price)}</div>
                </td>
              ))}
            </tr>

            {allFeatures.map(feature => (
              <tr key={feature}>
                <td className="p-6 bg-slate-50/50 text-[9px] font-black text-slate-400 uppercase tracking-widest leading-tight break-words">{feature}</td>
                {compareList.map(p => (
                  <td key={p.id} className="p-6 text-center">
                    {p.features?.includes(feature) ? (
                      <CheckCircle2 className="text-green-500 mx-auto" size={16} />
                    ) : (
                      <X className="text-slate-100 mx-auto" size={16} />
                    )}
                  </td>
                ))}
              </tr>
            ))}

            <tr className="bg-slate-50/20">
              <td className="p-6"></td>
              {compareList.map(p => (
                <td key={p.id} className="p-6">
                  <button 
                    onClick={() => addItem(p)}
                    className="w-full bg-slate-900 hover:bg-yellow-400 text-white hover:text-yellow-950 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    <ShoppingCart size={12} /> {p.stock === 0 ? t('order_now') : t('add_to_cart')}
                  </button>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
