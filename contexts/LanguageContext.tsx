import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { translations, TranslationKey } from '../utils/translations';

export type Language = 'en' | 'da' | 'no' | 'sv';

export interface ExchangeRates {
  EUR: number; DKK: number; NOK: number; SEK: number; USD: number; timestamp: number;
}

const STABLE_RATES: ExchangeRates = {
  EUR: 1.0, DKK: 7.46, NOK: 11.38, SEK: 11.23, USD: 1.08, timestamp: Date.now()
};

const LanguageContext = createContext<any>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => (localStorage.getItem('voltstore_lang') as Language) || 'en');
  const [rates, setRates] = useState<ExchangeRates>(STABLE_RATES);

  // ФУНКЦІЯ, ЯКА ТОЧНО ПРАЦЮЄ НА VERCEL
  const refreshRates = useCallback(async () => {
    const key = "AIzaSyAcQtP9UVrzqo4heGSlmZnIL5e3PDZes2U"; // Прямий ключ
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${key}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "Return current exchange rates for 1 EUR to: DKK, NOK, SEK, USD. Response ONLY JSON: {\"DKK\": 7.46, \"NOK\": 11.38, \"SEK\": 11.23, \"USD\": 1.08}" }] }]
        })
      });
      const result = await response.json();
      const text = result.candidates[0].content.parts[0].text;
      const data = JSON.parse(text.replace(/```json|```/gi, ''));
      setRates({ ...data, EUR: 1.0, timestamp: Date.now() });
      console.log("Rates updated!");
    } catch (e) {
      console.error("Gemini failed, using stable rates", e);
    }
  }, []);

  useEffect(() => { refreshRates(); }, [refreshRates]);

  const t = useCallback((key: string) => {
    const set = translations[language] || translations['en'];
    return (set as any)[key] || key;
  }, [language]);

  const value = useMemo(() => ({
    language, 
    setLanguage: (l: Language) => { setLanguageState(l); localStorage.setItem('voltstore_lang', l); },
    t,
    formatPrice: (p: number) => {
      const currentSet = translations[language] || translations['en'];
      const rate = rates[currentSet.currency_code as keyof ExchangeRates] || 1;
      return `${currentSet.currency_symbol}${(p * rate).toLocaleString()}`;
    },
    rates
  }), [language, rates, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => useContext(LanguageContext);
