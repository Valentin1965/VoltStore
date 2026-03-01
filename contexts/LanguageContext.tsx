
import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { translations, TranslationKey } from '../utils/translations';

export type Language = 'en' | 'da' | 'no' | 'sv';

export interface ExchangeRates {
  EUR: number;
  DKK: number;
  NOK: number;
  SEK: number;
  USD: number;
  timestamp: number;
}

const STABLE_RATES: ExchangeRates = {
  EUR: 1.0,
  DKK: 7.46,
  NOK: 11.38,
  SEK: 11.23,
  USD: 1.08,
  timestamp: Date.now()
};

export interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey | string) => string;
  translateDynamic: (text: string) => Promise<string>;
  formatPrice: (priceInEUR: number) => string;
  currencySymbol: string;
  currencyCode: string;
  rates: ExchangeRates;
  updateRates: (newRates: Partial<ExchangeRates>) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => 
    (localStorage.getItem('voltstore_lang') as Language) || 'en'
  );
  
  const [rates, setRates] = useState<ExchangeRates>(() => {
    const saved = localStorage.getItem('voltstore_rates_v3');
    return saved ? JSON.parse(saved) : STABLE_RATES;
  });

  const [aiCache, setAiCache] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('voltstore_ai_translations');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem('voltstore_ai_translations', JSON.stringify(aiCache));
  }, [aiCache]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('voltstore_lang', lang);
  };

  const updateRates = useCallback((newRates: Partial<ExchangeRates>) => {
    setRates(prev => {
      const updated = { ...prev, ...newRates, timestamp: Date.now() };
      localStorage.setItem('voltstore_rates_v3', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const translateDynamic = async (text: string): Promise<string> => {
    if (!text || text.length < 2) return text;

    const cacheKey = `${language}:${text}`;
    if (aiCache[cacheKey]) return aiCache[cacheKey];

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/ai-assistant`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: `Translate to ${language}. Preserve technical terms if standard. Text: "${text}". Return ONLY translation.`,
          type: 'translate',
          language
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const translated = data.text?.trim() || text;
      setAiCache(prev => ({ ...prev, [cacheKey]: translated }));
      return translated;
    } catch (e) {
      console.error("[LanguageContext] Translation failed:", e);
      return text;
    }
  };

  const t = useCallback((key: TranslationKey | string): string => {
    const currentSet = translations[language] || translations['en'];
    const val = (currentSet as any)[key] || (translations['en'] as any)[key] || key;
    return val;
  }, [language]);

  const currentLangData = useMemo(() => translations[language] || translations['en'], [language]);
  const currencyCode = currentLangData.currency_code;
  const currencySymbol = currentLangData.currency_symbol;

  const formatPrice = useCallback((priceInEUR: number): string => {
    const rate = rates[currencyCode as keyof ExchangeRates] || 1.0;
    const converted = (priceInEUR || 0) * rate;
    return `${currencySymbol}${converted.toLocaleString(language === 'en' ? 'en-US' : 'de-DE', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })}`;
  }, [currencySymbol, currencyCode, language, rates]);

  return (
    <LanguageContext.Provider value={{ 
      language, setLanguage, t, translateDynamic, formatPrice, 
      currencySymbol, currencyCode, rates, updateRates 
    }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
};
