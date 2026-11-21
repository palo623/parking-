# Tarraco Parkings · Reserva tu plaza

Web para reservar plazas en los parkings de Tarragona (proyecto ASIX2). Disponible en castellano, catalán e inglés.

| Parte | Tecnología | Carpeta |
|---|---|---|
| Base de datos y usuarios | Supabase (PostgreSQL + Auth) | `supabase/` |
| Backend (API) | Node.js + Express | `backend/` |
| Front end | React + Vite + Tailwind CSS | `frontend/` |

## Qué hace

- **Clientes:** elegir día, hora y duración, ver plazas libres y precio final de cada parking (Centro, Puerto, Estación), reservar con su matrícula y recibir un código, ver y cancelar sus reservas, editar su perfil.
- **Barrera:** simulador que lee la matrícula y abre solo si hay una reserva en hora. Cada intento (entrada, salida, minutos de más) se guarda en la tabla `accesos`.
- **Administrador:** resumen (plazas, ocupación, ingresos), reservas con buscador y cambio de estado, registro de la barrera, alta de plazas por parking, cambio de precio y activar/desactivar plazas.
- La base de datos impide que dos reservas confirmadas se solapen en la misma plaza.
- El precio se calcula por cuartos de hora + un 10 % de gastos de gestión, y se guarda desglosado.
- Aviso de cookies: de momento el botón solo cierra el aviso (no guarda nada).

## Puesta en marcha

### 1. Supabase
1. Crea un proyecto en [supabase.com](https://supabase.com).
2. Ve a **SQL Editor → New query**, pega el contenido de `supabase/schema.sql` y pulsa **Run**.
3. Haz lo mismo con `supabase/02_rediseno.sql` (añade los parkings, el código de reserva y la tabla `accesos`) después con `supabase/03_cuenta.sql` (vehículos guardados, preferencias y nombre al entrar con Google) y por último `supabase/04_seguridad.sql`. Se pueden ejecutar más de una vez.
   *(En el proyecto de Supabase de Tarraco Parkings ya están aplicados los cuatro.)*
4. En **Project Settings → API** copia la *Project URL*, la clave *anon public* y la clave *service_role*.
5. (Opcional, para pruebas) En **Authentication → Providers → Email** puedes desactivar *Confirm email*.

### 2. Backend
```bash
cd backend
cp .env.example .env      # en Windows: copy .env.example .env
# rellena SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY
npm install
npm run dev               # http://localhost:4000
```

### 3. Front end
```bash
cd frontend
cp .env.example .env      # en Windows: copy .env.example .env
# rellena VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY
npm install
npm run dev               # http://localhost:5173
```

### 4. Hacerte administrador
Regístrate en la web y después ejecuta en el SQL Editor de Supabase:
```sql
update public.perfiles set rol = 'admin'
where id = (select id from auth.users where email = 'TU_EMAIL');
```

## API

| Método | Ruta | Acceso |
|---|---|---|
| GET | `/api/parkings` | público |
| GET | `/api/parkings/disponibles?inicio=&fin=&tipo=` | público |
| GET | `/api/plazas` | público |
| GET | `/api/plazas/disponibles?inicio=&fin=&tipo=` | público |
| GET / POST | `/api/reservas` | usuario |
| PATCH | `/api/reservas/:id/cancelar` | usuario |
| GET / POST | `/api/accesos` (barrera) | usuario |
| GET / PATCH | `/api/perfil` | usuario |
| GET | `/api/admin/resumen` | admin |
| GET | `/api/admin/reservas` | admin |
| PATCH | `/api/admin/reservas/:id` | admin |
| GET | `/api/admin/accesos` | admin |
| GET / POST | `/api/admin/plazas` | admin |
| PATCH | `/api/admin/plazas/:id` | admin |

> ⚠️ La clave `service_role` va **solo** en `backend/.env`. Los archivos `.env` no se suben a GitHub.

## Novedades del diseño 8

- **Páginas:** Inicio (reserva), Parkings y tarifas, Cómo funciona, Ayuda, Mi cuenta.
- **Entrar con Google:** activa Google en Supabase → *Authentication → Providers → Google* (Client ID y Secret de Google Cloud) y añade `http://localhost:5173` en *Authentication → URL Configuration*.
- **Matrículas:** España (formato actual 1234 BCD) u «Otro país o antigua» (2 a 10 letras y números).
- **Justificante** de cada reserva, imprimible o en PDF desde el navegador.
- **Mi cuenta:** resumen y «reservar otra vez», vehículos guardados, justificantes, datos, preferencias (tema claro/oscuro, idioma, avisos), métodos de pago (pendiente de pasarela) y seguridad.
- **Cookies:** «Solo necesarias» o «Aceptar todas»; se recuerda la elección.
- **Asistente:** botón abajo a la derecha, todavía sin conectar. Las instrucciones para Gemini están en `frontend/src/components/Asistente.jsx`; la clave de Google AI Studio irá en `backend/.env`, nunca en el frontend.
