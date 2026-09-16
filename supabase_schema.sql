-- ==============================================================================
-- SCHEMA COMPLETO Y ACTUALIZADO DE SUPABASE PARA FICNATION
-- Plataforma de Fanfics, Novelas Ligeras, Taller de Escritura y Comunidad
-- ==============================================================================

-- ==============================================================================
-- 0. SCRIPT RÁPIDO DE MIGRACIÓN (SI YA TIENES TU BASE DE DATOS CREADA)
-- Puedes ejecutar este bloque completo en el SQL Editor de Supabase sin perder datos:
-- ==============================================================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS banner_url TEXT DEFAULT 'from-purple-950 via-indigo-950 to-[#080511]';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT 'Nuevo miembro en FicNation.';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS level_title TEXT DEFAULT 'Iniciado';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS next_level_xp INTEGER DEFAULT 500;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stories_count INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS lists_count INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS followers_count INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS badges JSONB DEFAULT '["Pionero"]'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS app_theme TEXT DEFAULT 'dark';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS coins INTEGER DEFAULT 100;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS earned_coins INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS equipped_avatar_frame TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS equipped_avatar_aura TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS equipped_title TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS equipped_badge TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS equipped_bookmark TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS equipped_comment_bubble TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS equipped_banner_frame TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS equipped_pet TEXT;

ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS age_rating TEXT DEFAULT 'TP';
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS content_warnings TEXT[] DEFAULT '{}';
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS story_type TEXT DEFAULT 'tradicional';
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS volumes JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS is_reader_insert BOOLEAN DEFAULT FALSE;

ALTER TABLE public.chapters ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;
ALTER TABLE public.chapters ADD COLUMN IF NOT EXISTS volume_id TEXT;
ALTER TABLE public.chapters ADD COLUMN IF NOT EXISTS volume_title TEXT;

ALTER TABLE public.story_votes ADD COLUMN IF NOT EXISTS chapter_number INTEGER;
ALTER TABLE public.story_views ADD COLUMN IF NOT EXISTS chapter_number INTEGER DEFAULT 1;

-- ==============================================================================
-- 1. TABLA DE PERFILES DE USUARIO (Vinculada a auth.users)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT DEFAULT 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  banner_url TEXT DEFAULT 'from-purple-950 via-indigo-950 to-[#080511]',
  bio TEXT DEFAULT 'Nuevo miembro en FicNation.',
  level INTEGER DEFAULT 0,
  level_title TEXT DEFAULT 'Iniciado',
  xp INTEGER DEFAULT 0,
  next_level_xp INTEGER DEFAULT 500,
  stories_count INTEGER DEFAULT 0,
  lists_count INTEGER DEFAULT 0,
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  badges JSONB DEFAULT '["Pionero"]'::jsonb,
  app_theme TEXT DEFAULT 'dark',
  coins INTEGER DEFAULT 100,
  earned_coins INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  is_banned BOOLEAN DEFAULT FALSE,
  role TEXT DEFAULT 'user', -- 'user', 'creator', 'admin'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 2. TRIGGER AUTOMÁTICO: CREAR PERFIL AL REGISTRARSE
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, name, avatar_url, banner_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'usuario_' || SUBSTRING(NEW.id::text, 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'name', 'Lector Nuevo'),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'),
    COALESCE(NEW.raw_user_meta_data->>'banner_url', 'from-purple-950 via-indigo-950 to-[#080511]')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 3. TABLA DE HISTORIAS / NOVELAS (CON SOPORTE T/N READER-INSERT Y VOLÚMENES)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  synopsis TEXT NOT NULL,
  genre TEXT NOT NULL DEFAULT 'Fantasía Oscura',
  tags TEXT[] DEFAULT '{}',
  cover_url TEXT,
  reads_count BIGINT DEFAULT 0,
  votes_count BIGINT DEFAULT 0,
  is_completed BOOLEAN DEFAULT FALSE,
  is_published BOOLEAN DEFAULT TRUE,
  age_rating TEXT DEFAULT 'TP', -- 'TP', '13+', '16+', '18+'
  content_warnings TEXT[] DEFAULT '{}',
  story_type TEXT DEFAULT 'tradicional', -- 'tradicional', 'interactiva'
  volumes JSONB DEFAULT '[]'::jsonb,
  is_reader_insert BOOLEAN DEFAULT FALSE, -- Modo Protagonista T/N
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 4. TABLA DE CAPÍTULOS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  chapter_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  word_count INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT TRUE,
  scheduled_at TIMESTAMPTZ,
  volume_id TEXT,
  volume_title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(story_id, chapter_number)
);

-- ==============================================================================
-- 5. TABLA DE BIBLIOTECA DEL USUARIO (Lecturas, guardados, progreso)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.library_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('leyendo', 'guardado', 'completado')),
  current_chapter INTEGER DEFAULT 1,
  progress_percent INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, story_id)
);

-- ==============================================================================
-- 6. TABLA DE COMENTARIOS DE CAPÍTULOS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  chapter_number INTEGER NOT NULL DEFAULT 1,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 7. TABLA DE RESEÑAS DE HISTORIAS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  content TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 8. TABLA DE ESTRELLAS / VOTOS (Persistencia por historia o por capítulo)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.story_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  chapter_number INTEGER, -- NULL para voto general, o número de capítulo
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(story_id, user_id, chapter_number)
);

-- ==============================================================================
-- 9. TABLA DE VISTAS (Conteo por cada capítulo leído por usuario o visitante)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.story_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  visitor_id TEXT,
  chapter_number INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices únicos por capítulo leído (garantiza no duplicar en F5 sobre el mismo capítulo)
CREATE UNIQUE INDEX IF NOT EXISTS idx_story_views_user_ch 
  ON public.story_views (story_id, user_id, chapter_number) 
  WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_story_views_visitor_ch 
  ON public.story_views (story_id, visitor_id, chapter_number) 
  WHERE visitor_id IS NOT NULL;

-- ==============================================================================
-- 10. TABLA DE MICRO-REACCIONES A PÁRRAFOS (🔥 💔 😱 🤣 💀 ❤️)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.paragraph_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  chapter_number INTEGER NOT NULL,
  paragraph_index INTEGER NOT NULL,
  emoji TEXT NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  visitor_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_p_reactions_chapter 
  ON public.paragraph_reactions (story_id, chapter_number, paragraph_index);

-- ==============================================================================
-- 11. TABLA DE NOTIFICACIONES EN TIEMPO REAL
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  actor_name TEXT NOT NULL,
  actor_avatar TEXT,
  type TEXT NOT NULL, -- 'vote', 'comment', 'review', 'follow', 'gift', 'admin_message'
  story_id UUID REFERENCES public.stories(id) ON DELETE CASCADE,
  story_title TEXT,
  chapter_number INTEGER,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 12. TABLA DE SUGERENCIAS Y FEEDBACK DE LA COMUNIDAD
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_name TEXT,
  user_email TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 13. TABLA DE DONACIONES Y REGALOS VIRTUALES (TIPPING SYSTEM)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.tips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  story_id UUID REFERENCES public.stories(id) ON DELETE SET NULL,
  amount_coins INTEGER NOT NULL CHECK (amount_coins > 0),
  gift_name TEXT NOT NULL,
  gift_icon TEXT DEFAULT '🎁',
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 14. TABLA DE SOLICITUDES DE RETIRO (CASHOUT REQUESTS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.cashout_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount_usd NUMERIC(10, 2) NOT NULL CHECK (amount_usd >= 5.00),
  coins_deducted INTEGER NOT NULL,
  payment_method TEXT NOT NULL, -- 'paypal', 'bank_transfer', 'crypto'
  payment_details JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'paid', 'rejected'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- ==============================================================================
-- 15. TABLA DE SEGUIDORES / SOCIAL FOLLOWS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_follower ON public.follows (follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON public.follows (following_id);

-- Trigger para mantener actualizados los contadores followers_count y following_count
CREATE OR REPLACE FUNCTION public.handle_follow_stats_update()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles
    SET followers_count = (SELECT COUNT(*) FROM public.follows WHERE following_id = NEW.following_id)
    WHERE id = NEW.following_id;

    UPDATE public.profiles
    SET following_count = (SELECT COUNT(*) FROM public.follows WHERE follower_id = NEW.follower_id)
    WHERE id = NEW.follower_id;

    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.profiles
    SET followers_count = (SELECT COUNT(*) FROM public.follows WHERE following_id = OLD.following_id)
    WHERE id = OLD.following_id;

    UPDATE public.profiles
    SET following_count = (SELECT COUNT(*) FROM public.follows WHERE follower_id = OLD.follower_id)
    WHERE id = OLD.follower_id;

    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_follow_changed ON public.follows;
CREATE TRIGGER on_follow_changed
  AFTER INSERT OR DELETE ON public.follows
  FOR EACH ROW EXECUTE FUNCTION public.handle_follow_stats_update();

-- ==============================================================================
-- 16. TABLAS DE MODERACIÓN Y ANUNCIOS DE ADMINISTRACIÓN (/admin)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.banned_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  reason TEXT NOT NULL,
  banned_by TEXT DEFAULT 'F4',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS public.system_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info', -- 'info', 'warning', 'event'
  is_active BOOLEAN DEFAULT TRUE,
  created_by TEXT DEFAULT 'F4',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 17. HABILITAR ROW LEVEL SECURITY (RLS) EN TODAS LAS TABLAS
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paragraph_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cashout_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banned_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_announcements ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 18. POLÍTICAS RLS IDEMPOTENTES
-- ==============================================================================

-- PERFILES
DROP POLICY IF EXISTS "Perfiles visibles públicamente" ON public.profiles;
CREATE POLICY "Perfiles visibles públicamente" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Usuarios pueden insertar su propio perfil" ON public.profiles;
CREATE POLICY "Usuarios pueden insertar su propio perfil" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Usuarios pueden actualizar su propio perfil" ON public.profiles;
CREATE POLICY "Usuarios pueden actualizar su propio perfil" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- HISTORIAS
DROP POLICY IF EXISTS "Historias públicas visibles para todos" ON public.stories;
CREATE POLICY "Historias públicas visibles para todos" ON public.stories FOR SELECT USING (is_published = true OR auth.uid() = author_id);

DROP POLICY IF EXISTS "Autores pueden crear historias" ON public.stories;
CREATE POLICY "Autores pueden crear historias" ON public.stories FOR INSERT WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Autores pueden editar sus historias" ON public.stories;
CREATE POLICY "Autores pueden editar sus historias" ON public.stories FOR UPDATE USING (auth.uid() = author_id);

DROP POLICY IF EXISTS "Autores pueden borrar sus historias" ON public.stories;
CREATE POLICY "Autores pueden borrar sus historias" ON public.stories FOR DELETE USING (auth.uid() = author_id);

-- CAPÍTULOS
DROP POLICY IF EXISTS "Capítulos visibles para todos o autores" ON public.chapters;
CREATE POLICY "Capítulos visibles para todos o autores" ON public.chapters FOR SELECT USING (
  is_published = true OR 
  EXISTS (SELECT 1 FROM public.stories WHERE id = story_id AND author_id = auth.uid())
);

DROP POLICY IF EXISTS "Autores pueden agregar capítulos" ON public.chapters;
CREATE POLICY "Autores pueden agregar capítulos" ON public.chapters FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.stories WHERE id = story_id AND author_id = auth.uid())
);

DROP POLICY IF EXISTS "Autores pueden editar capítulos" ON public.chapters;
CREATE POLICY "Autores pueden editar capítulos" ON public.chapters FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.stories WHERE id = story_id AND author_id = auth.uid())
);

DROP POLICY IF EXISTS "Autores pueden borrar capítulos" ON public.chapters;
CREATE POLICY "Autores pueden borrar capítulos" ON public.chapters FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.stories WHERE id = story_id AND author_id = auth.uid())
);

-- BIBLIOTECA
DROP POLICY IF EXISTS "Usuarios gestionan su propia biblioteca" ON public.library_entries;
CREATE POLICY "Usuarios gestionan su propia biblioteca" ON public.library_entries FOR ALL USING (auth.uid() = user_id);

-- COMENTARIOS
DROP POLICY IF EXISTS "Comentarios visibles para todos" ON public.comments;
CREATE POLICY "Comentarios visibles para todos" ON public.comments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Usuarios autenticados pueden comentar" ON public.comments;
CREATE POLICY "Usuarios autenticados pueden comentar" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuarios pueden editar sus comentarios" ON public.comments;
CREATE POLICY "Usuarios pueden editar sus comentarios" ON public.comments FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuarios pueden borrar sus comentarios" ON public.comments;
CREATE POLICY "Usuarios pueden borrar sus comentarios" ON public.comments FOR DELETE USING (auth.uid() = user_id);

-- RESEÑAS
DROP POLICY IF EXISTS "Reseñas visibles para todos" ON public.reviews;
CREATE POLICY "Reseñas visibles para todos" ON public.reviews FOR SELECT USING (true);

DROP POLICY IF EXISTS "Usuarios autenticados pueden reseñar" ON public.reviews;
CREATE POLICY "Usuarios autenticados pueden reseñar" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuarios pueden editar sus reseñas" ON public.reviews;
CREATE POLICY "Usuarios pueden editar sus reseñas" ON public.reviews FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuarios pueden borrar sus reseñas" ON public.reviews;
CREATE POLICY "Usuarios pueden borrar sus reseñas" ON public.reviews FOR DELETE USING (auth.uid() = user_id);

-- STORY VOTES (ESTRELLAS)
DROP POLICY IF EXISTS "Votos visibles para todos" ON public.story_votes;
CREATE POLICY "Votos visibles para todos" ON public.story_votes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Usuarios autenticados pueden votar" ON public.story_votes;
CREATE POLICY "Usuarios autenticados pueden votar" ON public.story_votes FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuarios pueden retirar su voto" ON public.story_votes;
CREATE POLICY "Usuarios pueden retirar su voto" ON public.story_votes FOR DELETE USING (auth.uid() = user_id);

-- STORY VIEWS (VISTAS POR CAPÍTULO)
DROP POLICY IF EXISTS "Vistas visibles para todos" ON public.story_views;
CREATE POLICY "Vistas visibles para todos" ON public.story_views FOR SELECT USING (true);

DROP POLICY IF EXISTS "Cualquiera puede registrar una vista única" ON public.story_views;
CREATE POLICY "Cualquiera puede registrar una vista única" ON public.story_views FOR INSERT WITH CHECK (true);

-- MICRO-REACCIONES DE PÁRRAFO
DROP POLICY IF EXISTS "Reacciones visibles para todos" ON public.paragraph_reactions;
CREATE POLICY "Reacciones visibles para todos" ON public.paragraph_reactions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Cualquiera puede reaccionar a un párrafo" ON public.paragraph_reactions;
CREATE POLICY "Cualquiera puede reaccionar a un párrafo" ON public.paragraph_reactions FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Usuarios pueden retirar su reacción" ON public.paragraph_reactions;
CREATE POLICY "Usuarios pueden retirar su reacción" ON public.paragraph_reactions FOR DELETE USING (
  (user_id IS NOT NULL AND auth.uid() = user_id) OR true
);

-- NOTIFICACIONES
DROP POLICY IF EXISTS "Usuarios ven sus propias notificaciones" ON public.notifications;
CREATE POLICY "Usuarios ven sus propias notificaciones" ON public.notifications FOR SELECT USING (auth.uid() = recipient_id);

DROP POLICY IF EXISTS "Usuarios pueden crear notificaciones para otros" ON public.notifications;
CREATE POLICY "Usuarios pueden crear notificaciones para otros" ON public.notifications FOR INSERT WITH CHECK (auth.uid() = actor_id);

DROP POLICY IF EXISTS "Usuarios pueden marcar sus notificaciones como leídas" ON public.notifications;
CREATE POLICY "Usuarios pueden marcar sus notificaciones como leídas" ON public.notifications FOR UPDATE USING (auth.uid() = recipient_id);

DROP POLICY IF EXISTS "Usuarios pueden borrar sus notificaciones" ON public.notifications;
CREATE POLICY "Usuarios pueden borrar sus notificaciones" ON public.notifications FOR DELETE USING (auth.uid() = recipient_id);

-- SUGERENCIAS
DROP POLICY IF EXISTS "Cualquiera puede enviar sugerencias" ON public.suggestions;
CREATE POLICY "Cualquiera puede enviar sugerencias" ON public.suggestions FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Usuarios ven sus propias sugerencias" ON public.suggestions;
CREATE POLICY "Usuarios ven sus propias sugerencias" ON public.suggestions FOR SELECT USING (auth.uid() = user_id);

-- TIPS (DONACIONES)
DROP POLICY IF EXISTS "Tips visibles para el emisor y el receptor" ON public.tips;
CREATE POLICY "Tips visibles para el emisor y el receptor" ON public.tips FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

DROP POLICY IF EXISTS "Usuarios autenticados pueden enviar tips" ON public.tips;
CREATE POLICY "Usuarios autenticados pueden enviar tips" ON public.tips FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- CASHOUT REQUESTS (RETIROS)
DROP POLICY IF EXISTS "Usuarios ven sus propias solicitudes de retiro" ON public.cashout_requests;
CREATE POLICY "Usuarios ven sus propias solicitudes de retiro" ON public.cashout_requests FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuarios pueden solicitar retiros" ON public.cashout_requests;
CREATE POLICY "Usuarios pueden solicitar retiros" ON public.cashout_requests FOR INSERT WITH CHECK (auth.uid() = user_id);

-- FOLLOWS
DROP POLICY IF EXISTS "Follows visibles públicamente" ON public.follows;
CREATE POLICY "Follows visibles públicamente" ON public.follows FOR SELECT USING (true);

DROP POLICY IF EXISTS "Usuarios autenticados pueden seguir" ON public.follows;
CREATE POLICY "Usuarios autenticados pueden seguir" ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);

DROP POLICY IF EXISTS "Usuarios pueden dejar de seguir" ON public.follows;
CREATE POLICY "Usuarios pueden dejar de seguir" ON public.follows FOR DELETE USING (auth.uid() = follower_id);

-- BANNED USERS & ANNOUNCEMENTS
DROP POLICY IF EXISTS "Usuarios baneados visibles para el sistema" ON public.banned_users;
CREATE POLICY "Usuarios baneados visibles para el sistema" ON public.banned_users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anuncios visibles públicamente" ON public.system_announcements;
CREATE POLICY "Anuncios visibles públicamente" ON public.system_announcements FOR SELECT USING (is_active = true);

-- USER INVENTORY & COSMETICS
CREATE TABLE IF NOT EXISTS public.user_inventory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  type TEXT NOT NULL, -- 'frame', 'aura', 'title', 'badge', 'bookmark', 'bubble', 'banner_frame', 'pet_egg', 'pet', 'chest', 'consumable'
  name TEXT NOT NULL,
  rarity TEXT NOT NULL, -- 'comun', 'raro', 'epico', 'legendario', 'mitico'
  icon TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  is_equipped BOOLEAN DEFAULT FALSE,
  egg_data JSONB DEFAULT NULL,
  loot_pool TEXT[] DEFAULT NULL,
  acquired_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_inventory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Cualquiera puede consultar el inventario para ver equipamiento de otros usuarios" ON public.user_inventory;
CREATE POLICY "Cualquiera puede consultar el inventario para ver equipamiento de otros usuarios" ON public.user_inventory FOR SELECT USING (true);

DROP POLICY IF EXISTS "Usuarios pueden modificar su propio inventario" ON public.user_inventory;
CREATE POLICY "Usuarios pueden modificar su propio inventario" ON public.user_inventory FOR ALL USING (auth.uid() = user_id);

-- ==============================================================================
-- 20. TRIGGERS Y FUNCIONES RPC PARA ACTUALIZACIÓN ATÓMICA DE VOTOS, VISTAS Y PROPINAS
-- ==============================================================================

-- 1. Trigger para mantener sincronizado votes_count en public.stories
CREATE OR REPLACE FUNCTION public.handle_story_vote_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.stories
    SET votes_count = COALESCE(votes_count, 0) + 1
    WHERE id = NEW.story_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.stories
    SET votes_count = GREATEST(0, COALESCE(votes_count, 0) - 1)
    WHERE id = OLD.story_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_story_vote_change ON public.story_votes;
CREATE TRIGGER tr_story_vote_change
AFTER INSERT OR DELETE ON public.story_votes
FOR EACH ROW EXECUTE FUNCTION public.handle_story_vote_change();

-- 2. Trigger para mantener sincronizado reads_count en public.stories
CREATE OR REPLACE FUNCTION public.handle_story_view_increment()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.stories
  SET reads_count = COALESCE(reads_count, 0) + 1
  WHERE id = NEW.story_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_story_view_increment ON public.story_views;
CREATE TRIGGER tr_story_view_increment
AFTER INSERT ON public.story_views
FOR EACH ROW EXECUTE FUNCTION public.handle_story_view_increment();

-- 3. Trigger para acreditar earned_coins al autor receptor en public.tips
CREATE OR REPLACE FUNCTION public.handle_tip_earned_coins()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET earned_coins = COALESCE(earned_coins, 0) + NEW.amount
  WHERE id = NEW.recipient_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_tip_earned_coins ON public.tips;
CREATE TRIGGER tr_tip_earned_coins
AFTER INSERT ON public.tips
FOR EACH ROW EXECUTE FUNCTION public.handle_tip_earned_coins();

-- 4. Funciones RPC ejecutables desde el cliente (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.increment_story_reads(target_story_id UUID)
RETURNS BIGINT AS $$
DECLARE
  new_count BIGINT;
BEGIN
  UPDATE public.stories
  SET reads_count = COALESCE(reads_count, 0) + 1
  WHERE id = target_story_id
  RETURNING reads_count INTO new_count;
  RETURN new_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.toggle_story_vote(target_story_id UUID, user_voted BOOLEAN)
RETURNS BIGINT AS $$
DECLARE
  new_count BIGINT;
BEGIN
  IF user_voted THEN
    UPDATE public.stories
    SET votes_count = COALESCE(votes_count, 0) + 1
    WHERE id = target_story_id
    RETURNING votes_count INTO new_count;
  ELSE
    UPDATE public.stories
    SET votes_count = GREATEST(0, COALESCE(votes_count, 0) - 1)
    WHERE id = target_story_id
    RETURNING votes_count INTO new_count;
  END IF;
  RETURN new_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


