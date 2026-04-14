import React, { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  Calendar as CalendarIcon, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle, 
  Save,
  Loader2,
  Users,
  Paperclip,
  FileText,
  X
} from 'lucide-react';
import { supabase } from '../lib/supabase';

// Utilitaire pour calculer la durée en heures décimales (ex: 09:00 à 10:30 -> 1.5)
const calculateDuration = (startTime, endTime) => {
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  const startDec = startH + (startM / 60);
  const endDec = endH + (endM / 60);
  return Math.max(0, parseFloat((endDec - startDec).toFixed(2)));
};

export default function Suivi() {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [seances, setSeances] = useState([]);
  const [selectedSeance, setSelectedSeance] = useState(null);
  
  const [apprenants, setApprenants] = useState([]);
  const [presencesData, setPresencesData] = useState({}); // L'état du formulaire de pointage
  
  const [loadingSeances, setLoadingSeances] = useState(false);
  const [loadingApprenants, setLoadingApprenants] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'success' | 'error', text: '...' }

  // États pour la modale de justificatif
  const [justifModal, setJustifModal] = useState({ open: false, apprenantId: null });
  const [apprenantDocs, setApprenantDocs] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  // 1. Charger les séances à chaque changement de date
  useEffect(() => {
    fetchSeancesForDate(selectedDate);
    setSelectedSeance(null);
    setApprenants([]);
    setMessage(null);
  }, [selectedDate]);

  // 2. Charger les apprenants et les présences existantes quand on choisit une séance
  useEffect(() => {
    if (selectedSeance) {
      fetchApprenantsAndPresences(selectedSeance);
      setMessage(null);
    }
  }, [selectedSeance]);

  const fetchSeancesForDate = async (date) => {
    setLoadingSeances(true);
    const { data, error } = await supabase
      .from('seances')
      .select('*, groupes(name), profiles(first_name, last_name)')
      .eq('date', date)
      .order('start_time');

    if (error) console.error(error);
    else setSeances(data || []);
    setLoadingSeances(false);
  };

  const fetchApprenantsAndPresences = async (seance) => {
    setLoadingApprenants(true);
    
    // A. Récupérer les apprenants du groupe lié à la séance
    const { data: groupeData, error: groupeError } = await supabase
      .from('groupes_apprenants')
      .select('profiles(id, first_name, last_name)')
      .eq('groupe_id', seance.groupe_id);

    // B. Récupérer les présences DÉJÀ enregistrées pour cette séance
    const { data: existingPresences, error: presencesError } = await supabase
      .from('presences')
      .select('*')
      .eq('seance_id', seance.id);

    if (groupeError || presencesError) {
      setMessage({ type: 'error', text: "Erreur lors du chargement des données." });
      setLoadingApprenants(false);
      return;
    }

    const apprenantsList = groupeData.map(g => g.profiles).sort((a, b) => a.last_name.localeCompare(b.last_name));
    setApprenants(apprenantsList);

    // C. Préparer le state du formulaire
    const dureeSeance = calculateDuration(seance.start_time, seance.end_time);
    const presencesMap = {};

    apprenantsList.forEach(apprenant => {
      // Vérifier si l'apprenant a déjà été pointé
      const existing = existingPresences?.find(p => p.apprenant_id === apprenant.id);
      
      if (existing) {
        presencesMap[apprenant.id] = {
          status: existing.status,
          heures_validees: existing.heures_validees,
          comment: existing.comment || '',
          justificatif_id: existing.justificatif_id || null
        };
      } else {
        // Par défaut: on le met présent avec la totalité des heures
        presencesMap[apprenant.id] = {
          status: 'present',
          heures_validees: dureeSeance,
          comment: '',
          justificatif_id: null
        };
      }
    });

    setPresencesData(presencesMap);
    setLoadingApprenants(false);
  };

  const handleStatusChange = (apprenantId, newStatus) => {
    setPresencesData(prev => {
      const current = prev[apprenantId];
      const dureeSeance = calculateDuration(selectedSeance.start_time, selectedSeance.end_time);
      
      // Ajustement automatique des heures selon le statut
      let nouvellesHeures = current.heures_validees;
      if (newStatus === 'absent' || newStatus === 'excuse') nouvellesHeures = 0;
      else if (newStatus === 'present' && current.heures_validees === 0) nouvellesHeures = dureeSeance;

      return {
        ...prev,
        [apprenantId]: {
          ...current,
          status: newStatus,
          heures_validees: nouvellesHeures
        }
      };
    });
  };

  // --- LOGIQUE DES JUSTIFICATIFS ---
  const openJustifModal = async (apprenantId) => {
    setJustifModal({ open: true, apprenantId });
    setLoadingDocs(true);
    // On va chercher les documents de l'apprenant dans le Storage / table documents
    const { data } = await supabase
      .from('documents')
      .select('*')
      .eq('apprenant_id', apprenantId)
      .order('created_at', { ascending: false });
    
    setApprenantDocs(data || []);
    setLoadingDocs(false);
  };

  const linkJustificatif = (docId) => {
    setPresencesData(prev => ({
      ...prev,
      [justifModal.apprenantId]: { 
        ...prev[justifModal.apprenantId], 
        justificatif_id: docId, 
        status: 'excuse' // On passe automatiquement le statut en "Excusé"
      }
    }));
    setJustifModal({ open: false, apprenantId: null });
  };
  // ---------------------------------

  const handleSavePresences = async () => {
    setIsSaving(true);
    setMessage(null);

    // Préparer le tableau d'objets à envoyer à Supabase
    const payload = Object.entries(presencesData).map(([apprenantId, data]) => ({
      seance_id: selectedSeance.id,
      apprenant_id: apprenantId,
      status: data.status,
      heures_validees: parseFloat(data.heures_validees),
      comment: data.comment,
      justificatif_id: data.justificatif_id // Inclusion du justificatif
    }));

    // Upsert = Insert si ça n'existe pas, Update si ça existe
    const { error } = await supabase
      .from('presences')
      .upsert(payload, { onConflict: 'seance_id, apprenant_id' });

    setIsSaving(false);

    if (error) {
      console.error(error);
      setMessage({ type: 'error', text: "Erreur lors de l'enregistrement des présences." });
    } else {
      setMessage({ type: 'success', text: "Appel enregistré avec succès !" });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
      
      {/* Header et Sélection de date */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Suivi des heures</h1>
            <p className="text-gray-500 mt-1">Pointer les présences et valider les heures des stagiaires.</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <CalendarIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none font-medium text-gray-700 bg-gray-50 hover:bg-white transition-colors"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Colonne de gauche : Liste des séances du jour */}
        <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 h-[calc(100vh-240px)] overflow-y-auto">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 px-2">Séances du {format(parseISO(selectedDate), 'dd/MM/yyyy')}</h2>
          
          {loadingSeances ? (
            <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 text-brand-500 animate-spin" /></div>
          ) : seances.length === 0 ? (
            <div className="text-center p-8 text-gray-400 italic bg-gray-50 rounded-xl border border-dashed border-gray-200">
              Aucune séance programmée ce jour.
            </div>
          ) : (
            <div className="space-y-3">
              {seances.map(seance => (
                <button
                  key={seance.id}
                  onClick={() => setSelectedSeance(seance)}
                  className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
                    selectedSeance?.id === seance.id 
                      ? 'bg-brand-50 border-brand-200 ring-1 ring-brand-500 shadow-sm' 
                      : 'bg-white border-gray-100 hover:border-brand-200 hover:shadow-sm'
                  }`}
                >
                  <h3 className={`font-bold ${selectedSeance?.id === seance.id ? 'text-brand-900' : 'text-gray-900'}`}>
                    {seance.title}
                  </h3>
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center text-xs text-gray-500">
                      <Clock className="h-3.5 w-3.5 mr-1.5" />
                      {seance.start_time.slice(0, 5)} - {seance.end_time.slice(0, 5)} 
                      <span className="ml-1 font-medium bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
                        ({calculateDuration(seance.start_time, seance.end_time)}h)
                      </span>
                    </div>
                    <div className="flex items-center text-xs text-gray-500">
                      <Users className="h-3.5 w-3.5 mr-1.5" />
                      {seance.groupes.name}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Colonne de droite : Liste d'appel */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-[calc(100vh-240px)] flex flex-col relative">
          {!selectedSeance ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
              <Users className="h-16 w-16 mb-4 text-gray-200" />
              <p className="text-lg font-medium text-gray-500">Sélectionnez une séance pour faire l'appel</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedSeance.title}</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Groupe : {selectedSeance.groupes.name} • {apprenants.length} apprenants
                  </p>
                </div>
                <button
                  onClick={handleSavePresences}
                  disabled={isSaving || apprenants.length === 0}
                  className="flex items-center px-6 py-2.5 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition-all shadow-lg shadow-brand-100 disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Save className="h-5 w-5 mr-2" />}
                  Enregistrer l'appel
                </button>
              </div>

              {message && (
                <div className={`mb-6 p-4 rounded-xl flex items-center ${message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>
                  {message.type === 'success' ? <CheckCircle2 className="h-5 w-5 mr-3" /> : <AlertCircle className="h-5 w-5 mr-3" />}
                  <p className="text-sm font-medium">{message.text}</p>
                </div>
              )}

              {loadingApprenants ? (
                <div className="flex-1 flex justify-center items-center"><Loader2 className="h-10 w-10 text-brand-500 animate-spin" /></div>
              ) : apprenants.length === 0 ? (
                <div className="flex-1 flex justify-center items-center text-gray-400 italic">Aucun apprenant dans ce groupe.</div>
              ) : (
                <div className="flex-1 overflow-y-auto pr-2">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0 z-10 rounded-t-xl">
                      <tr>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider rounded-tl-xl">Stagiaire</th>
                        <th scope="col" className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Statut</th>
                        <th scope="col" className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Justif.</th>
                        <th scope="col" className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Heures</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider rounded-tr-xl">Commentaire (optionnel)</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {apprenants.map((apprenant) => {
                        const state = presencesData[apprenant.id] || { status: 'present', heures_validees: 0, comment: '', justificatif_id: null };
                        
                        return (
                          <tr key={apprenant.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="h-8 w-8 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-bold text-sm mr-3">
                                  {apprenant.first_name[0]}{apprenant.last_name[0]}
                                </div>
                                <div className="text-sm font-bold text-gray-900">
                                  {apprenant.first_name} <span className="uppercase">{apprenant.last_name}</span>
                                </div>
                              </div>
                            </td>
                            
                            <td className="px-4 py-4 whitespace-nowrap text-center">
                              <div className="flex items-center justify-center space-x-1 bg-gray-100 p-1 rounded-lg inline-flex">
                                <button 
                                  onClick={() => handleStatusChange(apprenant.id, 'present')}
                                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${state.status === 'present' ? 'bg-green-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                  Présent
                                </button>
                                <button 
                                  onClick={() => handleStatusChange(apprenant.id, 'absent')}
                                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${state.status === 'absent' ? 'bg-red-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                  Absent
                                </button>
                                <button 
                                  onClick={() => handleStatusChange(apprenant.id, 'retard')}
                                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${state.status === 'retard' ? 'bg-orange-400 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                  Retard
                                </button>
                                <button 
                                  onClick={() => handleStatusChange(apprenant.id, 'excuse')}
                                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${state.status === 'excuse' ? 'bg-blue-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                  Excusé
                                </button>
                              </div>
                            </td>

                            {/* NOUVELLE COLONNE : Justificatif */}
                            <td className="px-4 py-4 whitespace-nowrap text-center">
                              {state.justificatif_id ? (
                                <div className="flex flex-col items-center justify-center text-green-600">
                                  <CheckCircle2 className="h-5 w-5 mb-0.5" />
                                  <button onClick={() => openJustifModal(apprenant.id)} className="text-[10px] font-bold underline hover:text-green-800">Lié</button>
                                </div>
                              ) : (
                                <button 
                                  onClick={() => openJustifModal(apprenant.id)}
                                  className={`p-2 rounded-lg transition-colors ${state.status === 'absent' ? 'bg-red-50 text-red-600 animate-pulse hover:bg-red-100' : 'bg-gray-50 text-gray-400 hover:bg-gray-200'}`}
                                  title="Lier un justificatif"
                                >
                                  <Paperclip className="h-4 w-4" />
                                </button>
                              )}
                            </td>

                            <td className="px-4 py-4 whitespace-nowrap text-center">
                              <input
                                type="number"
                                step="0.5"
                                min="0"
                                value={state.heures_validees}
                                onChange={(e) => setPresencesData(prev => ({
                                  ...prev,
                                  [apprenant.id]: { ...prev[apprenant.id], heures_validees: e.target.value }
                                }))}
                                className={`w-20 text-center font-bold px-2 py-1.5 border rounded-lg focus:ring-2 focus:outline-none ${
                                  state.status === 'present' ? 'border-green-200 text-green-700 bg-green-50 focus:ring-green-500' :
                                  state.status === 'absent' ? 'border-red-200 text-red-700 bg-red-50 focus:ring-red-500 opacity-50' :
                                  'border-gray-200 text-gray-700 bg-white focus:ring-brand-500'
                                }`}
                              />
                            </td>

                            <td className="px-4 py-4 w-full">
                              <input
                                type="text"
                                placeholder={state.status === 'retard' ? "Combien de temps ?" : "Raison de l'absence..."}
                                value={state.comment}
                                onChange={(e) => setPresencesData(prev => ({
                                  ...prev,
                                  [apprenant.id]: { ...prev[apprenant.id], comment: e.target.value }
                                }))}
                                className="w-full text-sm px-3 py-1.5 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* MODALE DE LIAISON JUSTIFICATIF */}
      {justifModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-900">Lier un document de l'apprenant</h3>
              <button onClick={() => setJustifModal({open: false, apprenantId: null})} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6 max-h-[400px] overflow-y-auto space-y-3">
              {loadingDocs ? (
                <Loader2 className="animate-spin text-brand-600 mx-auto my-8" /> 
              ) : apprenantDocs.length === 0 ? (
                <p className="text-center text-gray-500 py-8 italic">Aucun document dans le dossier de ce stagiaire.</p>
              ) : (
                apprenantDocs.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-2xl hover:bg-brand-50 hover:border-brand-200 transition-colors group">
                    <div className="flex items-center">
                      <div className="p-2 bg-brand-100 rounded-lg text-brand-600 mr-3">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{doc.title}</p>
                        <p className="text-[10px] text-gray-400 font-medium">Le {format(parseISO(doc.created_at), 'dd/MM/yyyy')}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => linkJustificatif(doc.id)} 
                      className="px-4 py-2 bg-white border border-gray-200 text-brand-600 text-xs font-bold rounded-xl group-hover:bg-brand-600 group-hover:text-white transition-colors"
                    >
                      Sélectionner
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}