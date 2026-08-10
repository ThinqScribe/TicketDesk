# 🎫 TicketDesk

**A multi-tenant SaaS support ticketing platform built with FastAPI and React.**

TicketDesk gives businesses a fully isolated workspace to manage customer support tickets with a team of agents — complete with role-based access, inbound email-to-ticket conversion, Stripe billing, Redis rate limiting, and automated email notifications.

[![Deploy Backend](https://github.com/yourusername/ticketdesk/actions/workflows/backend-deploy.yml/badge.svg)](https://github.com/yourusername/ticketdesk/actions/workflows/backend-deploy.yml)
[![Deploy Frontend](https://github.com/yourusername/ticketdesk/actions/workflows/frontend-deploy.yml/badge.svg)](https://github.com/yourusername/ticketdesk/actions/workflows/frontend-deploy.yml)
[![Tests](https://github.com/yourusername/ticketdesk/actions/workflows/tests.yml/badge.svg)](https://github.com/yourusername/ticketdesk/actions/workflows/tests.yml)

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Deployment](#deployment)
- [CI/CD](#cicd)

---

## Features

### Authentication & Security
- JWT access + refresh token pair (access: 60 min, refresh: 7 days)
- Automatic token rotation on refresh
- bcrypt password hashing
- Email verification (24-hour signed token)
- Password reset flow (30-minute signed token)
- Email enumeration-safe forgot-password endpoint
- Account activation/deactivation by owner

### Role-Based Access Control
Three roles with strictly enforced permissions:

| Capability | Owner | Admin | Agent |
|---|:---:|:---:|:---:|
| Invite admins | ✅ | ❌ | ❌ |
| Invite agents | ✅ | ✅ | ❌ |
| Remove users | ✅ | ❌ | ❌ |
| Change roles | ✅ | ❌ | ❌ |
| Manage customers | ✅ | ✅ | ❌ |
| Create/delete tickets | ✅ | ✅ | ❌ |
| Update assigned tickets | ✅ | ✅ | ✅ |
| View internal notes | ✅ | ✅ | ❌ |
| Manage billing | ✅ | ❌ | ❌ |

### Ticket Management
- Status lifecycle: `open` → `pending` → `resolved` → `closed`
- Priority levels: `low`, `normal`, `high`, `urgent`
- `closed_at` timestamp set automatically on close, cleared on re-open
- Full-text search on subject and description
- Filters by status, priority, assigned agent
- Pagination via `skip` / `limit`
- Ticket stats endpoint (counts by status and priority)

### Comments & Internal Notes
- Public and internal (`is_internal`) comments on tickets
- Agents can't see or create internal notes
- Agents can only comment on their assigned tickets
- Author resolved to display name and initials

### Customer Management
- Per-tenant customer registry (email unique per tenant, enforced by DB constraint)
- Customer auto-created when ticket arrives via inbound email
- Delete blocked if customer has open/pending tickets

### Inbound Email → Ticket
- Customers email `support+<tenant-slug>@<domain>` to open a ticket automatically
- Resend parses the email and POSTs to the webhook
- Svix/HMAC-SHA256 signature verification
- Find-or-create customer from sender address
- Strips quoted reply chains from email body
- Confirmation email sent to customer with ticket reference

### Billing & Subscriptions (Stripe)
- Free and Paid tiers
- Stripe Checkout session creation (auto-creates Stripe Customer on first purchase)
- Stripe Customer Portal for subscription/payment management
- Webhook handler with signature verification for 4 event types:
  - `checkout.session.completed` → upgrades to paid
  - `customer.subscription.updated` → syncs tier changes and renewals
  - `customer.subscription.deleted` → downgrades to free
  - `invoice.payment_failed` → downgrades to free
- Subscription tier mirrored on both `Tenant` and `Subscription` rows for fast lookups
- Compatible with Stripe API version `2025-03-31.basil` (`current_period_end` location change handled)

### Free Tier Quotas (HTTP 402 on breach)
- Max **50 open tickets** per tenant
- Max **3 active agents** per tenant
- Paid tenants bypass all quota checks

### Rate Limiting (Redis)
- Fixed-window per-tenant rate limiter using an atomic Lua script (no race conditions)
- Free tier: **100 req/min** | Paid tier: **1,000 req/min**
- Auth endpoints rate-limited by IP: **20 req/min** (no JWT available yet)
- Gracefully degrades (no-ops) if Redis is unavailable
- Skipped for `/webhooks/`, `/health`, `/docs`, `/openapi`, `/redoc`

### Email Notifications (Resend)
All email failures are logged but never propagate — a failed email never causes a 500.

| Trigger | Recipient |
|---|---|
| New signup | Verification email to new user |
| Invite | Temporary password email to invitee |
| Forgot password | Reset link email |
| Ticket created | Confirmation email to customer |
| Ticket resolved/closed | Status notification to customer |

### User Notification Preferences
Per-user toggles (updateable by the user themselves):
- `notify_new_tickets`
- `notify_ticket_updates`
- `notify_comments`

### Error Monitoring
- Sentry integration (activated when `SENTRY_DSN` is set)
- FastAPI + SQLAlchemy integrations
- Trace sample rate: 100% in debug, 10% in production

---

## Tech Stack

### Backend
| Layer | Technology |
|---|---|
| Framework | FastAPI 0.136, Uvicorn |
| Language | Python 3.13 |
| ORM | SQLAlchemy 2.0 |
| Migrations | Alembic |
| Validation | Pydantic v2 |
| Auth | python-jose (JWT), bcrypt / passlib |
| Database | PostgreSQL 16 (prod), SQLite (dev) |
| Cache | Redis 7 |
| Email | Resend |
| Payments | Stripe |
| Monitoring | Sentry |

### Frontend
| Layer | Technology |
|---|---|
| Framework | React 19, TypeScript 6 |
| Build | Vite 8 |
| Routing | React Router v6 |
| Styling | Tailwind CSS v4 |
| Icons | Lucide React |
| HTTP | Fetch API (typed wrapper with auto-refresh) |

### Infrastructure
| Service | Provider |
|---|---|
| Backend hosting | Railway |
| Frontend hosting | Vercel |
| Containerization | Docker + Docker Compose |
| CI/CD | GitHub Actions |

---

## Architecture

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────┐
│   React SPA     │─────▶│   FastAPI API    │─────▶│ PostgreSQL  │
│  (Vercel)       │      │   (Railway)      │      │  Database   │
└─────────────────┘      └──────────────────┘      └─────────────┘
                                  │
                                  ├─────▶ Redis   (rate limiting)
                                  ├─────▶ Stripe  (billing)
                                  ├─────▶ Resend  (email + inbound)
                                  └─────▶ Sentry  (error monitoring)

Inbound email flow:
  Customer email
    → Resend parses it
    → POST /webhooks/inbound-email
    → auto-create customer + ticket
    → confirmation email to customer
```

### Multi-tenancy model
Each tenant is a fully isolated workspace. `tenant_id` is embedded in the JWT and enforced on every query — no cross-tenant data leakage is possible at the ORM layer. Subscription tier is baked into the JWT for rate-limiting decisions without a DB round-trip.

---

## API Reference

All routes are mounted under the `API_PREFIX` (default `/api`).

### Auth — `/auth`
```
POST /auth/signup                 Register new account + tenant (returns JWT pair)
POST /auth/login                  Login (returns JWT pair)
POST /auth/refresh                Rotate refresh token (returns new JWT pair)
POST /auth/verify-email           Verify email with signed token
POST /auth/resend-verification    Resend verification email (requires auth)
POST /auth/forgot-password        Send password reset link
POST /auth/reset-password         Set new password with signed token
```

### Users — `/users`
```
GET    /users/me                  Current user profile + tenant info
GET    /users/                    List tenant users (owner/admin)
POST   /users/invite              Invite team member (sends email with temp password)
PATCH  /users/{id}                Update profile, role, active status, notifications
DELETE /users/{id}                Remove user from tenant (owner only)
```

### Tickets — `/tickets`
```
GET    /tickets/stats             Counts by status and priority
GET    /tickets/                  List tickets (filters: status, priority, q, assigned_to_me)
POST   /tickets/                  Create ticket (admin/owner, quota-gated)
GET    /tickets/{id}              Get single ticket
PATCH  /tickets/{id}              Update ticket (role-scoped field access)
DELETE /tickets/{id}              Delete ticket + comments (admin/owner)
```

### Comments — `/tickets/{id}/comments`
```
GET    /tickets/{id}/comments     List comments (agents: no internal notes)
POST   /tickets/{id}/comments     Add comment (agents: no internal notes, own tickets only)
```

### Customers — `/customers`
```
GET    /customers/                List customers with pagination (admin/owner)
POST   /customers/                Create customer
GET    /customers/{id}            Get customer
PATCH  /customers/{id}            Update customer
DELETE /customers/{id}            Delete customer (owner, blocked if open tickets exist)
```

### Billing — `/billing`
```
GET    /billing                           Subscription status (owner)
POST   /billing/checkout-session          Create Stripe Checkout session (owner)
POST   /billing/portal-session            Open Stripe Customer Portal (owner)
```

### Tenant — `/tenant`
```
GET    /tenant/me                 Current tenant details
```

### Webhooks
```
POST   /webhooks/stripe           Stripe event handler (signature-verified)
POST   /webhooks/inbound-email    Resend inbound email handler (Svix signature-verified)
```

### Health
```
GET    /health                    {"status": "ok", "timestamp": "..."}
GET    /                          {"message": "TicketDesk API is running", ...}
```

---

## Database Schema

```
Tenant ──(1:N)──▶ User
Tenant ──(1:N)──▶ Customer
Tenant ──(1:N)──▶ Ticket
Tenant ──(1:1)──▶ Subscription

User   ──(1:N)──▶ Ticket        (assigned_agent_id)
Customer ─(1:N)──▶ Ticket

Ticket ──(1:N)──▶ Comment
Comment.author → User OR Customer  [DB CHECK CONSTRAINT: exactly one set]
```

### Tables

**`tenant`**
`id, company_name (unique), slug (unique, indexed), stripe_customer_id, subscription_tier, created_at, updated_at`

**`user`**
`id, tenant_id (FK), email (unique), hashed_password, first_name, last_name, role (owner|admin|agent), is_active, is_verified, notify_new_tickets, notify_ticket_updates, notify_comments, created_at, updated_at`

**`customer`**
`id, tenant_id (FK), name, email` — unique constraint on `(tenant_id, email)`
`created_at, updated_at`

**`ticket`**
`id, tenant_id (FK, indexed), customer_id (FK), assigned_agent_id (FK, nullable), subject, description, status, priority, created_at, updated_at, closed_at (nullable)`

**`comment`**
`id, ticket_id (FK), author_user_id (FK, nullable), author_customer_id (FK, nullable), body, is_internal, created_at, updated_at`
DB check constraint: `(author_user_id IS NOT NULL) != (author_customer_id IS NOT NULL)`

**`subscription`**
`id, tenant_id (FK, unique), subscription_tier, is_subscribed, stripe_subscription_id (nullable), subscribed_at (nullable), current_period_end (nullable), created_at, updated_at`

### Migrations
Managed with Alembic. Migration history:
1. `20260807_2017` — initial schema
2. `20260810_1227` — add notification settings to user

---

## Quick Start

### Prerequisites
- Python 3.13+
- Node.js 20+
- PostgreSQL 16+ (or use SQLite for local dev by setting `DATABASE_URL=sqlite:///./database.db`)
- Redis (optional — rate limiting is skipped if unavailable)

### Backend

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Edit .env — at minimum set DATABASE_URL and SECRET_KEY
alembic upgrade head
uvicorn main:app --reload
```

Seed demo data (optional):
```bash
python seed.py
```

API available at http://localhost:8000  
Swagger UI at http://localhost:8000/docs

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
# Set VITE_API_URL=http://localhost:8000/api
npm run dev
```

App available at http://localhost:5173

### Docker (full stack)

```bash
# Copy and fill in env file
cp backend/.env.example backend/.env.docker

docker compose up --build
```

Services:
- API: http://localhost:8000
- PostgreSQL: localhost:5432
- Redis: localhost:6379

---

## Configuration

### Backend — `backend/.env`

```bash
# Database
DATABASE_URL=sqlite:///./database.db          # dev
# DATABASE_URL=postgresql://user:pass@host:5432/ticketdesk  # prod

# App
DEBUG=true
SECRET_KEY=generate-with-openssl-rand-hex-32
API_PREFIX=/api
FRONTEND_URL=http://localhost:5173
ALLOWED_ORIGINS=http://localhost:5173

# Tokens
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=7

# Email (Resend)
RESEND_API_KEY=re_your_key
RESEND_FROM_EMAIL=noreply@yourdomain.com
RESEND_INBOUND_SECRET=your-inbound-webhook-secret
INBOUND_EMAIL_DOMAIN=mail.yourdomain.com

# Stripe
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_PUBLIC_KEY=pk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
STRIPE_PAID_PRICE_ID=price_xxxxx

# Redis
REDIS_URL=redis://localhost:6379/0
RATE_LIMIT_FREE=100
RATE_LIMIT_PAID=1000

# Sentry (optional)
SENTRY_DSN=
```

### Frontend — `frontend/.env`

```bash
VITE_API_URL=http://localhost:8000/api
```

---

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for the full production guide.

### Backend → Railway

```bash
npm install -g @railway/cli
railway login
railway link
railway up --service backend
railway run alembic upgrade head
```

The Dockerfile runs `alembic upgrade head` automatically on container start before launching Uvicorn.

### Frontend → Vercel

```bash
npm install -g vercel
cd frontend
vercel --prod
```

Set `VITE_API_URL` in your Vercel project environment variables.

---

## CI/CD

### `tests.yml` — on push/PR to `main` or `develop`

**Backend:**
- Python 3.13, pip cache
- Black formatting check
- Flake8 lint (syntax errors and undefined names only)
- Import/syntax validation

**Frontend:**
- Node 20, npm cache
- TypeScript build check (`tsc -b && vite build`)
- ESLint

### `backend-deploy.yml` — on push to `main` (backend paths)
1. Install Railway CLI
2. `railway up --service backend`
3. `railway run alembic upgrade head`

### `frontend-deploy.yml` — on push to `main` (frontend paths)
1. `npm ci && npm run build` with `VITE_API_URL` from GitHub secrets
2. Deploy to Vercel with `--prod`

Both deployment workflows also support manual trigger via `workflow_dispatch`.

---

## Frontend Pages

### Public
| Route | Page |
|---|---|
| `/` | Landing page (hero, features, pricing, CTA) |
| `/login` | Sign in |
| `/signup` | Sign up (creates new tenant + owner account) |
| `/forgot-password` | Request password reset |
| `/reset-password` | Set new password (via email link) |
| `/verify-email` | Email verification (via email link) |

### Dashboard (protected by `DashboardLayout`)
| Route | Page |
|---|---|
| `/dashboard` | Overview — ticket stats cards |
| `/dashboard/tickets` | Ticket list with filters, search, create modal |
| `/dashboard/tickets/:id` | Ticket detail with comment thread |
| `/dashboard/customers` | Customer list, search, add modal |
| `/dashboard/agents` | Team management — invite, toggle active, remove |
| `/dashboard/reports` | Reports |
| `/dashboard/settings` | Settings |
| `/dashboard/notifications` | Per-user notification preferences |
| `/dashboard/billing` | Subscription status, upgrade / portal buttons |
| `/dashboard/billing/success` | Post-checkout confirmation (polls until webhook confirms) |
| `/dashboard/billing/cancel` | Checkout cancelled |

`DashboardLayout` provides `user` and `subscription` via React Router `Outlet` context to all child pages. The sidebar displays tenant name, slug, current plan badge, and an upgrade CTA on the free tier.

### Auth client (`lib/auth.ts` + `lib/api.ts`)
- Tokens stored in `localStorage` (`td_access`, `td_refresh`)
- JWT decoded client-side to check expiry (5-minute safety buffer)
- Auto-refresh on HTTP 401: retries original request with new access token
- On refresh failure: clears tokens and redirects to `/login`

---

## Project Structure

```
ticketdesk/
├── backend/
│   ├── alembic/            # Migration scripts
│   ├── core/
│   │   ├── config.py       # Pydantic settings
│   │   ├── dependencies.py # Auth dependencies + RBAC factory
│   │   ├── email.py        # Resend email helpers
│   │   ├── quota.py        # Free-tier quota enforcement
│   │   ├── rate_limit.py   # Redis rate limiter + ASGI middleware
│   │   └── security.py     # JWT + bcrypt helpers
│   ├── db/
│   │   └── database.py     # SQLAlchemy engine + session
│   ├── models/             # SQLAlchemy ORM models
│   ├── routers/            # FastAPI route handlers
│   ├── schemas/            # Pydantic request/response schemas
│   ├── main.py             # App factory, middleware, lifespan
│   ├── seed.py             # Demo data seeder
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── dashboard/  # DashboardLayout, Sidebar, StatCard, ...
│       │   └── landing/    # Navbar, HeroSection, ...
│       ├── lib/
│       │   ├── api.ts      # Typed API client
│       │   └── auth.ts     # Token storage helpers
│       └── pages/
│           ├── dashboard/  # All dashboard pages
│           └── *.tsx       # Public pages
├── .github/workflows/
│   ├── tests.yml
│   ├── backend-deploy.yml
│   └── frontend-deploy.yml
├── docker-compose.yml      # PostgreSQL + Redis + API
└── DEPLOYMENT.md
```
