-- 1. Garante colunas de bloqueio e defaults seguros (sem pré-definir 'all' para contas Starter/Trial)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS starter_platform_locked_until timestamptz;

ALTER TABLE public.profiles 
ALTER COLUMN allowed_platform SET DEFAULT '';

-- 2. Atualiza a conta do usuário prepconcurseiro@gmail.com para 'mercadolivre' já que ele havia travado no Mercado Livre
UPDATE public.profiles 
SET allowed_platform = 'mercadolivre' 
WHERE lower(email) = 'prepconcurseiro@gmail.com' AND (allowed_platform = 'all' OR allowed_platform IS NULL OR allowed_platform = '');

-- 3. Função para definir a plataforma e travar por 30 dias (funciona para qualquer conta)
CREATE OR REPLACE FUNCTION public.set_starter_platform(p_platform text)
RETURNS jsonb AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_profile public.profiles%ROWTYPE;
  v_now timestamptz := now();
  v_lock_until timestamptz;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'unauthorized', 'message', 'Usuário não autenticado.');
  END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE id = v_user_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_found', 'message', 'Perfil não encontrado.');
  END IF;

  -- Se já estiver bloqueado e o bloqueio ainda não expirou (não permite trocar de loja)
  IF (v_profile.role != 'superadmin' AND lower(v_profile.email) != 'jsnevesme@gmail.com') THEN
    IF v_profile.starter_platform_locked_until IS NOT NULL AND v_now < v_profile.starter_platform_locked_until THEN
      IF lower(v_profile.allowed_platform) != lower(p_platform) AND v_profile.allowed_platform != '' THEN
        RETURN jsonb_build_object(
          'success', false,
          'error', 'platform_locked',
          'message', 'A plataforma ' || upper(v_profile.allowed_platform) || ' está bloqueada até ' || to_char(v_profile.starter_platform_locked_until, 'DD/MM/YYYY') || '. Você só poderá alterar quando o mês virar!',
          'locked_until', v_profile.starter_platform_locked_until,
          'allowed_platform', v_profile.allowed_platform
        );
      END IF;
    END IF;
  END IF;

  -- Bloqueia a plataforma escolhida por 30 dias (1 mês)
  v_lock_until := v_now + interval '30 days';

  UPDATE public.profiles
  SET allowed_platform = lower(p_platform),
      starter_platform_locked_until = v_lock_until
  WHERE id = v_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'allowed_platform', lower(p_platform),
    'is_locked', true,
    'locked_until', v_lock_until,
    'message', 'Plataforma ' || upper(p_platform) || ' selecionada e bloqueada por 1 mês com sucesso!'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Função que APENAS valida autorização de disparo SEM incrementar o contador antes do WhatsApp enviar
CREATE OR REPLACE FUNCTION public.check_dispatch_allowed(p_platform text)
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

  -- Superadmin tem passe livre total perpétuo
  IF v_profile.role = 'superadmin' OR lower(v_profile.email) = 'jsnevesme@gmail.com' THEN
    RETURN jsonb_build_object(
      'success', true,
      'plan', 'ultra',
      'role', 'superadmin',
      'dispatchesToday', v_profile.daily_dispatches_count,
      'limit', 999999,
      'remaining', 999999
    );
  END IF;

  -- Checagem de expiração do plano
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

  -- Checagem de restrição e trava de plataforma (Starter ou Free Trial)
  IF (v_profile.plan = 'starter' OR v_profile.plan = 'free_trial' OR v_profile.plan IS NULL) THEN
    -- Se ainda não travou a plataforma
    IF v_profile.starter_platform_locked_until IS NULL OR v_profile.allowed_platform IS NULL OR v_profile.allowed_platform = '' THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'platform_lock_required',
        'message', 'Você precisa primeiro escolher e travar sua plataforma de disparo por 30 dias no painel de configurações antes de disparar!'
      );
    END IF;

    -- Se tentou disparar em loja diferente da travada
    IF v_profile.allowed_platform != 'all' AND lower(v_profile.allowed_platform) != lower(p_platform) THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'platform_not_allowed',
        'message', 'Sua conta está fixada exclusivamente para ' || upper(v_profile.allowed_platform) || '. Faça upgrade para o Plano Pro para disparar em todas as plataformas!'
      );
    END IF;
  END IF;

  -- Controle de cota diária
  IF v_profile.daily_dispatches_date != v_today THEN
    v_count := 0;
  ELSE
    v_count := v_profile.daily_dispatches_count;
  END IF;

  IF v_profile.plan = 'starter' OR v_profile.plan = 'free_trial' THEN
    v_limit := 20;
  ELSIF v_profile.plan = 'pro' THEN
    v_limit := 50;
  ELSIF v_profile.plan = 'ultra' THEN
    v_limit := 999999;
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

  RETURN jsonb_build_object(
    'success', true,
    'plan', v_profile.plan,
    'role', v_profile.role,
    'dispatchesToday', v_count,
    'limit', v_limit,
    'remaining', v_limit - v_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Função que efetivamente incrementa o contador SOMENTE após confirmação de envio no WhatsApp
CREATE OR REPLACE FUNCTION public.increment_dispatch(p_platform text)
RETURNS jsonb AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_profile public.profiles%ROWTYPE;
  v_today date := current_date;
  v_count int := 0;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'unauthorized', 'message', 'Usuário não autenticado.');
  END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE id = v_user_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_found', 'message', 'Perfil não encontrado.');
  END IF;

  IF v_profile.daily_dispatches_date != v_today THEN
    v_count := 0;
  ELSE
    v_count := v_profile.daily_dispatches_count;
  END IF;

  UPDATE public.profiles
  SET daily_dispatches_count = v_count + 1,
      daily_dispatches_date = v_today
  WHERE id = v_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'dispatchesToday', v_count + 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
