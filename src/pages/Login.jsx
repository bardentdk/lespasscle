import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, Loader2, AlertCircle, KeyRound } from 'lucide-react';
import Logo from "../assets/lespasscle-logo.png";

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  // Connexion classique
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    const { error } = await login(email, password);

    if (error) {
      setError("Identifiants invalides ou problème de connexion.");
      setIsSubmitting(false);
    } else {
      navigate('/');
    }
  };

  // Flux de première connexion / Mot de passe oublié
  const handleResetPassword = async () => {
    if (!email) {
      setError("Veuillez saisir votre adresse email pour recevoir le lien.");
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });
    
    setIsSubmitting(false);

    if (error) {
      setError("Erreur : " + error.message);
    } else {
      setMessage("Un email sécurisé vous a été envoyé pour définir votre mot de passe.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      
      {/* Affichage du Logo au-dessus de la carte */}
      <div className="mb-8">
        <img 
          src={Logo} 
          alt="LéspassClés Logo" 
          className="h-20 w-auto object-contain"
        />
      </div>

      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-gray-100">
        <div>
          <h2 className="text-center text-3xl font-black text-gray-900 tracking-tighter uppercase">
            Espace <span className="text-brand-600">Léspass</span><span className="text-accent-500">Clé</span>
          </h2>
          <p className="mt-3 text-center text-sm font-medium text-gray-500">
            Connectez-vous pour accéder à votre suivi de formation
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex items-start animate-in fade-in slide-in-from-top-1">
              <AlertCircle className="h-5 w-5 text-red-500 mr-3 mt-0.5" />
              <p className="text-sm font-bold text-red-700">{error}</p>
            </div>
          )}

          {message && (
            <div className="bg-brand-50 border-l-4 border-brand-500 p-4 rounded-md flex items-start animate-in fade-in">
              <CheckCircle2 className="h-5 w-5 text-brand-500 mr-3 mt-0.5" />
              <p className="text-sm font-bold text-brand-700">{message}</p>
            </div>
          )}

          <div className="space-y-4">
            <div className="relative">
              <label htmlFor="email" className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Email professionnel</label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all sm:text-sm font-medium"
                  placeholder="nom@exemple.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="relative">
              <label htmlFor="password" className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Mot de passe</label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <KeyRound className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all sm:text-sm font-medium"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-black uppercase rounded-xl text-white bg-brand-600 hover:bg-brand-700 focus:outline-none transition-all shadow-lg shadow-brand-100 disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin h-5 w-5" />
              ) : (
                "Se connecter"
              )}
            </button>

            <div className="text-center">
              <button 
                type="button"
                onClick={handleResetPassword}
                className="text-xs font-bold text-brand-600 hover:text-brand-800 transition-colors uppercase tracking-tight"
              >
                Première connexion ou mot de passe oublié ?
              </button>
            </div>
          </div>
        </form>
      </div>

      <p className="mt-8 text-center text-xs text-gray-400 font-bold uppercase tracking-widest">
        Dispositif Région Réunion
      </p>
    </div>
  );
}