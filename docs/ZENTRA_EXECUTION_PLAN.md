# Zentra Execution Plan

## 1. Decision and scope freeze

This plan assumes the product direction is now:

- Chile-first B2B food-service procurement marketplace
- buyer and supplier accounts
- supplier catalog and RFQ workflow
- supplier subscription SaaS
- AI and automation as paid operational tooling

This plan does **not** assume the original compliance-first outbound product remains the main surface.

Compliance, audit and traceability stay in the system, but as trust and operations layers, not as the headline wedge.

## 2. Recommended implementation strategy

### 2.1 Product source of truth

Use the external Zentra frontend as the product/UX/business reference.

### 2.2 Technical source of truth

Keep the current monorepo as the implementation base:
- backend: `apps/api`
- frontend: `apps/web`

### 2.3 Frontend migration approach

Recommended:
- port Zentra screens, components, flows and visual system into `apps/web`
- do **not** maintain two production frontends in parallel

Why:
- one auth/session model
- one deployment model
- one API contract
- less duplicated work

### 2.4 Backend direction

Do **not** force Supabase as the core backend yet.

Recommended:
- keep FastAPI + SQLAlchemy as the application backend
- use Supabase schema as a domain reference
- only adopt Supabase later if there is a strong product or team reason

## 3. Target architecture

### 3.1 Frontend

- Next.js app in `apps/web`
- Zentra visual language and UX patterns
- buyer area
- supplier area
- public marketplace landing and catalogs
- authenticated dashboards

### 3.2 Backend

- FastAPI modular monolith in `apps/api`
- SQLite in dev, Postgres in staging/prod
- session auth now, evolvable to JWT/managed auth later
- role and permission layer
- async jobs later for alerts, AI and notifications

### 3.3 Core bounded contexts

- identity and organizations
- buyer profiles
- supplier profiles
- catalog
- RFQ and offers
- subscriptions and entitlements
- reviews and favorites
- alerts
- AI operations
- audit and trust

## 4. Canonical domain model to build toward

### 4.1 Identity and tenancy

- `organization`
  - company-level tenant
  - type flags or role linkage: buyer, supplier, both
- `app_user`
  - belongs to an organization
  - roles: `admin`, `sales`, `ops`, `buyer_admin`, `buyer_member`
- `user_session`

### 4.2 Organization profiles

- `buyer_profile`
  - business type
  - monthly volume
  - preferred contact method
  - procurement metadata
- `supplier_profile`
  - giro
  - commercial description
  - verification fields
  - response rate
  - contact channels

### 4.3 Marketplace and procurement

- `category`
- `organization_category`
  - supplier categories
  - buyer interest categories
- `product`
  - supplier-owned listing
  - category
  - price
  - unit
  - stock
  - status
  - image
- `quote_request`
  - buyer-owned RFQ
  - product name
  - optional category
  - quantity
  - unit
  - delivery date
  - notes
  - status
- `quote_offer`
  - supplier response to RFQ
  - price
  - notes
  - status
- `favorite_supplier`
- `review`

### 4.4 Commercial SaaS

- `plan`
- `subscription`
- `usage_counter`
  - AI calls
  - contacts
  - alerts

### 4.5 AI and automation

- `ai_agent`
- `agent_conversation`
- `agent_message`
- `voice_call_log`
- `notification_log`

### 4.6 Trust and audit

- `verification_record`
  - RUT and documentation validation
- `audit_event`
- optional later:
  - `document_asset`
  - `compliance_check`

## 5. What from the current codebase stays, adapts, or gets deprecated

### 5.1 Keep

- multi-user auth and sessions
- roles and permission foundation
- audit events
- provider dashboard shell patterns
- database reset tooling
- marketplace page shell and general app infrastructure

### 5.2 Adapt

- `Organization` -> central tenant for buyer/supplier orgs
- `ProviderOffer` -> becomes `Product`
- `QuoteRequest` -> becomes buyer-created RFQ, not supplier-specific request
- current supplier opportunity detail -> evolve into RFQ offer workspace
- current campaigns/AI tooling -> keep as premium supplier ops feature

### 5.3 Deprioritize or phase out

- consent-first contact pool as primary object
- outbound campaign-first narrative
- buyer intake as the central demand surface

## 6. Execution stages

## Stage 0. Product freeze and repository alignment

Goal:
- freeze the new product definition so implementation stops oscillating

Backend work:
- decide canonical entities listed above
- define naming conventions
- mark legacy entities as:
  - keep
  - transform
  - deprecate
- define migration strategy from current SQLite dev schema

Frontend work:
- choose migration direction:
  - recommended: port Zentra UI into `apps/web`
- document page map:
  - `/`
  - `/registro-comprador`
  - `/registro-proveedor`
  - `/dashboard-comprador`
  - `/dashboard-proveedor`
  - `/marketplace`

Project work:
- create API contract doc
- create phase checklist
- define demo personas and seed scenarios

Done when:
- team agrees on domain language
- no more ambiguity between outbound product vs procurement marketplace

## Stage 1. Core identities, roles, and profiles

Goal:
- organizations and users can exist as buyers, suppliers or both

Backend modifications:
- extend `Organization` to support organization type and verification state
- add `BuyerProfile`
- add `SupplierProfile`
- extend `AppUser.role`
- add profile endpoints:
  - `GET /me`
  - `PATCH /me`
  - `GET /buyer-profile`
  - `PATCH /buyer-profile`
  - `GET /supplier-profile`
  - `PATCH /supplier-profile`
- add organization verification fields:
  - RUT
  - city
  - address
  - phone
  - whatsapp
  - website
  - description
  - verified

Frontend modifications:
- rebuild Zentra registration forms inside Next
- buyer registration flow:
  - business data
  - business type
  - interest categories
  - preferred contact method
- supplier registration flow:
  - company info
  - categories
  - plan selection
- profile edit flows in dashboards

Required backend decisions:
- whether one organization can be both buyer and supplier
  - recommended: yes

Testing:
- register buyer org
- register supplier org
- login/logout
- edit profile
- role permissions still work

Done when:
- buyer and supplier profiles exist and persist correctly

## Stage 2. Categories, products, and supplier catalogs

Goal:
- suppliers can publish real catalogs and buyers can browse them

Backend modifications:
- create `Category`
- create `OrganizationCategory`
- replace or evolve `ProviderOffer` into `Product`
- add product fields:
  - supplier organization id
  - category id
  - name
  - description
  - price
  - price unit
  - stock
  - stock unit
  - status
  - image url
- endpoints:
  - `GET /categories`
  - `GET /products`
  - `POST /products`
  - `PATCH /products/:id`
  - `DELETE /products/:id`
  - `GET /suppliers/:slug/catalog`

Frontend modifications:
- supplier dashboard:
  - products tab
  - add/edit/delete product
  - image upload placeholder support
- public marketplace:
  - list products
  - filter by category
  - filter by supplier
  - search by product name
- supplier public profile page:
  - products
  - categories
  - verification badge

Data work:
- seed realistic categories for food service
- seed 3-5 suppliers with 8-15 products each

Testing:
- supplier can CRUD only own products
- public catalog loads and filters correctly

Done when:
- a buyer can browse supplier products and compare visible pricing

## Stage 3. RFQ marketplace v1

Goal:
- build the real core loop: buyer RFQ -> supplier offers -> buyer comparison

Backend modifications:
- redesign `QuoteRequest`
  - owned by buyer org
  - not linked to a single supplier offer
  - fields:
    - buyer organization id
    - requester user id
    - product name
    - category id optional
    - quantity
    - unit
    - delivery date
    - notes
    - status: `open`, `in_review`, `closed`, `cancelled`
- create `QuoteOffer`
  - quote id
  - supplier organization id
  - responder user id
  - price
  - notes
  - estimated lead time
  - status: `pending`, `accepted`, `rejected`, `withdrawn`
- endpoints:
  - `POST /quote-requests`
  - `GET /quote-requests/my`
  - `GET /quote-requests/open`
  - `GET /quote-requests/:id`
  - `POST /quote-requests/:id/offers`
  - `GET /quote-requests/:id/offers`
  - `POST /quote-offers/:id/accept`
  - `POST /quote-requests/:id/cancel`

Authorization:
- buyers see own RFQs
- suppliers see open RFQs and their own offers
- buyers only accept offers on their own RFQs

Audit:
- RFQ created
- offer submitted
- offer accepted
- RFQ closed

Frontend modifications:
- buyer registration success should lead into RFQ creation
- buyer dashboard:
  - create RFQ modal
  - list RFQs
  - status badges
  - offer count
- supplier dashboard:
  - quote inbox
  - submit offer modal
  - view buyer profile summary

Testing:
- buyer creates RFQ
- multiple suppliers offer
- buyer accepts one
- remaining offers auto-reject
- RFQ closes correctly

Done when:
- the main marketplace transaction works end-to-end

## Stage 4. Buyer dashboard complete

Goal:
- buyer area becomes operational, not just a quote form

Backend modifications:
- add favorite suppliers
- add buyer-specific summary endpoints:
  - recent RFQs
  - accepted offers
  - favorite suppliers
  - relevant price alerts
- add supplier profile detail for buyer view

Frontend modifications:
- buyer dashboard tabs:
  - catalog
  - cotizaciones
  - alertas
  - proveedores favoritos
  - perfil
- supplier profile modal/page:
  - company details
  - categories
  - reviews
  - recent products
- compare offers view:
  - sorted by price
  - lead time
  - verification
  - rating

UX work:
- improve RFQ history states
- clear empty states
- accepted offer confirmation state

Testing:
- buyer can review and accept offers smoothly
- favorites persist
- profile edits persist

Done when:
- buyer can use the platform repeatedly without admin help

## Stage 5. Supplier dashboard complete

Goal:
- supplier dashboard becomes the real paid workspace

Backend modifications:
- supplier summary endpoints:
  - open RFQs relevant to their categories
  - submitted offers
  - accepted offers
  - win rate
  - response rate
- add internal pipeline status per offer or per RFQ response
- optional:
  - supplier notes on buyer
  - follow-up tasks

Frontend modifications:
- supplier dashboard tabs:
  - quote inbox
  - products
  - buyers
  - agents IA
  - plan
  - perfil
- quote response workspace:
  - buyer summary
  - demand context
  - submit offer
  - offer history
- product detail modal:
  - edit
  - stock updates
  - image handling

Testing:
- supplier can manage catalog
- supplier can respond quickly to RFQs
- stats reflect real data

Done when:
- supplier dashboard is good enough to justify charging

## Stage 6. Plans, subscriptions, and entitlements

Goal:
- supplier monetization stops being mock-only

Backend modifications:
- create `Plan`
- create `Subscription`
- create entitlement checks:
  - max active products? optional
  - max RFQ responses? optional
  - AI agent access
  - voice access
  - CRM/export access
  - API access
- plan endpoints:
  - `GET /plans`
  - `GET /subscription`
  - `POST /subscription/select`
- usage tracking:
  - conversations this month
  - AI calls this month
  - quote responses this month

Frontend modifications:
- supplier registration plan choice wired to backend
- plan page in supplier dashboard
- upgrade CTA gates
- locked feature states

Billing strategy:
- MVP can start with manual billing + internal subscription state
- payment gateway later

Testing:
- feature gates behave correctly for `starter`, `pro`, `enterprise`

Done when:
- plan selection and entitlements work in product, even if billing is manual

## Stage 7. Reviews, trust, and verification

Goal:
- strengthen marketplace trust and conversion

Backend modifications:
- add review model and endpoints
- add supplier verification records
- add buyer verification state
- average rating aggregation
- expose verification badges in API

Frontend modifications:
- supplier cards show:
  - verified
  - city
  - rating
  - categories
- buyer can review accepted supplier transactions
- trust banners on landing and profiles

Testing:
- only relevant counterparties can review
- rating aggregates correctly

Done when:
- trust layer is visible and credible in the marketplace

## Stage 8. Price alerts and buyer retention

Goal:
- give buyers a reason to come back even when they are not actively creating RFQs

Backend modifications:
- create `PriceAlert`
- create `PriceAlertSubscription`
- background job for price change detection
- buyer endpoints:
  - subscribe by category
  - subscribe by product
  - list alerts

Frontend modifications:
- alerts tab in buyer dashboard
- subscribe/unsubscribe UI
- badges on products with recent price movement

Testing:
- price changes generate alerts
- buyer sees relevant alerts only

Done when:
- buyer retention loop exists

## Stage 9. AI supplier tooling

Goal:
- implement the premium operational layer shown in Zentra

Backend modifications:
- create `AiAgent`
- create `AgentConversation`
- create `AgentMessage`
- usage counters by plan
- provider integrations for:
  - LLM chat assistant
  - TTS
  - optional STT
  - optional outbound voice call logs
- endpoints:
  - list agents
  - create agent
  - send message
  - list conversations

Frontend modifications:
- supplier dashboard AI tab
- agent selection
- chat workspace
- voice call UI state
- activity logs

Important sequencing:
- this should only come after RFQ marketplace and plans

Testing:
- plan gating works
- chat logs persist
- voice state is observable even if mocked initially

Done when:
- `pro` and `enterprise` plans visibly unlock differentiated workflow value

## Stage 10. Notifications and workflow automation

Goal:
- reduce manual follow-up and increase marketplace responsiveness

Backend modifications:
- notification jobs:
  - RFQ created
  - new offer received
  - offer accepted
  - price alert triggered
- channels:
  - email first
  - WhatsApp later
- notification preferences

Frontend modifications:
- notification center or lightweight badges
- user preferences for channels

Testing:
- events trigger correct notifications

Done when:
- users do not need to poll the platform constantly

## Stage 11. Hardening, analytics, and launch readiness

Goal:
- move from MVP demo to stable pilot product

Backend work:
- migrate SQLite dev assumptions to Postgres for non-dev environments
- indexes
- pagination
- rate limiting
- audit coverage
- error handling normalization
- admin tooling
- seed profiles:
  - demo marketplace
  - empty
  - stress-test

Frontend work:
- loading states
- empty states
- permission-denied states
- responsive cleanup
- error boundaries
- SEO/meta for public pages

Analytics:
- RFQ created
- RFQ matched
- offer submitted
- offer accepted
- supplier activation
- plan conversion

Testing:
- unit tests on domain services
- integration tests on RFQ flow
- manual QA script for buyer and supplier journeys

Done when:
- pilot customers can use the system without developer intervention

## 7. Concrete backend roadmap by file area

### `apps/api/app/models`

Need:
- new entities:
  - `BuyerProfile`
  - `SupplierProfile`
  - `Category`
  - `OrganizationCategory`
  - `Product`
  - `QuoteOffer`
  - `Plan`
  - `Subscription`
  - `Review`
  - `FavoriteSupplier`
  - `PriceAlert`
  - `PriceAlertSubscription`
  - `AiAgent`
  - `AgentConversation`
  - `AgentMessage`
- adapt:
  - `Organization`
  - `QuoteRequest`

### `apps/api/app/routers`

Need routers for:
- auth
- organizations/profiles
- categories
- products
- quote requests
- quote offers
- buyer dashboard
- supplier dashboard
- plans/subscriptions
- reviews
- favorites
- alerts
- ai agents

### `apps/api/app/services`

Need services for:
- matching RFQs to suppliers
- entitlement checks
- offer acceptance rules
- review eligibility
- alert generation
- seed generation
- audit event generation

### `apps/api/app/scripts`

Need:
- reset DB
- seed profiles
- optional import scripts for categories/products

## 8. Concrete frontend roadmap by page

### Public

- landing
- supplier registration
- buyer registration
- supplier public profile
- marketplace catalog

### Buyer

- buyer dashboard
- create RFQ
- RFQ detail
- compare offers
- favorites
- alerts
- edit buyer profile

### Supplier

- supplier dashboard
- quote inbox
- offer submission
- products tab
- product detail/edit modal
- AI agents tab
- plan tab
- edit supplier profile

## 9. API contract priorities

Build in this order:

1. auth and profiles
2. categories and products
3. buyer RFQs
4. supplier offers
5. buyer offer acceptance
6. buyer and supplier dashboard summary endpoints
7. plans and subscriptions
8. reviews and favorites
9. alerts
10. AI agents

## 10. Data migration guidance from current backend

Map current entities roughly like this:

- `Organization` -> keep
- `AppUser` -> keep
- `ProviderOffer` -> migrate to `Product`
- `QuoteRequest` -> redesign
- `Contact` -> split conceptually:
  - some fields become buyer org/profile fields
  - others become obsolete for the marketplace core
- `Campaign` -> preserve but move to later premium tooling phase

Recommended migration strategy during MVP:
- because data is disposable, prefer schema rewrite + reseed
- do not overinvest in backward compatibility yet

## 11. Suggested execution order for the next actual coding blocks

If implementing from tomorrow, I would do:

### Block 1

- buyer and supplier profiles
- categories
- product catalog

### Block 2

- RFQ schema rewrite
- quote offers
- buyer creates RFQ
- supplier submits offers

### Block 3

- buyer compares and accepts offers
- supplier and buyer dashboards tied to real data

### Block 4

- plans and gating
- reviews and favorites

### Block 5

- price alerts
- AI agents
- notifications

## 12. Definition of success

The project is working well when:

- a buyer can register, edit profile, browse products and create an RFQ
- multiple suppliers can respond to the same RFQ
- the buyer can compare and accept one offer
- the supplier can manage products and see a useful dashboard
- paid plans visibly unlock premium supplier functionality
- the UI feels aligned with Zentra, not with the old outbound-first concept

That is the path that gets the product from current prototype state to a coherent full marketplace.
