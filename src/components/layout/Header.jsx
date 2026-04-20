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
        <a href="https://expo.dev/artifacts/eas/Z6baVffemkfeKZp1iNwva.apk" className='flex items-center gap-5 py-2 px-3 text-sm border border-emerald-800 hover:border-emerald-500 bg-emerald-100 hover:bg-emerald-500 hover:duration-300 duration-700 font-bold rounded-lg text-emerald-800 hover:text-slate-50 text-center'>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0,0,264.583,230.948" width="20" className='hover:animate-spin hover:duration-7>00'>
              <g transform="translate(-66.97 -261.92)">
                <g transform="matrix(1.32125 0 0 1.32125 480.53 -75.04)">
                  <path d="m-299.036 399.581c-6.88566 0-13.966 5.51768-13.966 15.1756 0 8.82926 6.22524 15.0656 13.966 15.0656 6.38958 0 9.23732-4.28876 9.23732-4.28876v1.86946c0 .8836.83542 1.86946 1.86946 1.86946h4.61866v-29.0316h-6.48812v3.68394s-2.8716-4.34376-9.23732-4.34376zm1.15574 5.93636c5.66836 0 8.64172 4.9851 8.64172 9.2371 0 4.73604-3.5303 9.23388-8.6297 9.2339-4.26278 0-8.53284-3.45238-8.53284-9.2964 0-5.27526 3.67466-9.1746 8.52082-9.1746z"/>
                  <path d="m-274.293 429.272c-.99682 0-1.86946-.71498-1.86946-1.86946v-27.1621h6.48812v3.59262c1.47022-2.20986 4.34254-4.26128 8.75132-4.26128 7.2059 0 11.043 5.74422 11.043 11.1156v18.5846h-4.5087c-1.18224 0-1.97942-.9897-1.97942-1.97942v-15.1756c0-2.97738-1.82422-6.59332-6.04314-6.59332-4.55234 0-7.26302 4.30228-7.26302 8.3528v15.3955z"/>
                  <path d="m-230.966 399.581c-6.88564 0-13.9659 5.51768-13.9659 15.1756 0 8.82926 6.22524 15.0656 13.9659 15.0656 6.38958 0 9.23734-4.28876 9.23734-4.28876v1.86946c0 .8836.83542 1.86946 1.86946 1.86946h4.61866v-43.5474h-6.48812v18.1997s-2.87162-4.34374-9.23734-4.34374zm1.15576 5.93636c5.66836 0 8.64172 4.9851 8.64172 9.2371 0 4.73604-3.53032 9.23388-8.6297 9.2339-4.26278 0-8.53284-3.45238-8.53284-9.2964 0-5.27528 3.67464-9.1746 8.52082-9.1746z"/>
                  <path d="m-206.223 429.272c-.99682 0-1.86946-.71498-1.86946-1.86946v-27.1621h6.48812v4.8386c1.11676-2.7106 3.52662-5.1685 7.80774-5.1685 1.19346 0 2.30934.21994 2.30934.21994v6.70804s-1.39338-.54984-3.07912-.54984c-4.55234 0-7.03796 4.30228-7.03796 8.35282v14.6305z"/>
                  <path d="m-152.119 429.272c-.99682 0-1.86946-.71498-1.86946-1.86946v-27.1621h6.48812v29.0316z"/>
                  <path d="m-128.476 399.581c-6.88566 0-13.966 5.51768-13.966 15.1756 0 8.82926 6.22524 15.0656 13.966 15.0656 6.38956 0 9.23731-4.28876 9.23731-4.28876v1.86946c0 .8836.83542 1.86946 1.86946 1.86946h4.61866v-43.5474h-6.48812v18.1997s-2.87159-4.34374-9.23731-4.34374zm1.15574 5.93636c5.66836 0 8.64171 4.9851 8.64171 9.2371 0 4.73604-3.53029 9.23388-8.62969 9.2339-4.26278 0-8.53284-3.45238-8.53284-9.2964 0-5.27528 3.67466-9.1746 8.52082-9.1746z"/>
                  <circle cx="-150.79" cy="389.69" r="4.29"/>
                  <path d="m-174.376 399.571c-7.21114 0-15.1337 5.38276-15.1337 15.1337 0 8.88566 6.74818 15.1183 15.118 15.1183 10.315 0 15.3517-8.29218 15.3517-15.062 0-8.30724-6.48568-15.19-15.336-15.19zm.0236 6.059c4.9867 0 8.70638 4.01914 8.70638 9.09298 0 5.16184-3.94862 9.14498-8.69156 9.14498-4.40284 0-8.68276-3.583-8.68276-9.0582 0-5.56646 4.07064-9.17976 8.66794-9.17976z"/>
                </g>
                <path d="m263.837 306.59 21.9331-37.9944c1.2377-2.12998.48933-4.83565-1.61189-6.07335-2.1012-1.23768-4.83565-.5181-6.04456 1.61189l-22.221 38.4837c-16.9536-7.74281-36.0371-12.0604-56.5599-12.0604-20.5227 0-39.6063 4.31754-56.5599 12.0604l-22.221-38.4837c-1.2377-2.12999-3.94336-2.84957-6.07335-1.61189-2.13 1.2377-2.84959 3.94337-1.61189 6.07335l21.9331 37.9944c-37.8217 20.494-63.4392 58.7762-67.6703 103.592h264.407c-4.2312-44.8161-29.8487-83.0984-67.6991-103.592zm-125.209 66.4614c-6.13092 0-11.0817-4.97957-11.0817-11.0817 0-6.13093 4.97957-11.0817 11.0817-11.0817 6.13092 0 11.0817 4.97956 11.0817 11.0817.0289 6.10212-4.95079 11.0817-11.0817 11.0817zm121.381 0c-6.13091 0-11.0817-4.97957-11.0817-11.0817 0-6.13093 4.97958-11.0817 11.0817-11.0817 6.13093 0 11.0817 4.97956 11.0817 11.0817.0288 6.10212-4.95077 11.0817-11.0817 11.0817z" fill="#32de84" stroke-width=".288"/>
              </g>
            </svg>
            <span>Application Android</span>
        </a>
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