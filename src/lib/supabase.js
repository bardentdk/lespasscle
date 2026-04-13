import { createClient } from '@supabase/supabase-js';

// On récupère les variables d'environnement définies dans le .env.local
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Variables d'environnement Supabase manquantes. Vérifie ton fichier .env.local");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);