-- =====================================================================
--  PARKING - Parte 3: vehículos guardados, mapa del parking,
--  estadísticas para el administrador y email en los perfiles.
--  Ejecutar DESPUÉS de 02_funciones_y_permisos.sql (se puede repetir).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Email en perfiles (para que el administrador vea a los usuarios)
-- ---------------------------------------------------------------------
alter table public.perfiles add column if not exists email text;

update public.perfiles p
set email = u.email
from auth.users u
where u.id = p.id and p.email is distinct from u.email;

create or replace function public.crear_perfil()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.perfiles (id, nombre, telefono, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nombre', ''),
    new.raw_user_meta_data ->> 'telefono',
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- 2. Vehículos guardados de cada usuario
-- ---------------------------------------------------------------------
create table if not exists public.vehiculos (
  id          bigint generated always as identity primary key,
  usuario_id  uuid not null default auth.uid() references public.perfiles (id) on delete cascade,
  matricula   text not null check (matricula ~ '^[A-Z0-9-]{4,10}$'),
  alias       text check (char_length(alias) <= 40),
  creado_en   timestamptz not null default now(),
  unique (usuario_id, matricula)
);

alter table public.vehiculos enable row level security;

drop policy if exists "vehiculos propios" on public.vehiculos;
create policy "vehiculos propios" on public.vehiculos
  for all using (usuario_id = auth.uid())
  with check (usuario_id = auth.uid());

-- ---------------------------------------------------------------------
-- 3. Mapa: todas las plazas activas con su estado en un rango de fechas
--    (no revela de quién son las reservas)
-- ---------------------------------------------------------------------
create or replace function public.estado_plazas(p_inicio timestamptz, p_fin timestamptz)
returns table (id bigint, codigo text, planta int, tipo text, precio_hora numeric, precio_estimado numeric, libre boolean)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.codigo, p.planta, p.tipo, p.precio_hora,
         public.calcular_precio(p.precio_hora, p_inicio, p_fin),
         not exists (
           select 1 from reservas r
           where r.plaza_id = p.id
             and r.estado = 'confirmada'
             and r.inicio < p_fin
             and r.fin > p_inicio
         )
  from plazas p
  where p.activa
  order by p.planta desc, p.codigo;
$$;

-- ---------------------------------------------------------------------
-- 4. Estadísticas (solo administradores)
-- ---------------------------------------------------------------------
create or replace function public.admin_ingresos_diarios(p_dias int default 14)
returns table (dia date, ingresos numeric, reservas bigint)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.es_admin() then
    raise exception 'Solo para administradores';
  end if;
  return query
    select d::date,
           coalesce(sum(r.precio_total), 0),
           count(r.id)
    from generate_series(current_date - (greatest(p_dias, 1) - 1), current_date, interval '1 day') d
    left join reservas r
      on r.creado_en::date = d::date and r.estado <> 'cancelada'
    group by d
    order by d;
end;
$$;

create or replace function public.admin_ocupacion_plantas()
returns table (planta int, total bigint, ocupadas bigint)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.es_admin() then
    raise exception 'Solo para administradores';
  end if;
  return query
    select p.planta,
           count(*),
           count(*) filter (where exists (
             select 1 from reservas r
             where r.plaza_id = p.id and r.estado = 'confirmada'
               and r.inicio <= now() and r.fin > now()
           ))
    from plazas p
    where p.activa
    group by p.planta
    order by p.planta desc;
end;
$$;

revoke execute on function public.admin_ingresos_diarios(int) from anon;
revoke execute on function public.admin_ocupacion_plantas() from anon;
