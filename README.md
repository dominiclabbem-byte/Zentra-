# Zentra

Frontend React + Vite para el marketplace B2B de abastecimiento Zentra.

## Stage 1

Esta iteracion deja lista la base de:

- auth con Supabase
- registro buyer
- registro supplier
- activacion de segundo rol sobre la misma organizacion
- dashboards buyer/supplier protegidos por sesion
- edicion persistente de perfiles buyer/supplier
- deploy SPA en Vercel con `vercel.json`

## Variables de entorno

Usa `.env.example` como referencia:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_ANTHROPIC_API_KEY`
- `VITE_ELEVENLABS_API_KEY`

## Supabase

Antes de probar Stage 1, aplica tambien la migracion:

- [supabase/migrations/002_stage1_profiles.sql](/mnt/c/Users/mateo/Desktop/Zentra-/supabase/migrations/002_stage1_profiles.sql)

Esa migracion agrega `scope` a `user_categories` para soportar categorias buyer y supplier sin pisarse cuando una organizacion tiene ambos roles.

## Backfill de datos

Para cargar datos reales de prueba en el proyecto remoto, aplica primero las migraciones y luego corre el seed:

```powershell
$env:SUPABASE_URL="https://TU_PROJECT_REF.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="TU_SERVICE_ROLE_KEY"
$env:SEED_PASSWORD="ZentraDemo123!"
npm run seed:demo
```

El backfill crea una cuenta admin y varias cuentas buyer/supplier con datos plausibles para probar el flujo completo. Credenciales base:

- `admin@zentra.cl`
- `ventas@vallefrio.cl`
- `contacto@molinosdelsur.cl`
- `ventas@agrosur.cl`
- `compras@mozart.cl`
- `compras@ritz.cl`
- `abastecimiento@puertosur.cl`
- `compras@cateringandes.cl`

La contrasena por defecto es `ZentraDemo123!`, salvo que definas `SEED_PASSWORD`.

## Desarrollo

```bash
npm install
npm run dev
```

## Verificacion

```bash
npm run build
```

`npm run lint` todavia falla por deuda previa en:

- [src/components/VoiceCall.jsx](/mnt/c/Users/mateo/Desktop/Zentra-/src/components/VoiceCall.jsx)
- [src/services/ttsService.js](/mnt/c/Users/mateo/Desktop/Zentra-/src/services/ttsService.js)
