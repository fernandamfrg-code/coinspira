# Coinspira / Next.js

Conversión del HTML de Fer a Next.js App Router. El diseño original se conserva en `index.html`; la página utiliza contenido extraído en `src/content/landing.json`, CSS y assets locales. El script de importación `scripts/convert.ts` no debe repetirse después de editar contenido sin revisar los identificadores del CMS.

## Desarrollo

`npm install` y `npm run dev`. SQLite local (`local.db`) por defecto. En producción usa una base Turso exclusiva con `TURSO_DATABASE_URL` y `TURSO_AUTH_TOKEN`; el disco de Vercel no sirve para persistencia.

Configura `AUTH_SECRET` con al menos 32 caracteres aleatorios en `.env.local`. Para crear o actualizar un administrador, define `ADMIN_EMAIL` y `ADMIN_PASSWORD` (mínimo 8 caracteres) y ejecuta `node --env-file=.env.local --import tsx scripts/create-admin.ts`. La contraseña se almacena como hash y no se guarda en el repositorio.

## Incluido

- Página de Fer con ES/EN, desplegables y cuatro formularios.
- Envíos guardados en bandeja interna, reemplazando FormSubmit. Notificaciones email pendientes.
- `/admin`: login, bandeja con estados, edición de textos ES/EN y publicaciones.
- Historias, recursos y coinspiradores con borrador/publicado y contenido bilingüe básico.
- `/explorar` y `/explorar/[slug]`: biblioteca y publicaciones públicas. La navegación original de la landing se conserva.
- Sesiones firmadas, contraseñas cifradas, validación del servidor y límites persistidos en base.

Adaptación de patrones de AlaRaiz: LibSQL, sesiones jose/bcrypt, CMS bilingüe y formularios almacenados. No utiliza bases, cuentas ni credenciales de otros clientes.

## Pendientes

Pagos de anticipo/saldo, agenda, notificaciones, archivos, campos específicos de perfiles de coinspiradores, fuentes/revisor/destino, permisos de colaboradores y analytics. Publicaciones en texto plano. El CMS edita los textos traducibles de la landing; enlaces, imágenes y estructura se editan en código.

## Validación y publicación

`npm run build` y `npm run typecheck`. En Vercel cambia el framework de Other a Next.js y configura las variables anteriores. El HTML queda como referencia; la aplicación sirve desde `src/app`. El README original describe únicamente la versión estática previa.
