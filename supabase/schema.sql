-- =====================================================================
--  PARKING - Esquema de base de datos para Supabase (PostgreSQL)
--  Cómo usarlo: Supabase → SQL Editor → New query → pega todo → Run
-- =====================================================================

-- Necesario para impedir reservas solapadas en la misma plaza
create extension if not exists btree_gist;

-- ---------------------------------------------------------------------
-- 1. PERFILES (un perfil por cada usuario de Supabase Auth)
-- ---------------------------------------------------------------------
create table if not exists public.perfiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  nombre     text not null default '',
  telefono   text,
  rol        text not null default 'cliente' check (rol in ('cliente', 'admin')),
  creado_en  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 2. PLAZAS
-- ---------------------------------------------------------------------
create table if not exists public.plazas (
  id           bigint generated always as identity primary key,
  codigo       text not null unique,                 -- p. ej. "A-01"
  planta       int  not null default 0,
  tipo         text not null default 'normal'
               check (tipo in ('normal', 'moto', 'electrico', 'discapacitados')),
  precio_hora  numeric(6, 2) not null check (precio_hora >= 0),
  activa       boolean not null default true,
  creado_en    timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 3. RESERVAS
-- ---------------------------------------------------------------------
create table if not exists public.reservas (
  id            bigint generated always as identity primary key,
  usuario_id    uuid   not null references public.perfiles (id) on delete cascade,
  plaza_id      bigint not null references public.plazas (id) on delete restrict,
  matricula     text   not null,
  inicio        timestamptz not null,
  fin           timestamptz not null,
  precio_total  numeric(8, 2) not null check (precio_total >= 0),
  estado        text not null default 'confirmada'
                check (estado in ('confirmada', 'cancelada', 'completada')),
  creado_en     timestamptz not null default now(),
  constraint reservas_fechas_validas check (fin > inicio),
  -- Una plaza no puede tener dos reservas confirmadas que se solapen
  constraint reservas_sin_solape exclude using gist (
    plaza_id with =,
    tstzrange(inicio, fin, '[)') with &&
  ) where (estado = 'confirmada')
);

create index if not exists reservas_usuario_idx on public.reservas (usuario_id);
create index if not exists reservas_fechas_idx  on public.reservas (inicio, fin);

-- ---------------------------------------------------------------------
-- 4. Crear el perfil automáticamente al registrarse un usuario
-- ---------------------------------------------------------------------
create or replace function public.crear_perfil()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.perfiles (id, nombre, telefono)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nombre', ''),
    new.raw_user_meta_data ->> 'telefono'
  );
  return new;
end;
$$;

drop trigger if exists al_crear_usuario on auth.users;
create trigger al_crear_usuario
  after insert on auth.users
  for each row execute function public.crear_perfil();

-- ---------------------------------------------------------------------
-- 5. Seguridad (Row Level Security)
--    El backend usa la service_role key y salta estas reglas;
--    estas políticas protegen el acceso directo desde el navegador.
-- ---------------------------------------------------------------------
create or replace function public.es_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.perfiles where id = auth.uid() and rol = 'admin');
$$;

alter table public.perfiles enable row level security;
alter table public.plazas   enable row level security;
alter table public.reservas enable row level security;

drop policy if exists "perfil propio o admin" on public.perfiles;
create policy "perfil propio o admin" on public.perfiles
  for select using (id = auth.uid() or public.es_admin());

drop policy if exists "plazas visibles" on public.plazas;
create policy "plazas visibles" on public.plazas
  for select using (activa or public.es_admin());

drop policy if exists "reservas propias o admin" on public.reservas;
create policy "reservas propias o admin" on public.reservas
  for select using (usuario_id = auth.uid() or public.es_admin());

-- ---------------------------------------------------------------------
-- 6. Datos de ejemplo
-- ---------------------------------------------------------------------
insert into public.plazas (codigo, planta, tipo, precio_hora) values
  ('A-01', 0, 'normal',          2.00),
  ('A-02', 0, 'normal',          2.00),
  ('A-03', 0, 'normal',          2.00),
  ('A-04', 0, 'discapacitados',  1.50),
  ('A-05', 0, 'electrico',       2.50),
  ('A-06', 0, 'moto',            1.00),
  ('B-01', -1, 'normal',         1.80),
  ('B-02', -1, 'normal',         1.80),
  ('B-03', -1, 'normal',         1.80),
  ('B-04', -1, 'electrico',      2.30),
  ('B-05', -1, 'moto',           0.90),
  ('B-06', -1, 'normal',         1.80)
on conflict (codigo) do nothing;

-- ---------------------------------------------------------------------
-- 7. Hacer administrador a un usuario (ejecutar después de registrarte)
-- ---------------------------------------------------------------------
-- update public.perfiles set rol = 'admin'
-- where id = (select id from auth.users where email = 'TU_EMAIL@ejemplo.com');
