
import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { translations, TranslationKey } from '../utils/translations';
import { GoogleGenAI } from "@google/genai";

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    aistudio?: AIStudio;
  }
}

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
  timestamp: 0
};

const CACHE_KEY = 'voltstore_rates_v4_eur';
const SUPPRESS_KEY = 'voltstore_api_suppress';
const CACHE_DURATION = 24 * 60 * 60 * 1000; 
const SUPPRESS_DURATION = 4 * 60 * 60 * 1000;

export interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
  formatPrice: (priceInEUR: number) => string;
  currencySymbol: string;
  currencyCode: string;
  isLoadingRates: boolean;
  rates: ExchangeRates;
  refreshRates: () => Promise<void>;
  isApiRestricted: boolean;
  checkAndPromptKey: () => Promise<boolean>;
  apiError: string | null;
}

const DEFAULT_VALUE: LanguageContextType = {
  language: 'en',
  setLanguage: () => {},
  t: (key) => key,
  formatPrice: (p) => `€${(p || 0).toLocaleString()}`,
  currencySymbol: '€',
  currencyCode: 'EUR',
  isLoadingRates: false,
  rates: FALLBACK_RATES,
  refreshRates: async () => {},
  isApiRestricted: false,
  checkAndPromptKey: async () => true,
  apiError: null
};

const LanguageContext = createContext<LanguageContextType>(DEFAULT_VALUE);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      return (localStorage.getItem('voltstore_lang') as Language) || 'en';
    } catch {
      return 'en';
    }
  });
  
  const [rates, setRates] = useState<ExchangeRates>(() => {
    try {
      const saved = localStorage.getItem(CACHE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Date.now() - parsed.timestamp < CACHE_DURATION) {
          return parsed;
        }
      }
    } catch (e) {}
    return FALLBACK_RATES;
  });

  const [isLoadingRates, setIsLoadingRates] = useState(false);
  const [isApiRestricted, setIsApiRestricted] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const isKeyBlocked = useRef(false);

  const checkAndPromptKey = useCallback(async (): Promise<boolean> => {
    const aiStudio = window.aistudio;
    if (aiStudio && typeof aiStudio.hasSelectedApiKey === 'function') {
      try {
        const hasKey = await aiStudio.hasSelectedApiKey();
        if (!hasKey) {
          if (typeof aiStudio.openSelectKey === 'function') {
            await aiStudio.openSelectKey();
            setIsApiRestricted(false);
            isKeyBlocked.current = false;
            setApiError(null);
            return true;
          }
        }
      } catch (e) {
        console.error("API Key check error", e);
      }
    }
    return true;
  }, []);

  const fetchExchangeRates = useCallback(async (force = false) => {
    const apiKey = process.env.API_KEY;
    if (!apiKey || apiKey === 'undefined' || apiKey === '' || isKeyBlocked.current) {
      return;
    }

    const suppressUntil = Number(localStorage.getItem(SUPPRESS_KEY) || 0);
    if (!force && Date.now() < suppressUntil) {
      return;
    }

    setIsLoadingRates(true);
    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: 'Get current exchange rates for 1 EUR to: DKK, NOK, SEK, USD. Respond ONLY with a valid JSON object: {"DKK": number, "NOK": number, "SEK": number, "USD": number}',
        config: {
          responseMimeType: "application/json",
          temperature: 0,
        }
      });

      const text = response.text || '{}';
      const data = JSON.parse(text);
      
      if (data.DKK && data.NOK && data.SEK) {
        const newRates: ExchangeRates = {
          EUR: 1.0,
          DKK: Number(data.DKK),
          NOK: Number(data.NOK),
          SEK: Number(data.SEK),
          USD: Number(data.USD || 1.08),
          timestamp: Date.now()
        };
        setRates(newRates);
        localStorage.setItem(CACHE_KEY, JSON.stringify(newRates));
        localStorage.removeItem(SUPPRESS_KEY);
        setApiError(null);
        setIsApiRestricted(false);
      }
    } catch (err: any) {
      const errStr = String(err).toLowerCase();
      console.warn("[LanguageContext] API Call failed:", errStr);
      
      if (errStr.includes('429') || errStr.includes('quota')) {
        localStorage.setItem(SUPPRESS_KEY, String(Date.now() + SUPPRESS_DURATION));
        setApiError("Rate limit reached. Using cached values.");
      } else if (errStr.includes('leaked') || errStr.includes('safety')) {
        isKeyBlocked.current = true;
        setIsApiRestricted(true);
        setApiError("API Key is marked as leaked.");
      } else {
        // General errors (403, 400) usually mean project configuration issues on Vercel
        // We don't block the UI, just log it.
        setApiError("API Configuration issue. Check Vercel env variables.");
      }
    } finally {
      setIsLoadingRates(false);
    }
  }, []);

  useEffect(() => {
    const isCacheValid = rates.timestamp > 0 && (Date.now() - rates.timestamp < CACHE_DURATION);
    const suppressUntil = Number(localStorage.getItem(SUPPRESS_KEY) || 0);
    const isSuppressed = Date.now() < suppressUntil;

    if (!isCacheValid && !isSuppressed && !isApiRestricted) {
      const timer = setTimeout(() => fetchExchangeRates(), 7000);
      return () => clearTimeout(timer);
    }
  }, [fetchExchangeRates, rates.timestamp, isApiRestricted]);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('voltstore_lang', lang);
    } catch (e) {}
  }, []);

  const t = useCallback((key: TranslationKey): string => {
    const translationSet = translations[language] || translations['en'];
    return (translationSet as any)[key] || (translations['en'] as any)[key] || key;
  }, [language]);

  const currentLangTranslations = useMemo(() => translations[language] || translations['en'], [language]);
  const currencyCode = currentLangTranslations.currency_code;
  const currencySymbol = currentLangTranslations.currency_symbol;
  
  const currentRate = useMemo(() => 
    rates[currencyCode as keyof ExchangeRates] || FALLBACK_RATES[currencyCode as keyof ExchangeRates] || 1.0
  , [rates, currencyCode]);

  const formatPrice = useCallback((priceInEUR: number): string => {
    const converted = (priceInEUR || 0) * currentRate;
    return `${currencySymbol}${converted.toLocaleString(language === 'en' ? 'en-US' : 'de-DE', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })}`;
  }, [currencySymbol, currentRate, language]);

  const refreshRates = useCallback(() => fetchExchangeRates(true), [fetchExchangeRates]);

  const value = useMemo(() => ({
    language, 
    setLanguage, 
    t, 
    formatPrice, 
    currencySymbol, 
    currencyCode,
    isLoadingRates,
    rates,
    refreshRates,
    isApiRestricted,
    checkAndPromptKey,
    apiError
  }), [
    language, 
    setLanguage,
    t, 
    formatPrice, 
    currencySymbol, 
    currencyCode, 
    isLoadingRates, 
    rates, 
    refreshRates, 
    isApiRestricted, 
    checkAndPromptKey,
    apiError
  ]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) return DEFAULT_VALUE;
  return context;
};
