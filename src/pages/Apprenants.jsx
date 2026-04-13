import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Papa from 'papaparse';
import { 
  Users, Plus, UploadCloud, Search, Mail, Phone, 
  MoreVertical, X, CheckCircle2, AlertCircle, Loader2 
} from 'lucide-react';

export default function Apprenants() {
  const [apprenants, setApprenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Gestion des modales
  const [showManualModal, setShowManualModal] = useState(false);
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  // Formulaire manuel
  const [formData, setFormData] = useState({ first_name: '', last_name: '', email: '', phone: '' });

  useEffect(() => {
    fetchApprenants();
  }, []);

  const fetchApprenants = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'apprenant')
      .order('created_at', { ascending: false });
    
    if (!error) setApprenants(data || []);
    setLoading(false);
  };

  // -----------------------------------------------------
  // LOGIQUE 1 : AJOUT MANUEL
  // -----------------------------------------------------
  const handleManualSubmit = async (e) => {
    e.preventDefault();
    setStatusMsg(null);
    
    const mockId = crypto.randomUUID(); 

    const { error } = await supabase.from('profiles').insert([{
      id: mockId,
      role: 'apprenant',
      ...formData
    }]);

    if (error) {
      setStatusMsg({ type: 'error', text: error.message });
    } else {
      // 🚨 DÉCLENCHEMENT DU MAIL MAGIC LINK 🚨
      await supabase.auth.signInWithOtp({ email: formData.email });

      setShowManualModal(false);
      setFormData({ first_name: '', last_name: '', email: '', phone: '' });
      fetchApprenants();
    }
  };

  // -----------------------------------------------------
  // LOGIQUE 2 : IMPORT CSV
  // -----------------------------------------------------
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setStatusMsg(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data;
        if (!rows.length) {
          setStatusMsg({ type: 'error', text: "Le fichier CSV est vide." });
          return;
        }

        const payload = rows.map(row => ({
          id: crypto.randomUUID(),
          role: 'apprenant',
          first_name: row.first_name || row.prenom || '',
          last_name: row.last_name || row.nom || '',
          email: row.email || '',
          phone: row.phone || row.telephone || null
        })).filter(u => u.email && u.first_name);

        if (payload.length === 0) {
          setStatusMsg({ type: 'error', text: "Format CSV invalide. Colonnes requises : first_name, last_name, email" });
          return;
        }

        const { error } = await supabase.from('profiles').insert(payload);

        if (error) {
          setStatusMsg({ type: 'error', text: "Erreur lors de l'import : " + error.message });
        } else {
          // 🚨 DÉCLENCHEMENT DES MAILS POUR CHAQUE APPRENANT IMPORTÉ 🚨
          for (const user of payload) {
            await supabase.auth.resetPasswordForEmail(email_de_la_personne, { 
              redirectTo: `${window.location.origin}/update-password` 
            });
          }

          setShowCsvModal(false);
          fetchApprenants();
        }
      },
      error: (err) => setStatusMsg({ type: 'error', text: err.message })
    });
  };

  const filteredApprenants = apprenants.filter(a => 
    `${a.first_name} ${a.last_name} ${a.email}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Header & Actions */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Annuaire des Apprenants</h1>
          <p className="text-gray-500 mt-1">Gérez votre base de stagiaires. C'est la première étape du dispositif.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowCsvModal(true)}
            className="flex items-center px-4 py-2.5 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all shadow-sm"
          >
            <UploadCloud className="h-5 w-5 mr-2 text-brand-600" />
            Import CSV
          </button>
          <button 
            onClick={() => setShowManualModal(true)}
            className="flex items-center px-4 py-2.5 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition-all shadow-md shadow-brand-100"
          >
            <Plus className="h-5 w-5 mr-2" />
            Nouveau Stagiaire
          </button>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input 
          type="text" 
          placeholder="Rechercher par nom, email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
        />
      </div>

      {/* Tableau des Apprenants */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="py-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-brand-600" /></div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Stagiaire</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Contact</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Date d'ajout</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredApprenants.map(apprenant => (
                <tr key={apprenant.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-brand-100 to-accent-100 flex items-center justify-center text-brand-700 font-bold mr-4">
                        {apprenant.first_name[0]}{apprenant.last_name[0]}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{apprenant.first_name} <span className="uppercase">{apprenant.last_name}</span></p>
                        <p className="text-xs text-gray-500">ID: {apprenant.id.split('-')[0]}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center text-sm text-gray-600"><Mail className="h-3.5 w-3.5 mr-2 text-gray-400" /> {apprenant.email}</div>
                      {apprenant.phone && <div className="flex items-center text-sm text-gray-600"><Phone className="h-3.5 w-3.5 mr-2 text-gray-400" /> {apprenant.phone}</div>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(apprenant.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 text-gray-400 hover:text-brand-600 rounded-lg hover:bg-brand-50 transition-colors">
                      <MoreVertical className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* --- MODAL AJOUT MANUEL --- */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-bold">Nouveau Stagiaire</h2>
              <button onClick={() => setShowManualModal(false)}><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleManualSubmit} className="p-6 space-y-4">
              {statusMsg && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-xl">{statusMsg.text}</div>}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Prénom</label>
                  <input required type="text" className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50" value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nom</label>
                  <input required type="text" className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50" value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
                <input required type="email" className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Téléphone (optionnel)</label>
                <input type="tel" className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              </div>
              <button type="submit" className="w-full py-3 mt-4 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700">Enregistrer et inviter</button>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL IMPORT CSV --- */}
      {showCsvModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-bold">Importation CSV</h2>
              <button onClick={() => setShowCsvModal(false)}><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <div className="p-6">
              {statusMsg && <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-xl">{statusMsg.text}</div>}
              
              <div className="border-2 border-dashed border-brand-200 rounded-2xl p-8 text-center bg-brand-50/30">
                <UploadCloud className="h-10 w-10 text-brand-500 mx-auto mb-3" />
                <p className="text-sm font-bold text-gray-700 mb-1">Glissez votre fichier ici</p>
                <p className="text-xs text-gray-500 mb-4">Format requis : first_name, last_name, email</p>
                <input 
                  type="file" 
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-brand-600 file:text-white hover:file:bg-brand-700 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}