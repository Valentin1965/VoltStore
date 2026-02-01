 
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useProducts } from '../../contexts/ProductsContext';
import { useCart } from '../../contexts/CartContext';
import { useNotification } from '../../contexts/NotificationContext';
import { 
  Leaf, Zap, Cpu, Battery, Sun, Layers, Flame, Crown, X, 
  ChevronLeft, ChevronRight, Info, List, FileText, Download, ShoppingCart, Truck
} from 'lucide-react';
import { AppView, Category, Product, ProductSpec, ProductDoc } from '../../types';
import { ProductCard, useLocalizedText } from '../catalog/CatalogSection';

const IMAGE_FALLBACK = 'https://images.unsplash.com/photo-1509391366360-fe5bb58583bb?q=80&w=600&auto=format&fit=crop';

interface AboutPageProps {
  onNavigateToCatalog: (view: AppView) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigateToCatalog }) => {
  const { t, formatPrice } = useLanguage();
  const { products, setSelectedCategory } = useProducts();
  const { addItem } = useCart();
  const { addNotification } = useNotification();
  const getLoc = useLocalizedText();
  
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  useEffect(() => {
    if (selectedProduct) {
      document.body.style.overflow = 'hidden';
      setActiveImageIdx(0);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [selectedProduct]);

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

  const parseJsonData = (data: any): any[] => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    try {
      return typeof data === 'string' ? JSON.parse(data) : [];
    } catch { return []; }
  };

  const productImages = selectedProduct 
    ? (Array.isArray(selectedProduct.images) && selectedProduct.images.length > 0
        ? selectedProduct.images.filter(img => img && typeof img === 'string' && img.trim() !== '')
        : (selectedProduct.image && typeof selectedProduct.image === 'string' && selectedProduct.image.trim() !== '' ? [selectedProduct.image] : [IMAGE_FALLBACK]))
    : [IMAGE_FALLBACK];

  const filteredSpecs = selectedProduct ? parseJsonData(selectedProduct.specs).filter((s: ProductSpec) => s.label?.trim() && s.value?.trim()) : [];
  const productDocs = selectedProduct ? parseJsonData(selectedProduct.docs).filter((d: ProductDoc) => d.title?.trim() && d.url?.trim()) : [];
  const isSelectedOutOfStock = selectedProduct ? (selectedProduct.stock === 0 || selectedProduct.stock === null) : false;
  const selectedProductNameStr = selectedProduct ? getLoc(selectedProduct.name) : "";

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
        </div>

        <div className="relative z-20 px-8 md:px-16 py-12 max-w-4xl">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-xl text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] mb-6 border border-white/20">
            <Leaf size={12} className="text-emerald-400" /> Photovoltaic Specialists
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-[0.9] tracking-tighter uppercase">
            GREEN <span className="text-emerald-400 italic">LIGHT</span> <br/>
            <span className="text-white/95">SOLAR GROUP</span>
          </h1>
        </div>
      </div>

      {/* Category Menu */}
      <div className="mb-20 px-4">
        <div className="flex flex-wrap justify-center gap-6">
          {categoryMenu.map((item) => (
            <button 
              key={item.id} 
              onClick={() => handleCategoryClick(item.id)}
              className="flex-1 min-w-[150px] max-w-[220px] h-[180px] bg-white border-2 border-emerald-100/80 rounded-[2.5rem] px-6 py-6 flex flex-col items-center justify-center gap-3 group hover:border-emerald-500 hover:shadow-xl transition-all duration-500 shadow-sm relative overflow-hidden"
            >
              <div className="relative z-10 w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all duration-500">
                <item.icon size={24} />
              </div>
              <span className="relative z-10 text-[16px] font-black uppercase tracking-tighter text-slate-900 group-hover:text-emerald-600 transition-colors text-center leading-none">
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Bestsellers Section */}
      {leaders.length > 0 && (
        <div className="mb-24 px-4 space-y-10">
          <div className="flex flex-col items-center text-center space-y-2">
            <span className="text-amber-500 text-[9px] font-black uppercase tracking-[0.5em] flex items-center gap-2">
              <Crown size={14} className="fill-amber-500" /> Professional Grade
            </span>
            <h3 className="text-4xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-4">
              {t('sales_leader')} <Flame size={28} className="text-rose-500 animate-pulse" />
            </h3>
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

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-10 bg-slate-900/40 backdrop-blur-md overflow-y-auto animate-fade-in">
          <div className="bg-white w-full max-w-6xl rounded-[2.5rem] shadow-3xl border border-white flex flex-col my-auto max-h-[95vh] overflow-hidden">
            
            <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-4">
                <div className="bg-emerald-600 p-2 rounded-xl">
                  <Zap size={18} className="text-white" />
                </div>
                <h2 className="text-lg font-black text-slate-900 uppercase tracking-tighter leading-none">{selectedProductNameStr}</h2>
              </div>
              <button onClick={() => setSelectedProduct(null)} className="p-2 hover:bg-slate-100 rounded-xl transition-all"><X size={20} /></button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
              <div className="flex flex-col lg:flex-row gap-10 mb-12">
                <div className="lg:w-[58%] space-y-4">
                  <div className="aspect-video bg-slate-50 rounded-3xl overflow-hidden border border-slate-100 relative group/img p-6 flex items-center justify-center">
                    <img 
                      src={productImages[activeImageIdx] || IMAGE_FALLBACK} 
                      className="max-w-full max-h-full object-contain" 
                      alt={selectedProductNameStr} 
                      onError={(e) => { (e.target as HTMLImageElement).src = IMAGE_FALLBACK; }}
                    />
                    {productImages.length > 1 && (
                      <div className="absolute inset-0 flex items-center justify-between px-3 opacity-0 group-hover/img:opacity-100 transition-opacity">
                        <button onClick={() => setActiveImageIdx(prev => (prev > 0 ? prev - 1 : productImages.length - 1))} className="p-2 bg-white/80 rounded-xl shadow-md"><ChevronLeft size={18}/></button>
                        <button onClick={() => setActiveImageIdx(prev => (prev < productImages.length - 1 ? prev + 1 : 0))} className="p-2 bg-white/80 rounded-xl shadow-md"><ChevronRight size={18}/></button>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {productImages.map((img, idx) => (
                      <button 
                        key={idx} 
                        onClick={() => setActiveImageIdx(idx)}
                        className={`w-20 h-20 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${activeImageIdx === idx ? 'border-emerald-500 scale-95' : 'border-slate-100 opacity-60 hover:opacity-100'}`}
                      >
                        <img src={img || IMAGE_FALLBACK} className="w-full h-full object-cover" alt="" onError={(e) => { (e.target as HTMLImageElement).src = IMAGE_FALLBACK; }} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="lg:w-[42%] flex flex-col gap-6">
                  <div className="bg-slate-50/50 rounded-3xl border border-slate-100 p-8 flex flex-col gap-6 shadow-sm">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 mb-2">
                        {selectedProduct.is_leader && (
                          <span className="bg-amber-400 text-yellow-950 text-[8px] font-black uppercase px-2 py-1 rounded-md flex items-center gap-1">
                            <Crown size={10} className="fill-yellow-950" /> {t('sales_leader')}
                          </span>
                        )}
                        {selectedProduct.is_new && (
                          <span className="bg-emerald-500 text-white text-[8px] font-black uppercase px-2 py-1 rounded-md">New</span>
                        )}
                      </div>
                      <h3 className="font-black text-slate-900 text-sm uppercase tracking-tight leading-tight mb-2">{selectedProductNameStr}</h3>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('sku')}: {selectedProduct.id?.slice(0, 8).toUpperCase()}</span>
                      </div>
                    </div>

                    <div className="space-y-0.5">
                      <div className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter">
                        {formatPrice(Math.round(selectedProduct.price / 1.2))} <span className="text-[8px] opacity-60 font-black">{t('ex_vat')}</span>
                      </div>
                      <div className="text-3xl font-black text-slate-900 tracking-tighter">
                        {formatPrice(selectedProduct.price)} <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest ml-1">{t('inc_vat')}</span>
                      </div>
                    </div>

                    <div className="space-y-4 py-6 border-y border-slate-200/60">
                      <div className="flex items-center justify-between">
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('availability')}:</span>
                         <div className="flex items-center gap-1.5">
                            <div className={`w-2 h-2 rounded-full shadow-sm ${isSelectedOutOfStock ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
                            <span className="text-[10px] font-black text-slate-900 uppercase tracking-tight">
                              {isSelectedOutOfStock ? t('out_of_stock') : t('in_stock')}
                            </span>
                         </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button 
                        onClick={() => { 
                          addItem(selectedProduct); 
                          addNotification(isSelectedOutOfStock ? t('preorder_added') : t('item_added'), 'success'); 
                        }}
                        className={`flex-1 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all shadow-lg py-5 flex items-center justify-center gap-3 active:scale-95 group ${
                          isSelectedOutOfStock 
                            ? 'bg-amber-500 hover:bg-amber-600 text-white' 
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        }`}
                      >
                        <ShoppingCart size={18} className="group-hover:rotate-12 transition-transform" /> 
                        {isSelectedOutOfStock ? t('order_now') : t('add_to_cart')}
                      </button>
                    </div>
                  </div>
                  <button onClick={() => setSelectedProduct(null)} className="w-full py-4 rounded-2xl bg-slate-100 text-slate-500 font-black text-[9px] uppercase tracking-widest hover:bg-slate-200 transition-all">{t('close')}</button>
                </div>
              </div>

              {/* Product Characteristics Form Section */}
              <div className="max-w-4xl space-y-16 pb-20">
                {selectedProduct.description && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                      <Info size={16} className="text-emerald-500" />
                      <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{t('about_product')}</h4>
                    </div>
                    <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">{getLoc(selectedProduct.description)}</p>
                  </div>
                )}

                {filteredSpecs.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                      <List size={16} className="text-emerald-500" />
                      <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{t('specs')}</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-1">
                      {filteredSpecs.map((spec: ProductSpec, i: number) => (
                        <div key={i} className="flex justify-between border-b border-slate-50 py-3">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight">{spec.label}</span>
                          <span className="text-[10px] font-bold text-slate-800 uppercase text-right">{spec.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {productDocs.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                      <FileText size={16} className="text-emerald-500" />
                      <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{t('docs_and_files')}</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {productDocs.map((doc: ProductDoc, i: number) => (
                        <a 
                          key={i} 
                          href={doc.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-md transition-all group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-xl text-rose-500 shadow-sm">
                              <FileText size={16} />
                            </div>
                            <span className="text-[10px] font-black text-slate-900 uppercase tracking-tight line-clamp-1">{doc.title}</span>
                          </div>
                          <Download size={14} className="text-slate-400 group-hover:text-emerald-500 transition-colors" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
                   
