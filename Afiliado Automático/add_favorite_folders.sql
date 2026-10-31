-- Adiciona coluna favorite_folders na tabela profiles para sincronização completa de pastas entre a extensão e o dashboard
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS favorite_folders jsonb DEFAULT '[]'::jsonb;
