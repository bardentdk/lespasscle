import React, { useState, useEffect } from 'react';
import { format, addDays, startOfWeek, addWeeks, subWeeks, isSameDay, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, Clock, User, Users, X, Loader2, Calendar as CalendarIcon, AlertCircle, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function Planning() {
  const { user } = useAuth();
  const role = user?.profile?.role;

  const [currentDate, setCurrentDate] = useState(new Date());
  const [seances, setSeances] = useState([]);
  const [groupes, setGroupes] = useState([]);
  const [formateurs, setFormateurs] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    start_time: '09:00',
    end_time: '12:00',
    groupe_id: '',
    formateur_id: ''
  });

  // --- NOUVEAUX ÉTATS POUR LA CRÉATION À LA VOLÉE ---
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [newGroupData, setNewGroupData] = useState({ name: '', description: '' });
  
  const [isFormateurModalOpen, setIsFormateurModalOpen] = useState(false);
  const [newFormateurData, setNewFormateurData] = useState({ first_name: '', last_name: '', email: '' });
  const [subModalLoading, setSubModalLoading] = useState(false);

  const startDate = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = [...Array(7)].map((_, i) => addDays(startDate, i));

  useEffect(() => {
    if (role !== 'apprenant') {
      fetchInitialData();
    }
  }, [role]);

  useEffect(() => {
    fetchSeances();
  }, [currentDate]);

  const fetchInitialData = async () => {
    try {
      const [groupesRes, formateursRes] = await Promise.all([
        supabase.from('groupes').select('id, name').order('name'),
        supabase.from('profiles').select('id, first_name, last_name').eq('role', 'formateur').order('last_name')
      ]);
      if (groupesRes.error) throw groupesRes.error;
      if (formateursRes.error) throw formateursRes.error;
      setGroupes(groupesRes.data || []);
      setFormateurs(formateursRes.data || []);
    } catch (err) {
      console.error(err);
      setError("Impossible de charger les listes de groupes ou de formateurs.");
    }
  };

  const fetchSeances = async () => {
    setLoading(true);
    const startStr = format(startDate, 'yyyy-MM-dd');
    const endStr = format(addDays(startDate, 6), 'yyyy-MM-dd');

    let query = supabase.from('seances')
      .select('*, profiles (first_name, last_name), groupes (name)')
      .gte('date', startStr)
      .lte('date', endStr);

    if (role === 'formateur') {
      query = query.eq('formateur_id', user.profile.id);
    } else if (role === 'apprenant') {
      const { data: userGroups } = await supabase.from('groupes_apprenants').select('groupe_id').eq('apprenant_id', user.profile.id);
      const groupIds = userGroups?.map(g => g.groupe_id) || [];
      if (groupIds.length > 0) {
        query = query.in('groupe_id', groupIds);
      } else {
        query = query.eq('id', '00000000-0000-0000-0000-000000000000'); 
      }
    }

    const { data, fetchError } = await query;
    if (fetchError) setError("Erreur lors de la récupération des séances.");
    else setSeances(data || []);
    setLoading(false);
  };

  // --- LOGIQUE DE SUPPRESSION ---
  const handleDeleteSeance = async (e, seanceId) => {
    e.stopPropagation();
    if (!window.confirm("Êtes-vous sûr de vouloir annuler cette séance ?")) return;

    const { error: deleteError } = await supabase
      .from('seances')
      .delete()
      .eq('id', seanceId);

    if (deleteError) {
      setError("Impossible de supprimer la séance.");
    } else {
      fetchSeances();
    }
  };

  // --- LOGIQUE PRINCIPALE ---
  const handleAddSeance = async (e) => {
    e.preventDefault();
    setError(null);
    if (!formData.groupe_id || !formData.formateur_id) {
      setError("Veuillez sélectionner un groupe et un formateur.");
      return;
    }
    const { error: insertError } = await supabase.from('seances').insert([formData]);
    if (insertError) {
      setError("Erreur lors de l'enregistrement de la séance.");
    } else {
      setIsModalOpen(false);
      setFormData({ ...formData, title: '', start_time: '09:00', end_time: '12:00', groupe_id: '', formateur_id: '' });
      fetchSeances();
    }
  };

  // --- LOGIQUE DE CRÉATION À LA VOLÉE ---
  const handleCreateGroup = async (e) => {
    e.preventDefault();
    setSubModalLoading(true);
    const { data, error } = await supabase.from('groupes').insert([newGroupData]).select();
    setSubModalLoading(false);
    
    if (error) {
      alert("Erreur lors de la création du groupe.");
    } else if (data && data[0]) {
      await fetchInitialData(); 
      setFormData(prev => ({ ...prev, groupe_id: data[0].id })); 
      setIsGroupModalOpen(false);
      setNewGroupData({ name: '', description: '' });
    }
  };

  const handleCreateFormateur = async (e) => {
    e.preventDefault();
    setSubModalLoading(true);
    const { data, error } = await supabase.from('profiles').insert([{ ...newFormateurData, role: 'formateur' }]).select();
    setSubModalLoading(false);

    if (error) {
      alert("Erreur lors de la création du formateur.");
    } else if (data && data[0]) {
      // 🚨 DÉCLENCHEMENT DU MAIL MAGIC LINK 🚨
      await supabase.auth.resetPasswordForEmail(email_de_la_personne, { 
        redirectTo: `${window.location.origin}/update-password` 
      });

      await fetchInitialData(); 
      setFormData(prev => ({ ...prev, formateur_id: data[0].id })); 
      setIsFormateurModalOpen(false);
      setNewFormateurData({ first_name: '', last_name: '', email: '' });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl flex items-center shadow-sm">
          <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
          <p className="text-sm font-medium text-red-700">{error}</p>
        </div>
      )}

      {/* Header Planning */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Planning de la semaine</h1>
          <p className="text-gray-500 flex items-center mt-1">
            <CalendarIcon className="h-4 w-4 mr-2 text-brand-500" />
            Semaine du {format(startDate, 'd MMMM', { locale: fr })} au {format(addDays(startDate, 6), 'd MMMM yyyy', { locale: fr })}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex bg-gray-50 border border-gray-100 rounded-xl p-1">
            <button onClick={() => setCurrentDate(subWeeks(currentDate, 1))} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-gray-500 hover:text-brand-600">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button onClick={() => setCurrentDate(new Date())} className="px-4 py-2 text-sm font-bold text-gray-700 hover:bg-white hover:shadow-sm rounded-lg transition-all">
              Aujourd'hui
            </button>
            <button onClick={() => setCurrentDate(addWeeks(currentDate, 1))} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-gray-500 hover:text-brand-600">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          
          {role !== 'apprenant' && (
            <button onClick={() => setIsModalOpen(true)} className="flex items-center justify-center px-5 py-2.5 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-100">
              <Plus className="h-5 w-5 mr-2" />
              Nouvelle séance
            </button>
          )}
        </div>
      </div>

      {/* Grille du calendrier */}
      {loading ? (
        <div className="h-96 flex items-center justify-center">
          <Loader2 className="h-10 w-10 text-brand-600 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          {weekDays.map((day) => (
            <div key={day.toString()} className="flex flex-col min-h-[500px] bg-gray-50/50 p-2 rounded-2xl border border-gray-100/50">
              <div className={`mb-4 p-3 rounded-xl text-center transition-colors ${isSameDay(day, new Date()) ? 'bg-brand-600 text-white shadow-md' : 'bg-white text-gray-900 border border-gray-100'}`}>
                <p className="text-xs uppercase font-black tracking-wider opacity-80">{format(day, 'EEE', { locale: fr })}</p>
                <p className="text-xl font-black mt-0.5">{format(day, 'd')}</p>
              </div>

              <div className="flex-1 space-y-3">
                {seances
                  .filter(s => isSameDay(parseISO(s.date), day))
                  .sort((a, b) => a.start_time.localeCompare(b.start_time))
                  .map((seance) => (
                    <div key={seance.id} className="group p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-brand-300 transition-all cursor-pointer relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-brand-500 rounded-l-2xl" />
                      
                      {role !== 'apprenant' && (
                        <button 
                          onClick={(e) => handleDeleteSeance(e, seance.id)}
                          className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                          title="Supprimer la séance"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}

                      <h3 className="font-bold text-gray-900 text-sm leading-tight group-hover:text-brand-600 transition-colors pl-1 pr-6">
                        {seance.title}
                      </h3>
                      <div className="mt-3 space-y-2 pl-1">
                        <div className="flex items-center text-xs text-gray-500 font-medium">
                          <Clock className="h-3.5 w-3.5 mr-2 text-brand-400" />
                          {seance.start_time.slice(0, 5)} - {seance.end_time.slice(0, 5)}
                        </div>
                        <div className="flex items-center text-xs text-gray-500 font-medium">
                          <Users className="h-3.5 w-3.5 mr-2 text-brand-400" />
                          {seance.groupes?.name}
                        </div>
                        <div className="flex items-center text-xs text-gray-500 font-medium">
                          <User className="h-3.5 w-3.5 mr-2 text-brand-400" />
                          {seance.profiles?.first_name} {seance.profiles?.last_name}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- MODALE PRINCIPALE : NOUVELLE SÉANCE --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
              <h2 className="text-xl font-black text-gray-900 tracking-tight">Nouvelle Séance</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 bg-white hover:bg-gray-100 rounded-full transition-colors shadow-sm"><X className="h-4 w-4 text-gray-500" /></button>
            </div>
            
            <form onSubmit={handleAddSeance} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Titre de la séance</label>
                <input required type="text" value={formData.title} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 focus:outline-none bg-gray-50 font-medium" onChange={e => setFormData({...formData, title: e.target.value})} placeholder="ex: Anglais Professionnel" />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Groupe</label>
                <div className="flex gap-2">
                  <select required value={formData.groupe_id} className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 focus:outline-none bg-gray-50 font-medium appearance-none" onChange={e => setFormData({...formData, groupe_id: e.target.value})}>
                    <option value="">Sélectionner un groupe</option>
                    {groupes.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                  <button type="button" onClick={() => setIsGroupModalOpen(true)} className="px-4 bg-brand-50 text-brand-600 border border-brand-100 rounded-xl hover:bg-brand-100 hover:border-brand-200 transition-colors flex items-center justify-center" title="Nouveau groupe">
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Formateur</label>
                <div className="flex gap-2">
                  <select required value={formData.formateur_id} className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 focus:outline-none bg-gray-50 font-medium appearance-none" onChange={e => setFormData({...formData, formateur_id: e.target.value})}>
                    <option value="">Sélectionner le formateur</option>
                    {formateurs.map(f => <option key={f.id} value={f.id}>{f.first_name} {f.last_name}</option>)}
                  </select>
                  <button type="button" onClick={() => setIsFormateurModalOpen(true)} className="px-4 bg-brand-50 text-brand-600 border border-brand-100 rounded-xl hover:bg-brand-100 hover:border-brand-200 transition-colors flex items-center justify-center" title="Nouveau formateur">
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Début</label>
                  <input type="time" required value={formData.start_time} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 font-medium focus:ring-2 focus:ring-brand-500 outline-none" onChange={e => setFormData({...formData, start_time: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Fin</label>
                  <input type="time" required value={formData.end_time} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 font-medium focus:ring-2 focus:ring-brand-500 outline-none" onChange={e => setFormData({...formData, end_time: e.target.value})} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Date</label>
                <input type="date" required value={formData.date} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 font-medium focus:ring-2 focus:ring-brand-500 outline-none" onChange={e => setFormData({...formData, date: e.target.value})} />
              </div>

              <div className="pt-2">
                <button type="submit" className="w-full py-4 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 shadow-md shadow-brand-100 transition-all flex justify-center items-center">
                  Enregistrer la séance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- SOUS-MODALE : CRÉER UN GROUPE --- */}
      {isGroupModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Créer un Groupe</h2>
              <button onClick={() => setIsGroupModalOpen(false)} className="p-1.5 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors"><X className="h-4 w-4 text-gray-500" /></button>
            </div>
            <form onSubmit={handleCreateGroup} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Nom du groupe</label>
                <input required type="text" value={newGroupData.name} className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-brand-500 outline-none" placeholder="Ex: Développeurs Web" onChange={e => setNewGroupData({...newGroupData, name: e.target.value})} />
              </div>
              <button type="submit" disabled={subModalLoading} className="w-full py-3 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 disabled:opacity-50 flex justify-center">
                {subModalLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Créer et sélectionner'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- SOUS-MODALE : CRÉER UN FORMATEUR --- */}
      {isFormateurModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Créer un Formateur</h2>
              <button onClick={() => setIsFormateurModalOpen(false)} className="p-1.5 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors"><X className="h-4 w-4 text-gray-500" /></button>
            </div>
            <form onSubmit={handleCreateFormateur} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Prénom</label>
                  <input required type="text" value={newFormateurData.first_name} className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-brand-500 outline-none" onChange={e => setNewFormateurData({...newFormateurData, first_name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Nom</label>
                  <input required type="text" value={newFormateurData.last_name} className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-brand-500 outline-none" onChange={e => setNewFormateurData({...newFormateurData, last_name: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Email</label>
                <input required type="email" value={newFormateurData.email} className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-brand-500 outline-none" onChange={e => setNewFormateurData({...newFormateurData, email: e.target.value})} />
              </div>
              <button type="submit" disabled={subModalLoading} className="w-full py-3 mt-2 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 disabled:opacity-50 flex justify-center">
                {subModalLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Créer et sélectionner'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}