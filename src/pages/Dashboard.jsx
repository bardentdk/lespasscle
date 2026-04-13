import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { 
  Users, 
  Calendar as CalendarIcon, 
  FolderOpen, 
  TrendingUp,
  Clock,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const role = user?.profile?.role;

  const [stats, setStats] = useState({ apprenants: 0, seances: 0, documents: 0 });
  const [seancesDuJour, setSeancesDuJour] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Si c'est un apprenant, on le redirige directement sur SON Dashboard personnalisé
    if (role === 'apprenant') {
      navigate(`/dashboard-apprenant/${user.profile.id}`, { replace: true });
      return;
    }
    fetchDashboardData();
  }, [role, navigate, user]);

  const fetchDashboardData = async () => {
    setLoading(true);
    const today = format(new Date(), 'yyyy-MM-dd');

    try {
      // Préparation de la requête des séances (Filtrée si c'est un formateur)
      let seancesQuery = supabase.from('seances')
        .select('*, groupes(name), profiles(first_name, last_name)')
        .eq('date', today)
        .order('start_time');
      
      if (role === 'formateur') {
        seancesQuery = seancesQuery.eq('formateur_id', user.profile.id);
      }

      const [
        { count: apprenantsCount },
        { count: docsCount },
        { data: seances }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'apprenant'),
        supabase.from('documents').select('*', { count: 'exact', head: true }),
        seancesQuery
      ]);

      setStats({
        apprenants: apprenantsCount || 0,
        seances: seances?.length || 0,
        documents: docsCount || 0
      });
      setSeancesDuJour(seances || []);
    } catch (error) {
      console.error("Erreur chargement dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="h-full flex items-center justify-center"><Loader2 className="h-10 w-10 text-brand-600 animate-spin" /></div>;
  }
  
  if (role === 'apprenant') return null; // Sécurité visuelle pendant la redirection

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header Accueil */}
      <div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Bonjour {user?.profile?.first_name} ! 👋</h1>
        <p className="text-gray-500 mt-2 font-medium">Voici votre aperçu pour aujourd'hui.</p>
      </div>

      {/* Cartes de Statistiques (Visibles uniquement pour l'admin) */}
      {role === 'admin' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
            <div className="absolute -right-6 -top-6 h-24 w-24 bg-blue-50 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out" />
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Apprenants Actifs</p>
                <p className="text-3xl font-black text-gray-900 mt-1">{stats.apprenants}</p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center"><Users className="h-6 w-6" /></div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
            <div className="absolute -right-6 -top-6 h-24 w-24 bg-purple-50 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out" />
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Documents Stockés</p>
                <p className="text-3xl font-black text-gray-900 mt-1">{stats.documents}</p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center"><FolderOpen className="h-6 w-6" /></div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
            <div className="absolute -right-6 -top-6 h-24 w-24 bg-green-50 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out" />
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Cours aujourd'hui</p>
                <p className="text-3xl font-black text-gray-900 mt-1">{stats.seances}</p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-green-100 text-green-600 flex items-center justify-center"><TrendingUp className="h-6 w-6" /></div>
            </div>
          </div>
        </div>
      )}

      {/* Contenu Principal : Emploi du temps du jour */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <h2 className="text-lg font-bold text-gray-900 flex items-center">
            <CalendarIcon className="h-5 w-5 mr-2 text-brand-600" />
            Emploi du temps du jour
          </h2>
          <Link to="/planning" className="text-sm font-bold text-brand-600 hover:text-brand-800 flex items-center">
            Voir la semaine <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
        </div>
        
        <div className="p-6">
          {seancesDuJour.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gray-50 mb-4">
                <Clock className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Aucune séance aujourd'hui</h3>
              <p className="text-gray-500 mt-1">L'emploi du temps est vide pour cette journée.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {seancesDuJour.map((seance) => (
                <div key={seance.id} className="flex items-center p-4 rounded-2xl border border-gray-100 hover:border-brand-100 hover:bg-brand-50/30 transition-colors group">
                  <div className="w-24 shrink-0 text-center border-r border-gray-100 pr-4">
                    <p className="text-lg font-black text-gray-900">{seance.start_time.slice(0, 5)}</p>
                    <p className="text-xs font-bold text-gray-400 uppercase">{seance.end_time.slice(0, 5)}</p>
                  </div>
                  <div className="pl-4 flex-1">
                    <h4 className="text-base font-bold text-gray-900 group-hover:text-brand-700 transition-colors">{seance.title}</h4>
                    <p className="text-sm font-medium text-gray-500 mt-1">Groupe : {seance.groupes?.name} {role === 'admin' && `• Formateur : ${seance.profiles?.last_name}`}</p>
                  </div>
                  {(role === 'admin' || role === 'formateur') && (
                    <Link to="/suivi" className="hidden sm:flex items-center px-4 py-2 bg-white border border-gray-200 text-sm font-bold text-gray-700 rounded-xl shadow-sm hover:bg-gray-50 hover:text-brand-600 transition-all">
                      Faire l'appel
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}