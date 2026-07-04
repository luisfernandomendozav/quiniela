# Quiniela ⚽

Web app de quiniela deportiva con **Next.js 14** (App Router) y **Neon DB** (PostgreSQL serverless).

## Funcionalidades

- **Login simple** (registro + inicio de sesión con correo/contraseña, sesión por cookie firmada HMAC).
- **Pronósticos**: cada usuario predice el marcador de los partidos abiertos. Los pronósticos se cierran automáticamente cuando empieza el partido.
- **Tabla de posiciones** (leaderboard) con puntos, pronósticos y resultados exactos.
- **Panel de administración** (solo admins): crear partidos por jornada, registrar resultados y eliminar partidos.
- **Cálculo automático de puntos** al registrar un resultado:
  - Resultado exacto → **3 puntos**
  - Acertar ganador/empate (1X2) sin el marcador → **1 punto**
  - Fallar → **0 puntos**

## Configuración

Las variables están en `.env`:

- `DATABASE_URL` — conexión Neon (la misma del proyecto `ai-crm`). Todas las tablas viven en el schema dedicado **`quiniela`**, así que no interfieren con las tablas del CRM.
- `SESSION_SECRET` — secreto para firmar las cookies de sesión (cámbialo en producción).
- `ADMIN_EMAILS` — correos que reciben rol admin automáticamente al registrarse (separados por coma).
- `FOOTBALL_DATA_TOKEN` — *(opcional)* API key gratuita de [football-data.org](https://www.football-data.org/client/register) para sincronizar resultados reales del Mundial.
- `CRON_SECRET` — *(opcional)* secreto para proteger el endpoint de sincronización; Vercel Cron lo envía automáticamente.

## Sincronización automática de resultados

Un **Vercel Cron** (`vercel.json`) llama 1 vez al día a `/api/cron/sync-resultados`, que
consulta football-data.org, busca los partidos terminados y registra el marcador
(recalculando puntos). Solo rellena partidos **pendientes**; nunca pisa un resultado ya puesto.

- Empareja cada partido por **nombre real** de las selecciones (todas las rondas). En
  eliminatorias, si el tiempo reglamentario quedó empatado, define `pen_winner` con el ganador
  (penales). Ver `src/lib/worldcup.ts`.
- **Setup en Vercel:** agrega `FOOTBALL_DATA_TOKEN` y `CRON_SECRET` en *Settings → Environment Variables* y redeploya.
- **Probar el mapeo sin escribir:** `GET /api/cron/sync-resultados?key=<CRON_SECRET>&dryRun=1`
  (devuelve qué actualizaría y los `unmatched` que no logró emparejar).
- **Frecuencia:** por defecto `0 18 * * *` (1 vez al día, compatible con el plan **Hobby**).
  Con plan **Pro** puedes subirla, p. ej. `*/30 * * * *` (cada 30 min).

## Puesta en marcha

```bash
npm install
npm run db:init   # crea el schema 'quiniela' y las tablas en Neon
npm run dev       # http://localhost:3000
```

## Uso

1. Regístrate en `/login`. Si tu correo está en `ADMIN_EMAILS`, serás admin.
2. Como admin, ve a **Admin** y crea partidos (jornada, equipos, fecha/hora).
3. Los usuarios pronostican en **Partidos** antes de que inicie cada juego.
4. Cuando termine un partido, el admin registra el marcador y los puntos se recalculan solos.
5. Consulta la **Tabla** para ver el ranking.

## Estructura

```
src/
  lib/        db.ts (cliente Neon), auth.ts (sesiones), points.ts (reglas)
  app/
    api/      auth/, predictions/, matches/ (rutas REST)
    login/    dashboard/  matches/  leaderboard/  admin/
  components/ NavBar, LogoutButton
scripts/
  init-db.mjs crea el schema y las tablas
```
# quiniela
