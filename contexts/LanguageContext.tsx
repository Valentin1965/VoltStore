import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { translations, TranslationKey } from '../utils/translations';
import { GoogleGenerativeAI } from "@google/generative-ai";

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
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 години
const SUPPRESS_DURATION = 4 * 60 * 60 * 1000; // 4 години

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
    // Отримуємо ключ з середовища
    const apiKey = (import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_API_KEY || "").trim();

    // ──────────────────────────────────────────────────────────────
    // ДЕБАГ-БЛОК — саме тут, перед використанням ключа
    console.log("[Gemini Runtime Debug] VITE_GEMINI_API_KEY value length:", apiKey.length);
    console.log("[Gemini Runtime Debug] Starts with:", apiKey.substring(0, 10)); // повинно бути "AIzaSy..."
    console.log("[Gemini Runtime Debug] Full key (перші 20 символів):", apiKey.substring(0, 20));
    console.log("[Gemini Runtime Debug] All env keys з GEMINI або API_KEY:", 
      Object.keys(import.meta.env).filter(k => k.includes('GEMINI') || k.includes('API_KEY'))
    );
    console.log("[Gemini Runtime Debug] import.meta.env exists?", !!import.meta.env);

    if (apiKey.length < 30) {
      console.error("[Gemini Runtime Debug] Ключ завантажився, але невалідний (довжина < 30 символів)");
      setApiError("VITE_GEMINI_API_KEY завантажився, але значення невалідне (довжина < 30). Перевірте Vercel env vars.");
      setIsApiRestricted(true);
      return;
    }

    if (!apiKey || apiKey === 'undefined' || apiKey === '' || isKeyBlocked.current) {
      console.warn("[Gemini Runtime Debug] Ключ відсутній або заблокований");
      setApiError("API Key not found in Environment. Check Vercel env vars.");
      setIsApiRestricted(true);
      return;
    }
    // ──────────────────────────────────────────────────────────────

    const suppressUntil = Number(localStorage.getItem(SUPPRESS_KEY) || 0);
    if (!force && Date.now() < suppressUntil) {
      console.log("[Gemini Runtime Debug] Запит придушено через suppress");
      return;
    }

    setIsLoadingRates(true);

    try {
      console.log("[Gemini Runtime Debug] Створюємо GoogleGenerativeAI з ключем");
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.1,
        }
      });

      console.log("[Gemini Runtime Debug] Генеруємо контент з промптом");
      const prompt = 'Return current exchange rates for 1 EUR to: DKK, NOK, SEK, USD. Response must be ONLY JSON: {"DKK": number, "NOK": number, "SEK": number, "USD": number}';

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().replace(/```json|```/g, "").trim();
      console.log("[Gemini Runtime Debug] Отримана відповідь:", text.substring(0, 100) + "...");

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
        console.log("[Gemini Runtime Debug] Курси успішно оновлено");
      }
    } catch (err: any) {
      const errStr = String(err).toLowerCase();
      console.warn("[LanguageContext] API Call failed:", errStr);

      if (errStr.includes('429') || errStr.includes('quota')) {
        localStorage.setItem(SUPPRESS_KEY, String(Date.now() + SUPPRESS_DURATION));
        setApiError("Rate limit reached. Using cached values.");
      } else if (errStr.includes('400') || errStr.includes('api_key_invalid') || errStr.includes('not found')) {
        console.error("[Gemini Runtime Debug] Критична помилка 400: ключ невалідний або не переданий");
        window.alert("CRITICAL: API Key is invalid or not passed correctly! Перевірте Vercel env vars.");
        setIsApiRestricted(true);
        setApiError("Invalid API Key configuration. Перевірте Vercel Environment Variables.");
      } else {
        setApiError("Exchange rate update failed.");
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