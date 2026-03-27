# Zentra Alignment

## 1. What I found in the external frontend

Reviewed path:
- `/mnt/c/Users/mateo/Desktop/Zentra-`

Observed stack:
- Vite + React + React Router
- Tailwind CSS
- Supabase auth + database helpers
- Heavy use of mock data for buyer and supplier dashboards

Key product positioning in that frontend:
- Chile-first B2B marketplace for food-service procurement
- Buyers: restaurants, hotels, pastelerias, catering
- Suppliers: food distributors and wholesalers
- Marketplace organized by product categories, not by consented contact pools
- Core loop is RFQ marketplace:
  1. buyer registers
  2. buyer publishes or requests a quote
  3. multiple suppliers respond
  4. buyer compares offers
  5. supplier upgrades plan and uses AI agents
- Supplier monetization is explicit subscription SaaS:
  - `starter`
  - `pro`
  - `enterprise`
- AI appears as a supplier-side accelerator, not the entire moat

Important domain shift:
- Our current implementation is still closer to `compliance-native outbound + provider campaigns + auditable buyer consent`
- Zentra frontend is closer to `procurement marketplace + quote engine + supplier operating system`

This is not a cosmetic difference. It changes the canonical data model.

Detailed execution plan:
- [docs/ZENTRA_EXECUTION_PLAN.md](/mnt/c/users/mateo/desktop/bodegadigital/docs/ZENTRA_EXECUTION_PLAN.md)

## 2. Compatibility with what we already built

### Reusable immediately

- Organization and multi-user auth
- Sessions and roles
- Provider dashboard shell
- Opportunity pipeline concepts
- Marketplace offers published by suppliers
- Audit timeline patterns
- Resettable development DB

### Reusable with adaptation

- Quote request flow
  - today it is more direct and provider-linked
  - Zentra needs buyer-created RFQs with multiple supplier offers
- Campaigns
  - still useful, but should become a supplier-side growth/retention tool
  - not the main product surface
- AI voice / AI outreach
  - still valuable, but should sit behind paid plans and supplier operations

### Mismatch / needs redesign

- Current core concept: consented buyer contact pool
- Zentra core concept: buyer companies + supplier catalogs + RFQs + offers
- Current vertical: HoReCa packaging / compliant outbound
- Zentra vertical: broader food-service procurement marketplace
- Current quote model: one request tied to one supplier offer
- Zentra quote model: one RFQ can receive multiple supplier offers

## 3. Recommended product interpretation

Best synthesis:

Zentra should be treated as:
- a B2B procurement marketplace for Chilean food service
- with a supplier SaaS layer
- and AI/compliance/audit as operational leverage

That means:
- marketplace is now the primary surface
- supplier CRM/agents are secondary but monetizable
- compliance remains useful, but not the headline anymore

## 4. Recommended technical direction

I would **not** switch the backend source of truth to Supabase-only right now.

Reason:
- we already have working domain code in FastAPI
- sessions, roles, audit, quote flow, supplier-side actions, reset workflow already exist
- the external frontend is still mostly mocked

Recommended approach:
- keep the backend we already built as the product core
- use the Zentra frontend as the new UX/product specification
- migrate the data model and API to satisfy that frontend's real business flows

This avoids throwing away working backend logic while still adopting the better product framing.

## 5. Canonical model I would move to

### Main actors

- `organization`
  - a company on the platform
- `user`
  - belongs to an organization
- `buyer_profile`
  - procurement metadata for buyer org
- `supplier_profile`
  - sales/commercial metadata for supplier org

### Marketplace core

- `category`
- `product`
  - supplier-owned listing with price, stock, unit, status
- `quote_request`
  - buyer-created RFQ
  - product name, quantity, unit, delivery date, notes, status
- `quote_offer`
  - supplier response to an RFQ
  - price, notes, status

### Commercial extensions

- `subscription_plan`
- `organization_subscription`
- `price_alert`
- `favorite_supplier`
- `review`
- `ai_agent`
- `agent_conversation`

### Keep from current system

- `audit_event`
- role-based permissions
- provider-side opportunity tracking

## 6. Migration strategy

### Phase A: product framing alignment

Do first:
- update copy from `compliance-native outbound` to `procurement marketplace + supplier operating system`
- narrow compliance language to trust, verification and audit
- expand categories from packaging to food-service supply

### Phase B: backend domain alignment

Do next:
- introduce buyer and supplier profiles as first-class records
- evolve quote flow into:
  - buyer creates RFQ
  - many suppliers can submit offers
  - buyer compares and accepts one
- keep current direct quote logic only if needed for transitional compatibility

### Phase C: frontend migration

Two options:

1. Rebuild Zentra UX inside current `apps/web`
- preserves monorepo
- easier local integration with current backend
- preferred path

2. Keep the external Vite app as a separate frontend
- faster visual adoption
- but creates duplicate app maintenance immediately

I recommend option 1 unless the user explicitly wants a separate app.

### Phase D: AI and plans

Only after RFQ marketplace works:
- subscription plans
- AI agents
- supplier automation
- voice tools
- price alerts

## 7. Immediate backlog I would execute

### P0

- define canonical RFQ marketplace schema in our backend
- add `buyer_profile` and `supplier_profile`
- add `quote_offer`
- make buyer-created quote requests independent from a specific supplier offer

### P1

- adapt dashboard logic to buyer-side and supplier-side views
- map products to supplier catalogs
- add buyer acceptance of an offer

### P2

- plans and subscriptions
- favorites and reviews
- price alerts

### P3

- AI agents
- conversations
- channel orchestration as premium supplier tooling

## 8. Concrete conclusion

The external Zentra frontend is not just "another UI".
It is a product-spec signal that the business is moving from:

- compliant outbound marketplace for packaging

toward:

- B2B food-service procurement marketplace with supplier SaaS tooling

So the right move is:
- keep our backend foundation
- treat Zentra frontend as the new business definition
- migrate the backend and current web app toward RFQs, multi-offer comparison, supplier catalogs and plans

That is the least wasteful path and the most consistent with what your friends actually designed.
