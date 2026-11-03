-- Endurecimento de permissões ao nível da base de dados

-- 1) Impedir escalada de privilégios nos perfis, mesmo com chamadas diretas à API.
--    auth.uid() é nulo no SQL Editor / service role, o que permite o arranque do 1.º superadmin.
create or replace function guard_profile_role() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return new; end if;
  if new.role is distinct from old.role or new.active is distinct from old.active then
    if new.id = auth.uid() then
      raise exception 'Não pode alterar o seu próprio papel ou estado' using errcode = '42501';
    end if;
    if (new.role = 'superadmin' or old.role = 'superadmin') and current_role_name() <> 'superadmin' then
      raise exception 'Apenas um superadministrador gere superadministradores' using errcode = '42501';
    end if;
  end if;
  return new;
end $$;
create trigger t_guard_profile_role before update on profiles
  for each row execute function guard_profile_role();

-- 2) Editores podem editar textos do site (exceto chaves privadas).
drop policy if exists cms_settings on site_settings;
create policy cms_settings on site_settings for all
  using (has_role('admin') or (has_role('editor') and key not like 'private.%'))
  with check (has_role('admin') or (has_role('editor') and key not like 'private.%'));

-- 3) Equipa pode ler/gerir documentos de contratos (anexar contrato assinado) sem expor B.I. ao comercial.
create policy doc_contract_rw on documents for all
  using (has_role('comercial') and kind in ('contract_signed','proposal'))
  with check (has_role('comercial') and kind in ('contract_signed','proposal'));

-- 4) Perfis visíveis à equipa que precisa de ver o responsável de um lead.
create policy profiles_staff_read on profiles for select using (has_role('comercial','gestor_eventos','financeiro'));

-- 5) Eventos não confirmam inscrições com pagamento por validar: reforço na base de dados.
create or replace function enforce_paid_before_confirm() returns trigger
language plpgsql security definer set search_path = public as $$
declare paid numeric;
begin
  if new.status = 'confirmed' and old.status is distinct from 'confirmed' and new.amount is not null and auth.uid() is not null then
    select coalesce(sum(amount),0) into paid from payments
      where registration_id = new.id and status = 'confirmed' and currency = new.currency;
    if paid < new.amount then
      raise exception 'Inscrição sem pagamento confirmado que cubra o valor' using errcode = 'P0001';
    end if;
  end if;
  return new;
end $$;
create trigger t_reg_paid_before_confirm before update on registrations
  for each row execute function enforce_paid_before_confirm();
