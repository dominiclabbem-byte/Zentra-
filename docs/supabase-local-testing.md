# Supabase Local Testing

Esta suite existe para detectar problemas que los tests mockeados no ven:

- policies RLS
- triggers `auth.users -> public.users`
- constraints reales
- permisos de lectura/escritura entre buyer/supplier

## Flujo recomendado

1. Levantar el stack local:

```powershell
npx supabase start
```

2. Resetear base local con migraciones actuales:

```powershell
npm run supabase:reset:local
```

3. Correr la suite de integración local:

```powershell
npm run test:supabase:local
```

## Qué cubre la primera versión

- `signUp` real crea `auth.users` y espeja a `public.users`
- la policy de `notifications` permite insertar al actor autenticado
- el actor no puede leer notificaciones ajenas
- el destinatario sí puede leerlas y marcarlas como leídas

## Convención

- `npm test` sigue siendo la suite rápida de unit/integration mockeada
- `npm run test:supabase:local` corre sólo contra Supabase local
- no se usa el proyecto remoto para estas pruebas
