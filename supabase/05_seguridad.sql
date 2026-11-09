-- =====================================================================
--  PARKING - Parte 5: ajustes de seguridad recomendados por el
--  "Security Advisor" de Supabase. Se puede ejecutar varias veces.
-- =====================================================================

-- 1. La extensión btree_gist fuera del esquema público
create schema if not exists extensions;
alter extension btree_gist set schema extensions;

-- 2. search_path fijo en la función de precio
alter function public.calcular_precio(numeric, timestamptz, timestamptz) set search_path = public;

-- 3. Funciones de triggers: nadie las llama directamente
revoke execute on function public.crear_perfil() from public, anon, authenticated;
revoke execute on function public.proteger_rol() from public, anon, authenticated;

-- 4. Funciones que necesitan sesión iniciada: fuera para visitantes anónimos
revoke execute on function public.crear_reserva(bigint, text, timestamptz, timestamptz) from public, anon;
revoke execute on function public.cancelar_reserva(bigint) from public, anon;
revoke execute on function public.ampliar_reserva(bigint, timestamptz) from public, anon;
revoke execute on function public.valorar_reserva(bigint, int, text) from public, anon;
revoke execute on function public.admin_ingresos_diarios(int) from public, anon;
revoke execute on function public.admin_ocupacion_plantas() from public, anon;

grant execute on function public.crear_reserva(bigint, text, timestamptz, timestamptz) to authenticated;
grant execute on function public.cancelar_reserva(bigint) to authenticated;
grant execute on function public.ampliar_reserva(bigint, timestamptz) to authenticated;
grant execute on function public.valorar_reserva(bigint, int, text) to authenticated;
grant execute on function public.admin_ingresos_diarios(int) to authenticated;
grant execute on function public.admin_ocupacion_plantas() to authenticated;

-- Quedan públicas a propósito (no revelan datos personales):
--   plazas_disponibles, estado_plazas, valoraciones_publicas, resumen_valoraciones,
--   calcular_precio y es_admin (devuelve false a quien no es administrador).
