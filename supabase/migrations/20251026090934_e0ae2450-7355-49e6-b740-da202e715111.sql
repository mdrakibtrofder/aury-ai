-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  handle TEXT UNIQUE NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  is_anonymous BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Create bots table for AI bot accounts
CREATE TABLE public.bots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  handle TEXT UNIQUE NOT NULL,
  persona_type TEXT NOT NULL, -- e.g., 'tech', 'health', 'business'
  avatar_url TEXT,
  active BOOLEAN DEFAULT true,
  created_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create posts table
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  bot_id UUID REFERENCES public.bots(id) ON DELETE SET NULL,
  is_bot BOOLEAN DEFAULT false,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  topics TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT either_author_or_bot CHECK (
    (author_id IS NOT NULL AND bot_id IS NULL) OR 
    (author_id IS NULL AND bot_id IS NOT NULL)
  )
);

-- Create comments table
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  bot_id UUID REFERENCES public.bots(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  is_bot BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT either_author_or_bot_comment CHECK (
    (author_id IS NOT NULL AND bot_id IS NULL) OR 
    (author_id IS NULL AND bot_id IS NOT NULL)
  )
);

-- Create reactions table (like, insightful, laugh)
CREATE TABLE public.reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  bot_id UUID REFERENCES public.bots(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('heart', 'insight', 'laugh')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (post_id, user_id, reaction_type),
  UNIQUE (post_id, bot_id, reaction_type),
  CONSTRAINT either_user_or_bot_reaction CHECK (
    (user_id IS NOT NULL AND bot_id IS NULL) OR 
    (user_id IS NULL AND bot_id IS NOT NULL)
  )
);

-- Create saves table
CREATE TABLE public.saves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (post_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saves ENABLE ROW LEVEL SECURITY;

-- Create security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS Policies for profiles
CREATE POLICY "Profiles are viewable by everyone" 
  ON public.profiles FOR SELECT 
  USING (true);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "User roles are viewable by everyone" 
  ON public.user_roles FOR SELECT 
  USING (true);

CREATE POLICY "Admins can manage user roles" 
  ON public.user_roles FOR ALL 
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for bots
CREATE POLICY "Bots are viewable by everyone" 
  ON public.bots FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can create bots" 
  ON public.bots FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

-- RLS Policies for posts
CREATE POLICY "Posts are viewable by everyone" 
  ON public.posts FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can create posts" 
  ON public.posts FOR INSERT 
  WITH CHECK (auth.uid() = author_id OR auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own posts" 
  ON public.posts FOR UPDATE 
  USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own posts" 
  ON public.posts FOR DELETE 
  USING (auth.uid() = author_id);

-- RLS Policies for comments
CREATE POLICY "Comments are viewable by everyone" 
  ON public.comments FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can create comments" 
  ON public.comments FOR INSERT 
  WITH CHECK (auth.uid() = author_id OR auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own comments" 
  ON public.comments FOR UPDATE 
  USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own comments" 
  ON public.comments FOR DELETE 
  USING (auth.uid() = author_id);

-- RLS Policies for reactions
CREATE POLICY "Reactions are viewable by everyone" 
  ON public.reactions FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can create reactions" 
  ON public.reactions FOR INSERT 
  WITH CHECK (auth.uid() = user_id OR auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own reactions" 
  ON public.reactions FOR DELETE 
  USING (auth.uid() = user_id);

-- RLS Policies for saves
CREATE POLICY "Users can view their own saves" 
  ON public.saves FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own saves" 
  ON public.saves FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saves" 
  ON public.saves FOR DELETE 
  USING (auth.uid() = user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  random_adjective TEXT;
  random_noun TEXT;
  generated_username TEXT;
  generated_handle TEXT;
BEGIN
  -- Arrays of random words for anonymous names
  random_adjective := (ARRAY['nimbus', 'cosmic', 'velvet', 'amber', 'azure', 'crimson', 'jade', 'silver', 'golden', 'misty'])[floor(random() * 10 + 1)];
  random_noun := (ARRAY['orchid', 'phoenix', 'nebula', 'echo', 'whisper', 'sage', 'storm', 'river', 'moon', 'star'])[floor(random() * 10 + 1)];
  
  generated_username := random_adjective || '_' || random_noun;
  generated_handle := generated_username || '_' || substr(md5(random()::text), 1, 4);
  
  INSERT INTO public.profiles (id, username, handle, is_anonymous)
  VALUES (NEW.id, generated_username, generated_handle, true);
  
  -- Assign default 'user' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for better query performance
CREATE INDEX idx_posts_author_id ON public.posts(author_id);
CREATE INDEX idx_posts_bot_id ON public.posts(bot_id);
CREATE INDEX idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX idx_comments_post_id ON public.comments(post_id);
CREATE INDEX idx_reactions_post_id ON public.reactions(post_id);
CREATE INDEX idx_saves_user_id ON public.saves(user_id);
CREATE INDEX idx_saves_post_id ON public.saves(post_id);