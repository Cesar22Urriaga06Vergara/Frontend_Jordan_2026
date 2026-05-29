# Arquitectura Oficial de Despliegue

Proyecto: Purificadora Jordan

## Frontend

Proveedor: Cloudflare Pages

Framework: Nuxt 3

Build command:

```bash
npm run build
```

Output:

```text
.output/public
```

Variables:

- `NUXT_PUBLIC_API_BASE`
- `NUXT_PUBLIC_APP_NAME`

## Backend

Proveedor: Render

Variable que debe apuntar al backend:

```text
NUXT_PUBLIC_API_BASE=https://TU-BACKEND.onrender.com/api
```

## Base De Datos

Proveedor objetivo: Aiven MySQL Free.

La base de datos solo debe ser accedida por el backend. El frontend no debe
tener credenciales de Aiven ni tokens privados.

## Reglas De Seguridad

Nunca subir:

- `.env`
- `.env.local`
- `.env.production`
- passwords
- tokens
- URLs privadas
- credenciales
- certificados
- archivos `.pem`
- backups

## Checklist Antes De Deploy

- Cloudflare Pages conectado al repo `jordan-frontend`
- Build command: `npm run build`
- Output: `.output/public`
- `NUXT_PUBLIC_API_BASE` apunta a Render
- `NUXT_PUBLIC_APP_NAME=JORDAN`

## Checklist Antes De Push

- `npm run type-check`
- `npm run build`
- `.env.example` actualizado
- `.gitignore` actualizado
- no subir `.output`, `.nuxt`, logs ni archivos generados
