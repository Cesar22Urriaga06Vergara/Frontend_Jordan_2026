# Seguridad

## Secretos

Nunca subir:

- `.env`
- `.env.local`
- `.env.production`
- tokens
- credenciales
- certificados
- backups

## Produccion

Solo usar variables publicas `NUXT_PUBLIC_*` cuando el valor pueda ser visible
en el navegador.

No poner credenciales de Aiven, Render ni claves privadas en el frontend.
