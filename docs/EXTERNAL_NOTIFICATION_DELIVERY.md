# External Notification Delivery

Zentra now persists external delivery intents for `email` and `sms` in `notification_deliveries`.

## What exists today

- In-app notifications still live in `notifications`.
- Every new in-app notification attempts to enqueue external deliveries for:
  - `email` if the recipient has `users.email`
  - `sms` if the recipient has `users.whatsapp` or `users.phone`
- The queue is written from the same application flow that creates the in-app notification.

## What is still missing

- No worker / Edge Function sends those queued deliveries yet.
- `provider`, `sent_at`, `attempts_count` and `last_error` are reserved for that future sender.
- Templates are represented today by `template_key` values such as:
  - `rfq_created:email`
  - `message_received:sms`

## Recommended next step

Implement a server-side processor that:

1. reads pending rows from `notification_deliveries`
2. maps `template_key` to a real provider payload
3. sends through an email provider (for example Resend/Postmark) or SMS provider (for example Twilio/Vonage)
4. updates `status`, `attempts_count`, `sent_at` and `last_error`

## Scaffold included

- Supabase Edge Function scaffold:
  - [process-notification-deliveries](../supabase/functions/process-notification-deliveries/index.ts)

It currently:

- reads pending rows from `notification_deliveries`
- reports whether email / SMS provider env vars are configured
- returns a scaffold response without sending yet

## Notes

- This queue is intentionally delivery-provider agnostic.
- It is safe to have this structure in production before wiring the actual sender.
- Recipients can read their own queued deliveries through RLS; inserts are restricted to authenticated actors.
