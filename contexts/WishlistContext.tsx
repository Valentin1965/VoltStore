
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Product } from '../types';
import { useNotification } from './NotificationContext';

interface WishlistContextType {
  wishlist: Product[];
  toggleWishlist: (product: Product) => void;
  isInWishlist: (id: string) => boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wishlist, setWishlist] = useState<Product[]>(() => {
    const saved = localStorage.getItem('voltstore_wishlist');
    return saved ? JSON.parse(saved) : [];
  });
  const { addNotification } = useNotification();

  useEffect(() => {
    localStorage.setItem('voltstore_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  const toggleWishlist = useCallback((product: Product) => {
    setWishlist(prev => {
      const exists = prev.find(p => p.id === product.id);
      if (exists) {
        setTimeout(() => addNotification('Booking cancelled', 'info'), 0);
        return prev.filter(p => p.id !== product.id);
      } else {
        setTimeout(() => addNotification('Equipment successfully booked', 'success'), 0);
        return [...prev, product];
      }
    });
  }, [addNotification]);

  const isInWishlist = useCallback((id: string) => 
    wishlist.some(p => p.id === id), 
  [wishlist]);

  return (
    <WishlistContext.Provider value={{ wishlist, toggleWishlist, isInWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) throw new Error('useWishlist must be used within WishlistProvider');
  return context;
};
