
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Plus, Edit, Trash2, X, 
  Layers, Save, Cpu, ImageIcon, 
  Package, Table as TableIcon,
  FileDown,
  Eye,
  EyeOff,
  CornerDownRight,
  Globe,
  List,
  FileText,
  Link as LinkIcon,
  Crown,
  Flame
} from 'lucide-react';
import { useProducts } from '../../contexts/ProductsContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Product, Category, ProductSpec, ProductDoc, KitComponent, Alternative } from '../../types';

const IMAGE_FALLBACK = 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?q=80&w=400&auto=format&fit=crop';
const LANGUAGES = ['en', 'da', 'no', 'sv'] as const;

export const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'kits' | 'products'>('kits');
  const { products, addProduct, updateProduct, deleteProduct, categories } = useProducts();
  const { addNotification } = useNotification();
  const { formatPrice, t } = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const kits = useMemo(() => products.filter(p => p.category === 'Kits'), [products]);
  const dbProductsList = useMemo(() => products.filter(p => p.category !== 'Kits'), [products]);
  
  const [formData, setFormData] = useState<Partial<Product>>({
    id: '',
    name: { en: '' }, 
    description: { en: '' }, 
    price: 0, 
    category: 'Inverters', 
    sub_category: '',
    image: '', 
    images: ['', '', ''],
    stock: 10, 
    is_new: true,
    on_sale: false,
    is_active: true,
    is_leader: false,
    features: [], 
    specs: '[]',
    docs: '[]',
    kitComponents: []
  });

  const isKitMode = formData.category === 'Kits';

  useEffect(() => {
    if (isKitMode && formData.kitComponents) {
      const total = formData.kitComponents.reduce((sum, comp) => sum + (comp.price * comp.quantity), 0);
      if (total !== formData.price) {
        setFormData(prev => ({ ...prev, price: total }));
      }
    }
  }, [formData.kitComponents, isKitMode]);

  const safeJsonParse = (val: any) => {
    if (val === null || val === undefined) return [];
    if (Array.isArray(val)) return val;
    if (typeof val !== 'string' || val.trim() === '') return [];
    try { 
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed : [];
    }
    catch (e) { 
      console.warn('[Admin Guard] Failed to parse JSON:', val);
      return []; 
    }
  };

  const handleOpenModal = (product?: Product, defaultCategory: Category = 'Inverters') => {
    if (product) {
      setEditingProduct(product);
      
      const stringifyField = (field: any) => {
        if (!field) return '[]';
        if (typeof field === 'string') {
          try { 
            const parsed = JSON.parse(field); 
            return Array.isArray(parsed) ? field : '[]';
          } 
          catch { return '[]'; }
        }
        return JSON.stringify(field);
      };

      setFormData({ 
        ...product, 
        name: typeof product.name === 'string' ? { en: product.name } : product.name,
        description: typeof product.description === 'string' ? { en: product.description } : product.description,
        images: Array.isArray(product.images) ? [...product.images, '', '', ''].slice(0, 3) : [product.image || '', '', ''].slice(0, 3),
        features: Array.isArray(product.features) ? product.features : [],
        specs: stringifyField(product.specs),
        docs: stringifyField(product.docs),
        kitComponents: product.kitComponents || [],
        is_active: product.is_active !== false,
        is_leader: product.is_leader === true
      });
    } else {
      setEditingProduct(null);
      setFormData({ 
        id: defaultCategory === 'Kits' ? 'KIT-' + Math.random().toString(36).substr(2, 6).toUpperCase() : '',
        name: { en: '', da: '', no: '', sv: '' }, 
        description: { en: '', da: '', no: '', sv: '' }, 
        price: 0, category: defaultCategory, sub_category: '',
        image: '', images: ['', '', ''], stock: 10, is_new: true, on_sale: false, is_active: true, is_leader: false, features: [], 
        specs: '[]', docs: '[]', kitComponents: []
      });
    }
    setIsModalOpen(true);
  };

  const getSafeImage = (img: string | null | undefined) => {
    if (!img || typeof img !== 'string' || img.trim() === '') return null;
    return img;
  };

  const getDisplayValue = (val: any) => {
    if (!val) return '—';
    if (typeof val === 'string') return val;
    return val.en || val.da || val.no || val.sv || '—';
  };

  const handleJsonListAdd = (field: 'specs' | 'docs', newItem: any) => {
    const list = safeJsonParse(formData[field]);
    list.push(newItem);
    setFormData({ ...formData, [field]: JSON.stringify(list) });
  };

  const handleJsonListRemove = (field: 'specs' | 'docs', index: number) => {
    const list = safeJsonParse(formData[field]);
    if (index >= 0 && index < list.length) {
      list.splice(index, 1);
      setFormData({ ...formData, [field]: JSON.stringify(list) });
    }
  };

  const handleJsonListUpdate = (field: 'specs' | 'docs', index: number, key: string, val: string) => {
    const list = safeJsonParse(formData[field]);
    if (list[index]) {
      list[index][key] = val;
      setFormData({ ...formData, [field]: JSON.stringify(list) });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanImages = (Array.isArray(formData.images) ? formData.images : []).filter(img => img && img.trim() !== '');
    const dataToSave = { 
      ...formData, 
      images: cleanImages, 
      image: cleanImages[0] || formData.image || '',
      is_active: formData.is_active ?? true,
      is_leader: formData.is_leader ?? false
    };
    
    if (editingProduct) {
      updateProduct(dataToSave as Product);
    } else {
      addProduct(dataToSave as Omit<Product, 'id'>);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-12 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2 uppercase tracking-tighter">
            <Cpu className="text-yellow-500" size={24} /> VoltStore Terminal
          </h1>
          <p className="text-slate-400 text-[8px] font-bold uppercase tracking-[0.2em] mt-1">Asset Management Panel</p>
        </div>
        <div className="flex bg-slate-200/50 p-2 rounded-2xl shadow-inner border border-slate-100">
          <button onClick={() => setActiveTab('kits')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'kits' ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-500 hover:text-slate-700'}`}>Energy Kits</button>
          <button onClick={() => setActiveTab('products')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'products' ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-500 hover:text-slate-700'}`}>Stock Items</button>
        </div>
      </div>

      {activeTab === 'kits' && (
        <div className="space-y-12 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
              <Layers className="text-yellow-400 mb-6" size={32} />
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Local Systems</div>
              <div className="text-5xl font-black tracking-tighter">{kits.length}</div>
            </div>
            <button onClick={() => handleOpenModal(undefined, 'Kits')} className="md:col-span-2 bg-white border-4 border-dashed border-slate-200 rounded-[3rem] flex flex-col items-center justify-center gap-6 hover:border-yellow-400 hover:bg-yellow-50/50 transition-all group shadow-sm">
              <Plus size={40} className="text-slate-200 group-hover:text-yellow-500" />
              <span className="text-xs font-black uppercase tracking-widest text-slate-900">Create Local Kit</span>
            </button>
          </div>
          <div className="bg-white rounded-[3.5rem] border border-slate-100 overflow-hidden shadow-sm">
            {kits.length === 0 ? (
              <div className="p-20 text-center text-slate-300 font-black uppercase text-[10px] tracking-widest">No saved kits found</div>
            ) : kits.map(kit => {
              const kitIsHidden = kit.is_active === false;
              const kitIsLeader = kit.is_leader === true;
              return (
                <div key={kit.id} className={`p-8 border-b border-slate-50 flex items-center justify-between hover:bg-slate-50 transition-colors ${kitIsHidden ? 'opacity-50 grayscale' : ''}`}>
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden relative">
                      <img 
                        src={getSafeImage(kit.image) || IMAGE_FALLBACK} 
                        className="w-full h-full object-cover" 
                        alt="" 
                        onError={(e) => { (e.target as HTMLImageElement).src = IMAGE_FALLBACK; }}
                      />
                      {kitIsHidden && (
                        <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center text-white">
                          <EyeOff size={12}/>
                        </div>
                      )}
                      {kitIsLeader && (
                         <div className="absolute top-1 right-1 bg-amber-400 text-yellow-950 p-1 rounded-md shadow-lg">
                           <Crown size={10} className="fill-yellow-950" />
                         </div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 uppercase text-sm tracking-tight flex items-center gap-2">
                        {getDisplayValue(kit.name)}
                        {kitIsHidden && <span className="bg-slate-200 text-slate-600 text-[8px] px-2 py-0.5 rounded-full uppercase">Inactive</span>}
                      </h4>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold text-slate-400 uppercase">{kit.id}</span>
                        {kitIsLeader && <span className="text-[8px] font-black text-amber-500 uppercase flex items-center gap-1"><Flame size={10} className="fill-amber-500"/> Sales Leader</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="text-right"><div className="text-xl font-black text-slate-900 tracking-tighter">{formatPrice(kit.price || 0)}</div></div>
                    <div className="flex gap-2">
                      <button onClick={() => handleOpenModal(kit)} className="p-3 bg-slate-100 text-slate-500 hover:bg-slate-900 hover:text-white rounded-xl transition-all shadow-sm"><Edit size={16} /></button>
                      <button onClick={() => deleteProduct(kit.id)} className="p-3 bg-slate-100 text-slate-500 hover:bg-red-500 hover:text-white rounded-xl transition-all shadow-sm"><Trash2 size={16} /></button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'products' && (
        <div className="bg-white rounded-[3.5rem] border border-slate-100 overflow-hidden shadow-sm animate-fade-in">
          <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50/20">
             <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Stock (Supabase Database)</h3>
             <button onClick={() => handleOpenModal()} className="bg-slate-900 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-yellow-400 hover:text-yellow-950 transition-all shadow-lg">Add Product</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead className="bg-slate-50/50 text-[9px] font-black uppercase text-slate-400">
                  <tr>
                    <th className="px-10 py-5">Product</th>
                    <th className="px-10 py-5">Category</th>
                    <th className="px-10 py-5">Status</th>
                    <th className="px-10 py-5">Price (Base: EUR)</th>
                    <th className="px-10 py-5 text-right">Actions</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {dbProductsList.map(p => {
                    const isHidden = p.is_active === false;
                    const isLeader = p.is_leader === true;
                    return (
                      <tr key={p.id} className={`hover:bg-slate-50 transition-colors ${isHidden ? 'bg-slate-50/30' : ''}`}>
                        <td className="px-10 py-5 flex items-center gap-4">
                          <div className="relative">
                            <img 
                              src={getSafeImage(p.image) || IMAGE_FALLBACK} 
                              className={`w-8 h-8 rounded-lg object-cover border border-slate-100 ${isHidden ? 'grayscale' : ''}`} 
                              alt="" 
                              onError={(e) => { (e.target as HTMLImageElement).src = IMAGE_FALLBACK; }}
                            />
                            {isHidden && <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center text-white rounded-lg"><EyeOff size={10}/></div>}
                            {isLeader && <div className="absolute -top-1 -right-1 bg-amber-400 text-yellow-950 p-0.5 rounded shadow-sm"><Crown size={8} className="fill-yellow-950" /></div>}
                          </div>
                          <div className="flex flex-col">
                             <span className={`font-black text-slate-900 text-xs uppercase truncate max-w-[250px] ${isHidden ? 'text-slate-400' : ''}`}>{getDisplayValue(p.name)}</span>
                             {isLeader && <span className="text-[7px] font-black text-amber-500 uppercase tracking-widest mt-0.5 flex items-center gap-1"><Flame size={8} className="fill-amber-500"/> Sales Leader</span>}
                          </div>
                        </td>
                        <td className="px-10 py-5"><span className="text-[9px] font-bold uppercase text-slate-500 bg-slate-100 px-3 py-1 rounded-full">{p.category}</span></td>
                        <td className="px-10 py-5">
                          <span className={`flex items-center gap-1.5 text-[8px] font-black uppercase ${isHidden ? 'text-slate-400' : 'text-emerald-600'}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${isHidden ? 'bg-slate-300' : 'bg-emerald-500'}`}></div> 
                            {isHidden ? 'Inactive' : 'Active'}
                          </span>
                        </td>
                        <td className="px-10 py-5 font-black text-slate-900">{formatPrice(p.price)}</td>
                        <td className="px-10 py-5 text-right flex justify-end gap-2">
                          <button onClick={() => handleOpenModal(p)} className="p-2 text-slate-300 hover:text-slate-900 transition-colors"><Edit size={16}/></button>
                          <button onClick={() => deleteProduct(p.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                        </td>
                      </tr>
                    );
                  })}
               </tbody>
            </table>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl overflow-y-auto animate-fade-in">
          <div className="bg-white w-full max-w-6xl rounded-[4rem] shadow-3xl border border-white flex flex-col max-h-[95vh] overflow-hidden my-auto">
            
            <div className="px-12 py-8 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
              <div className="flex items-center gap-4">
                <div className="bg-slate-900 p-3 rounded-2xl text-yellow-400">{isKitMode ? <Layers size={24}/> : <Package size={24}/>}</div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{isKitMode ? 'System Constructor' : 'Product Card'}</h3>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{isKitMode ? 'Asset assembly and logic config' : 'Technical data and media entry'}</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-4 bg-slate-50 hover:bg-red-50 hover:text-red-500 rounded-3xl transition-all shadow-sm"><X size={24} /></button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-12 bg-slate-50/30">
              <form onSubmit={handleSubmit} className="space-y-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                  <div className="space-y-6">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 flex justify-between">
                      Multilingual Name
                      <div className="flex gap-2">
                        <button 
                          type="button" 
                          onClick={() => setFormData(prev => ({...prev, is_leader: !prev.is_leader}))}
                          className={`flex items-center gap-2 px-3 py-1 rounded-full text-[8px] font-black uppercase transition-all ${formData.is_leader ? 'bg-amber-100 text-amber-600 border border-amber-200' : 'bg-slate-100 text-slate-400 border border-slate-200'}`}
                        >
                          <Crown size={10} className={formData.is_leader ? 'fill-amber-600' : ''}/>
                          <span>{t('sales_leader')}</span>
                        </button>
                        <button 
                          type="button" 
                          onClick={() => setFormData(prev => ({...prev, is_active: !prev.is_active}))}
                          className={`flex items-center gap-2 px-3 py-1 rounded-full text-[8px] font-black uppercase transition-all ${formData.is_active ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'}`}
                        >
                          {formData.is_active ? <Eye size={10}/> : <EyeOff size={10}/>}
                          <span>{formData.is_active ? 'Active' : 'Hidden'}</span>
                        </button>
                      </div>
                    </label>
                    <div className="space-y-3">
                      {LANGUAGES.map(lang => (
                        <div key={`name-${lang}`} className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[8px] font-black text-slate-300 uppercase">{lang}</span>
                          <input 
                            required={lang === 'en'}
                            value={(formData.name as any)?.[lang] || ''} 
                            onChange={e => {
                              const newName = { ...(formData.name as any), [lang]: e.target.value };
                              setFormData({...formData, name: newName});
                            }} 
                            className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-6 py-4 text-xs font-bold uppercase" 
                            placeholder={`Name (${lang.toUpperCase()})`} 
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Cost (Base: EUR)</label>
                      <input 
                        type="number" 
                        required 
                        value={formData.price || 0} 
                        onChange={e => setFormData({...formData, price: Number(e.target.value)})} 
                        readOnly={isKitMode}
                        className={`input-premium ${isKitMode ? 'bg-slate-100/50 cursor-not-allowed text-slate-500' : ''}`} 
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Category</label>
                        <select value={formData.category || 'Inverters'} onChange={e => setFormData({...formData, category: e.target.value as Category})} className="input-premium appearance-none">
                          {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Stock</label>
                        <input type="number" value={formData.stock || 0} onChange={e => setFormData({...formData, stock: Number(e.target.value)})} className="input-premium" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2">Multilingual Description</label>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {LANGUAGES.map(lang => (
                        <div key={`desc-${lang}`} className="space-y-2">
                          <label className="text-[8px] font-black text-slate-300 uppercase px-2 tracking-widest">{lang.toUpperCase()} DESCRIPTION</label>
                          <textarea 
                            value={(formData.description as any)?.[lang] || ''} 
                            onChange={e => {
                              const newDesc = { ...(formData.description as any), [lang]: e.target.value };
                              setFormData({...formData, description: newDesc});
                            }} 
                            className="input-premium h-40 resize-none pt-4 text-xs font-medium leading-relaxed" 
                            placeholder={`Description in ${lang.toUpperCase()}...`} 
                          />
                        </div>
                      ))}
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 border-t border-slate-100 pt-10">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                        <List size={16} className="text-yellow-500" /> Technical Specs
                      </h4>
                      <button 
                        type="button" 
                        onClick={() => handleJsonListAdd('specs', { label: '', value: '' })}
                        className="p-2 bg-slate-100 text-slate-500 hover:bg-slate-900 hover:text-white rounded-lg transition-all"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <div className="space-y-3">
                      {safeJsonParse(formData.specs).map((spec: ProductSpec, idx: number) => (
                        <div key={idx} className="flex gap-2 items-center">
                          <input 
                            value={spec.label} 
                            onChange={e => handleJsonListUpdate('specs', idx, 'label', e.target.value)}
                            placeholder="Label (e.g. Weight)"
                            className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-bold uppercase"
                          />
                          <input 
                            value={spec.value} 
                            onChange={e => handleJsonListUpdate('specs', idx, 'value', e.target.value)}
                            placeholder="Value (e.g. 5 kg)"
                            className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-bold"
                          />
                          <button 
                            type="button" 
                            onClick={() => handleJsonListRemove('specs', idx)}
                            className="p-2 text-slate-300 hover:text-red-500"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                        <FileText size={16} className="text-red-500" /> Documentation (PDF)
                      </h4>
                      <button 
                        type="button" 
                        onClick={() => handleJsonListAdd('docs', { title: '', url: '' })}
                        className="p-2 bg-slate-100 text-slate-500 hover:bg-slate-900 hover:text-white rounded-lg transition-all"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <div className="space-y-3">
                      {safeJsonParse(formData.docs).map((doc: ProductDoc, idx: number) => (
                        <div key={idx} className="space-y-2 p-4 bg-slate-50 rounded-2xl border border-slate-100 relative group/doc">
                          <button 
                            type="button" 
                            onClick={() => handleJsonListRemove('docs', idx)}
                            className="absolute top-2 right-2 p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover/doc:opacity-100 transition-opacity"
                          >
                            <X size={12} />
                          </button>
                          <div className="flex items-center gap-2">
                            <FileText size={12} className="text-slate-400" />
                            <input 
                              value={doc.title} 
                              onChange={e => handleJsonListUpdate('docs', idx, 'title', e.target.value)}
                              placeholder="File Title (e.g. Datasheet)"
                              className="w-full bg-transparent border-none p-0 text-[10px] font-black uppercase outline-none"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <LinkIcon size={12} className="text-slate-400" />
                            <input 
                              value={doc.url} 
                              onChange={e => handleJsonListUpdate('docs', idx, 'url', e.target.value)}
                              placeholder="URL Link (https://...)"
                              className="w-full bg-transparent border-none p-0 text-[9px] text-slate-400 font-medium outline-none"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {isKitMode && (
                  <div className="space-y-10 border-t border-slate-100 pt-10">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2"><Cpu size={16}/> Kit Components</h4>
                      <button type="button" onClick={() => {
                         const newComp: KitComponent = { id: 'COMP-' + Math.random().toString(36).substr(2, 9), name: '', price: 0, quantity: 1, alternatives: [] };
                         setFormData({ ...formData, kitComponents: [...(formData.kitComponents || []), newComp] });
                      }} className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-yellow-400 transition-all">+ Add Node</button>
                    </div>
                    <div className="space-y-6">
                       {(formData.kitComponents || []).map((comp, compIdx) => (
                         <div key={comp.id || compIdx} className="bg-white rounded-[2.5rem] border-2 border-slate-100 overflow-hidden shadow-sm">
                            <div className="p-8 bg-slate-50/50 flex flex-wrap items-end gap-6 border-b border-slate-100">
                               <div className="flex-1 min-w-[200px]">
                                  <label className="text-[7px] font-black text-slate-400 uppercase block mb-2">Component Name</label>
                                  <input value={comp.name} onChange={e => {
                                     const comps = [...(formData.kitComponents || [])];
                                     comps[compIdx].name = e.target.value;
                                     setFormData({...formData, kitComponents: comps});
                                  }} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-[11px] font-black uppercase" placeholder="Hybrid Inverter" />
                               </div>
                               <div className="w-32">
                                  <label className="text-[7px] font-black text-slate-400 uppercase block mb-2">Price (EUR)</label>
                                  <input type="number" value={comp.price} onChange={e => {
                                     const comps = [...(formData.kitComponents || [])];
                                     comps[compIdx].price = Number(e.target.value);
                                     setFormData({...formData, kitComponents: comps});
                                  }} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold" />
                               </div>
                               <button type="button" onClick={() => {
                                  const comps = [...(formData.kitComponents || [])];
                                  const newAlt: Alternative = { id: 'ALT-' + Math.random().toString(36).substr(2, 9), name: '', price: 0, quantity: 1 };
                                  comps[compIdx].alternatives = [...(comps[compIdx].alternatives || []), newAlt];
                                  setFormData({...formData, kitComponents: comps});
                               }} className="px-4 py-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 text-[8px] font-black uppercase">+ Substitute</button>
                               <button type="button" onClick={() => setFormData({...formData, kitComponents: (formData.kitComponents || []).filter((_, i) => i !== compIdx)})} className="p-3 text-slate-300 hover:text-red-500"><Trash2 size={18}/></button>
                            </div>
                         </div>
                       ))}
                    </div>
                  </div>
                )}

                {!isKitMode && (
                  <div className="space-y-16 pt-10 border-t border-slate-100">
                    <div className="bg-white p-10 rounded-[3rem] border border-slate-100 space-y-8">
                       <div className="flex items-center gap-3 border-b border-slate-100 pb-4"><ImageIcon size={18} className="text-yellow-500"/><h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Image Gallery</h4></div>
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                         {[0, 1, 2].map(idx => (
                           <div key={`img-field-${idx}`} className="space-y-4">
                             <input value={(formData.images || [])[idx] || ''} onChange={e => {
                                const imgs = [...(formData.images || ['', '', ''])];
                                imgs[idx] = e.target.value;
                                setFormData({...formData, images: imgs});
                             }} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-[10px] outline-none" placeholder={`URL photo ${idx + 1}`} />
                             <div className="aspect-square bg-slate-50 rounded-[2rem] overflow-hidden border border-slate-100 flex items-center justify-center">
                                <img 
                                  src={getSafeImage((formData.images || [])[idx]) || IMAGE_FALLBACK} 
                                  className="w-full h-full object-contain" 
                                  alt="" 
                                  onError={(e) => { (e.target as HTMLImageElement).src = IMAGE_FALLBACK; }}
                                />
                             </div>
                           </div>
                         ))}
                       </div>
                    </div>
                  </div>
                )}
              </form>
            </div>

            <div className="p-12 border-t border-slate-100 flex gap-6 bg-slate-50/50 shrink-0">
              <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-6 rounded-[2rem] border-2 border-slate-200 font-black text-[12px] uppercase tracking-widest text-slate-500 hover:bg-white transition-all shadow-lg">Cancel</button>
              <button onClick={handleSubmit} className="bg-slate-900 hover:bg-yellow-400 text-white hover:text-yellow-950 flex-[2] flex items-center justify-center gap-4 py-6 text-[14px] rounded-[2rem] font-black uppercase tracking-widest transition-all shadow-2xl active:scale-95">
                <Save size={24} /> {editingProduct ? 'Update Data' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
