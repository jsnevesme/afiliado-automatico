-- Remove políticas antigas que causavam recursão infinita
DROP POLICY IF EXISTS "Superadmin pode ver todos os perfis" ON public.profiles;
DROP POLICY IF EXISTS "Usuários podem ver seu próprio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Usuários podem atualizar configurações do seu perfil" ON public.profiles;
DROP POLICY IF EXISTS "Superadmin tem acesso total" ON public.profiles;

-- Função auxiliar segura sem recursão (lê do JWT e auth.users)
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS boolean AS $$
BEGIN
  RETURN (
    lower(COALESCE(auth.jwt() ->> 'email', '')) = 'jsnevesme@gmail.com'
    OR EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid() AND lower(email) = 'jsnevesme@gmail.com'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Política de leitura: usuário vê seu próprio perfil, ou superadmin vê todos
CREATE POLICY "Usuários podem ver seu próprio perfil"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_superadmin());

-- Política de atualização: usuário atualiza seu perfil, ou superadmin atualiza todos
CREATE POLICY "Usuários podem atualizar seu próprio perfil"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id OR public.is_superadmin())
  WITH CHECK (auth.uid() = id OR public.is_superadmin());

-- Superadmin pode inserir ou deletar
CREATE POLICY "Superadmin tem controle total"
  ON public.profiles FOR ALL
  USING (public.is_superadmin());
