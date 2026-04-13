import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { BellRing, X } from 'lucide-react';

const NotificationContext = createContext({});

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [activeToast, setActiveToast] = useState(null);

  useEffect(() => {
    // 1. S'abonner aux insertions sur la table 'seances'
    const channel = supabase
      .channel('public:seances')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'seances' },
        (payload) => {
          const newSeance = payload.new;
          
          const newNotif = {
            id: newSeance.id,
            title: "Nouvelle séance programmée",
            message: `${newSeance.title} le ${format(parseISO(newSeance.date), 'dd MMM', { locale: fr })}`,
            read: false,
            timestamp: new Date()
          };

          // Ajouter à la liste globale
          setNotifications((prev) => [newNotif, ...prev]);
          
          // Déclencher le Toast visuel
          setActiveToast(newNotif);
          
          // Faire disparaître le Toast après 5 secondes
          setTimeout(() => setActiveToast(null), 5000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const markAsRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <NotificationContext.Provider value={{ notifications, markAsRead, markAllAsRead }}>
      {children}

      {/* Le Toast Global (Popup flottante) */}
      {activeToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="bg-white border border-brand-100 shadow-xl shadow-brand-100/50 rounded-2xl p-4 flex items-start max-w-sm">
            <div className="p-2 bg-brand-50 rounded-xl text-brand-600 mr-4 shrink-0">
              <BellRing className="h-5 w-5 animate-pulse" />
            </div>
            <div className="flex-1 pr-2">
              <h4 className="text-sm font-bold text-gray-900">{activeToast.title}</h4>
              <p className="text-sm text-gray-500 mt-1">{activeToast.message}</p>
            </div>
            <button 
              onClick={() => setActiveToast(null)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);