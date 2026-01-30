
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useProducts } from '../../contexts/ProductsContext';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { useCompare } from '../../contexts/CompareContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { 
  ShoppingCart, X, Heart, Loader2, Zap, 
  Sparkles, Scale, Layers, ChevronLeft, ChevronRight, Info, List, 
  Truck, Clock, FileText, Download, Leaf, Crown
} from 'lucide-react';
import { Product, ProductSpec, ProductDoc, LocalizedText } from '../../types';

// Reliable image fallback
const IMAGE_FALLBACK = 'https://images.unsplash.com/photo-1509391366360-fe5bb58583bb?q=80&w=600&auto=format&fit=crop';

export const useLocalizedText = () => {
  const { language } = useLanguage();
  return (text: LocalizedText | null | undefined): string => {
    if (!text) return "";
    if (typeof text === 'string') return text;
    return (text as any)[language] || (text as any)['en'] || Object.values(text as any)[0] || "";
  };
};

export interface ProductCardProps {
  product: Product;
  index: number;
  onSelect: (product: Product) => void;
  onAddToCart: (e: React.MouseEvent, product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, index, onSelect, onAddToCart }) => {
  const { t, formatPrice } = useLanguage();
  const getLoc = useLocalizedText();
  
  const getDisplayImage = () => {
    if (Array.isArray(product.images) && product.images.length > 0) {
      const firstValid = product.images.find(img => img && typeof img === 'string' && img.trim() !== '');
      if (firstValid) return firstValid;
    }
    if (product.image && typeof product.image === 'string' && product.image.trim() !== '') return product.image;
    return IMAGE_FALLBACK;
  };

  const [displayImage, setDisplayImage] = useState(getDisplayImage());
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { toggleCompare, isInCompare } = useCompare();
  
  const isReserved = isInWishlist(product.id);
  const isComparing = isInCompare(product.id);
  const isOutOfStock = product.stock === 0 || product.stock === null;
  const productNameStr = getLoc(product.name);

  // Sync image if product data changes
  useEffect(() => {
    setDisplayImage(getDisplayImage());
  }, [product]);

  return (
    <div 
      onClick={() => onSelect(product)}
      style={{ animationDelay: `${index * 50}ms` }}
      className={`group premium-card overflow-hidden cursor-pointer flex flex-col h-full animate-fade-in relative border ${product.is_leader ? 'border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.1)]' : 'border-slate-200/50'}`}
    >
      <div className="relative h-52 w-full overflow-hidden bg-slate-50/50 p-2 flex items-center justify-center">
        <img 
          src={displayImage} 
          alt={productNameStr}
          className="max-w-full max-h-full object-contain transition-all duration-700 group-hover:scale-110"
          onError={() => { setDisplayImage(IMAGE_FALLBACK); }}
          loading="lazy"
        />
        
        <div className="absolute top-3 right-3 z-20">
          <div className="bg-slate-900/90 backdrop-blur-md text-white px-3 py-1.5 rounded-xl shadow-2xl border border-white/10 flex items-center justify-center">
            <span className="text-[11px] font-black tracking-tighter">{formatPrice(product.price)}</span>
          </div>
        </div>

        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {product.is_leader && (
            <span className="bg-amber-400 text-yellow-950 text-[7px] font-black uppercase px-2 py-1 rounded-md shadow-lg flex items-center gap-1">
              <Crown size={8} className="fill-yellow-950" /> {t('sales_leader')}
            </span>
          )}
          {product.is_new && (
            <span className="bg-emerald-500 text-white text-[7px] font-black uppercase px-2 py-1 rounded-md shadow-lg">New</span>
          )}
          {product.on_sale && (
            <span className="bg-rose-500 text-white text-[7px] font-black uppercase px-2 py-1 rounded-md shadow-lg">Sale</span>
          )}
          {isOutOfStock && (
            <span className="bg-slate-500 text-white text-[7px] font-black uppercase px-2 py-1 rounded-md shadow-lg flex items-center gap-1">
              <Clock size={8} /> {t('out_of_stock')}
            </span>
          )}
        </div>

        <div className="absolute top-12 left-3 flex flex-col gap-2 -translate-x-12 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300 z-10">
          <button 
            onClick={(e) => { e.stopPropagation(); toggleWishlist(product); }}
            className={`p-2 rounded-lg shadow-lg transition-all active:scale-90 ${
              isReserved ? 'bg-rose-500 text-white' : 'bg-white text-slate-400 hover:text-rose-500'
            }`}
          >
            <Heart size={12} fill={isReserved ? "currentColor" : "none"} />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); toggleCompare(product); }}
            className={`p-2 rounded-lg shadow-lg transition-all active:scale-90 ${
              isComparing ? 'bg-emerald-600 text-white' : 'bg-white text-slate-400 hover:text-emerald-600'
            }`}
          >
            <Scale size={12} />
          </button>
        </div>
      </div>

      <div className="p-5 flex flex-col flex-1 bg-white">
        <div className="text-[8px] font-black text-emerald-600 uppercase tracking-widest mb-1">{product.category}</div>
        <h3 className="font-bold text-slate-800 text-[10px] leading-tight group-hover:text-emerald-600 transition-colors line-clamp-2 uppercase tracking-tight mb-4">{productNameStr}</h3>
        
        <div className="mt-auto flex items-center justify-between">
          <div className="flex items-center gap-1">
             <div className={`w-1 h-1 rounded-full ${isOutOfStock ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
             <span className="text-[7px] font-black text-slate-400 uppercase">
               {isOutOfStock ? t('out_of_stock') : t('in_stock')}
             </span>
          </div>
          <button 
            onClick={(e) => onAddToCart(e, product)}
            className={`p-2.5 rounded-lg transition-all shadow-xl active:scale-90 flex items-center gap-2 ${
              isOutOfStock 
                ? 'bg-amber-500 hover:bg-amber-600 text-white' 
                : 'bg-slate-900 hover:bg-emerald-500 text-white'
            }`}
          >
            <ShoppingCart size={14} />
            <span className="text-[8px] font-black uppercase">{isOutOfStock ? t('order_now') : t('add_to_cart')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export const CatalogSection: React.FC<{ onSelectSystem?: () => void }> = ({ onSelectSystem }) => {
  const { t, formatPrice } = useLanguage();
  const getLoc = useLocalizedText();
  const { filteredProducts, categories, selectedCategory, setSelectedCategory, isLoading } = useProducts();
  const { addItem } = useCart();
  const { addNotification } = useNotification();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const productsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedProduct) {
      document.body.style.overflow = 'hidden';
      setActiveImageIdx(0);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [selectedProduct]);

  const scrollToProducts = () => {
    productsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSelectKits = () => {
    setSelectedCategory('Kits');
    setTimeout(scrollToProducts, 100);
  };

  const parseJsonData = (data: any): any[] => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    try {
      return typeof data === 'string' ? JSON.parse(data) : [];
    } catch { return []; }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-60 space-y-8">
        <Loader2 className="text-emerald-500 animate-spin" size={60} />
      </div>
    );
  }

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
    <div className="space-y-24">
      {/* Hero Section - Image made lighter and higher contrast as requested */}
      <div className="relative rounded-[3rem] bg-white overflow-hidden min-h-[380px] flex items-center shadow-sm border border-emerald-100">
        <div className="absolute inset-0 bg-gradient-to-r from-white/70 via-white/20 to-transparent z-10"></div>
        <img 
          src="https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?q=80&w=2000&auto=format&fit=crop" 
          className="absolute right-0 top-0 w-3/4 h-full object-cover animate-slow-zoom opacity-100 brightness-125 contrast-150" 
          alt="" 
        />
        
        <div className="relative z-20 px-8 md:px-16 max-w-4xl py-12">
          <div className="inline-flex items-center gap-2 bg-emerald-600 text-white px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest mb-6 shadow-lg">
            <Leaf size={12} className="text-white" /> {t('hero_tagline')}
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-8 leading-[0.85] tracking-tighter uppercase">
            GREEN <br/>
            <span className="text-emerald-500 italic">LIGHT</span>
          </h1>
          
          <div className="flex flex-wrap gap-4">
            <button onClick={onSelectSystem} className="btn-action bg-slate-900 text-white hover:bg-emerald-600 group px-6 py-3.5 text-[10px]">
              {t('nav_architect')} <Sparkles size={16} className="group-hover:rotate-12 transition-transform" />
            </button>
            <button onClick={handleSelectKits} className="px-8 py-3.5 rounded-xl bg-white border border-emerald-200 text-emerald-700 font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 hover:text-white hover:shadow-xl transition-all">
              {t('ready_kits')} <Layers size={16} className="ml-2 inline-block" />
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-12">
        <div ref={productsRef} className="flex flex-col md:flex-row items-center justify-between border-b border-slate-200 pb-8 scroll-mt-32 gap-6">
           <div className="flex gap-4 overflow-x-auto scrollbar-hide w-full md:w-auto">
            <button onClick={() => setSelectedCategory('All')} className={`px-8 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${selectedCategory === 'All' ? 'bg-slate-900 text-white shadow-xl' : 'bg-white text-slate-400 border border-slate-100'}`}>{t('all_products')}</button>
            {categories.map((cat) => (
              <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-8 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${selectedCategory === cat ? 'bg-slate-900 text-white shadow-xl' : 'bg-white text-slate-400 border border-slate-100'}`}>{cat}</button>
            ))}
          </div>
          <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
            {filteredProducts.length} {t('items_found')}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
          {filteredProducts.map((p, idx) => (
            <ProductCard 
              key={p.id} 
              product={p} 
              index={idx} 
              onSelect={setSelectedProduct} 
              onAddToCart={(e, p) => { 
                e.stopPropagation(); 
                addItem(p); 
                addNotification(p.stock === 0 ? t('preorder_added') : t('item_added'), 'success'); 
              }} 
            />
          ))}
        </div>
      </div>

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

                      <div className="bg-white p-4 rounded-2xl border border-slate-100 flex items-start gap-4">
                         <div className={`shrink-0 p-2 rounded-xl ${isSelectedOutOfStock ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                            <Truck size={16} />
                         </div>
                         <div className="flex-1">
                            <div className="text-[10px] font-black text-slate-900 uppercase tracking-tight">
                              {isSelectedOutOfStock ? t('expected_delivery') : t('delivery')}
                            </div>
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
