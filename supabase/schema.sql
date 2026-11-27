create table if not exists public.areas (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique(owner_id, name)
);

create table if not exists public.people (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  email text not null default '',
  phone text not null default '',
  area_id uuid references public.areas(id) on delete set null,
  status text not null default 'Activo' check (status in ('Activo', 'Inactivo')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.equipment (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  asset_tag text not null,
  person_id uuid references public.people(id) on delete set null,
  device_type text not null default 'Escritorio'
    check (device_type in ('Laptop', 'Escritorio', 'Impresora', 'Monitor')),
  laptop_brand text not null default '',
  processor text not null default '',
  memory_gb integer check (memory_gb is null or memory_gb >= 0),
  graphics_card text not null default '',
  disk_capacity_gb integer check (disk_capacity_gb is null or disk_capacity_gb >= 0),
  disk_type text check (disk_type is null or disk_type in ('SSD', 'HDD')),
  operating_system text check (operating_system is null or operating_system in ('Windows 10', 'Windows 11')),
  maintenance_done boolean not null default false,
  last_maintenance_date date,
  status text not null default 'Operativo'
    check (status in ('Operativo', 'Mantenimiento', 'Baja')),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique(owner_id, asset_tag)
);

create table if not exists public.components (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category text not null,
  brand text not null default '',
  model text not null default '',
  serial_number text not null default '',
  equipment_id uuid references public.equipment(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.pending_notes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  content text not null default '',
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

alter table public.areas enable row level security;
alter table public.people enable row level security;
alter table public.equipment enable row level security;
alter table public.components enable row level security;
alter table public.pending_notes enable row level security;

create policy "areas_owner" on public.areas
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "people_owner" on public.people
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "equipment_owner" on public.equipment
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "components_owner" on public.components
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "pending_notes_owner" on public.pending_notes
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
