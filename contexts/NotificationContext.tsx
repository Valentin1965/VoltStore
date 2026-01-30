
import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info as InfoIcon, X } from 'lucide-react';

type NotificationType = 'success' | 'error' | 'info';

interface Notification {
  id: string;
  message: string;
  type: NotificationType;
}

interface NotificationContextType {
  addNotification: (message: string, type: NotificationType) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const timeoutsRef = useRef<Map<string, number>>(new Map());

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    if (timeoutsRef.current.has(id)) {
      window.clearTimeout(timeoutsRef.current.get(id));
      timeoutsRef.current.delete(id);
    }
  }, []);

  const addNotification = useCallback((message: string, type: NotificationType) => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    setNotifications(prev => [...prev, { id, message, type }]);
    
    const timeout = window.setTimeout(() => {
      removeNotification(id);
    }, 4500);
    
    timeoutsRef.current.set(id, timeout);
  }, [removeNotification]);

  useEffect(() => {
    return () => {
      // Cleanup all timeouts on unmount
      timeoutsRef.current.forEach(timeout => window.clearTimeout(timeout));
      timeoutsRef.current.clear();
    };
  }, []);

  return (
    <NotificationContext.Provider value={{ addNotification }}>
      {children}
      <div className="fixed bottom-8 right-8 z-[10000] flex flex-col gap-4 max-w-md w-full pointer-events-none">
        {notifications.map(n => (
          <div
            key={n.id}
            className={`flex items-center gap-4 p-5 rounded-3xl backdrop-blur-xl border shadow-[0_20px_50px_rgba(0,0,0,0.2)] animate-fade-in transition-all group pointer-events-auto ${
              n.type === 'success' 
                ? 'bg-emerald-500/90 border-emerald-400/50 text-white' 
                : n.type === 'error' 
                ? 'bg-rose-500/90 border-rose-400/50 text-white' 
                : 'bg-slate-900/90 border-slate-700/50 text-white'
            }`}
          >
            <div className="shrink-0">
              {n.type === 'success' && <CheckCircle2 size={24} />}
              {n.type === 'error' && <AlertCircle size={24} />}
              {n.type === 'info' && <InfoIcon size={24} />}
            </div>
            <p className="flex-1 font-bold text-sm uppercase tracking-tight leading-tight">{n.message}</p>
            <button 
              onClick={() => removeNotification(n.id)}
              className="p-1.5 hover:bg-white/20 rounded-xl transition-colors"
              aria-label="Close notification"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    // Return a dummy to prevent crashes during initialization if called accidentally
    return {
      addNotification: (msg: string, type: NotificationType) => console.warn('NotificationProvider not found', msg)
    };
  }
  return context;
};
