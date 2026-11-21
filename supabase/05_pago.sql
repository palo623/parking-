-- =====================================================================
--  Tarraco Parkings · Pago simulado (ejecutar después de 04_seguridad.sql)
--  Guarda con qué se pagó cada reserva y una referencia, como haría una
--  pasarela de pago. No se cobra nada ni se guardan datos de tarjeta.
-- =====================================================================
alter table public.reservas add column if not exists metodo_pago text;
alter table public.reservas add column if not exists pago_ref text;
alter table public.reservas drop constraint if exists reservas_metodo_pago_ok;
alter table public.reservas add constraint reservas_metodo_pago_ok
  check (metodo_pago is null or metodo_pago in ('tarjeta', 'bizum', 'paypal'));
