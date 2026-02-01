import React, { useState, useRef, useEffect } from 'react';
import { X, Zap, Send, Loader2, MessageSquare, AlertCircle } from 'lucide-react';

export const LiveAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string; isError?: boolean }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    // ПРЯМИЙ КЛЮЧ ЯК У ПЕРЕДУШНИХ ВИПРАВЛЕННЯХ
    const apiKey = "AIzaSyDhNAK8S9_HQdCQD-y9nkY_d9IaLOmm9tg";
    
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    // Використовуємо стабільний URL v1
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: userMsg }] }],
          systemInstruction: {
            parts: [{ text: "Ти — технічний спеціаліст підтримки VoltStore. Відповідай ВИКЛЮЧНО українською мовою. Твої відповіді мають бути професійними, короткими та стосуватися сонячної енергетики, інверторів та акумуляторів." }]
          }
        })
      });

      if (!response.ok) throw new Error(`Status: ${response.status}`);

      const data = await response.json();
      const aiText = data.candidates[0].content.parts[0].text;
      
      setMessages(prev => [...prev, { role: 'ai', text: aiText }]);
    } catch (err: any) {
      console.error('AI Chat Error:', err);
      let errorMsg = "Сервіс тимчасово недоступний. Спробуйте пізніше.";
      setMessages(prev => [...prev, { role: 'ai', text: errorMsg, isError: true }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    // ... (весь ваш JSX залишається без змін, він чудовий)
    <div className="fixed bottom-6 right-6 z-[100]">
      {/* Ваш код кнопок та вікна чату */}
      {/* ... */}
    </div>
  );
};