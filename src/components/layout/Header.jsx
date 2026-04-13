import React, { useState } from 'react';
import { Bell, Search, Menu, Check } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';

export default function Header() {
  const { notifications, markAsRead, markAllAsRead } = useNotifications();
  const [showDropdown, setShowDropdown] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 lg:px-8 relative z-40">
      
      {/* ... (Garde la barre de recherche existante ici) ... */}
      <div className="flex items-center flex-1">
        <div className="hidden lg:flex w-full max-w-md relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input type="text" className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-full bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-brand-500 sm:text-sm" placeholder="Rechercher..." />
        </div>
      </div>

      <div className="ml-4 flex items-center space-x-4">
        
        {/* Bouton Cloche */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="p-2 text-gray-400 hover:text-gray-500 relative focus:outline-none transition-colors"
          >
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 ring-2 ring-white"></span>
              </span>
            )}
            <Bell className="h-6 w-6" />
          </button>

          {/* Menu Déroulant des Notifications */}
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2">
              <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h3 className="text-sm font-bold text-gray-900">Notifications</h3>
                {unreadCount > 0 && (
                  <button onClick={markAllAsRead} className="text-xs text-brand-600 font-medium hover:text-brand-800">
                    Tout marquer lu
                  </button>
                )}
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-sm text-gray-500">Aucune notification</div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {notifications.map((notif) => (
                      <div 
                        key={notif.id} 
                        className={`p-4 transition-colors ${!notif.read ? 'bg-brand-50/50' : 'bg-white hover:bg-gray-50'}`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className={`text-sm ${!notif.read ? 'font-bold text-gray-900' : 'font-medium text-gray-600'}`}>
                              {notif.title}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">{notif.message}</p>
                          </div>
                          {!notif.read && (
                            <button onClick={() => markAsRead(notif.id)} className="p-1 ml-2 text-brand-400 hover:text-brand-600 rounded-full hover:bg-brand-100 transition-colors">
                              <Check className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profil */}
        <div className="flex items-center cursor-pointer">
          <img className="h-8 w-8 rounded-full border border-gray-200" src="https://ui-avatars.com/api/?name=Admin&background=4f46e5&color=fff" alt="Avatar" />
        </div>
      </div>
    </header>
  )
}