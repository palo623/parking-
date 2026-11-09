-- =====================================================================
--  PARKING - Parte 4: ampliar reservas, valoraciones de clientes
--  y mensajes de contacto.
--  Ejecutar DESPUÉS de 03_mejoras.sql (se puede repetir).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Ampliar una reserva propia (solo hacia delante y sin solapes)
-- ---------------------------------------------------------------------
create or replace function public.ampliar_reserva(p_id bigint, p_nuevo_fin timestamptz)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  r reservas%rowtype;
  v_precio_hora numeric;
  v_total numeric;
begin
  select * into r from reservas where id = p_id and usuario_id = auth.uid();
  if not found then
    raise exception 'Reserva no encontrada';
  end if;
  if r.estado <> 'confirmada' or r.fin <= now() then
    raise exception 'Esta reserva ya no se puede ampliar';
  end if;
  if p_nuevo_fin <= r.fin then
    raise exception 'La nueva hora de salida debe ser posterior a la actual';
  end if;
  if p_nuevo_fin - r.inicio > interval '30 days' then
    raise exception 'La reserva no puede superar 30 días';
  end if;

  select precio_hora into v_precio_hora from plazas where id = r.plaza_id;
  v_total := public.calcular_precio(v_precio_hora, r.inicio, p_nuevo_fin);

  -- Si choca con otra reserva, la restricción de no solape lanza el error 23P01
  update reservas set fin = p_nuevo_fin, precio_total = v_total where id = p_id;
  return v_total;
end;
$$;

revoke execute on function public.ampliar_reserva(bigint, timestamptz) from anon;

-- ---------------------------------------------------------------------
-- 2. Valoraciones (una por reserva terminada)
-- ---------------------------------------------------------------------
create table if not exists public.valoraciones (
  id          bigint generated always as identity primary key,
  reserva_id  bigint not null unique references public.reservas (id) on delete cascade,
  usuario_id  uuid   not null references public.perfiles (id) on delete cascade,
  puntuacion  int    not null check (puntuacion between 1 and 5),
  comentario  text   check (char_length(comentario) <= 500),
  visible     boolean not null default true,
  creado_en   timestamptz not null default now()
);

alter table public.valoraciones enable row level security;

drop policy if exists "valoraciones propias o admin" on public.valoraciones;
create policy "valoraciones propias o admin" on public.valoraciones
  for select using (usuario_id = auth.uid() or public.es_admin());

drop policy if exists "admin modera valoraciones" on public.valoraciones;
create policy "admin modera valoraciones" on public.valoraciones
  for update using (public.es_admin()) with check (public.es_admin());

create or replace function public.valorar_reserva(p_reserva_id bigint, p_puntuacion int, p_comentario text default null)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  r reservas%rowtype;
  v_id bigint;
begin
  select * into r from reservas where id = p_reserva_id and usuario_id = auth.uid();
  if not found then
    raise exception 'Reserva no encontrada';
  end if;
  if r.estado = 'cancelada' or r.inicio > now() then
    raise exception 'Solo puedes valorar reservas que ya han empezado';
  end if;
  if p_puntuacion not between 1 and 5 then
    raise exception 'La puntuación debe ser de 1 a 5 estrellas';
  end if;
  if exists (select 1 from valoraciones where reserva_id = p_reserva_id) then
    raise exception 'Ya has valorado esta reserva';
  end if;

  insert into valoraciones (reserva_id, usuario_id, puntuacion, comentario)
  values (p_reserva_id, auth.uid(), p_puntuacion, nullif(trim(left(coalesce(p_comentario, ''), 500)), ''))
  returning id into v_id;
  return v_id;
end;
$$;

revoke execute on function public.valorar_reserva(bigint, int, text) from anon;

-- Valoraciones públicas (solo nombre de pila, sin datos personales)
create or replace function public.valoraciones_publicas(p_limite int default 6)
returns table (puntuacion int, comentario text, nombre text, creado_en timestamptz, media numeric, total bigint)
language sql
stable
security definer
set search_path = public
as $$
  with visibles as (select * from valoraciones where visible),
       resumen as (select round(avg(puntuacion)::numeric, 1) as media, count(*) as total from visibles)
  select v.puntuacion, v.comentario,
         coalesce(nullif(split_part(trim(p.nombre), ' ', 1), ''), 'Cliente'),
         v.creado_en, r.media, r.total
  from visibles v
  join perfiles p on p.id = v.usuario_id
  cross join resumen r
  where v.comentario is not null
  order by v.puntuacion desc, v.creado_en desc
  limit least(greatest(p_limite, 1), 20);
$$;

create or replace function public.resumen_valoraciones()
returns table (media numeric, total bigint)
language sql
stable
security definer
set search_path = public
as $$
  select round(avg(puntuacion)::numeric, 1), count(*) from valoraciones where visible;
$$;

-- ---------------------------------------------------------------------
-- 3. Mensajes del formulario de contacto
-- ---------------------------------------------------------------------
create table if not exists public.mensajes_contacto (
  id          bigint generated always as identity primary key,
  usuario_id  uuid references public.perfiles (id) on delete set null default auth.uid(),
  nombre      text not null check (char_length(nombre) between 1 and 80),
  email       text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(email) <= 120),
  asunto      text not null check (char_length(asunto) between 1 and 120),
  mensaje     text not null check (char_length(mensaje) between 5 and 2000),
  leido       boolean not null default false,
  creado_en   timestamptz not null default now()
);

alter table public.mensajes_contacto enable row level security;

drop policy if exists "cualquiera puede escribir" on public.mensajes_contacto;
create policy "cualquiera puede escribir" on public.mensajes_contacto
  for insert to anon, authenticated
  with check (leido = false and (usuario_id is null or usuario_id = auth.uid()));

drop policy if exists "admin lee mensajes" on public.mensajes_contacto;
create policy "admin lee mensajes" on public.mensajes_contacto
  for select using (public.es_admin());

drop policy if exists "admin marca mensajes" on public.mensajes_contacto;
create policy "admin marca mensajes" on public.mensajes_contacto
  for update using (public.es_admin()) with check (public.es_admin());
