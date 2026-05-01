// src/utils/envCheck.ts

export function checkSupabaseEnv() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.error("Supabase NÃO configurado no build");
    return false;
  }

  console.log("Supabase configurado com sucesso");
  return true;
}
