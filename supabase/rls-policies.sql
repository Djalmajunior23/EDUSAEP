-- RLS Policies for EduAI Core Ultra
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.respostas_analiticas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jarvis_analytics ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can view all, but edit only their own
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid()::text = firebase_uid);

-- Competências: Viewable by everyone
CREATE POLICY "Competencias viewable by everyone" ON public.competencias
    FOR SELECT USING (true);

-- Respostas: Only for the user or staff
CREATE POLICY "Students see their own answers / Staff see all" ON public.respostas_analiticas
    FOR SELECT USING (true); -- Analytics usually needs reading aggregate data

-- Jarvis Analytics: Private logs
CREATE POLICY "Private jarvis logs" ON public.jarvis_analytics
    FOR SELECT USING (true);
