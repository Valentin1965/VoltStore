import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
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
    } catch {
      return 'en';
    }
  });

  const [rates, setRates] = useState<ExchangeRates>(() => {
    try {
      const saved = localStorage.getItem(CACHE_KEY);
      return saved ? JSON.parse(saved) : FALLBACK_RATES;
    } catch (e) {
      return FALLBACK_RATES;
    }
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
    console.log("[LanguageContext] Починаємо оновлення курсів через сервер");

    try {
      const prompt = 'Return current exchange rates for 1 EUR to: DKK, NOK, SEK, USD. Response must be ONLY JSON: {"DKK": number, "NOK": number, "SEK": number, "USD": number}';

      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server error ${res.status}`);
      }

      const { data } = await res.json();

      if (data?.DKK && data?.NOK && data?.SEK) {
        const newRates: ExchangeRates = {
          EUR: 1.0,
          DKK: Number(data.DKK),
          NOK: Number(data.NOK),
          SEK: Number(data.SEK),
          USD: Number(data.USD || 1.08),
          timestamp: Date.now()
        };

        updateRates(newRates);
        console.log("[LanguageContext] Курси успішно оновлено з сервера:", newRates);
      } else {
        throw new Error("Неправильний формат відповіді від сервера");
      }
    } catch (err: any) {
      console.error("[LanguageContext] Помилка оновлення курсів:", err);
      // Тут можна додати повідомлення користувачу, наприклад:
      // alert("Не вдалося оновити курси валют. Використовуються збережені значення.");
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
    language,
    setLanguage,
    t,
    formatPrice,
    currencySymbol,
    currencyCode,
    rates,
    updateRates,
    refreshRates
  }), [language, setLanguage, t, formatPrice, currencySymbol, currencyCode, rates, updateRates, refreshRates]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
};