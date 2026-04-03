# Demo Backfill

## Objetivo
Poblar las cuentas demo de Zentra con datos coherentes y reutilizables para demos internas, QA manual y pruebas con equipo comercial/producto.

El backfill:
- crea o actualiza las cuentas demo en `auth.users`
- resetea solo la data demo asociada a esas cuentas
- vuelve a poblar perfiles, categorias, productos, RFQs, ofertas, conversaciones, notificaciones, favoritos, alertas, reviews, activity events y agentes IA

No borra el proyecto completo.
Sí reemplaza la data previa de estas cuentas demo:
- `admin@zentra.cl`
- `ventas@vallefrio.cl`
- `contacto@molinosdelsur.cl`
- `ventas@agrosur.cl`
- `compras@mozart.cl`
- `compras@ritz.cl`
- `abastecimiento@puertosur.cl`
- `compras@cateringandes.cl`

## Escenarios por cuenta

### Admin
- `admin@zentra.cl`
- acceso a panel admin
- cuenta marcada como admin y verificada

### Suppliers
- `ventas@vallefrio.cl`
  - supplier verificado
  - plan `pro`
  - catalogo amplio de harinas, lacteos, aceites y abarrotes
  - ofertas aceptadas y en negociacion
  - conversaciones activas y cerradas
- `contacto@molinosdelsur.cl`
  - supplier verificado
  - plan `enterprise`
  - foco en harinas, legumbres, secos y abarrotes
  - oferta pendiente y RFQ cancelada
- `ventas@agrosur.cl`
  - supplier verificado
  - plan `starter`
  - suscripcion adicional `pending_payment` para mostrar upgrade Flow
  - catalogo IQF y congelados
  - conversacion activa con buyer

### Buyers
- `compras@mozart.cl`
  - buyer con bastante actividad
  - RFQs, favoritos, alertas y recomendaciones fuertes
- `compras@ritz.cl`
  - buyer hotelero con historial medio
  - RFQ aceptada y review emitida
- `abastecimiento@puertosur.cl`
  - buyer operativo con RFQ abierta y otra en negociacion
- `compras@cateringandes.cl`
  - buyer con menos historial
  - sirve para ver un caso mas cercano a cold-start

## Requisitos
- `VITE_SUPABASE_URL` o `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

El script ya intenta leer `.env.local` para obtener la URL.
La `service role key` no deberia quedar guardada en el repo; pásala por entorno al ejecutar.

## Ejecucion

### PowerShell
```powershell
$env:SUPABASE_SERVICE_ROLE_KEY="TU_SERVICE_ROLE_KEY"
npm run seed:demo
```

Si quieres forzar otra password demo:
```powershell
$env:SUPABASE_SERVICE_ROLE_KEY="TU_SERVICE_ROLE_KEY"
$env:SEED_PASSWORD="ZentraDemo123!"
npm run seed:demo
```

### Bash
```bash
SUPABASE_SERVICE_ROLE_KEY="TU_SERVICE_ROLE_KEY" npm run seed:demo
```

## Validacion recomendada
1. Entrar con `compras@mozart.cl`
2. Revisar:
   - `Para ti`
   - `Cotizaciones`
   - favoritos
   - alertas
3. Entrar con `ventas@vallefrio.cl`
4. Revisar:
   - `Quote Inbox`
   - `Mis ofertas`
   - conversaciones
   - plan y uso
5. Entrar con `admin@zentra.cl`
6. Confirmar panel admin

## Notas
- La password demo por defecto del script es `ZentraDemo123!`
- El backfill es idempotente para estas cuentas: si lo corres de nuevo, reconstruye la data demo
- Si el equipo genera datos manuales usando estas cuentas, el siguiente backfill los reemplazará
