# CoInspira

Sitio de viajes accesibles en Next.js, con contenido bilingüe, formularios, biblioteca y panel de administración. La persistencia usa Neon/PostgreSQL mediante el driver HTTP de Neon.

## Activar producción desde Vercel

1. Importa o abre el proyecto conectado a este repositorio y a la rama `main`.
2. En **Settings → Build and Deployment**, selecciona **Next.js**. La raíz es la raíz del repositorio; usa los valores predeterminados de Build Command y Output Directory. Usa Node.js 22 o superior.
3. En **Storage / Marketplace**, crea **Neon Postgres** y conéctalo al proyecto, incluyendo el entorno **Production**. La integración debe añadir `DATABASE_URL`; el código también admite `POSTGRES_URL` si la integración usa ese nombre. No requiere cuenta Turso ni token Turso.
4. En **Settings → Environment Variables**, añade estas variables privadas en **Production**:

   | Variable | Valor |
   | --- | --- |
   | `DATABASE_URL` | Cadena de conexión PostgreSQL proporcionada por Neon; normalmente la añade la integración. |
   | `AUTH_SECRET` | Secreto aleatorio de al menos 32 caracteres. |
   | `ADMIN_EMAIL` | Correo de la primera administradora. |
   | `ADMIN_PASSWORD` | Contraseña privada de 8 a 256 caracteres; usa una contraseña larga y única. |

   No añadas prefijos `NEXT_PUBLIC_`. Si Vercel solicita un prefijo para las variables de la integración, conserva `DATABASE_URL` o configura un alias con ese nombre.
5. Haz **Redeploy** desde Deployments para que el despliegue reciba las nuevas variables.
6. Abre la página pública y `/admin`. En el primer uso se crean las ocho tablas e índices en una transacción y se crea la administradora. El proceso es idempotente: no borra registros ni cambia contraseñas existentes. No hace falta ejecutar SQL ni comandos de terminal para este primer acceso.
7. Confirma el login; envía una solicitud de prueba desde la página pública y comprueba que aparezca en el admin, incluido CRM. Verifica guardado de contenido, citas y registros de pagos. Recarga para confirmar persistencia.
8. Después de confirmar el acceso, elimina `ADMIN_EMAIL` y `ADMIN_PASSWORD` de Vercel y redepliega. Conserva `DATABASE_URL` y `AUTH_SECRET`; el usuario y su contraseña cifrada ya están guardados en PostgreSQL.

La clienta necesita crear/conectar Neon dentro de su Vercel y definir sus credenciales. La integración conecta la base, pero no genera `AUTH_SECRET` ni decide el correo/contraseña del admin. La activación se considera completa después de las pruebas en su proyecto real.

[Neon en Vercel Marketplace](https://vercel.com/marketplace/neon/neon) · [Variables de entorno de Vercel](https://vercel.com/docs/environment-variables)

## Desarrollo

```sh
npm install
npm run dev
```

Configura `.env.local` usando `.env.example` y una conexión Neon de desarrollo. También puedes obtener las variables desde un proyecto Vercel conectado con `vercel env pull .env.local`. Usa una base/rama de desarrollo separada de producción para pruebas.

Sin conexión de base, la landing puede previsualizarse localmente con su contenido original. Los formularios y el admin requieren PostgreSQL. En Vercel se exige la conexión y no se usa una base SQLite local como alternativa.

## Verificación

```sh
npm run test:db
npm run typecheck
npm run build
```

Las pruebas usan PostgreSQL aislado en memoria (PGlite) y el driver real de Neon con transporte local de prueba. No se conectan a cuentas ni bases externas. Verifican inicialización, administrador, formularios, CRM, citas, pagos, CMS, publicaciones, límites y rollback. La conexión y el login en Vercel se validan después de conectar Neon.

## Operaciones opcionales desde terminal

Con las variables de conexión en `.env.local`:

```sh
npm run db:migrate
npm run db:admin
```

`db:admin` usa `ADMIN_EMAIL` y `ADMIN_PASSWORD` para crear una cuenta o actualizar expresamente su contraseña. La inicialización automática solo crea la cuenta si todavía no existe.

No se importan automáticamente archivos SQLite ni usuarios locales de la versión anterior. Antes del cambio, la base local tenía un usuario y no tenía datos operativos; el usuario de producción se crea con las nuevas credenciales.

El panel `/admin` gestiona solicitudes, textos, publicaciones, contactos, citas y registros manuales de pagos. La biblioteca pública está en `/explorar`. El registro de pagos no constituye una pasarela de cobro. `index.html` conserva el sitio original como referencia.
