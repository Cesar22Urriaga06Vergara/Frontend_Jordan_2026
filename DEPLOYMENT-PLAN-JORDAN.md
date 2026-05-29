# Plan Oficial de Despliegue

## Sistema Purificadora de Agua JORDAN

Arquitectura aprobada:

- Frontend: Cloudflare Pages
- Backend: Render Free Web Service
- Base de Datos: Aiven MySQL Free

## Frontend

Build command:

```bash
npm run build
```

Output:

```text
.output/public
```

Variables en Cloudflare Pages:

```text
NUXT_PUBLIC_API_BASE=https://TU-BACKEND.onrender.com/api
NUXT_PUBLIC_APP_NAME=JORDAN
```

## Seguridad

No subir `.env`, credenciales, tokens, backups ni certificados.

El frontend nunca debe recibir credenciales de base de datos.
