# 🅿️ Parking · Reserva tu plaza

Web para reservar plazas de parking.

| Parte | Tecnología | Carpeta |
|---|---|---|
| Base de datos y usuarios | Supabase (PostgreSQL + Auth) | `supabase/` |
| Backend (API) | Node.js + Express | `backend/` |
| Front end | React + Vite | `frontend/` |

## Qué hace

- **Clientes:** crear cuenta, buscar plazas libres por fecha/hora y tipo, ver el precio exacto, reservar con matrícula, ver y cancelar sus reservas, editar su perfil.
- **Administrador:** resumen (plazas, ocupación, ingresos), lista de todas las reservas con buscador y cambio de estado, alta de plazas, cambio de precio y activar/desactivar plazas.
- La base de datos impide que dos reservas confirmadas se solapen en la misma plaza.
- El precio se calcula por cuartos de hora.

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

Abre http://localhost:5173 y crea tu cuenta.

> Si Supabase te pide confirmar el email al registrarte y no quieres esperar, desactívalo en
> Supabase → Authentication → Sign In / Providers → Email → *Confirm email*.

### Base de datos desde cero (solo si usas otro proyecto)
En Supabase → SQL Editor ejecuta, en este orden, `supabase/schema.sql` y `supabase/02_funciones_y_permisos.sql`.

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
| GET / POST | `/api/reservas` | usuario |
| PATCH | `/api/reservas/:id/cancelar` | usuario |
| GET / PATCH | `/api/perfil` | usuario |
| GET | `/api/admin/resumen` | admin |
| GET | `/api/admin/reservas` | admin |
| PATCH | `/api/admin/reservas/:id` | admin |
| GET / POST | `/api/admin/plazas` | admin |
| PATCH | `/api/admin/plazas/:id` | admin |

> 🔒 No se usa la clave secreta `service_role`: la seguridad está en la base de datos (políticas RLS y funciones), así que la clave anon puede ir en el código sin riesgo.
