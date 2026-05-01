import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Inicializa o cliente Supabase apenas se as variáveis estiverem presentes
// para evitar quebras se o usuário ainda não as configurou
export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Verifica se o Supabase está configurado e disponível
 */
export const isSupabaseConfigured = (): boolean => {
  return !!supabase;
};
