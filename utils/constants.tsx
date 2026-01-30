
import React from 'react';
import { Product, Category } from '../types';

export const CATEGORIES: Category[] = [
  'Charging Stations',
  'Inverters',
  'Batteries',
  'Solar Panels',
  'Kits'
];

export const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'EcoFlow Delta Pro 3600Wh',
    description: 'Portable power station with massive capacity and ultra-fast charging technology. Ideal for home backup power.',
    price: 125000,
    old_price: 140000,
    category: 'Charging Stations',
    image: 'https://images.unsplash.com/photo-1620714223084-8fcacc6dfd8d?q=80&w=800&auto=format&fit=crop',
    rating: 4.9,
    reviews_count: 124,
    stock: 12,
    is_new: true,
    on_sale: true,
    features: ['3600Wh Capacity', 'X-Stream Fast Charging', 'Expandable design']
  },
  {
    id: '2',
    name: 'Deye SUN-5K-SG03LP1-EU',
    description: 'Hybrid single-phase inverter with built-in intelligent battery management and grid-tie support.',
    price: 45000,
    category: 'Inverters',
    image: 'https://images.unsplash.com/photo-1592833159155-c62df1b35624?q=80&w=800&auto=format&fit=crop',
    rating: 4.7,
    reviews_count: 56,
    stock: 8,
    features: ['5 kW Power Output', 'Dual MPPT', 'Smart Cooling']
  }
];
