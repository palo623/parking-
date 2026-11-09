# 🅿️ Parking · Reserva tu plaza

Web para reservar plazas de parking.

| Parte | Tecnología | Carpeta |
|---|---|---|
| Base de datos y usuarios | Supabase (PostgreSQL + Auth) | `supabase/` |
| Backend (API) | Node.js + Express | `backend/` |
| Front end | React + Vite | `frontend/` |

## Qué hace

**Clientes**
- Portada con buscador, tarifas en vivo, preguntas frecuentes y modo claro/oscuro.
- **Mapa visual del parking** por plantas: plazas libres en verde, ocupadas en gris, filtro por tipo (normal, eléctrico, moto, movilidad reducida) y botón "elegir la más barata".
- Atajos de duración (1 h, 2 h, 4 h, 8 h, 24 h) y precio exacto antes de confirmar.
- **Ticket con código QR**, imprimible y con botón para añadirlo al calendario (.ics).
- Mis reservas: próximas / historial, cuenta atrás, cancelación con confirmación.
- Perfil: datos personales, **vehículos guardados** (se ofrecen al reservar) y cambio de contraseña.
- Registro con medidor de seguridad de contraseña y **recuperación de contraseña** por email.
- **Ampliar una reserva** (incluso si ya ha empezado) pagando solo la diferencia.
- **Valorar** la estancia con estrellas; las opiniones reales salen en la portada con la media.
- Página de **contacto** con formulario (con protección anti-spam), datos del negocio y mapa.
- Portada con plazas libres en directo, cifras, opiniones, sección **"Cómo llegar"** con mapa (OpenStreetMap) y animaciones al hacer scroll.

**Administrador**
- Resumen: ocupación actual, reservas pendientes, ingresos, **gráfica de ingresos de 14 días**, ocupación por planta y mapa del parking en tiempo real.
- Reservas: buscador, filtro por estado, cambio de estado y **exportación a CSV**.
- Plazas: alta, edición (código, planta, tipo, precio) y activar/desactivar.
- Usuarios: lista con buscador y dar/quitar rol de administrador.
- **Agenda**: línea de tiempo de 24 h por plaza para ver la ocupación de cualquier día.
- **Mensajes** del formulario de contacto (sin leer / leídos, responder por email).
- **Valoraciones**: reparto de estrellas y ocultar/mostrar opiniones en la web.

**Legal y extras de web**
- Aviso de **cookies** con consentimiento real (necesarias / preferencias / terceros). El mapa de OpenStreetMap no se carga sin permiso y el tema solo se recuerda si se aceptan las preferencias. Se puede cambiar desde "Configurar cookies" en el pie.
- Páginas de **aviso legal**, **política de privacidad**, **política de cookies** y **condiciones de reserva** (`/aviso-legal`, `/privacidad`, `/cookies`, `/terminos`). Son plantillas: revisa los datos entre corchetes de `LEGAL` en `frontend/src/config.js` y, si puedes, que las valide un profesional.
- Casillas de aceptación de condiciones y privacidad en el registro y en el formulario de contacto.
- Fuente Inter servida desde la propia web (sin Google Fonts), favicon, manifest (instalable en el móvil), `robots.txt`, imagen para compartir en redes (Open Graph), botón "volver arriba" y enlace "saltar al contenido" para accesibilidad.

**Datos del negocio**: dirección, teléfono, email, horario y coordenadas del mapa se cambian en un solo sitio: `frontend/src/config.js`.

**Asistente virtual (Google Gemini)**
- Burbuja de chat en todas las páginas. Responde dudas sobre reservas, precios, cancelaciones y problemas.
- Si el usuario ha iniciado sesión, conoce sus reservas y puede contestar cosas como "¿a qué hora es mi reserva?".
- La clave de Google se queda en el backend: el navegador nunca la ve. Máximo 30 mensajes cada 10 minutos por IP.

**Seguridad**
- Reglas RLS y funciones en la base de datos: precio calculado en el servidor, sin solapes, cada usuario solo ve lo suyo.
- Backend con `helmet` y límite de peticiones (300 / 15 min por IP, 20 reservas / hora).

## Puesta en marcha

La base de datos ya está creada en el proyecto de Supabase `qlhqrjbdufqwvzqlsosi`, y el front end y el backend ya traen su URL y su clave pública (anon). **No hace falta ningún archivo `.env`.**

Abre dos terminales en Visual Studio Code (Terminal → Nueva terminal):

```bash
# Terminal 1 - backend (http://localhost:4000)
cd backend
npm install
npm run dev
```

```bash
# Terminal 2 - front end (http://localhost:5173)
cd frontend
npm install
npm run dev
```

Abre http://localhost:5173 y crea tu cuenta. El asistente se activa al añadir la clave de Google (ver abajo).

> Si Supabase te pide confirmar el email al registrarte y no quieres esperar, desactívalo en
> Supabase → Authentication → Sign In / Providers → Email → *Confirm email*.

### Activar el asistente (chatbot)
1. Consigue una clave gratis en [Google AI Studio](https://aistudio.google.com/apikey) → *Create API key*.
2. En la carpeta `backend`, copia `.env.example` como `.env` (en Windows: `copy .env.example .env`).
3. Pega la clave en la línea `GEMINI_API_KEY=` y guarda.
4. Reinicia el backend (`Ctrl + C` y `npm run dev`). En la terminal verás *"Asistente Gemini activo"*.

El modelo por defecto es `gemini-flash-lite-latest` (siempre el Flash-Lite más reciente). Para fijar otro, cambia `GEMINI_MODEL` en el mismo archivo, por ejemplo `GEMINI_MODEL=gemini-3.5-flash-lite`.

### Base de datos desde cero (solo si usas otro proyecto)
En Supabase → SQL Editor ejecuta, en este orden: `supabase/schema.sql`, `supabase/02_funciones_y_permisos.sql`, `supabase/03_mejoras.sql` y `supabase/04_valoraciones_contacto.sql`.
Después, en Authentication → URL Configuration, pon como *Site URL* la dirección de la web (en local `http://localhost:5173`) y añádela a *Redirect URLs* con `/**` al final.

### 4. Hacerte administrador
Regístrate en la web y después ejecuta en el SQL Editor de Supabase:
```sql
update public.perfiles set rol = 'admin'
where id = (select id from auth.users where email = 'TU_EMAIL');
```

## API

| Método | Ruta | Acceso |
|---|---|---|
| GET | `/api/plazas` | público |
| GET | `/api/plazas/disponibles?inicio=&fin=&tipo=` | público |
| GET | `/api/plazas/mapa?inicio=&fin=` | público |
| GET / POST / DELETE | `/api/vehiculos` | usuario |
| GET | `/api/reservas/:id` | usuario |
| GET | `/api/admin/estadisticas?dias=14` | admin |
| GET / PATCH | `/api/admin/usuarios` | admin |
| GET | `/api/chat/estado` | público |
| GET | `/api/valoraciones` | público |
| POST | `/api/contacto` | público |
| POST | `/api/reservas/:id/ampliar` | usuario |
| POST | `/api/reservas/:id/valoracion` | usuario |
| GET | `/api/admin/agenda?dia=` | admin |
| GET / PATCH | `/api/admin/mensajes` | admin |
| GET / PATCH | `/api/admin/valoraciones` | admin |
| POST | `/api/chat` | público (usa la sesión si la hay) |
| GET / POST | `/api/reservas` | usuario |
| PATCH | `/api/reservas/:id/cancelar` | usuario |
| GET / PATCH | `/api/perfil` | usuario |
| GET | `/api/admin/resumen` | admin |
| GET | `/api/admin/reservas` | admin |
| PATCH | `/api/admin/reservas/:id` | admin |
| GET / POST | `/api/admin/plazas` | admin |
| PATCH | `/api/admin/plazas/:id` | admin |

> 🔒 No se usa la clave secreta `service_role`: la seguridad está en la base de datos (políticas RLS y funciones), así que la clave anon puede ir en el código sin riesgo.
