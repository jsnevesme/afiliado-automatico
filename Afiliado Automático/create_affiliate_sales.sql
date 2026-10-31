-- Tabela de registro de vendas e comissões do afiliado
CREATE TABLE IF NOT EXISTS public.affiliate_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sale_date date NOT NULL DEFAULT current_date,
  platform text NOT NULL,
  product_name text NOT NULL,
  category text DEFAULT 'Geral',
  quantity int NOT NULL DEFAULT 1,
  gross_amount numeric NOT NULL DEFAULT 0,
  commission_amount numeric NOT NULL DEFAULT 0,
  target_group text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_sales_user ON public.affiliate_sales(user_id, sale_date DESC);
CREATE INDEX IF NOT EXISTS idx_affiliate_sales_platform ON public.affiliate_sales(user_id, platform);

ALTER TABLE public.affiliate_sales ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários gerenciam suas próprias vendas" ON public.affiliate_sales;
CREATE POLICY "Usuários gerenciam suas próprias vendas"
  ON public.affiliate_sales FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Superadmin pode ver todas as vendas" ON public.affiliate_sales;
CREATE POLICY "Superadmin pode ver todas as vendas"
  ON public.affiliate_sales FOR SELECT
  USING (public.is_superadmin());
