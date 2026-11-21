-- =====================================================================
--  PARKING - Cierre de funciones antiguas (solo si existen)
--  En el proyecto había funciones de una versión anterior (crear_reserva,
--  cancelar_reserva…) que el código actual no usa. Se quita el permiso para
--  llamarlas desde fuera: crear_reserva permitía reservar sin pasar por el
--  backend ni sumar el 10 % de gestión. No se borran; se puede volver atrás
--  con «grant execute … to authenticated».
-- =====================================================================
do $$
declare f text;
begin
  foreach f in array array[
    'public.crear_reserva(bigint, text, timestamptz, timestamptz)',
    'public.cancelar_reserva(bigint)',
    'public.ampliar_reserva(bigint, timestamptz)',
    'public.valorar_reserva(bigint, integer, text)',
    'public.plazas_disponibles(timestamptz, timestamptz, text)',
    'public.estado_plazas(timestamptz, timestamptz)',
    'public.valoraciones_publicas(integer)',
    'public.resumen_valoraciones()',
    'public.admin_ingresos_diarios(integer)',
    'public.admin_ocupacion_plantas()'
  ] loop
    if to_regprocedure(f) is not null then
      execute format('revoke execute on function %s from public, anon, authenticated', f);
    end if;
  end loop;
end $$;

-- es_admin() la usan las políticas de seguridad: solo usuarios con sesión
revoke execute on function public.es_admin() from public, anon;
grant execute on function public.es_admin() to authenticated;
