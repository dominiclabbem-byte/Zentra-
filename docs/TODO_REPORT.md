# Reporte TODO Zentra

Fecha: 2026-04-25

## 1. Marketplace carga lento en dashboard comprador

Estado: parcialmente resuelto / requiere medicion en ambiente real.

Hallazgos:
- El marketplace publico ya tiene cache de modulo y deduplicacion de request en `src/pages/Marketplace.jsx`.
- El dashboard comprador usa `getProducts({ lite: true, dashboardLite: true })`, por lo que no deberia traer columnas pesadas de imagenes base64.
- `getProducts` usa `PRODUCTS_LITE_SELECT`, excluyendo columnas pesadas en modo lite.

Accion sugerida:
- Medir en produccion con `localStorage.DEBUG_MARKETPLACE_PERF = "1"` para separar latencia Supabase, render y payload.
- Si sigue lento, paginar o virtualizar el catalogo del comprador y mover imagenes antiguas base64 a Storage.

## 2. B-001: No se estan pudiendo editar los productos creados

Estado: resuelto previamente.

Hallazgos:
- `SupplierDashboard` tiene flujo de edicion con `editingProductId`.
- `handleSaveProduct` llama `updateProduct(editingProductId, payload)` cuando corresponde.
- Existe cobertura de test para crear, editar y eliminar productos en `src/test/marketplaceScenario.test.js`.

Accion sugerida:
- Validar manualmente en Supabase real con un proveedor autenticado, porque el flujo depende de RLS y Storage.

## 3. No se puede agregar productos

Estado: no reproducido por codigo / requiere QA con credenciales reales.

Hallazgos:
- La UI de proveedor tiene modal de alta de producto.
- `createProduct` inserta en `products` y `handleSaveProduct` refresca estado local y uso del plan.
- Hay control de limite por plan: si el plan no permite mas productos, la app bloquea y manda a la pestaña Plan.

Accion sugerida:
- Probar con un proveedor cuyo plan tenga cupo disponible.
- Si falla solo en produccion, revisar RLS de `products`, bucket de imagenes y variables de Supabase.

## 4. No se puede ver el nombre del proveedor en cotizaciones del dashboard comprador

Estado: resuelto para cotizaciones nuevas con proveedor objetivo.

Hallazgos:
- Las tarjetas de cotizaciones activas muestran proveedores ofertando cuando existen ofertas.
- Las cotizaciones creadas desde marketplace guardan `sourceSupplierId` como `target_supplier_id`.
- La migracion `017_quote_target_supplier.sql` agrega ese campo para saber el proveedor objetivo.
- `getQuoteRequestsForBuyer` ahora trae `target_supplier` y `mapQuoteRequestRecord` lo expone como `targetSupplierName`.
- `BuyerDashboard` muestra `Solicitado a {proveedor}` cuando la cotizacion aun no tiene ofertas.

Accion sugerida:
- Revisar registros antiguos que no tengan `target_supplier_id`; esos no podran mostrar proveedor hasta backfill.

## 5. Web del proveedor pinchable como link

Estado: resuelto.

Cambios:
- `src/pages/Marketplace.jsx`: el campo `Web` ahora renderiza un `<a>` con `https://` automatico si falta protocolo.
- `src/pages/BuyerDashboard.jsx`: misma mejora en el modal de perfil proveedor del dashboard comprador.

## 6. B-002: Agregar notificacion al mail o sms

Estado: envio implementado por Edge Function; requiere configurar proveedores.

Hallazgos:
- La app crea filas en `notification_deliveries` para email y SMS cuando hay email/telefono del destinatario.
- La Edge Function `process-notification-deliveries` procesa pendientes, envia email por Resend y SMS por Twilio, y actualiza `sent`/`failed`.

Accion sugerida:
- Configurar `RESEND_API_KEY`, `NOTIFICATION_EMAIL_FROM`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` y `TWILIO_FROM_NUMBER`.
- Configurar job programado para ejecutar la funcion.

## 7. Borrar productos y proveedores ficticios del marketplace

Estado: herramienta existente; no ejecutado.

Hallazgos:
- Existe `scripts/cleanup-demo-data.mjs`, que elimina suppliers/buyers demo, productos, cotizaciones, notificaciones, reviews y agentes asociados.
- No lo ejecute porque borra datos en Supabase y requiere confirmacion operacional.

Accion sugerida:
- Ejecutar `npm run cleanup:demo` solo contra el proyecto Supabase correcto y con `SUPABASE_SERVICE_ROLE_KEY` configurado.
- Revisar la lista de emails demo dentro del script antes de correrlo.

## 8. Generacion de imagenes con IA con API key de Nano Banana

Estado: key hardcodeada removida; configuracion por env.

Hallazgos:
- `src/services/imageGenerator.js` llama a OpenRouter usando `VITE_OPENROUTER_API_KEY`.
- El modelo se controla con `VITE_OPENROUTER_IMAGE_MODEL`.
- El texto de UI menciona "Nano Banana Pro 2", pero el modelo configurado no coincide literalmente con ese nombre.

Accion sugerida:
- Para produccion, mover la generacion a backend/Edge Function si la key no debe exponerse al navegador.
- Confirmar el nombre exacto del modelo Nano Banana disponible en el proveedor elegido.

## 9. Opciones de rediseno para que no parezca tanto a IA

Estado: reporte de producto/UX, no implementado todavia.

Hallazgos:
- La interfaz usa mucho gradiente, brillos, cards grandes, copy con "IA", y secciones visualmente parecidas entre dashboards.

Sugerencias:
- Reducir gradientes y efectos decorativos; usar una paleta mas operacional.
- Priorizar tablas, listas densas y estados claros en dashboards.
- Cambiar copy de "IA" por nombres funcionales cuando sea posible.
- Unificar componentes de cards, tabs, modales y metricas para que parezca producto SaaS maduro.

## 10. Sacar agentes de IA del dashboard de proveedores

Estado: resuelto.

Cambios:
- `src/pages/SupplierDashboard.jsx`: se elimino la pestaña "Agentes de Venta IA" del header.
- Si una navegacion externa intenta abrir `activeTab: "agents"`, el dashboard redirige internamente a `quotes`.
- Se elimino la vista interna de agentes, dependencias de chat/voz y referencias del plan supplier.
