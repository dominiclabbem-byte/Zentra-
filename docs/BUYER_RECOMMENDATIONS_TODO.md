# Buyer Recommendations TODO

## Estado actual

Ya existe una `v1` heurística para la sección `Para ti` en buyer.

Señales activas hoy:
- RFQs previas del buyer
- búsquedas recientes locales
- eventos persistidos en `buyer_activity_events`
- proveedores favoritos
- ofertas aceptadas / interacción previa con suppliers
- alertas de precio y cambios recientes
- verificación del proveedor
- frescura básica del producto

Infraestructura ya implementada:
- tabla `buyer_activity_events`
- tracking de:
  - `search`
  - `product_view`
  - `supplier_view`
  - `favorite_added`
  - `favorite_removed`
  - `quote_created`
- uso de esos eventos dentro del ranking buyer actual
- tests unitarios/UI y Supabase local

Limitación explícita actual:
- no usamos cercanía geográfica como señal importante
- hoy sólo existe `city/address`
- más adelante la idea es usar dirección confirmada en mapa + `lat/lng`

## TODO 1: Explotar mejor los eventos en el ranking

Objetivo:
- pasar de una heurística básica a una personalización más fina usando frecuencia, recencia y contexto

### Trabajo pendiente

- ponderar recencia con decay temporal
  - búsqueda de ayer > búsqueda de hace 3 semanas
  - vista reciente > vista antigua

- ponderar frecuencia
  - si el buyer busca varias veces el mismo término, subir peso
  - si abre varias veces el mismo supplier o producto, subir peso

- dar más peso a conversiones
  - `quote_created` debería pesar más que `product_view`
  - `favorite_added` debería pesar más que una sola vista

- evitar repetición excesiva
  - no saturar las primeras cards con el mismo supplier
  - introducir diversidad por supplier/categoría

- separar mejor la experiencia por bloques
  - `Basado en tus búsquedas`
  - `Porque viste este proveedor`
  - `Oportunidades recientes`
  - `Relacionados con tus RFQs`

- enriquecer metadata al trackear
  - origen del evento: `catalog`, `supplier_profile`, `recommendation`, etc.
  - término de búsqueda normalizado
  - categoría inferida cuando corresponda

### Resultado esperado

- una sección `Para ti` menos genérica
- mejor orden en primeras posiciones
- recomendaciones más defendibles visualmente y en producto

## TODO 2: Similitud entre buyers

Objetivo:
- agregar una capa de recomendación basada en patrones parecidos entre buyers, sin depender todavía de ML pesado

### Enfoque recomendado

Primero heurístico:
- mismo `business_type`
- categorías compartidas
- búsquedas compartidas
- RFQs similares
- favoritos parecidos

Después, si hay volumen suficiente:
- modelos de similitud más sofisticados
- embeddings / vector search
- collaborative filtering más serio

### Trabajo pendiente

- definir score de similitud entre buyers
  - por rubro
  - por categorías
  - por términos de búsqueda
  - por intención comercial (`quote_created`)

- generar insights derivados
  - `Otros buyers como tú también vieron...`
  - `Muy cotizado entre pastelerías`
  - `Proveedores frecuentes en tu rubro`

- decidir si esto se calcula:
  - en tiempo real simple
  - con materialización periódica
  - o con una vista agregada/intermedia

- revisar privacidad / producto
  - las recomendaciones deben usar similitud agregada
  - no exponer datos identificables de otros buyers

### Resultado esperado

- capa de descubrimiento más rica
- recomendaciones menos dependientes del historial individual inmediato
- mejor cold start para buyers con poca actividad

## No prioritario por ahora

- geolocalización real por distancia
- omnicanal / señales externas
- ML pesado
- embeddings como base principal del ranking

## Condición para retomar

Retomar estos TODOs cuando:
- el tracking actual ya esté estable en producción o staging
- exista algo de volumen real de eventos
- valga la pena calibrar el ranking con datos reales en vez de sólo heurística manual
