create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  github_id bigint unique,
  github_login text,
  github_token text,
  created_at timestamptz not null default now()
);

create table if not exists sessions (
  id text primary key,
  user_id uuid not null references users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists cvs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  name text not null,
  kind text not null check (kind in ('main', 'variant')),
  parent_id uuid references cvs (id) on delete set null,
  jd text,
  base_version_id uuid,
  created_at timestamptz not null default now()
);
alter table cvs drop column if exists updated_at;
create unique index if not exists cvs_one_main_per_user on cvs (user_id) where kind = 'main';

create table if not exists versions (
  id uuid primary key default gen_random_uuid(),
  cv_id uuid not null references cvs (id) on delete cascade,
  seq int not null,
  message text not null,
  file_name text,
  reply text not null,
  suggestions jsonb not null default '[]',
  site jsonb not null,
  starts_chat boolean not null default false,
  created_at timestamptz not null default now(),
  unique (cv_id, seq)
);
alter table versions add column if not exists starts_chat boolean not null default false;

create table if not exists publishes (
  id uuid primary key default gen_random_uuid(),
  cv_id uuid not null references cvs (id) on delete cascade,
  url text not null,
  repo text not null,
  site jsonb not null,
  created_at timestamptz not null default now()
);
alter table publishes add column if not exists version_id uuid references versions (id) on delete set null;
create index if not exists publishes_cv on publishes (cv_id, created_at desc);
