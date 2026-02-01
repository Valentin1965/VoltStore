
import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';
import { Product, Category } from '../types';
import { supabase } from '../services/supabase';
import { useNotification } from './NotificationContext';
import { useLanguage } from './LanguageContext';

export interface ProductsContextType {
  products: Product[];
  isLoading: boolean;
  categories: Category[];
  selectedCategory: Category | 'All';
  setSelectedCategory: (category: Category | 'All') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filteredProducts: Product[];
  fetchProducts: () => Promise<void>;
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
}

const ProductsContext = createContext<ProductsContextType | undefined>(undefined);

const sanitizeForDb = (product: any) => {
  const { kitComponents, id, created_at, ...cleanProduct } = product;
  
  const processJsonField = (field: any) => {
    if (field === null || field === undefined) return [];
    if (Array.isArray(field)) return field;
    if (typeof field === 'string' && field.trim() !== '') {
      try {
        const parsed = JSON.parse(field);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  cleanProduct.specs = processJsonField(cleanProduct.specs);
  cleanProduct.docs = processJsonField(cleanProduct.docs);
  cleanProduct.features = Array.isArray(cleanProduct.features) ? cleanProduct.features : [];
  
  cleanProduct.is_active = cleanProduct.is_active !== false;
  cleanProduct.is_leader = cleanProduct.is_leader === true;
  cleanProduct.price = Number(cleanProduct.price) || 0;
  cleanProduct.stock = Number(cleanProduct.stock) || 0;
  
  if (Array.isArray(cleanProduct.images)) {
    cleanProduct.images = cleanProduct.images.filter((img: string) => img && img.trim() !== '');
  }

  return cleanProduct;
};

export const ProductsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dbProducts, setDbProducts] = useState<Product[]>([]);
  const [localKits, setLocalKits] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('voltstore_local_kits');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  const { addNotification } = useNotification();
  const { language } = useLanguage();

  const products = useMemo(() => [...localKits, ...dbProducts], [localKits, dbProducts]);

  useEffect(() => {
    try {
      localStorage.setItem('voltstore_local_kits', JSON.stringify(localKits));
    } catch (e) {}
  }, [localKits]);

  const fetchProducts = useCallback(async () => {
    // Check if supabase is initialized with a valid URL before fetching
    const supabaseUrl = (supabase as any).supabaseUrl;
    if (!supabaseUrl || supabaseUrl.includes('xyz.supabase.co')) {
      console.warn('[ProductsContext] Supabase URL is missing or invalid. Skipping fetch.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDbProducts(data || []);
    } catch (err: any) {
      console.error('Fetch error:', err);
      // Don't spam the user with notification if it's a configuration error during initial load
      if (!err.message?.includes('failed to fetch') && !err.message?.includes('NetworkError')) {
        addNotification('Error loading products from database.', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  }, [addNotification]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const getLocalizedValue = (val: any, lang: string): string => {
    if (!val) return "";
    if (typeof val === 'string') return val;
    if (typeof val === 'object') {
      return val[lang] || val['en'] || Object.values(val)[0] as string || "";
    }
    return String(val);
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const isActive = p.is_active !== false;
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
      const productName = getLocalizedValue(p.name, language || 'en');
      const matchesSearch = productName.toLowerCase().includes(searchQuery.toLowerCase());
      return isActive && matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery, products, language]);

  const addProduct = async (newProduct: Omit<Product, 'id'>) => {
    if (newProduct.category === 'Kits') {
      const kitWithId = { 
        ...newProduct, 
        id: `KIT-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
        is_active: newProduct.is_active ?? true
      } as Product;
      setLocalKits(prev => [kitWithId, ...prev]);
      addNotification('Kit saved locally', 'success');
      return;
    }

    try {
      const cleanData = sanitizeForDb(newProduct);
      const { data, error } = await supabase
        .from('products')
        .insert([cleanData])
        .select();

      if (error) throw error;
      if (data) setDbProducts(prev => [data[0], ...prev]);
      addNotification('Product added to database', 'success');
    } catch (err: any) {
      console.error('DB Add Error:', err);
      addNotification(`DB Error: ${err.message || 'Check connection'}`, 'error');
    }
  };

  const updateProduct = async (updatedProduct: Product) => {
    if (String(updatedProduct.id).startsWith('KIT-')) {
      setLocalKits(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
      addNotification('Kit updated locally', 'success');
      return;
    }

    try {
      const cleanData = sanitizeForDb(updatedProduct);
      const { error } = await supabase
        .from('products')
        .update(cleanData)
        .eq('id', updatedProduct.id);

      if (error) throw error;
      setDbProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
      addNotification('Product updated in database', 'success');
    } catch (err: any) {
      console.error('DB Update Error:', err);
      addNotification(`Update Error: ${err.message || 'Check Data Format'}`, 'error');
    }
  };

  const deleteProduct = async (id: string) => {
    if (String(id).startsWith('KIT-')) {
      setLocalKits(prev => prev.filter(p => p.id !== id));
      addNotification('Kit deleted', 'info');
      return;
    }

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setDbProducts(prev => prev.filter(p => p.id !== id));
      addNotification('Product deleted from database', 'info');
    } catch (err: any) {
      console.error('DB Delete Error:', err);
      addNotification(`Delete Error: ${err.message}`, 'error');
    }
  };

  return (
    <ProductsContext.Provider value={{
      products,
      isLoading,
      categories: ['Charging Stations', 'Inverters', 'Batteries', 'Solar Panels', 'Kits'],
      selectedCategory,
      setSelectedCategory,
      searchQuery,
      setSearchQuery,
      filteredProducts,
      fetchProducts,
      addProduct,
      updateProduct,
      deleteProduct
    }}>
      {children}
    </ProductsContext.Provider>
  );
};

export const useProducts = (): ProductsContextType => {
  const context = useContext(ProductsContext);
  if (!context) {
    return {
      products: [],
      isLoading: false,
      categories: [],
      selectedCategory: 'All',
      setSelectedCategory: () => {},
      searchQuery: '',
      setSearchQuery: () => {},
      filteredProducts: [],
      fetchProducts: async () => {},
      addProduct: async () => {},
      updateProduct: async () => {},
      deleteProduct: async () => {}
    };
  }
  return context;
};
