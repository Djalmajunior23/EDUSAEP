-- EDUAI CORE ULTRA - Supabase Schema
-- Habilita extensão para UUIDs se necessário
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Perfis Sincronizados (Híbrido)
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    firebase_uid text UNIQUE NOT NULL,
    email text,
    full_name text,
    role text CHECK (role IN ('STUDENT', 'TEACHER', 'ADMIN', 'COORDINATOR')),
    turma_id text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 2. Competências
CREATE TABLE IF NOT EXISTS public.competencias (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    nome text NOT NULL,
    descricao text,
    area_conhecimento text,
    created_at timestamptz DEFAULT now()
);

-- 3. Desempenho Analítico (Simulados)
CREATE TABLE IF NOT EXISTS public.respostas_analiticas (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    firebase_uid text NOT NULL, -- User ID
    turma_id text NOT NULL,
    competencia_id uuid REFERENCES public.competencias(id),
    foi_correto boolean NOT NULL,
    tempo_resposta integer, -- em segundos
    data_interacao timestamptz DEFAULT now()
);

-- 4. Logs de Insight do EduJarvis
CREATE TABLE IF NOT EXISTS public.jarvis_analytics (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    firebase_uid text NOT NULL,
    action_type text,
    intent_detected text,
    ai_confidence float,
    tokens_used integer,
    created_at timestamptz DEFAULT now()
);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plaged';
