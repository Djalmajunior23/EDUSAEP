import { supabase, isSupabaseConfigured } from "../../lib/supabaseClient";

/**
 * Sincroniza o usuário do Firebase com o Supabase
 */
export async function syncFirebaseUserToSupabase(user: any, profile: any) {
  if (!supabase || !isSupabaseConfigured) return null;

  try {
    const { data, error } = await supabase
      .from('profiles_supabase')
      .upsert({
        firebase_uid: user.uid,
        email: user.email,
        display_name: user.displayName || profile?.nome || '',
        perfil: profile?.role || 'aluno',
        ultimo_acesso: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'firebase_uid' })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.warn("Falha ao sincronizar usuário com Supabase:", error);
    return null;
  }
}

/**
 * Busca o perfil do Supabase pelo Firebase UID
 */
export async function getSupabaseProfile(firebaseUid: string) {
  if (!supabase || !isSupabaseConfigured) return null;
  const { data, error } = await supabase
    .from('profiles_supabase')
    .select('*')
    .eq('firebase_uid', firebaseUid)
    .single();
  
  if (error) return null;
  return data;
}
