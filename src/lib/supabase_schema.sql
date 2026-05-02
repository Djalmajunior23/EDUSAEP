-- SQL PARA INICIALIZAÇÃO DO SUPABASE NO EDUAI CORE ULTRA

-- 1. TABELA DE PERFIS (Sincronizada com Firebase Auth)
CREATE TABLE public.profiles_supabase (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    firebase_uid TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    display_name TEXT,
    perfil TEXT CHECK (perfil IN ('admin', 'professor', 'aluno', 'coordenador')),
    ultimo_acesso TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. TABELA DE TURMAS
CREATE TABLE public.turmas_supabase (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    codigo TEXT UNIQUE,
    professor_id UUID REFERENCES public.profiles_supabase(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by TEXT -- Firebase UID do criador
);

-- 3. TABELA DE COMPETÊNCIAS
CREATE TABLE public.competencias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    codigo TEXT UNIQUE,
    descricao TEXT,
    unidade_curricular TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. QUESTÕES ANALÍTICAS
CREATE TABLE public.questoes_analiticas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    firebase_id TEXT, -- ID no Firestore se existir
    enunciado TEXT NOT NULL,
    competencia_id UUID REFERENCES public.competencias(id),
    dificuldade TEXT CHECK (dificuldade IN ('facil', 'medio', 'dificil')),
    taxonomia_bloom TEXT,
    uso_total_erros INTEGER DEFAULT 0,
    uso_total_acertos INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. TENTATIVAS DE SIMULADO
CREATE TABLE public.tentativas_simulado (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    firebase_uid TEXT NOT NULL, -- FK lógica com Auth
    aluno_id UUID REFERENCES public.profiles_supabase(id),
    turma_id UUID REFERENCES public.turmas_supabase(id),
    simulado_id TEXT, -- ID do simulado no Firebase
    nota_final DECIMAL(5,2),
    percentual_acerto DECIMAL(5,2),
    tempo_segundos INTEGER,
    status TEXT DEFAULT 'finalizado',
    data_tentativa TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. RESPOSTAS DETALHADAS
CREATE TABLE public.respostas_simulado (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tentativa_id UUID REFERENCES public.tentativas_simulado(id) ON DELETE CASCADE,
    questao_id UUID REFERENCES public.questoes_analiticas(id),
    alternativa_marcada TEXT,
    foi_correto BOOLEAN,
    tempo_resposta_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 7. ANÁLISES EDUJARVIS
CREATE TABLE public.analises_edu_jarvis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    firebase_uid TEXT NOT NULL,
    aluno_id UUID REFERENCES public.profiles_supabase(id),
    turma_id UUID REFERENCES public.turmas_supabase(id),
    tipo_analise TEXT, -- 'desempenho', 'recuperacao', 'estudo'
    prompt_version TEXT,
    conteudo_analise JSONB,
    recomendacoes JSONB,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 8. GAMIFICAÇÃO
CREATE TABLE public.gamificacao_pontos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    firebase_uid TEXT NOT NULL,
    aluno_id UUID REFERENCES public.profiles_supabase(id),
    pontos INTEGER DEFAULT 0,
    motivo TEXT,
    tipo TEXT, -- 'acerto', 'sequencia', 'missao'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.gamificacao_medalhas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aluno_id UUID REFERENCES public.profiles_supabase(id),
    nome TEXT NOT NULL,
    slug TEXT NOT NULL,
    icone TEXT,
    descricao TEXT,
    conquistada_em TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ÍNDICES PARA PERFORMANCE
CREATE INDEX idx_profiles_firebase_uid ON public.profiles_supabase(firebase_uid);
CREATE INDEX idx_tentativas_aluno ON public.tentativas_simulado(aluno_id);
CREATE INDEX idx_tentativas_turma ON public.tentativas_simulado(turma_id);
CREATE INDEX idx_analises_aluno ON public.analises_edu_jarvis(aluno_id);
CREATE INDEX idx_respostas_tentativa ON public.respostas_simulado(tentativa_id);

-- 9. ANALÍTICAS AVANÇADAS (Fase 1)
CREATE TABLE public.competency_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aluno_id UUID REFERENCES public.profiles_supabase(id),
    competencia_id UUID REFERENCES public.competencias(id),
    taxa_acerto DECIMAL(5,4) DEFAULT 0,
    total_questoes INTEGER DEFAULT 0,
    nivel_proficiencia TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 10. SIMULADO ADAPTATIVO (Fase 2)
CREATE TABLE public.adaptive_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aluno_id UUID REFERENCES public.profiles_supabase(id),
    status TEXT DEFAULT 'active', -- active, completed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.student_proficiency (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aluno_id UUID REFERENCES public.profiles_supabase(id),
    competencia_id UUID REFERENCES public.competencias(id),
    score DECIMAL(5,2) DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.adaptive_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aluno_id UUID REFERENCES public.profiles_supabase(id),
    tipo TEXT, -- 'reforco', 'avancado'
    conteudo JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ÍNDICES ADICIONAIS
CREATE INDEX idx_perf_aluno ON public.competency_performance(aluno_id);
CREATE INDEX idx_adaptive_sessions_aluno ON public.adaptive_sessions(aluno_id);

-- POLÍTICAS BÁSICAS (Exemplos)
-- Alunos podem ver seu próprio perfil
CREATE POLICY "Alunos veem próprio perfil" ON public.profiles_supabase
    FOR SELECT USING (firebase_uid = auth.jwt() ->> 'sub');

-- Professores veem todos da turma deles (lógica simplificada para Admin Status)
CREATE POLICY "Professores veem perfis" ON public.profiles_supabase
    FOR SELECT USING (TRUE); -- Permitir leitura global para simplificar no início

-- Tentativas: Apenas o próprio aluno ou professor
CREATE POLICY "Acesso tentativas" ON public.tentativas_simulado
    FOR ALL USING (firebase_uid = auth.jwt() ->> 'sub' OR TRUE); -- Implementar lógica de professor real depois
