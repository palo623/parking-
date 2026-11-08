-- =====================================================================
--  PARKING - Parte 2: funciones y permisos
--  Permite que el backend funcione solo con la clave pública (anon),
--  sin necesitar la clave secreta service_role.
--  Ejecutar DESPUÉS de schema.sql (se puede ejecutar varias veces).
-- =====================================================================

-- Precio por cuartos de hora, calculado siempre en la base de datos
create or replace function public.calcular_precio(p_precio numeric, p_inicio timestamptz, p_fin timestamptz)
returns numeric
language sql
immutable
as $$
  select round(ceil(extract(epoch from (p_fin - p_inicio)) / 900.0) * 0.25 * p_precio, 2);
$$;

-- Plazas libres en un rango de fechas (cualquiera puede consultarlo)
create or replace function public.plazas_disponibles(p_inicio timestamptz, p_fin timestamptz, p_tipo text default null)
returns table (id bigint, codigo text, planta int, tipo text, precio_hora numeric, precio_estimado numeric)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.codigo, p.planta, p.tipo, p.precio_hora,
         public.calcular_precio(p.precio_hora, p_inicio, p_fin)
  from plazas p
  where p.activa
    and (p_tipo is null or p.tipo = p_tipo)
    and not exists (
      select 1 from reservas r
      where r.plaza_id = p.id
        and r.estado = 'confirmada'
        and r.inicio < p_fin
        and r.fin > p_inicio
    )
  order by p.codigo;
$$;

-- Crear una reserva para el usuario que ha iniciado sesión
create or replace function public.crear_reserva(p_plaza_id bigint, p_matricula text, p_inicio timestamptz, p_fin timestamptz)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_precio numeric;
  v_id bigint;
  v_matricula text := upper(regexp_replace(coalesce(p_matricula, ''), '\s', '', 'g'));
begin
  if auth.uid() is null then
    raise exception 'No has iniciado sesión';
  end if;
  if v_matricula !~ '^[A-Z0-9-]{4,10}$' then
    raise exception 'Matrícula no válida';
  end if;
  if p_fin <= p_inicio then
    raise exception 'La fecha de salida debe ser posterior a la de entrada';
  end if;
  if p_inicio < now() - interval '5 minutes' then
    raise exception 'No puedes reservar en el pasado';
  end if;
  if p_fin - p_inicio > interval '30 days' then
    raise exception 'La reserva no puede superar 30 días';
  end if;

  select precio_hora into v_precio from plazas where id = p_plaza_id and activa;
  if not found then
    raise exception 'La plaza no existe';
  end if;

  insert into reservas (usuario_id, plaza_id, matricula, inicio, fin, precio_total)
  values (auth.uid(), p_plaza_id, v_matricula, p_inicio, p_fin, public.calcular_precio(v_precio, p_inicio, p_fin))
  returning id into v_id;

  return v_id;
end;
$$;

-- Cancelar una reserva propia que todavía no ha empezado
create or replace function public.cancelar_reserva(p_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r reservas%rowtype;
begin
  select * into r from reservas where id = p_id and usuario_id = auth.uid();
  if not found then
    raise exception 'Reserva no encontrada';
  end if;
  if r.estado <> 'confirmada' then
    raise exception 'Esta reserva ya no se puede cancelar';
  end if;
  if r.inicio <= now() then
    raise exception 'La reserva ya ha empezado';
  end if;
  update reservas set estado = 'cancelada' where id = p_id;
end;
$$;

revoke execute on function public.crear_reserva(bigint, text, timestamptz, timestamptz) from anon;
revoke execute on function public.cancelar_reserva(bigint) from anon;

-- Cada usuario puede editar su perfil, pero solo un admin puede cambiar roles
drop policy if exists "editar perfil propio" on public.perfiles;
create policy "editar perfil propio" on public.perfiles
  for update using (id = auth.uid() or public.es_admin())
  with check (id = auth.uid() or public.es_admin());

-- (sin security definer: así current_user es el rol real de quien hace el cambio)
create or replace function public.proteger_rol()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.rol is distinct from old.rol
     and current_user in ('authenticated', 'anon')
     and not public.es_admin() then
    raise exception 'No puedes cambiar tu rol';
  end if;
  return new;
end;
$$;

drop trigger if exists proteger_rol on public.perfiles;
create trigger proteger_rol
  before update on public.perfiles
  for each row execute function public.proteger_rol();

-- El administrador gestiona plazas y reservas
drop policy if exists "admin crea plazas" on public.plazas;
create policy "admin crea plazas" on public.plazas
  for insert with check (public.es_admin());

drop policy if exists "admin edita plazas" on public.plazas;
create policy "admin edita plazas" on public.plazas
  for update using (public.es_admin()) with check (public.es_admin());

drop policy if exists "admin edita reservas" on public.reservas;
create policy "admin edita reservas" on public.reservas
  for update using (public.es_admin()) with check (public.es_admin());
