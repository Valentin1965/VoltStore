import React, { useState, useMemo } from 'react';
import { useNotification } from '../../contexts/NotificationContext';
import { useCart } from '../../contexts/CartContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { 
  RotateCcw, Check, Activity, Zap, Settings2, Target, Wallet, Sparkles 
} from 'lucide-react';
import { KitComponent } from '../../types';

interface CalculatorProps {
  initialStep?: 1 | 3;
}

export const Calculator: React.FC<CalculatorProps> = ({ initialStep = 1 }) => {
  const [step, setStep] = useState<1 | 3>(initialStep as 1 | 3); 
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ title: string; description: string; } | null>(null);
  const [activeComponents, setActiveComponents] = useState<KitComponent[]>([]);
  
  const { addNotification } = useNotification();
  const { addItem } = useCart();
  const { formatPrice, t } = useLanguage();
  
  const [config, setConfig] = useState({ 
    objectType: 'Private House', 
    monthlyUsage: '300-600 kWh/month', 
    purpose: 'Backup Power', 
    budget: 'Optimal'
  });

  const generateAiSolution = async () => {
    // ВСТАВЛЯЄМО КЛЮЧ ПРЯМО (Hardcoded) ДЛЯ ГАРАНТІЇ РОБОТИ НА VERCEL
    const apiKey = "AIzaSyDhNAK8S9_HQdCQD-y9nkY_d9IaLOmm9tg";
    
    // Використовуємо стабільний URL v1
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    setLoading(true);
    try {
      const prompt = `
        As a Solar Energy Expert, design a system for:
        Object: ${config.objectType}, Monthly Usage: ${config.monthlyUsage}, 
        Primary Goal: ${config.purpose}, Budget Level: ${config.budget}.
        
        IMPORTANT: Return ONLY a JSON object in this format:
        {
          "title": "Name in Ukrainian",
          "description": "Benefits in Ukrainian",
          "components": [
            {"name": "English Technical Name", "price": number_in_eur, "quantity": number}
          ]
        }
      `;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

      const resData = await response.json();
      const aiText = resData.candidates[0].content.parts[0].text;
      const cleanJson = aiText.replace(/```json|```/gi, '').trim();
      const data = JSON.parse(cleanJson);

      setResult({ title: data.title, description: data.description });
      
      const components: KitComponent[] = (data.components || []).map((c: any) => ({
        id: `ai-${Math.random().toString(36).substr(2, 9)}`,
        name: c.name,
        price: Number(c.price),
        quantity: Number(c.quantity),
        alternatives: []
      }));

      setActiveComponents(components);
      setStep(3);
      addNotification("Solution generated successfully", "success");
    } catch (err: any) {
      console.error('AI Error:', err);
      addNotification("AI Architect is busy. Try again in 60s.", "error");
    } finally {
      setLoading(false);
    }
  };

  const totalPrice = useMemo(() => 
    activeComponents.reduce((s, c) => s + (c.price * c.quantity), 0)
  , [activeComponents]);

  // ... (Решта вашого JSX коду Selector та return залишається без змін)