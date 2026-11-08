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

### 1. Supabase
1. Crea un proyecto en [supabase.com](https://supabase.com).
2. Ve a **SQL Editor → New query**, pega el contenido de `supabase/schema.sql` y pulsa **Run**.
3. En **Project Settings → API** copia la *Project URL*, la clave *anon public* y la clave *service_role*.
4. (Opcional, para pruebas) En **Authentication → Providers → Email** puedes desactivar *Confirm email*.

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

> ⚠️ La clave `service_role` va **solo** en `backend/.env`. Los archivos `.env` no se suben a GitHub.
