# CoInspira

Sitio de viajes accesibles construido con Next.js, con contenido bilingüe, formularios y panel de administración.

## Desarrollo

```sh
npm install
npm run dev
```

Configura las variables de `.env.example` en `.env.local`. La base de datos local usa SQLite; en producción configura una base Turso mediante `TURSO_DATABASE_URL` y `TURSO_AUTH_TOKEN`.

Define `AUTH_SECRET` con al menos 32 caracteres. Para crear o actualizar un administrador, configura `ADMIN_EMAIL` y `ADMIN_PASSWORD` y ejecuta:

```sh
node --env-file=.env.local --import tsx scripts/create-admin.ts
```

## Verificación

```sh
npm run typecheck
npm run build
```

## Publicación

Importa el repositorio en Vercel, selecciona el framework Next.js y configura las variables de entorno. La aplicación está en `src/app`; `index.html` conserva el sitio original como referencia.

El panel `/admin` permite gestionar solicitudes, contenido bilingüe, publicaciones, contactos, citas y registros manuales de pagos. La biblioteca pública está en `/explorar`.
