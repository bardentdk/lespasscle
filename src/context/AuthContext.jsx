import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // La fonction clé qui fait le pont entre Auth et Métier
  const loadUserWithProfile = async (sessionUser) => {
    if (!sessionUser) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      // On cherche la fiche stagiaire / admin correspondant à cet email
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', sessionUser.email)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error("Erreur de récupération du profil:", error.message);
      }

      // On fusionne l'objet Auth natif avec notre Profil métier
      setUser({
        ...sessionUser, // Contient user.id (Auth), user.email, etc.
        profile: profile || null // Contient user.profile.id (Métier), user.profile.role, etc.
      });
    } catch (err) {
      console.error("Erreur inattendue:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 1. Vérification au chargement de l'application
    supabase.auth.getSession().then(({ data: { session } }) => {
      loadUserWithProfile(session?.user);
    });

    // 2. Écoute dynamique (Connexion, Déconnexion, Lien Magique)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // Pour éviter de recharger inutilement si on est déjà logué
      if (session?.user?.id !== user?.id) {
        loadUserWithProfile(session?.user);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Les méthodes d'authentification
  const login = (email, password) => supabase.auth.signInWithPassword({ email, password });
  const logout = () => supabase.auth.signOut();
  
  // NOUVEAU : Le Magic Link pour les stagiaires importés
  const sendMagicLink = (email) => supabase.auth.signInWithOtp({ email });

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, sendMagicLink }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);