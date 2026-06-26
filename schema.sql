-- Tosi Support Pro - Sprint 21
-- Banco real Supabase/Postgres. Rode este arquivo no Supabase > SQL Editor.

create extension if not exists "pgcrypto";

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text unique,
  role text not null default 'USUARIO',
  sector text,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists assets (
  id uuid primary key default gen_random_uuid(),
  asset_tag text unique not null,
  name text not null,
  type text not null default 'Ativo',
  owner_name text,
  location text,
  status text not null default 'Em uso',
  risk text not null default 'Baixo',
  warranty_until date,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists tickets (
  id uuid primary key default gen_random_uuid(),
  protocol text unique not null,
  title text not null,
  description text not null default '',
  sector text not null default 'TI',
  category text not null default 'Suporte Técnico',
  priority text not null default 'Média',
  status text not null default 'Aberto',
  type text not null default 'Incidente',
  impact text not null default 'Médio',
  asset_code text references assets(asset_tag) on update cascade on delete set null,
  requester_id uuid references profiles(id),
  requester_name text,
  requester_email text,
  responsible_id uuid references profiles(id),
  responsible_name text default 'Service Desk',
  location text,
  sla_due_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists ticket_comments (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid references tickets(id) on delete cascade,
  author_id uuid references profiles(id),
  author_name text,
  body text not null,
  internal boolean default false,
  created_at timestamptz default now()
);

create table if not exists ticket_attachments (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid references tickets(id) on delete cascade,
  file_name text not null,
  file_path text,
  mime_type text,
  size_bytes bigint default 0,
  created_at timestamptz default now()
);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  entity text not null,
  entity_id text,
  action text not null,
  actor_id uuid references profiles(id),
  actor_name text,
  payload jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists approvals (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  requester_name text,
  status text not null default 'Pendente',
  priority text default 'Média',
  payload jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists automations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text default 'Chamados',
  active boolean default true,
  trigger_config jsonb default '{}'::jsonb,
  actions_config jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists noc_snapshots (
  id text primary key default 'default',
  snapshot jsonb not null,
  updated_at timestamptz default now()
);

create index if not exists idx_tickets_protocol on tickets(protocol);
create index if not exists idx_tickets_status on tickets(status);
create index if not exists idx_tickets_sla on tickets(sla_due_at);
create index if not exists idx_tickets_asset on tickets(asset_code);
create index if not exists idx_assets_tag on assets(asset_tag);

-- Opcional para começar com usuário ADM real sem criar chamados/ativos falsos.
insert into profiles (name,email,role,sector)
values ('Administrador','admin@seudominio.com.br','ADM','TI')
on conflict (email) do update set name=excluded.name, role=excluded.role, sector=excluded.sector, updated_at=now();


-- Campos adicionais para Aprovações Enterprise reais
alter table approvals add column if not exists approval_code text;
alter table approvals add column if not exists type text;
alter table approvals add column if not exists department text;
alter table approvals add column if not exists approver_name text;
alter table approvals add column if not exists ticket_protocol text;
alter table approvals add column if not exists asset_tag text;
alter table approvals add column if not exists impact text;
alter table approvals add column if not exists reason text;
alter table approvals add column if not exists risk text;
alter table approvals add column if not exists sla_label text;
create index if not exists idx_approvals_status on approvals(status);
create index if not exists idx_approvals_created_at on approvals(created_at desc);

-- =========================================================
-- Sprint 23 - Segurança Real / Proxy First
-- =========================================================

alter table profiles add column if not exists password_hash text;
alter table profiles add column if not exists password_updated_at timestamptz;
alter table profiles add column if not exists last_login_at timestamptz;

-- O acesso demo foi removido. Para criar a primeira senha do ADM:
-- 1) Configure ADMIN_BOOTSTRAP_EMAIL e ADMIN_BOOTSTRAP_PASSWORD na Vercel.
-- 2) Faça login uma vez com esse e-mail/senha.
-- 3) O proxy gravará password_hash no perfil ADM.
-- 4) Remova ADMIN_BOOTSTRAP_PASSWORD das variáveis depois do primeiro login.

-- Segurança do banco: impedir acesso direto anônimo às tabelas.
alter table profiles enable row level security;
alter table assets enable row level security;
alter table tickets enable row level security;
alter table ticket_comments enable row level security;
alter table ticket_attachments enable row level security;
alter table audit_logs enable row level security;
alter table approvals enable row level security;
alter table automations enable row level security;
alter table noc_snapshots enable row level security;

-- Remove policies antigas com mesmo nome, se existirem.
drop policy if exists "deny_anon_profiles" on profiles;
drop policy if exists "deny_anon_assets" on assets;
drop policy if exists "deny_anon_tickets" on tickets;
drop policy if exists "deny_anon_ticket_comments" on ticket_comments;
drop policy if exists "deny_anon_ticket_attachments" on ticket_attachments;
drop policy if exists "deny_anon_audit_logs" on audit_logs;
drop policy if exists "deny_anon_approvals" on approvals;
drop policy if exists "deny_anon_automations" on automations;
drop policy if exists "deny_anon_noc_snapshots" on noc_snapshots;

-- Sem políticas permissivas para anon. O front-end não deve usar Supabase direto.
-- O acesso legítimo ocorre somente pelo proxy com SERVICE_ROLE_KEY protegida em variável de ambiente.

-- Índices úteis para autenticação e auditoria.
create index if not exists idx_profiles_email_active on profiles(email, active);
create index if not exists idx_audit_logs_entity_created on audit_logs(entity, created_at desc);
