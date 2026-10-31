-- Tabela para histórico detalhado e métricas de ofertas disparadas
CREATE TABLE IF NOT EXISTS public.dispatches_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform text NOT NULL,
  product_title text NOT NULL,
  product_price numeric,
  product_url text,
  affiliate_link text,
  product_image text,
  target_group text,
  copy_text text,
  dispatched_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dispatches_user_date ON public.dispatches_log(user_id, dispatched_at DESC);
CREATE INDEX IF NOT EXISTS idx_dispatches_platform ON public.dispatches_log(user_id, platform);

ALTER TABLE public.dispatches_log ENABLE ROW LEVEL SECURITY;

-- Usuários só veem e criam seus próprios disparos
DROP POLICY IF EXISTS "Usuários gerenciam seus próprios logs de disparo" ON public.dispatches_log;
CREATE POLICY "Usuários gerenciam seus próprios logs de disparo"
  ON public.dispatches_log FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Superadmin pode ver todos os disparos do sistema para métricas globais
DROP POLICY IF EXISTS "Superadmin pode ver todos os disparos" ON public.dispatches_log;
CREATE POLICY "Superadmin pode ver todos os disparos"
  ON public.dispatches_log FOR SELECT
  USING (public.is_superadmin());
