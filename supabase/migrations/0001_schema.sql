-- Academia Tchamile — esquema principal
-- Executar no SQL Editor do Supabase ou com `supabase db push`.

create extension if not exists pgcrypto;

-- ───────────────────────── Tipos ─────────────────────────
create type app_role as enum (
  'superadmin','admin','comercial','financeiro','formador','gestor_eventos','editor'
);
create type publish_status as enum ('draft','published','archived');
create type course_status as enum ('draft','published','open','full','closed');
create type registration_status as enum (
  'draft','pending_documents','pending_payment','in_validation',
  'confirmed','rejected','cancelled','refunded'
);
create type payment_status as enum ('pending','confirmed','failed','refunded');
create type plan_kind as enum ('turma','personalizado','edicao_especial','mentoria','corporativo');
create type ticket_kind as enum ('normal','vip','corporativo');
create type contract_status as enum ('draft','proposal_sent','signed','approved','cancelled');
create type notification_status as enum ('queued','sent','failed','skipped');

-- ───────────────────────── Perfis e permissões ─────────────────────────
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text,
  avatar_url text,
  role app_role,                      -- null = utilizador sem acesso ao painel
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create or replace function current_role_name() returns app_role
language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid() and active
$$;

create or replace function has_role(variadic roles app_role[]) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(current_role_name() = 'superadmin' or current_role_name() = any(roles), false)
$$;

create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, full_name) values (new.id, coalesce(new.raw_user_meta_data->>'full_name',''));
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

-- ───────────────────────── Configurações globais ─────────────────────────
create table site_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- Estatísticas de prova social (só mostradas quando existirem e estiverem visíveis)
create table social_proof (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  value text not null,
  icon text,
  position int not null default 0,
  visible boolean not null default true
);

create table partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_path text,
  url text,
  authorized boolean not null default false,
  position int not null default 0
);

-- ───────────────────────── Páginas e secções (CMS / landing pages) ─────────────────────────
create table pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*(/[a-z0-9]+(-[a-z0-9]+)*)*$'),
  title text not null,
  kind text not null default 'institutional' check (kind in ('institutional','landing')),
  status publish_status not null default 'draft',
  seo_title text,
  seo_description text,
  og_image_path text,
  indexable boolean not null default true,
  redirect_after_submit text,
  course_id uuid,
  event_edition_id uuid,
  campaign text,
  published_at timestamptz,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table page_sections (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references pages(id) on delete cascade,
  type text not null check (type in (
    'hero','text_image','video','benefits','program','trainer','testimonials',
    'stats','pricing','faq','form','cta','footer')),
  position int not null default 0,
  visible boolean not null default true,
  content jsonb not null default '{}'::jsonb,  -- sanitizado no servidor (zod) antes de gravar
  updated_at timestamptz not null default now()
);
create index on page_sections(page_id, position);

create table page_revisions (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references pages(id) on delete cascade,
  snapshot jsonb not null,
  saved_by uuid references profiles(id),
  saved_at timestamptz not null default now()
);

create table page_views (
  id bigserial primary key,
  page_id uuid references pages(id) on delete cascade,
  viewed_at timestamptz not null default now()
);
create index on page_views(page_id, viewed_at);

-- ───────────────────────── Formadores / equipa ─────────────────────────
create table team_members (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete set null,
  name text not null,
  job_title text,
  bio text,
  photo_path text,
  specialization text,
  socials jsonb not null default '{}'::jsonb,
  is_trainer boolean not null default false,
  position int not null default 0,
  visible boolean not null default true
);

-- ───────────────────────── Formações ─────────────────────────
create table course_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique
);

create table courses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  category_id uuid references course_categories(id) on delete set null,
  short_description text,
  description text,
  objectives text[] not null default '{}',
  target_audience text,
  skills text[] not null default '{}',
  syllabus jsonb not null default '[]'::jsonb,
  duration_days int check (duration_days > 0),
  modality text check (modality in ('presencial','online','hibrido')),
  trainer_id uuid references team_members(id) on delete set null,
  prerequisites text,
  certification boolean not null default false,
  price numeric(12,2) check (price >= 0),
  currency char(3) not null default 'USD',
  quote_only boolean not null default false,
  image_path text,
  featured boolean not null default false,
  status course_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on courses(status, featured);

create table cohorts (  -- turmas
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  name text not null,
  starts_on date not null,
  ends_on date,
  schedule text,
  location text,
  capacity int not null check (capacity >= 0),
  status course_status not null default 'draft',
  created_at timestamptz not null default now(),
  check (ends_on is null or ends_on >= starts_on)
);
create index on cohorts(course_id, starts_on);

alter table pages
  add constraint pages_course_fk foreign key (course_id) references courses(id) on delete set null;

-- ───────────────────────── Planos de treinamento ─────────────────────────
create table training_plans (
  id uuid primary key default gen_random_uuid(),
  kind plan_kind not null unique,
  name text not null,
  tagline text,
  duration_label text,           -- "5 dias", "3 meses"
  duration_days int,
  price numeric(12,2) check (price >= 0),   -- null = não mostrar preço
  currency char(3) not null default 'USD',
  price_published boolean not null default false,
  cta_label text not null default 'Inscrever-me',
  cta_mode text not null default 'register' check (cta_mode in ('register','proposal','details')),
  conditions text,
  included_course_ids uuid[] not null default '{}',
  capacity int,
  mentor_id uuid references team_members(id) on delete set null,
  position int not null default 0,
  status publish_status not null default 'draft'
);

create table plan_benefits (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references training_plans(id) on delete cascade,
  text text not null,
  position int not null default 0
);
create index on plan_benefits(plan_id, position);

-- ───────────────────────── Eventos (Protagonista Summit) ─────────────────────────
create table events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text
);

create table event_editions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  year int not null,
  title text not null,
  headline text,
  subtitle text,
  starts_at timestamptz not null,       -- ÚNICA fonte da data do evento
  ends_at timestamptz,
  venue text,
  city text,
  about text,
  history text,
  video_url text,
  hero_image_path text,
  currency char(3) not null default 'AOA',
  registrations_open boolean not null default false,
  group_invite_url text,
  group_invite_active boolean not null default false,
  is_current boolean not null default false,
  status publish_status not null default 'draft',
  unique (event_id, year)
);
create unique index one_current_edition on event_editions(event_id) where is_current;

create table event_audiences (
  id uuid primary key default gen_random_uuid(),
  edition_id uuid not null references event_editions(id) on delete cascade,
  title text not null,
  description text,
  position int not null default 0
);

create table event_sessions (  -- programação
  id uuid primary key default gen_random_uuid(),
  edition_id uuid not null references event_editions(id) on delete cascade,
  starts_at timestamptz not null,
  duration_minutes int check (duration_minutes > 0),
  title text not null,
  speaker text,
  description text,
  activity_type text,
  stage text,
  position int not null default 0
);
create index on event_sessions(edition_id, position);

create table event_gallery (
  id uuid primary key default gen_random_uuid(),
  edition_id uuid not null references event_editions(id) on delete cascade,
  media_path text not null,
  caption text,
  is_video boolean not null default false,
  position int not null default 0
);

create table ticket_types (
  id uuid primary key default gen_random_uuid(),
  edition_id uuid not null references event_editions(id) on delete cascade,
  kind ticket_kind not null,
  name text not null,
  price numeric(12,2) check (price >= 0),
  promo_price numeric(12,2) check (promo_price >= 0),
  promo_ends_at timestamptz,
  price_published boolean not null default false,
  total_quantity int not null check (total_quantity >= 0),   -- inventário, NÃO preço
  benefits text[] not null default '{}',
  access_conditions text,
  includes_vip_tickets int not null default 0,                -- pacote corporativo: 10
  includes_public_exposure int not null default 0,
  includes_stage_pitch boolean not null default false,
  sales_start timestamptz,
  sales_end timestamptz,
  batch_label text,
  active boolean not null default true,
  unique (edition_id, kind, batch_label)
);

-- ───────────────────────── Empresas, leads, CRM ─────────────────────────
create table companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  nif text,
  contact_name text,
  contact_email text,
  contact_phone text,
  created_at timestamptz not null default now()
);

create table pipeline_stages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  position int not null,
  is_won boolean not null default false,
  is_lost boolean not null default false
);

create table leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  whatsapp text,
  email text,
  company_id uuid references companies(id) on delete set null,
  company_name text,
  source text,
  course_id uuid references courses(id) on delete set null,
  edition_id uuid references event_editions(id) on delete set null,
  plan_kind plan_kind,
  stage_id uuid references pipeline_stages(id) on delete set null,
  owner_id uuid references profiles(id) on delete set null,
  message text,
  extra jsonb not null default '{}'::jsonb,   -- ex.: nº participantes, objetivos (formulário corporativo)
  notes text,
  consent boolean not null default false,
  created_at timestamptz not null default now()
);
create index on leads(stage_id, created_at desc);

create table lead_interactions (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  author_id uuid references profiles(id),
  kind text not null default 'note',
  body text not null,
  created_at timestamptz not null default now()
);

-- ───────────────────────── Participantes e inscrições ─────────────────────────
create table participants (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text,
  whatsapp text,
  email text,
  id_number text,
  company_id uuid references companies(id) on delete set null,
  lead_id uuid references leads(id) on delete set null,
  consent_at timestamptz,
  created_at timestamptz not null default now()
);
create index on participants(lower(email));

create table registrations (
  id uuid primary key default gen_random_uuid(),
  code text not null unique default upper(substr(encode(gen_random_bytes(5),'hex'),1,8)),
  access_token uuid not null default gen_random_uuid(),   -- para o participante consultar o estado
  participant_id uuid not null references participants(id) on delete restrict,
  company_id uuid references companies(id) on delete set null,
  course_id uuid references courses(id) on delete set null,
  cohort_id uuid references cohorts(id) on delete set null,
  plan_id uuid references training_plans(id) on delete set null,
  ticket_type_id uuid references ticket_types(id) on delete set null,
  edition_id uuid references event_editions(id) on delete set null,
  status registration_status not null default 'pending_documents',
  amount numeric(12,2),
  currency char(3),
  internal_notes text,
  terms_accepted_at timestamptz,
  invite_sent_at timestamptz,
  invite_joined_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (course_id is not null or plan_id is not null or ticket_type_id is not null)
);
create index on registrations(status, created_at desc);
create index on registrations(ticket_type_id) where status in ('pending_documents','pending_payment','in_validation','confirmed');

create table registration_history (
  id bigserial primary key,
  registration_id uuid not null references registrations(id) on delete cascade,
  from_status registration_status,
  to_status registration_status not null,
  changed_by uuid references profiles(id),
  note text,
  changed_at timestamptz not null default now()
);

-- Documentos: guardam apenas o caminho num bucket PRIVADO
create table documents (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid references registrations(id) on delete cascade,
  contract_id uuid,
  kind text not null check (kind in ('bi','payment_proof','contract_signed','proposal','other')),
  storage_path text not null,
  original_name text,
  mime_type text,
  size_bytes int,
  uploaded_at timestamptz not null default now()
);

create table contracts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete restrict,
  registration_id uuid references registrations(id) on delete set null,
  ticket_type_id uuid references ticket_types(id),
  plan_id uuid references training_plans(id),
  status contract_status not null default 'draft',
  amount numeric(12,2),
  currency char(3),
  terms text,
  vip_tickets_granted int not null default 0,
  public_exposure_contracted boolean not null default false,
  stage_pitch_contracted boolean not null default false,
  pitch_notes text,
  created_at timestamptz not null default now()
);
alter table documents add constraint documents_contract_fk
  foreign key (contract_id) references contracts(id) on delete cascade;

create table attendance (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null references registrations(id) on delete cascade,
  cohort_id uuid references cohorts(id) on delete cascade,
  session_id uuid references event_sessions(id) on delete cascade,
  attended_on date not null default current_date,
  present boolean not null default true,
  unique (registration_id, cohort_id, attended_on)
);

create table certificates (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null references registrations(id) on delete cascade,
  code text not null unique default upper(substr(encode(gen_random_bytes(6),'hex'),1,10)),
  issued_at timestamptz not null default now()
);

-- ───────────────────────── Finanças ─────────────────────────
create table payments (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid references registrations(id) on delete set null,
  contract_id uuid references contracts(id) on delete set null,
  amount numeric(12,2) not null check (amount > 0),
  currency char(3) not null,
  status payment_status not null default 'pending',
  method text,
  reference text,
  paid_at timestamptz,
  confirmed_by uuid references profiles(id),
  confirmed_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  check (status <> 'confirmed' or (confirmed_by is not null and confirmed_at is not null))
);
create index on payments(status, created_at desc);

create table expenses (
  id uuid primary key default gen_random_uuid(),
  description text not null,
  amount numeric(12,2) not null check (amount > 0),
  currency char(3) not null,
  course_id uuid references courses(id) on delete set null,
  edition_id uuid references event_editions(id) on delete set null,
  spent_on date not null default current_date,
  created_by uuid references profiles(id)
);

create table exchange_rates (  -- câmbio só com taxa explícita registada
  id uuid primary key default gen_random_uuid(),
  from_currency char(3) not null,
  to_currency char(3) not null,
  rate numeric(18,6) not null check (rate > 0),
  valid_from date not null default current_date,
  created_by uuid references profiles(id)
);

-- ───────────────────────── Comunicação ─────────────────────────
create table testimonials (
  id uuid primary key default gen_random_uuid(),
  author text not null,
  role text,
  body text not null,
  photo_path text,
  rating int check (rating between 1 and 5),
  edition_id uuid references event_editions(id) on delete set null,
  status publish_status not null default 'draft',
  position int not null default 0
);

create table faqs (
  id uuid primary key default gen_random_uuid(),
  scope text not null default 'general',
  question text not null,
  answer text not null,
  position int not null default 0,
  status publish_status not null default 'published'
);

create table posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text,
  body text,
  cover_path text,
  status publish_status not null default 'draft',
  published_at timestamptz
);

create table banners (
  id uuid primary key default gen_random_uuid(),
  message text not null,
  link_url text,
  starts_at timestamptz,
  ends_at timestamptz,
  active boolean not null default true
);

create table message_templates (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,          -- ex.: registration_received, registration_confirmed
  channel text not null check (channel in ('email','whatsapp')),
  subject text,
  body text not null
);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  channel text not null check (channel in ('internal','email','whatsapp','webhook')),
  recipient text,
  payload jsonb not null default '{}'::jsonb,
  status notification_status not null default 'queued',
  provider_response text,
  error text,
  attempts int not null default 0,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);
create index on notifications(status, created_at desc);

create table webhooks (
  id uuid primary key default gen_random_uuid(),
  event_kind text not null,
  url text not null check (url like 'https://%'),
  secret text,
  active boolean not null default true
);

create table audit_log (
  id bigserial primary key,
  actor_id uuid,
  table_name text not null,
  row_id text,
  action text not null,
  old_data jsonb,
  new_data jsonb,
  at timestamptz not null default now()
);

-- ───────────────────────── Triggers ─────────────────────────
create or replace function touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create trigger t_pages_upd before update on pages for each row execute function touch_updated_at();
create trigger t_courses_upd before update on courses for each row execute function touch_updated_at();
create trigger t_regs_upd before update on registrations for each row execute function touch_updated_at();
create trigger t_sections_upd before update on page_sections for each row execute function touch_updated_at();

create or replace function log_registration_status() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into registration_history(registration_id, to_status, changed_by) values (new.id, new.status, auth.uid());
  elsif new.status is distinct from old.status then
    insert into registration_history(registration_id, from_status, to_status, changed_by)
      values (new.id, old.status, new.status, auth.uid());
  end if;
  return new;
end $$;
create trigger t_reg_history after insert or update on registrations
  for each row execute function log_registration_status();

create or replace function audit_row() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into audit_log(actor_id, table_name, row_id, action, old_data, new_data)
  values (auth.uid(), tg_table_name,
          coalesce((to_jsonb(new)->>'id'), (to_jsonb(old)->>'id')),
          tg_op,
          case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) end,
          case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) end);
  return coalesce(new, old);
end $$;

do $$
declare t text;
begin
  foreach t in array array['pages','courses','cohorts','training_plans','plan_benefits','event_editions',
    'ticket_types','registrations','payments','contracts','profiles','site_settings','expenses','webhooks']
  loop
    execute format('create trigger audit_%1$s after insert or update or delete on %1$I for each row execute function audit_row()', t);
  end loop;
end $$;

-- Impede confirmar pagamento sem validação e vender mais do que o inventário
create or replace function ticket_available(p_ticket uuid) returns int
language sql stable security definer set search_path = public as $$
  select t.total_quantity - count(r.*)::int
  from ticket_types t
  left join registrations r on r.ticket_type_id = t.id
    and r.status in ('pending_documents','pending_payment','in_validation','confirmed')
  where t.id = p_ticket group by t.total_quantity
$$;

create or replace function enforce_ticket_inventory() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.ticket_type_id is not null and ticket_available(new.ticket_type_id) <= 0 then
    raise exception 'Ingressos esgotados para esta categoria' using errcode = 'P0001';
  end if;
  return new;
end $$;
create trigger t_reg_inventory before insert on registrations
  for each row execute function enforce_ticket_inventory();

-- ───────────────────────── RLS ─────────────────────────
do $$
declare t text;
begin
  for t in select tablename from pg_tables where schemaname='public' loop
    execute format('alter table %I enable row level security', t);
  end loop;
end $$;

-- Leitura pública apenas de conteúdo publicado
create policy pub_pages on pages for select using (status='published' or has_role('admin','editor','gestor_eventos'));
create policy pub_sections on page_sections for select using (
  exists (select 1 from pages p where p.id=page_id and p.status='published') and visible
  or has_role('admin','editor','gestor_eventos'));
create policy pub_courses on courses for select using (status<>'draft' or has_role('admin','editor','formador'));
create policy pub_cats on course_categories for select using (true);
create policy pub_cohorts on cohorts for select using (status<>'draft' or has_role('admin','formador'));
create policy pub_plans on training_plans for select using (status='published' or has_role('admin','editor','comercial'));
create policy pub_benefits on plan_benefits for select using (true);
create policy pub_events on events for select using (true);
create policy pub_editions on event_editions for select using (status='published' or has_role('admin','gestor_eventos'));
create policy pub_audiences on event_audiences for select using (true);
create policy pub_sessions on event_sessions for select using (true);
create policy pub_gallery on event_gallery for select using (true);
create policy pub_tickets on ticket_types for select using (active or has_role('admin','gestor_eventos','financeiro'));
create policy pub_team on team_members for select using (visible or has_role('admin','editor'));
create policy pub_testimonials on testimonials for select using (status='published' or has_role('admin','editor'));
create policy pub_faqs on faqs for select using (status='published' or has_role('admin','editor'));
create policy pub_posts on posts for select using (status='published' or has_role('admin','editor'));
create policy pub_banners on banners for select using (active or has_role('admin','editor'));
create policy pub_proof on social_proof for select using (visible or has_role('admin','editor'));
create policy pub_partners on partners for select using (authorized or has_role('admin','editor'));
create policy pub_settings on site_settings for select using (key not like 'private.%' or has_role('admin'));

-- Escrita de conteúdo
create policy cms_write_pages on pages for all using (has_role('admin','editor')) with check (has_role('admin','editor'));
create policy cms_write_sections on page_sections for all using (has_role('admin','editor')) with check (has_role('admin','editor'));
create policy cms_rev on page_revisions for all using (has_role('admin','editor')) with check (has_role('admin','editor'));
create policy cms_courses on courses for all using (has_role('admin','editor')) with check (has_role('admin','editor'));
create policy cms_cats on course_categories for all using (has_role('admin','editor')) with check (has_role('admin','editor'));
create policy cms_cohorts on cohorts for all using (has_role('admin')) with check (has_role('admin'));
create policy cms_plans on training_plans for all using (has_role('admin','editor')) with check (has_role('admin','editor'));
create policy cms_benefits on plan_benefits for all using (has_role('admin','editor')) with check (has_role('admin','editor'));
create policy ev_events on events for all using (has_role('admin','gestor_eventos')) with check (has_role('admin','gestor_eventos'));
create policy ev_editions on event_editions for all using (has_role('admin','gestor_eventos')) with check (has_role('admin','gestor_eventos'));
create policy ev_aud on event_audiences for all using (has_role('admin','gestor_eventos','editor')) with check (has_role('admin','gestor_eventos','editor'));
create policy ev_sess on event_sessions for all using (has_role('admin','gestor_eventos')) with check (has_role('admin','gestor_eventos'));
create policy ev_gal on event_gallery for all using (has_role('admin','gestor_eventos','editor')) with check (has_role('admin','gestor_eventos','editor'));
create policy ev_tickets on ticket_types for all using (has_role('admin','gestor_eventos')) with check (has_role('admin','gestor_eventos'));
create policy cms_team on team_members for all using (has_role('admin','editor')) with check (has_role('admin','editor'));
create policy cms_test on testimonials for all using (has_role('admin','editor')) with check (has_role('admin','editor'));
create policy cms_faqs on faqs for all using (has_role('admin','editor')) with check (has_role('admin','editor'));
create policy cms_posts on posts for all using (has_role('admin','editor')) with check (has_role('admin','editor'));
create policy cms_banners on banners for all using (has_role('admin','editor')) with check (has_role('admin','editor'));
create policy cms_proof on social_proof for all using (has_role('admin','editor')) with check (has_role('admin','editor'));
create policy cms_partners on partners for all using (has_role('admin','editor')) with check (has_role('admin','editor'));
create policy cms_settings on site_settings for all using (has_role('admin')) with check (has_role('admin'));
create policy cms_templates on message_templates for all using (has_role('admin')) with check (has_role('admin'));
create policy cms_webhooks on webhooks for all using (has_role('admin')) with check (has_role('admin'));

-- Dados pessoais / negócio: nunca acessíveis ao público (inscrições entram via servidor com service role)
create policy profiles_self on profiles for select using (id = auth.uid() or has_role('admin'));
create policy profiles_admin on profiles for update using (has_role('admin')) with check (has_role('admin'));
create policy crm_leads on leads for all using (has_role('admin','comercial')) with check (has_role('admin','comercial'));
create policy crm_inter on lead_interactions for all using (has_role('admin','comercial')) with check (has_role('admin','comercial'));
create policy crm_stages on pipeline_stages for select using (has_role('admin','comercial'));
create policy crm_stages_w on pipeline_stages for all using (has_role('admin')) with check (has_role('admin'));
create policy crm_companies on companies for all using (has_role('admin','comercial','financeiro','gestor_eventos')) with check (has_role('admin','comercial','gestor_eventos'));
create policy part_rw on participants for all using (has_role('admin','comercial','financeiro','gestor_eventos')) with check (has_role('admin','comercial','gestor_eventos'));
create policy part_trainer on participants for select using (
  has_role('formador') and exists (
    select 1 from registrations r join cohorts c on c.id=r.cohort_id join courses k on k.id=c.course_id
    join team_members tm on tm.id=k.trainer_id
    where r.participant_id=participants.id and tm.profile_id=auth.uid()));
create policy reg_rw on registrations for all using (has_role('admin','comercial','financeiro','gestor_eventos')) with check (has_role('admin','comercial','financeiro','gestor_eventos'));
create policy reg_hist on registration_history for select using (has_role('admin','comercial','financeiro','gestor_eventos'));
create policy doc_rw on documents for all using (has_role('admin','gestor_eventos')) with check (has_role('admin','gestor_eventos'));
create policy ctr_rw on contracts for all using (has_role('admin','comercial','gestor_eventos')) with check (has_role('admin','comercial','gestor_eventos'));
create policy att_rw on attendance for all using (has_role('admin','formador','gestor_eventos')) with check (has_role('admin','formador','gestor_eventos'));
create policy cert_rw on certificates for all using (has_role('admin','formador')) with check (has_role('admin','formador'));
create policy pay_rw on payments for all using (has_role('admin','financeiro')) with check (has_role('admin','financeiro'));
create policy exp_rw on expenses for all using (has_role('admin','financeiro')) with check (has_role('admin','financeiro'));
create policy fx_rw on exchange_rates for all using (has_role('admin','financeiro')) with check (has_role('admin','financeiro'));
create policy notif_r on notifications for select using (has_role('admin','comercial','financeiro','gestor_eventos'));
create policy audit_r on audit_log for select using (has_role('admin'));
create policy views_ins on page_views for insert with check (true);
create policy views_r on page_views for select using (has_role('admin','editor','comercial'));

-- ───────────────────────── Storage ─────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('public-media','public-media', true, 10485760, array['image/jpeg','image/png','image/webp','image/svg+xml','video/mp4']),
  ('private-docs','private-docs', false, 5242880, array['application/pdf','image/jpeg','image/png'])
on conflict (id) do nothing;

create policy "public media read" on storage.objects for select using (bucket_id='public-media');
create policy "public media write" on storage.objects for all
  using (bucket_id='public-media' and has_role('admin','editor','gestor_eventos'))
  with check (bucket_id='public-media' and has_role('admin','editor','gestor_eventos'));
create policy "private docs staff read" on storage.objects for select
  using (bucket_id='private-docs' and has_role('admin','gestor_eventos','financeiro'));
-- uploads de participantes passam pelo servidor (service role); sem política pública no bucket privado.

-- ───────────────────────── Dados iniciais (estrutura, sem métricas inventadas) ─────────────────────────
insert into pipeline_stages(name, position, is_won, is_lost) values
  ('Novo contacto',1,false,false),('Contactado',2,false,false),('Interessado',3,false,false),
  ('Proposta enviada',4,false,false),('Inscrição iniciada',5,false,false),
  ('Inscrição confirmada',6,true,false),('Cliente ativo',7,true,false),('Perdido',8,false,true);

insert into training_plans(kind,name,tagline,duration_label,duration_days,price,currency,price_published,cta_label,cta_mode,conditions,position,status) values
  ('turma','Treinamento por Turma','Experiência estruturada em grupo.','5 dias',5,50,'USD',true,'Inscrever-me','register',null,1,'published'),
  ('personalizado','Treinamento Personalizado','Formação adaptada às suas necessidades.',null,null,null,'USD',false,'Solicitar proposta personalizada','proposal','Fora de Moçâmedes, as condições logísticas, deslocações, calendário e investimento são ajustáveis mediante negociação.',2,'published'),
  ('edicao_especial','Turma de Edição Especial','Mais cursos, mais exposição.','10 dias',10,null,'USD',false,'Ver detalhes','details',null,3,'published'),
  ('mentoria','Mentoria','Acompanhamento estruturado e individual.','3 meses',90,null,'USD',false,'Ver detalhes','details',null,4,'published'),
  ('corporativo','Treinamento Corporativo','Para empresas, equipas e instituições.',null,null,null,'USD',false,'Solicitar proposta corporativa','proposal',null,5,'published');

with p as (select id, kind from training_plans)
insert into plan_benefits(plan_id,text,position)
select p.id, b.text, b.pos from p join (values
  ('turma','Certificado de participação, conforme os critérios da formação',1),
  ('turma','Cartilha do comunicador',2),
  ('turma','Acompanhamento durante um mês',3),
  ('turma','Formação presencial em turma',4),
  ('personalizado','Todos os benefícios do treinamento por turma',1),
  ('personalizado','Formação adaptada às necessidades do participante',2),
  ('personalizado','Local de realização escolhido pelo cliente, mediante confirmação',3),
  ('personalizado','Possibilidade de ajustar datas e condições',4),
  ('edicao_especial','Todos os benefícios do treinamento por turma',1),
  ('edicao_especial','Material de apoio adicional',2),
  ('edicao_especial','Possibilidade de participar em mais de um curso incluído no programa',3),
  ('edicao_especial','Duração total de 10 dias',4),
  ('edicao_especial','Duas exposições públicas',5),
  ('mentoria','Todos os benefícios aplicáveis do treinamento por turma (exceto a duração de 5 dias)',1),
  ('mentoria','Duas sessões por semana',2),
  ('mentoria','Três exposições públicas',3),
  ('mentoria','Acompanhamento estruturado ao longo do programa',4),
  ('mentoria','Definição de objetivos individuais e acompanhamento da evolução',5),
  ('corporativo','Formação adaptada às necessidades da organização',1),
  ('corporativo','Realização nas instalações do cliente ou noutro local acordado',2),
  ('corporativo','Proposta comercial personalizada',3),
  ('corporativo','Gestão de participantes e acompanhamento de inscrições',4)
) as b(kind,text,pos) on b.kind::plan_kind = p.kind;

insert into events(slug,name,description) values
  ('protagonista-summit','Protagonista Summit',null);

-- Edição inicial: 15 de dezembro (editável em Admin > Protagonista Summit; ÚNICA fonte da data)
insert into event_editions(event_id,year,title,starts_at,city,currency,is_current,status,registrations_open)
select id, extract(year from now())::int, 'Protagonista Summit',
       make_timestamptz(extract(year from now())::int,12,15,9,0,0,'Africa/Luanda'),
       'Moçâmedes','AOA', true, 'draft', false
from events where slug='protagonista-summit';

insert into ticket_types(edition_id,kind,name,total_quantity,includes_vip_tickets,includes_public_exposure,includes_stage_pitch,benefits,batch_label)
select e.id, v.kind::ticket_kind, v.name, v.qty, v.vip, v.expo, v.pitch, v.benefits, 'Lote 1'
from event_editions e, (values
  ('normal','Ingresso Normal',15,0,0,false,array['Acesso ao evento']),
  ('vip','Ingresso VIP',25,0,0,false,array['Acesso exclusivo']),
  ('corporativo','Pacote Corporativo',1,10,1,true,array['Acesso corporativo','10 ingressos VIP','Uma exposição pública','Pitch de negócio no palco principal'])
) as v(kind,name,qty,vip,expo,pitch,benefits)
where e.is_current;
-- quantidade do pacote corporativo é um valor inicial; o administrador define o inventário real.

insert into site_settings(key,value) values
  ('academy', '{"name":"Academia Tchamile","tagline":"Formamos Pessoas que Constroem o Amanhã","city":"Moçâmedes"}'),
  ('hero', '{"eyebrow":"","title":"Formamos Pessoas que Constroem o Amanhã","subtitle":"Na Academia Tchamile acreditamos no poder da educação para transformar vidas, desenvolver talentos e criar líderes que fazem a diferença.","cta_primary":{"label":"Explorar formações","href":"/formacoes"},"cta_secondary":{"label":"Conhecer a Academia","href":"/sobre"}}'),
  ('contacts', '{"email":"","phone":"","whatsapp":"","address":"","socials":{}}');
