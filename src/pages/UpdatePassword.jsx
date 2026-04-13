import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { KeyRound, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

export default function UpdatePassword() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.updateUser({ password: password });

    if (error) {
      setError("Erreur lors de la mise à jour : " + error.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setTimeout(() => {
        navigate('/'); // Redirection vers le tableau de bord après 2 secondes
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-black text-brand-600 uppercase tracking-tighter">
          Léspass<span className="text-accent-500">Clés</span>
        </h2>
        <h2 className="mt-4 text-center text-xl font-bold text-gray-900">
          Sécurisez votre compte
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-2xl sm:px-10 border border-gray-100">
          {success ? (
            <div className="text-center">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-900">Mot de passe enregistré !</h3>
              <p className="text-gray-500 mt-2">Redirection vers votre espace...</p>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleUpdate}>
              {error && (
                <div className="p-3 bg-red-50 text-red-700 text-sm font-medium border-l-4 border-red-500 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2" /> {error}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-bold text-gray-700">Nouveau mot de passe</label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <KeyRound className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none block w-full pl-10 px-3 py-3 border border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-500 focus:border-brand-500 font-medium"
                    placeholder="Minimum 6 caractères"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 focus:outline-none disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Valider et me connecter"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}