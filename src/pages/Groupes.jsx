import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Layers, Users, Plus, Search, X, Loader2, Check, UserMinus, UserPlus, Target
} from 'lucide-react';

export default function Groupes() {
  const [groupes, setGroupes] = useState([]);
  const [selectedGroupe, setSelectedGroupe] = useState(null);
  const [apprenants, setApprenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal Création
  const [showModal, setShowModal] = useState(false);
  // NOUVEAU : Ajout de l'objectif_heures par défaut à 150
  const [newGroup, setNewGroup] = useState({ name: '', description: '', objectif_heures: 150 });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    // 1. Charger les groupes avec le compte d'élèves
    const { data: grpData } = await supabase
      .from('groupes')
      .select('*, groupes_apprenants(count)')
      .order('created_at', { ascending: false });

    // 2. Charger tous les apprenants (pour l'affectation)
    const { data: appData } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'apprenant')
      .order('last_name');

    setGroupes(grpData || []);
    setApprenants(appData || []);
    setLoading(false);
  };

  const loadGroupDetails = async (groupe) => {
    const { data } = await supabase
      .from('groupes_apprenants')
      .select('apprenant_id')
      .eq('groupe_id', groupe.id);
    
    const assignedIds = data ? data.map(d => d.apprenant_id) : [];
    setSelectedGroupe({ ...groupe, assignedIds });
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('groupes').insert([newGroup]);
    
    if (error) {
      alert("Erreur de création : " + error.message);
    } else {
      setShowModal(false);
      setNewGroup({ name: '', description: '', objectif_heures: 150 });
      fetchData();
    }
  };

  const toggleStudent = async (apprenantId, isAssigned) => {
    if (isAssigned) {
      await supabase.from('groupes_apprenants').delete()
        .match({ groupe_id: selectedGroupe.id, apprenant_id: apprenantId });
    } else {
      await supabase.from('groupes_apprenants').insert([
        { groupe_id: selectedGroupe.id, apprenant_id: apprenantId }
      ]);
    }
    loadGroupDetails(selectedGroupe);
    fetchData(); 
  };

  const filteredApprenants = apprenants.filter(a => 
    `${a.first_name} ${a.last_name}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 h-[calc(100vh-8rem)] flex flex-col">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Groupes</h1>
          <p className="text-gray-500 mt-1">Créez vos cohortes et affectez-y les stagiaires.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center px-4 py-2.5 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition-all shadow-md">
          <Plus className="h-5 w-5 mr-2" />
          Nouveau Groupe
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50">
            <h2 className="font-bold text-gray-700 flex items-center">
              <Layers className="h-5 w-5 mr-2 text-brand-500" />
              Vos Cohortes
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {loading ? <div className="flex justify-center p-4"><Loader2 className="animate-spin text-brand-600" /></div> : 
              groupes.map(g => (
                <button
                  key={g.id}
                  onClick={() => loadGroupDetails(g)}
                  className={`w-full text-left p-4 rounded-xl transition-all border ${
                    selectedGroupe?.id === g.id ? 'bg-brand-50 border-brand-200 ring-1 ring-brand-500' : 'bg-white border-gray-100 hover:border-brand-200'
                  }`}
                >
                  <h3 className={`font-bold ${selectedGroupe?.id === g.id ? 'text-brand-900' : 'text-gray-900'}`}>{g.name}</h3>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center text-xs text-gray-500">
                      <Users className="h-4 w-4 mr-1.5" />
                      {g.groupes_apprenants?.[0]?.count || 0} inscrits
                    </div>
                    {/* AFFICHAGE DE L'OBJECTIF */}
                    <div className="flex items-center text-[10px] font-bold text-brand-600 bg-brand-50 px-2 py-1 rounded-md">
                      <Target className="h-3 w-3 mr-1" />
                      {g.objectif_heures}h
                    </div>
                  </div>
                </button>
              ))
            }
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
          {!selectedGroupe ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
              <Users className="h-16 w-16 mb-4 text-gray-200" />
              <p className="text-lg font-medium">Sélectionnez un groupe pour gérer les élèves</p>
            </div>
          ) : (
            <>
              <div className="p-6 border-b border-gray-100 bg-white shrink-0 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedGroupe.name}</h2>
                  <p className="text-sm text-gray-500 mt-1">{selectedGroupe.description}</p>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input type="text" placeholder="Chercher un stagiaire..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none" />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-2">
                <table className="w-full text-left">
                  <tbody className="divide-y divide-gray-50">
                    {filteredApprenants.map(apprenant => {
                      const isAssigned = selectedGroupe.assignedIds.includes(apprenant.id);
                      return (
                        <tr key={apprenant.id} className="hover:bg-gray-50 transition-colors">
                          <td className="p-4">
                            <p className="font-bold text-gray-900">{apprenant.first_name} {apprenant.last_name}</p>
                            <p className="text-xs text-gray-500">{apprenant.email}</p>
                          </td>
                          <td className="p-4 text-right">
                            <button 
                              onClick={() => toggleStudent(apprenant.id, isAssigned)}
                              className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                                isAssigned 
                                  ? 'bg-green-50 text-green-700 hover:bg-red-50 hover:text-red-700 group' 
                                  : 'bg-gray-100 text-gray-600 hover:bg-brand-600 hover:text-white'
                              }`}
                            >
                              {isAssigned ? (
                                <>
                                  <Check className="h-4 w-4 mr-2 group-hover:hidden" />
                                  <UserMinus className="h-4 w-4 mr-2 hidden group-hover:block" />
                                  <span className="group-hover:hidden">Inscrit</span>
                                  <span className="hidden group-hover:block">Retirer</span>
                                </>
                              ) : (
                                <><UserPlus className="h-4 w-4 mr-2" /> Ajouter</>
                              )}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-lg font-bold">Nouvelle Cohorte</h2>
              <button onClick={() => setShowModal(false)}><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleCreateGroup} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nom du groupe</label>
                <input required type="text" className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50" placeholder="Ex: Développeurs Web 2024" value={newGroup.name} onChange={e => setNewGroup({...newGroup, name: e.target.value})} />
              </div>
              
              {/* NOUVEAU CHAMP : Objectif d'heures */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Objectif total d'heures</label>
                <div className="relative">
                  <input required type="number" min="1" className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 pr-10" placeholder="Ex: 150" value={newGroup.objectif_heures} onChange={e => setNewGroup({...newGroup, objectif_heures: parseInt(e.target.value) || 0})} />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">h</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Description (optionnel)</label>
                <textarea className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50" rows="3" value={newGroup.description} onChange={e => setNewGroup({...newGroup, description: e.target.value})}></textarea>
              </div>
              <button type="submit" className="w-full py-3 mt-4 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700">Créer le groupe</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}