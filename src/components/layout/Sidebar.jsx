import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, Users, Layers, FolderOpen, FileDown,
  CalendarDays, UserCheck, Settings, LogOut, FileText 
} from 'lucide-react';
import Logo from "../../assets/lespasscle-logo.png";
export default function Sidebar() {
  const { user, logout } = useAuth();
  const role = user?.profile?.role;

  // Définition des accès par rôle
  const navigation = [
    { name: 'Tableau de bord', href: '/', icon: LayoutDashboard, roles: ['admin', 'formateur', 'apprenant'] },
    { name: 'Annuaire', href: '/apprenants', icon: Users, roles: ['admin'] },
    { name: 'Groupes', href: '/groupes', icon: Layers, roles: ['admin'] },
    { name: 'Dossiers', href: '/dossiers', icon: FolderOpen, roles: ['admin'] },
    { name: 'Mon Dossier', href: '/mon-dossier', icon: FolderOpen, roles: ['apprenant'] },
    { name: 'Planning', href: '/planning', icon: CalendarDays, roles: ['admin', 'formateur'] },
    { name: 'Suivi des heures', href: '/suivi', icon: UserCheck, roles: ['admin', 'formateur'] },
    { name: 'Mon Bilan', href: `/dashboard-apprenant/${user?.profile?.id}`, icon: FileText, roles: ['apprenant'] },
    { name: 'Exports Admin', href: '/exports', icon: FileDown, roles: ['admin'] },
  ];

  // Filtrage des items selon le rôle de l'utilisateur
  const filteredNav = navigation.filter(item => item.roles.includes(role));

  return (
    <div className="flex flex-col h-full w-64 bg-white border-r border-gray-200">
      <div className="flex items-center justify-center h-20 border-b border-gray-100 px-10">
        <span className="text-xl font-black text-brand-600 tracking-tighter uppercase">
          <img src={Logo} alt="" width={150}/>
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
        {filteredNav.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              `group flex items-center px-4 py-3 text-sm font-bold rounded-2xl transition-all duration-200 ${
                isActive
                  ? 'bg-brand-50 text-brand-700 shadow-sm border border-brand-100'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 border border-transparent'
              }`
            }
          >
            <item.icon className="flex-shrink-0 mr-3 h-5 w-5" />
            {item.name}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-100 space-y-2">
        <NavLink to="/parametres" className="flex items-center px-4 py-3 text-sm font-bold text-gray-500 rounded-2xl hover:bg-gray-50 transition-colors">
          <Settings className="mr-3 h-5 w-5" />
          Paramètres
        </NavLink>
        <button onClick={logout} className="w-full flex items-center px-4 py-3 text-sm font-bold text-red-500 rounded-2xl hover:bg-red-50 transition-colors">
          <LogOut className="mr-3 h-5 w-5" />
          Déconnexion
        </button>
      </div>
    </div>
  );
}