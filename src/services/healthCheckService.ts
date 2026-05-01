import { db, auth } from '../firebase';
import { collection, query, limit, getDocs } from 'firebase/firestore';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export interface HealthStatus {
  service: string;
  status: 'ok' | 'error' | 'warning' | 'loading';
  message: string;
  latency?: number;
}

export async function checkSystemHealth(): Promise<HealthStatus[]> {
  const results: HealthStatus[] = [];

  // 1. Firebase Auth
  try {
    const user = auth.currentUser;
    results.push({
      service: 'Firebase Auth',
      status: 'ok',
      message: user ? `Autenticado como ${user.email}` : 'Pronto para autenticar'
    });
  } catch (e) {
    results.push({ service: 'Firebase Auth', status: 'error', message: String(e) });
  }

  // 2. Firestore
  const firestartTime = Date.now();
  try {
    const q = query(collection(db, 'profiles'), limit(1));
    await getDocs(q);
    results.push({
      service: 'Firestore',
      status: 'ok',
      message: 'Conexão estável',
      latency: Date.now() - firestartTime
    });
  } catch (e) {
    results.push({ service: 'Firestore', status: 'error', message: 'Erro de permissão ou rede: ' + String(e) });
  }

  // 3. Supabase
  const supabaseStartTime = Date.now();
  if (!isSupabaseConfigured) {
    results.push({ service: 'Supabase', status: 'warning', message: 'Variáveis de ambiente não configuradas' });
  } else {
    try {
      const { data, error } = await supabase.from('profiles').select('id').limit(1);
      if (error) throw error;
      results.push({
        service: 'Supabase',
        status: 'ok',
        message: 'Conexão analítica ativa',
        latency: Date.now() - supabaseStartTime
      });
    } catch (e) {
      results.push({ service: 'Supabase', status: 'error', message: 'Erro de conexão SQL: ' + String(e) });
    }
  }

  // 4. EduJarvis (API Check)
  try {
    const res = await fetch('/api/edu-jarvis/health').catch(() => null);
    if (res && res.ok) {
      results.push({ service: 'EduJarvis API', status: 'ok', message: 'Backend operacional' });
    } else {
      results.push({ service: 'EduJarvis API', status: 'warning', message: 'Backend com resposta lenta ou indisponível' });
    }
  } catch (e) {
    results.push({ service: 'EduJarvis API', status: 'error', message: 'Falha crítica na rede' });
  }

  return results;
}
