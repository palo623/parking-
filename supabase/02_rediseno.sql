-- =====================================================================
--  PARKING - Ampliación para el rediseño (Tarraco Parkings)
--  Ejecutar DESPUÉS de schema.sql:
--  Supabase → SQL Editor → New query → pega todo → Run
--  Se puede ejecutar más de una vez sin romper nada.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. PARKINGS (cada parking agrupa sus plazas)
-- ---------------------------------------------------------------------
create table if not exists public.parkings (
  id         bigint generated always as identity primary key,
  slug       text not null unique,                -- p. ej. "centro"
  nombre     text not null,
  zona       text not null default '',
  activo     boolean not null default true,
  creado_en  timestamptz not null default now()
);

alter table public.plazas
  add column if not exists parking_id bigint references public.parkings (id) on delete restrict;

create index if not exists plazas_parking_idx on public.plazas (parking_id);

insert into public.parkings (slug, nombre, zona) values
  ('centro',  'Parking Centro',   'Junto a la Rambla Nova'),
  ('puerto',  'Parking Puerto',   'Zona del Serrallo y el puerto'),
  ('estacion','Parking Estación', 'A pie de la estación de tren')
on conflict (slug) do nothing;

-- Las plazas de ejemplo que ya existían pasan al Parking Centro
update public.plazas
   set parking_id = (select id from public.parkings where slug = 'centro')
 where parking_id is null;

-- Plazas de ejemplo para los otros dos parkings
insert into public.plazas (codigo, planta, tipo, precio_hora, parking_id)
select v.codigo, v.planta, v.tipo, v.precio, p.id
from (values
  ('P-01', 0, 'normal', 1.80, 'puerto'), ('P-02', 0, 'normal', 1.80, 'puerto'),
  ('P-03', 0, 'normal', 1.80, 'puerto'), ('P-04', 0, 'normal', 1.80, 'puerto'),
  ('P-05', 0, 'electrico', 2.20, 'puerto'), ('P-06', 0, 'discapacitados', 1.40, 'puerto'),
  ('P-07', 0, 'moto', 0.80, 'puerto'),   ('P-08', 0, 'normal', 1.80, 'puerto'),
  ('E-01', 0, 'normal', 1.60, 'estacion'), ('E-02', 0, 'normal', 1.60, 'estacion'),
  ('E-03', 0, 'normal', 1.60, 'estacion'), ('E-04', 0, 'electrico', 2.00, 'estacion'),
  ('E-05', 0, 'discapacitados', 1.20, 'estacion'), ('E-06', 0, 'moto', 0.70, 'estacion')
) as v(codigo, planta, tipo, precio, slug)
join public.parkings p on p.slug = v.slug
on conflict (codigo) do nothing;

-- ---------------------------------------------------------------------
-- 2. RESERVAS: código para el cliente y precio desglosado
-- ---------------------------------------------------------------------
alter table public.reservas
  add column if not exists codigo text unique
    default ('TP-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 7))),
  add column if not exists precio_base    numeric(8, 2),
  add column if not exists gastos_gestion numeric(8, 2);

-- Reservas antiguas sin código
update public.reservas
   set codigo = 'TP-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 7))
 where codigo is null;

-- ---------------------------------------------------------------------
-- 3. ACCESOS: cada lectura de matrícula en la barrera
--    (también los intentos sin reserva, para auditoría)
-- ---------------------------------------------------------------------
create table if not exists public.accesos (
  id              bigint generated always as identity primary key,
  usuario_id      uuid references public.perfiles (id) on delete set null,
  reserva_id      bigint references public.reservas (id) on delete restrict,
  matricula       text not null,
  tipo            text not null check (tipo in ('entrada', 'salida')),
  permitido       boolean not null,
  motivo          text,                         -- p. ej. 'sin_reserva', 'pronto', 'dentro'
  minutos_exceso  int not null default 0 check (minutos_exceso >= 0),
  importe_extra   numeric(8, 2) not null default 0 check (importe_extra >= 0),
  creado_en       timestamptz not null default now()
);

create index if not exists accesos_reserva_idx on public.accesos (reserva_id, creado_en desc);
create index if not exists accesos_fecha_idx   on public.accesos (creado_en desc);

-- ---------------------------------------------------------------------
-- 4. Seguridad (Row Level Security)
--    El backend usa la service_role key; esto protege el acceso directo.
-- ---------------------------------------------------------------------
alter table public.parkings enable row level security;
alter table public.accesos  enable row level security;

drop policy if exists "parkings visibles" on public.parkings;
create policy "parkings visibles" on public.parkings
  for select using (activo or public.es_admin());

drop policy if exists "accesos propios o admin" on public.accesos;
create policy "accesos propios o admin" on public.accesos
  for select using (usuario_id = auth.uid() or public.es_admin());
