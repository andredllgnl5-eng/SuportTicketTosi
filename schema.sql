create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text unique not null,
  role text not null default 'USUARIO',
  sector text,
  created_at timestamptz default now()
);

create table if not exists tickets (
  id uuid primary key default gen_random_uuid(),
  protocol text unique not null,
  title text not null,
  description text not null,
  sector text not null,
  category text not null,
  priority text not null default 'Média',
  status text not null default 'Aberto',
  requester_id uuid references profiles(id),
  responsible_id uuid references profiles(id),
  sla_due_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  closed_at timestamptz
);

create table if not exists ticket_comments (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid references tickets(id) on delete cascade,
  author_id uuid references profiles(id),
  body text not null,
  internal boolean default false,
  created_at timestamptz default now()
);

create table if not exists ticket_attachments (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid references tickets(id) on delete cascade,
  file_name text not null,
  file_path text not null,
  mime_type text,
  size_bytes bigint,
  created_at timestamptz default now()
);


-- Sprint 19 - Central NOC Enterprise
-- Armazena o último snapshot operacional do NOC para Modo TV e dashboards em tempo real.
create table if not exists noc_snapshots (
  id text primary key default 'default',
  snapshot jsonb not null,
  updated_at timestamptz default now()
);
