-- Adiciona coluna de bloqueio de plataforma por 1 mês para o plano Starter
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS starter_platform_locked_until timestamptz;

-- Função segura para definir a plataforma do plano Starter e bloquear por 1 mês
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

  -- Superadmin pode alterar qualquer plataforma livremente sem bloqueio
  IF v_profile.role = 'superadmin' OR lower(v_profile.email) = 'jsnevesme@gmail.com' THEN
    UPDATE public.profiles 
    SET allowed_platform = 'all', starter_platform_locked_until = NULL 
    WHERE id = v_user_id;
    RETURN jsonb_build_object('success', true, 'allowed_platform', 'all', 'is_locked', false);
  END IF;

  -- Se já estiver bloqueado e o bloqueio ainda não expirou
  IF v_profile.starter_platform_locked_until IS NOT NULL AND v_now < v_profile.starter_platform_locked_until THEN
    IF lower(v_profile.allowed_platform) != lower(p_platform) THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'platform_locked',
        'message', 'A plataforma ' || upper(v_profile.allowed_platform) || ' está bloqueada até ' || to_char(v_profile.starter_platform_locked_until, 'DD/MM/YYYY') || '. Você só poderá alterar quando o mês virar!',
        'locked_until', v_profile.starter_platform_locked_until,
        'allowed_platform', v_profile.allowed_platform
      );
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
