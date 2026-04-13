import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { User, Lock, Save, Loader2, CheckCircle2 } from 'lucide-react';

export default function Parametres() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // Séparation des formulaires
  const [profile, setProfile] = useState({
    first_name: user?.profile?.first_name || '',
    last_name: user?.profile?.last_name || '',
    phone: user?.profile?.phone || ''
  });
  
  const [passwords, setPasswords] = useState({ new: '', confirm: '' });

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase
      .from('profiles')
      .update(profile)
      .eq('id', user.profile.id);

    if (error) setMessage({ type: 'error', text: "Erreur lors de la mise à jour." });
    else setMessage({ type: 'success', text: "Profil mis à jour avec succès !" });
    setLoading(false);
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      setMessage({ type: 'error', text: "Les mots de passe ne correspondent pas." });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: passwords.new });
    
    if (error) setMessage({ type: 'error', text: error.message });
    else {
      setMessage({ type: 'success', text: "Mot de passe modifié avec succès." });
      setPasswords({ new: '', confirm: '' });
    }
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Paramètres du compte</h1>
        <p className="text-gray-500 mt-1">Gérez vos informations personnelles et votre sécurité.</p>
      </div>

      {message && (
        <div className={`p-4 rounded-xl flex items-center ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          <CheckCircle2 className="h-5 w-5 mr-3 shrink-0" />
          <p className="text-sm font-medium">{message.text}</p>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Section Profil */}
        <div className="p-8 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 flex items-center mb-6">
            <User className="h-5 w-5 mr-2 text-brand-600" />
            Informations Personnelles
          </h2>
          <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-2xl">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Prénom</label>
                <input type="text" value={profile.first_name} onChange={e => setProfile({...profile, first_name: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none transition-all" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Nom</label>
                <input type="text" value={profile.last_name} onChange={e => setProfile({...profile, last_name: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none transition-all" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Téléphone</label>
              <input type="tel" value={profile.phone} onChange={e => setProfile({...profile, phone: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none transition-all" />
            </div>
            <button type="submit" disabled={loading} className="px-6 py-3 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition-all flex items-center mt-4">
              {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Save className="h-5 w-5 mr-2" />}
              Enregistrer les modifications
            </button>
          </form>
        </div>

        {/* Section Sécurité */}
        <div className="p-8 bg-gray-50">
          <h2 className="text-lg font-bold text-gray-900 flex items-center mb-6">
            <Lock className="h-5 w-5 mr-2 text-brand-600" />
            Sécurité (Mot de passe)
          </h2>
          <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Nouveau mot de passe</label>
              <input type="password" required minLength={6} value={passwords.new} onChange={e => setPasswords({...passwords, new: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-brand-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Confirmer le mot de passe</label>
              <input type="password" required minLength={6} value={passwords.confirm} onChange={e => setPasswords({...passwords, confirm: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-brand-500 outline-none" />
            </div>
            <button type="submit" disabled={loading} className="px-6 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition-all flex items-center mt-4">
              Mettre à jour le mot de passe
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}