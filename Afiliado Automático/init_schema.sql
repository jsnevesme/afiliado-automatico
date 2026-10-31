-- Habilita extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Cria a tabela de perfis de usuário
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'superadmin')),
  plan text NOT NULL DEFAULT 'free_trial' CHECK (plan IN ('free_trial', 'starter', 'pro', 'ultra')),
  plan_period text NOT NULL DEFAULT 'trial' CHECK (plan_period IN ('trial', 'monthly', 'yearly', 'lifetime')),
  plan_status text NOT NULL DEFAULT 'active' CHECK (plan_status IN ('active', 'expired', 'canceled')),
  trial_ends_at timestamptz NOT NULL DEFAULT (now() + interval '3 days'),
  plan_expires_at timestamptz,
  allowed_platform text NOT NULL DEFAULT 'all' CHECK (allowed_platform IN ('all', 'mercadolivre', 'amazon', 'shopee')),
  daily_dispatches_count int NOT NULL DEFAULT 0,
  daily_dispatches_date date NOT NULL DEFAULT current_date,
  
  -- Configurações sincronizadas na nuvem
  ml_affiliate_tag text DEFAULT 'jonathansneves',
  amazon_affiliate_tag text DEFAULT '',
  shopee_affiliate_tag text DEFAULT '',
  groq_api_key text DEFAULT '',
  ml_copy_style text DEFAULT 'vantagens_gatilhos',
  ml_pinned_group text DEFAULT '',
  ml_whatsapp_groups jsonb DEFAULT '[]'::jsonb,
  favorite_offers jsonb DEFAULT '[]'::jsonb,
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Tabela de histórico de compras da Cakto
CREATE TABLE IF NOT EXISTS public.cakto_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id text,
  customer_name text,
  customer_email text NOT NULL,
  customer_phone text,
  customer_doc text,
  checkout_id text,
  checkout_url text,
  plan_identified text NOT NULL,
  plan_period text NOT NULL,
  amount numeric,
  payment_method text,
  status text NOT NULL DEFAULT 'paid',
  raw_payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Índices para consultas ultra rápidas
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(lower(email));
CREATE INDEX IF NOT EXISTS idx_cakto_customer_email ON public.cakto_purchases(lower(customer_email));

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON public.profiles;
CREATE TRIGGER trigger_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Função disparada na criação de um novo usuário em auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role text := 'user';
  v_plan text := 'free_trial';
  v_period text := 'trial';
  v_status text := 'active';
  v_trial_ends timestamptz := now() + interval '3 days';
  v_plan_expires timestamptz := NULL;
  v_platform text := 'all';
  v_purchase record;
BEGIN
  -- Regra absoluta do Superadmin para jsnevesme@gmail.com
  IF lower(NEW.email) = 'jsnevesme@gmail.com' THEN
    v_role := 'superadmin';
    v_plan := 'ultra';
    v_period := 'lifetime';
    v_status := 'active';
    v_platform := 'all';
  ELSE
    -- Verifica se já existe compra aprovada prévia na Cakto para este e-mail
    SELECT * INTO v_purchase
    FROM public.cakto_purchases
    WHERE lower(customer_email) = lower(NEW.email)
      AND status = 'paid'
    ORDER BY created_at DESC
    LIMIT 1;

    IF FOUND THEN
      v_plan := v_purchase.plan_identified;
      v_period := v_purchase.plan_period;
      v_status := 'active';
      IF v_period = 'yearly' THEN
        v_plan_expires := now() + interval '365 days';
      ELSE
        v_plan_expires := now() + interval '30 days';
      END IF;
      
      IF v_plan = 'starter' THEN
        v_platform := 'mercadolivre'; -- padrão starter, pode alternar para 1
      ELSE
        v_platform := 'all';
      END IF;
    END IF;
  END IF;

  INSERT INTO public.profiles (
    id,
    email,
    role,
    plan,
    plan_period,
    plan_status,
    trial_ends_at,
    plan_expires_at,
    allowed_platform
  ) VALUES (
    NEW.id,
    NEW.email,
    v_role,
    v_plan,
    v_period,
    v_status,
    v_trial_ends,
    v_plan_expires,
    v_platform
  ) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    role = CASE WHEN lower(EXCLUDED.email) = 'jsnevesme@gmail.com' THEN 'superadmin' ELSE profiles.role END,
    plan = CASE WHEN lower(EXCLUDED.email) = 'jsnevesme@gmail.com' THEN 'ultra' ELSE profiles.plan END,
    plan_status = CASE WHEN lower(EXCLUDED.email) = 'jsnevesme@gmail.com' THEN 'active' ELSE profiles.plan_status END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Função para registrar e validar disparos com respeito estrito aos limites do plano
CREATE OR REPLACE FUNCTION public.check_and_increment_dispatch(p_platform text)
RETURNS jsonb AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_profile public.profiles%ROWTYPE;
  v_today date := current_date;
  v_count int := 0;
  v_limit int := 20;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'unauthorized', 'message', 'Usuário não autenticado.');
  END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE id = v_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_found', 'message', 'Perfil não encontrado.');
  END IF;

  -- 1. Superadmin tem passe livre total perpétuo
  IF v_profile.role = 'superadmin' OR lower(v_profile.email) = 'jsnevesme@gmail.com' THEN
    UPDATE public.profiles
    SET daily_dispatches_count = daily_dispatches_count + 1,
        daily_dispatches_date = v_today
    WHERE id = v_user_id;

    RETURN jsonb_build_object(
      'success', true,
      'plan', 'ultra',
      'role', 'superadmin',
      'dispatchesToday', v_profile.daily_dispatches_count + 1,
      'limit', 999999,
      'remaining', 999999
    );
  END IF;

  -- 2. Checagem de expiração do plano
  IF v_profile.plan = 'free_trial' THEN
    IF now() > v_profile.trial_ends_at THEN
      UPDATE public.profiles SET plan_status = 'expired' WHERE id = v_user_id;
      RETURN jsonb_build_object(
        'success', false,
        'error', 'trial_expired',
        'message', 'Seu período de 3 dias de teste gratuito expirou. Assine um plano para continuar disparando!'
      );
    END IF;
  ELSE
    IF v_profile.plan_expires_at IS NOT NULL AND now() > v_profile.plan_expires_at THEN
      UPDATE public.profiles SET plan_status = 'expired' WHERE id = v_user_id;
      RETURN jsonb_build_object(
        'success', false,
        'error', 'plan_expired',
        'message', 'Sua assinatura expirou. Renove seu plano para continuar disparando!'
      );
    END IF;
  END IF;

  IF v_profile.plan_status != 'active' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'plan_inactive',
      'message', 'Seu plano está inativo ou suspenso.'
    );
  END IF;

  -- 3. Checagem de restrição de plataforma (Plano Starter dá direito a apenas 1 plataforma)
  IF v_profile.plan = 'starter' THEN
    IF v_profile.allowed_platform IS NOT NULL AND v_profile.allowed_platform != 'all' AND p_platform IS NOT NULL THEN
      IF lower(v_profile.allowed_platform) != lower(p_platform) THEN
        RETURN jsonb_build_object(
          'success', false,
          'error', 'platform_not_allowed',
          'message', 'O Plano Starter dá acesso a apenas 1 plataforma escolhida (' || upper(v_profile.allowed_platform) || '). Faça upgrade para o Plano Pro para usar todas!'
        );
      END IF;
    END IF;
  END IF;

  -- 4. Controle diário de disparos
  IF v_profile.daily_dispatches_date != v_today THEN
    v_count := 0;
  ELSE
    v_count := v_profile.daily_dispatches_count;
  END IF;

  -- Definição de limites diários
  IF v_profile.plan = 'starter' OR v_profile.plan = 'free_trial' THEN
    v_limit := 20;
  ELSIF v_profile.plan = 'pro' THEN
    v_limit := 50;
  ELSIF v_profile.plan = 'ultra' THEN
    v_limit := 999999; -- Ilimitado
  END IF;

  IF v_count >= v_limit AND v_limit < 999999 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'daily_limit_reached',
      'message', 'Limite diário atingido (' || v_limit || ' disparos). Aguarde a virada do dia ou faça upgrade de plano!',
      'dispatchesToday', v_count,
      'limit', v_limit,
      'remaining', 0
    );
  END IF;

  -- Incrementa o contador
  UPDATE public.profiles
  SET daily_dispatches_count = v_count + 1,
      daily_dispatches_date = v_today
  WHERE id = v_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'plan', v_profile.plan,
    'role', v_profile.role,
    'dispatchesToday', v_count + 1,
    'limit', v_limit,
    'remaining', CASE WHEN v_limit >= 999999 THEN 999999 ELSE (v_limit - (v_count + 1)) END
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Configuração de Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cakto_purchases ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para Profiles
DROP POLICY IF EXISTS "Usuários podem ver seu próprio perfil" ON public.profiles;
CREATE POLICY "Usuários podem ver seu próprio perfil"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Usuários podem atualizar configurações do seu perfil" ON public.profiles;
CREATE POLICY "Usuários podem atualizar configurações do seu perfil"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Superadmin pode visualizar todos os perfis
DROP POLICY IF EXISTS "Superadmin pode ver todos os perfis" ON public.profiles;
CREATE POLICY "Superadmin pode ver todos os perfis"
  ON public.profiles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND (p.role = 'superadmin' OR lower(p.email) = 'jsnevesme@gmail.com')
    )
  );
