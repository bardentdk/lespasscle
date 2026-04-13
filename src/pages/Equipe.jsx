import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  UserCog, Plus, Search, Mail, Phone, 
  Edit2, Trash2, X, Loader2, Shield, Briefcase, CheckCircle2 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Equipe() {
  const { user } = useAuth();
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modale et Formulaire
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  const initialFormState = { first_name: '', last_name: '', email: '', phone: '', role: 'formateur' };
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    fetchTeam();
  }, []);

  const fetchTeam = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .in('role', ['admin', 'formateur'])
      .order('role', { ascending: true }) 
      .order('last_name', { ascending: true });
    
    if (!error) setTeam(data || []);
    setLoading(false);
  };

  const handleOpenModal = (member = null) => {
    setMessage(null);
    if (member) {
      setEditingMember(member);
      setFormData({
        first_name: member.first_name || '',
        last_name: member.last_name || '',
        email: member.email || '',
        phone: member.phone || '',
        role: member.role || 'formateur'
      });
    } else {
      setEditingMember(null);
      setFormData(initialFormState);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    const payload = { ...formData };

    let error;
    if (editingMember) {
      // Mise à jour
      const { error: updateError } = await supabase
        .from('profiles')
        .update(payload)
        .eq('id', editingMember.id);
      error = updateError;
    } else {
      // Création
      const { error: insertError } = await supabase
        .from('profiles')
        .insert([payload]);
      error = insertError;

      // ✅ CORRECTION ICI : on utilise payload.email
      if (!insertError) {
        await supabase.auth.resetPasswordForEmail(payload.email, { 
          redirectTo: `${window.location.origin}/update-password` 
        });
      }
    }

    setIsSubmitting(false);

    if (error) {
      setMessage({ type: 'error', text: "Une erreur est survenue : " + error.message });
    } else {
      setIsModalOpen(false);
      fetchTeam();
    }
  };

  const handleDelete = async (id, name) => {
    if (id === user?.profile?.id) {
      alert("Vous ne pouvez pas supprimer votre propre compte !");
      return;
    }
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer ${name} de l'équipe ? Cette action est irréversible.`)) return;

    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (error) {
      alert("Erreur lors de la suppression. Ce profil est peut-être lié à des séances de formation.");
    } else {
      fetchTeam();
    }
  };

  const filteredTeam = team.filter(m => 
    `${m.first_name} ${m.last_name} ${m.email}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Header & Actions */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion de l'Équipe</h1>
          <p className="text-gray-500 mt-1">Gérez les accès des formateurs et du staff administratif.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center px-5 py-2.5 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition-all shadow-lg shadow-brand-100"
        >
          <Plus className="h-5 w-5 mr-2" />
          Nouveau membre
        </button>
      </div>

      {/* Barre de recherche */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input 
          type="text" 
          placeholder="Rechercher un collègue..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none shadow-sm"
        />
      </div>

      {/* Tableau de l'Équipe */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="py-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-brand-600" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Membre</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Rôle</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredTeam.map(member => (
                  <tr key={member.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-brand-50 flex items-center justify-center text-brand-600 font-bold mr-4 border border-brand-100">
                          {member.first_name[0]}{member.last_name[0]}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{member.first_name} <span className="uppercase">{member.last_name}</span></p>
                          {member.id === user?.profile?.id && (
                            <span className="text-[10px] font-bold text-accent-600 uppercase bg-accent-50 px-2 py-0.5 rounded-full mt-1 inline-block">C'est vous</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-gray-600"><Mail className="h-3.5 w-3.5 mr-2 text-gray-400" /> {member.email}</div>
                        {member.phone && <div className="flex items-center text-sm text-gray-600"><Phone className="h-3.5 w-3.5 mr-2 text-gray-400" /> {member.phone}</div>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {member.role === 'admin' ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-50 text-purple-700 border border-purple-100">
                          <Shield className="h-3.5 w-3.5 mr-1.5" /> Administrateur
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-brand-50 text-brand-700 border border-brand-100">
                          <Briefcase className="h-3.5 w-3.5 mr-1.5" /> Formateur
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button 
                        onClick={() => handleOpenModal(member)}
                        className="p-2 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                        title="Modifier"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(member.id, member.first_name)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- MODALE CRUD --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/80">
              <h2 className="text-xl font-bold text-gray-900">
                {editingMember ? 'Modifier le profil' : 'Nouveau membre'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 bg-white hover:bg-gray-100 rounded-full transition-colors shadow-sm"><X className="h-4 w-4 text-gray-500" /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {message && (
                <div className="p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm font-medium">
                  {message.text}
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Prénom</label>
                  <input required type="text" className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-brand-500 outline-none" value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Nom</label>
                  <input required type="text" className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-brand-500 outline-none" value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Email</label>
                <input required type="email" className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-brand-500 outline-none" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Téléphone (Optionnel)</label>
                <input type="tel" className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-brand-500 outline-none" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Rôle</label>
                <select 
                  className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-brand-500 outline-none font-medium" 
                  value={formData.role} 
                  onChange={e => setFormData({...formData, role: e.target.value})}
                >
                  <option value="formateur">Formateur</option>
                  <option value="admin">Administrateur</option>
                </select>
              </div>

              <div className="pt-2">
                <button type="submit" disabled={isSubmitting} className="w-full py-3 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition-all shadow-md flex justify-center items-center disabled:opacity-50">
                  {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : (editingMember ? <CheckCircle2 className="h-5 w-5 mr-2" /> : <UserCog className="h-5 w-5 mr-2" />)}
                  {isSubmitting ? 'Enregistrement...' : (editingMember ? 'Mettre à jour' : 'Ajouter à l\'équipe')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}