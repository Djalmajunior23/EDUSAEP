import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Validação robusta de existência e formato
const isValid =
  !!supabaseUrl &&
  supabaseUrl.startsWith("https://") &&
  !!supabaseAnonKey;

if (!isValid) {
  console.warn(
    "Supabase não configurado corretamente. Verifique VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY nas variáveis de ambiente."
  );
}

export const isSupabaseConfigured = isValid;

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
