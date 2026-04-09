# Notificaciones Externas: Email y SMS

Esta guia deja documentado como terminar de conectar el envio real de notificaciones externas sobre la base que ya existe en Zentra.

## Estado actual

Hoy ya existe:

- tabla `notification_deliveries`
- enqueue automatico desde `notifications`
- soporte para canales `email` y `sms`
- Edge Function scaffold en:
  - [process-notification-deliveries](../supabase/functions/process-notification-deliveries/index.ts)

Hoy todavia **no existe**:

- envio real a un proveedor
- reintentos reales
- scheduler/cron para procesar la cola automaticamente
- templates HTML/SMS definitivos

## Flujo actual

1. La app crea una notificacion in-app en `notifications`
2. En el mismo flujo intenta crear filas en `notification_deliveries`
3. Se encola:
   - `email` si el destinatario tiene `users.email`
   - `sms` si el destinatario tiene `users.whatsapp` o `users.phone`
4. La fila queda con `status = 'pending'`
5. Un worker futuro debe tomar esa fila y marcarla como:
   - `processing`
   - `sent`
   - `failed`

## Recomendacion de implementacion

### Email

Usar `Resend` por simplicidad para transactional email.

Variables sugeridas:

- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `RESEND_REPLY_TO`

Payload minimo esperado por Resend:

- `from`
- `to`
- `subject`
- `html` o `text`

La API oficial de Resend documenta el endpoint de envio de emails y los campos `from`, `to`, `subject`, `html` y `text`.  
Fuente: https://resend.com/docs/api-reference/emails/send-email

### SMS

Usar `Twilio` para la primera version.

Variables sugeridas:

- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_FROM_NUMBER`

Twilio Messaging API es adecuada para notificaciones transaccionales por SMS y otros canales.  
Fuente: https://www.twilio.com/en-us/messaging/programmable-messaging-api

## Variables de entorno

La Edge Function ya usa estas secrets de Supabase por defecto:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Supabase documenta que esas secrets estan disponibles en Edge Functions y que `SUPABASE_SERVICE_ROLE_KEY` es segura en server-side, nunca en browser.  
Fuente: https://supabase.com/docs/guides/functions/secrets

Ademas debes configurar:

```env
RESEND_API_KEY=
RESEND_FROM_EMAIL=
RESEND_REPLY_TO=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM_NUMBER=
```

## Deploy de la Edge Function

Supabase documenta este flujo:

1. login
2. link del proyecto
3. deploy de la function

Comandos:

```bash
supabase login
supabase link --project-ref <project-ref>
supabase functions deploy process-notification-deliveries
```

Fuente: https://supabase.com/docs/guides/functions/deploy

## Cargar secrets en Supabase

Ejemplo:

```bash
supabase secrets set RESEND_API_KEY=...
supabase secrets set RESEND_FROM_EMAIL=...
supabase secrets set RESEND_REPLY_TO=...
supabase secrets set TWILIO_ACCOUNT_SID=...
supabase secrets set TWILIO_AUTH_TOKEN=...
supabase secrets set TWILIO_FROM_NUMBER=...
```

La documentacion oficial de Supabase recomienda manejar credenciales de Functions mediante secrets/env vars.  
Fuente: https://supabase.com/docs/guides/functions/secrets

## Como deberia comportarse el worker

El procesador `process-notification-deliveries` deberia:

1. leer filas `pending`
2. tomar un lote pequeno, por ejemplo `20-50`
3. marcar cada fila como `processing`
4. enviar segun `channel`
5. actualizar:
   - `provider`
   - `attempts_count`
   - `status`
   - `sent_at`
   - `last_error`

### Reglas recomendadas

- `email`:
  - enviar HTML simple + version `text`
  - guardar `provider = 'resend'`
- `sms`:
  - enviar mensaje corto, sin formato
  - guardar `provider = 'twilio'`
- reintentos:
  - maximo `3`
  - backoff simple
- idempotencia:
  - no reenviar una fila ya `sent`

## Templates recomendados

Primera ronda sugerida:

- `message_received:email`
- `message_received:sms`
- `offer_received:email`
- `offer_received:sms`
- `rfq_created:email`

Estrategia:

- usar `template_key` para rutear
- construir payload server-side
- no guardar HTML completo en la base

## Invocacion manual

Mientras no exista scheduler, puedes invocar la function manualmente desde dashboard, CLI o HTTP.

La documentacion de Supabase cubre Edge Functions y su invocacion autenticada.  
Fuente: https://supabase.com/docs/guides/functions

## Scheduler recomendado

Cuando quieran automatizarlo, la opcion mas limpia es:

- `pg_cron` / Supabase Cron
- invocando la Edge Function cada 1 minuto o cada 5 minutos

Supabase documenta scheduling de Edge Functions con `pg_cron` y `pg_net`, y tambien el producto Cron en dashboard.  
Fuentes:

- https://supabase.com/docs/guides/functions/schedule-functions
- https://supabase.com/docs/guides/cron

## Orden recomendado para implementarlo

1. terminar adapter `email` con Resend
2. terminar adapter `sms` con Twilio
3. actualizar la Edge Function para procesar y persistir estados
4. desplegar la function
5. cargar secrets
6. probar invocacion manual
7. agregar scheduler
8. agregar observabilidad y alertas

## Criterio de salida

Considerar este bloque "listo" cuando:

- una notificacion `message_received` genere fila en `notification_deliveries`
- la function envie realmente email y/o SMS
- la fila pase a `sent`
- los errores queden persistidos en `last_error`
- exista una forma automatica de procesar la cola

## Archivos relevantes

- [database.js](../src/services/database.js)
- [019_products_rls_and_notification_deliveries.sql](../supabase/migrations/019_products_rls_and_notification_deliveries.sql)
- [process-notification-deliveries](../supabase/functions/process-notification-deliveries/index.ts)
