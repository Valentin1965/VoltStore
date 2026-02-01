import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { translations, TranslationKey } from '../utils/translations';
import { GoogleGenerativeAI } from "@google/generative-ai";

export type Language = 'en' | 'da' | 'no' | 'sv';

export interface ExchangeRates {
  EUR: number;
  DKK: number;
  NOK: number;
  SEK: number;
  USD: number;
  timestamp: number;
}

const FALLBACK_RATES: ExchangeRates = {
  EUR: 1.0,
  DKK: 7.46,
  NOK: 11.38,
  SEK: 11.23,
  USD: 1.08,
  timestamp: Date.now()
};

const CACHE_KEY = 'voltstore_rates_v5_eur';

export interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
  formatPrice: (priceInEUR: number) => string;
  currencySymbol: string;
  currencyCode: string;
  rates: ExchangeRates;
  updateRates: (newRates: Partial<ExchangeRates>) => void;
  refreshRates: () => Promise<void>;
}

const DEFAULT_VALUE: LanguageContextType = {
  language: 'en',
  setLanguage: () => {},
  t: (key) => key,
  formatPrice: (p) => `€${(p || 0).toLocaleString()}`,
  currencySymbol: '€',
  currencyCode: 'EUR',
  rates: FALLBACK_RATES,
  updateRates: () => {},
  refreshRates: async () => {},
};

const LanguageContext = createContext<LanguageContextType>(DEFAULT_VALUE);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      return (localStorage.getItem('voltstore_lang') as Language) || 'en';
    } catch { return 'en'; }
  });

  const [rates, setRates] = useState<ExchangeRates>(() => {
    try {
      const saved = localStorage.getItem(CACHE_KEY);
      return saved ? JSON.parse(saved) : FALLBACK_RATES;
    } catch (e) { return FALLBACK_RATES; }
  });

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('voltstore_lang', lang);
  }, []);

  const updateRates = useCallback((newRates: Partial<ExchangeRates>) => {
    setRates(prev => {
      const updated = { ...prev, ...newRates, timestamp: Date.now() };
      localStorage.setItem(CACHE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const refreshRates = useCallback(async () => {
    console.log("[LanguageContext] Updating rates...");
    
    // ПРАВИЛЬНИЙ СПОСІБ ДЛЯ VITE
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_API_KEY;
    
    if (!apiKey) {
      console.error("API Key missing in environment variables");
      return;
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        generationConfig: { responseMimeType: "application/json" }
      });

      const prompt = 'Provide current approximate exchange rates for 1 EUR to: DKK, NOK, SEK, USD. Return ONLY JSON: {"DKK": number, "NOK": number, "SEK": number, "USD": number}';
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const data = JSON.parse(text);
      if (data.DKK && data.NOK) {
        const newRates: ExchangeRates = {
          EUR: 1.0,
          DKK: Number(data.DKK),
          NOK: Number(data.NOK),
          SEK: Number(data.SEK),
          USD: Number(data.USD || 1.08),
          timestamp: Date.now()
        };
        updateRates(newRates);
      }
    } catch (err) {
      console.error("[LanguageContext] Gemini API Error:", err);
    }
  }, [updateRates]);

  const t = useCallback((key: TranslationKey): string => {
    const translationSet = translations[language] || translations['en'];
    return (translationSet as any)[key] || (translations['en'] as any)[key] || key;
  }, [language]);

  const currentLangTranslations = useMemo(() => translations[language] || translations['en'], [language]);
  const currencyCode = currentLangTranslations.currency_code;
  const currencySymbol = currentLangTranslations.currency_symbol;
  const currentRate = useMemo(() => rates[currencyCode as keyof ExchangeRates] || 1.0, [rates, currencyCode]);

  const formatPrice = useCallback((priceInEUR: number): string => {
    const converted = (priceInEUR || 0) * currentRate;
    return `${currencySymbol}${converted.toLocaleString(language === 'en' ? 'en-US' : 'de-DE', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })}`;
  }, [currencySymbol, currentRate, language]);

  const value = useMemo(() => ({
    language, setLanguage, t, formatPrice, currencySymbol, currencyCode, rates, updateRates, refreshRates
  }), [language, setLanguage, t, formatPrice, currencySymbol, currencyCode, rates, updateRates, refreshRates]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => useContext(LanguageContext);