# TicketDesk

A multi-tenant SaaS support ticketing platform built with FastAPI. Think a lean, self-hostable Zendesk — companies sign up, invite agents, manage customer tickets, and upgrade via Stripe.

**Live demo:** _coming soon_  
**API docs (Swagger):** `http://localhost:8000/docs`

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                     Client / Browser                │
└────────────────────────┬────────────────────────────┘
                         │ HTTPS
┌────────────────────────▼────────────────────────────┐
│                  FastAPI  (port 8000)               │
│                                                     │
│  ┌──────────┐  ┌────────┐  ┌──────────────────────┐│
│  │   Auth   │  │ RBAC   │  │  Rate Limit          ││
│  │ JWT RS   │  │ owner/ │  │  Middleware           ││
│  │ access + │  │ admin/ │  │  (per-tenant Redis    ││
│  │ refresh  │  │ agent  │  │   fixed-window)       ││
│  └──────────┘  └────────┘  └──────────────────────┘│
│                                                     │
│  Routers: auth · users · tickets · comments        │
│           customers · billing · webhooks           │
└───────────┬──────────────────────┬─────────────────┘
            │ SQLAlchemy ORM       │ redis.asyncio
┌───────────▼──────┐    ┌──────────▼──────────┐
│   PostgreSQL     │    │       Redis          │
│   (Alembic)      │    │  rate-limit buckets  │
└──────────────────┘    └─────────────────────┘
            │
     Stripe webhooks → subscription tier sync
```

**Key design choices:**

- **Multi-tenancy** — every DB query is scoped to `tenant_id` extracted from the JWT. Cross-tenant access is structurally impossible from application code.
- **RBAC** — owner / admin / agent hierarchy enforced by a single `require_role()` FastAPI dependency.
- **Rate limiting** — fixed-window counter in Redis keyed by `tenant_id`. Limits are baked into the access token at login so the middleware never hits the database.
- **Stripe** — webhook signature verification on every event; `checkout.session.completed` upgrades the tenant tier on both the `Tenant` and `Subscription` rows.

---

## Tech stack

| Layer | Technology |
|---|---|
| API | FastAPI 0.136 |
| Database | PostgreSQL 16 (SQLite for local dev) |
| ORM / Migrations | SQLAlchemy 2 + Alembic |
| Auth | JWT (python-jose) + bcrypt |
| Email | Resend |
| Payments | Stripe |
| Rate limiting | Redis 7 |
| Container | Docker + docker-compose |

---

## Local development (SQLite, no Docker)

**Prerequisites:** Python 3.11+

```bash
# 1. Clone and enter the backend directory
cd backend

# 2. Create and activate a virtual environment
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Copy the example env and fill in your secrets
cp .env.docker .env
# Edit .env: set SECRET_KEY, RESEND_API_KEY, STRIPE_* keys

# 5. Run Alembic migrations
alembic upgrade head

# 6. (Optional) Seed the database with fake data
python seed.py

# 7. Start the development server
uvicorn main:app --reload --port 8000
```

Open [http://localhost:8000/docs](http://localhost:8000/docs) for the interactive Swagger UI.

---

## Running with Docker

**Prerequisites:** Docker Desktop

```bash
# 1. Copy and configure the Docker env file
cp backend/.env.docker backend/.env.docker
# Edit backend/.env.docker: set SECRET_KEY, RESEND_API_KEY, STRIPE_* keys

# 2. Build and start all services
docker compose up --build

# 3. (Optional) Seed the database
docker compose exec api python seed.py
```

Services:

| Service | URL |
|---|---|
| API | http://localhost:8000 |
| Swagger UI | http://localhost:8000/docs |
| PostgreSQL | localhost:5432 |
| Redis | localhost:6379 |

---

## Environment variables

| Variable | Description | Default |
|---|---|---|
| `DATABASE_URL` | SQLAlchemy DB URL | `sqlite:///./database.db` |
| `REDIS_URL` | Redis connection URL | `redis://localhost:6379/0` |
| `SECRET_KEY` | JWT signing secret — **change before deploying** | — |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Access token TTL | `15` |
| `REFRESH_TOKEN_EXPIRE_DAYS` | Refresh token TTL | `7` |
| `RESEND_API_KEY` | Resend API key for transactional email | — |
| `RESEND_FROM_EMAIL` | Sender address | `noreply@ticketdesk.dev` |
| `FRONTEND_URL` | Base URL for email links | `http://localhost:3000` |
| `STRIPE_SECRET_KEY` | Stripe secret key | — |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | — |
| `STRIPE_PAID_PRICE_ID` | Stripe Price ID for the paid plan | — |
| `RATE_LIMIT_FREE` | Requests/min for free tier | `100` |
| `RATE_LIMIT_PAID` | Requests/min for paid tier | `1000` |

---

## API reference

Full interactive docs at `/docs`. Key endpoints:

### Auth
| Method | Path | Description |
|---|---|---|
| `POST` | `/auth/signup` | Create tenant + owner account |
| `POST` | `/auth/login` | Get access + refresh tokens |
| `POST` | `/auth/refresh` | Rotate tokens |
| `POST` | `/auth/verify-email` | Verify email address |
| `POST` | `/auth/forgot-password` | Request password reset |
| `POST` | `/auth/reset-password` | Set new password |

### Users
| Method | Path | Description | Roles |
|---|---|---|---|
| `GET` | `/users/me` | Current user profile | any |
| `GET` | `/users/` | List tenant users | owner, admin |
| `POST` | `/users/invite` | Invite a new user | owner, admin |
| `PATCH` | `/users/{id}` | Update user / deactivate | owner (self: any) |

### Tickets
| Method | Path | Description | Roles |
|---|---|---|---|
| `GET` | `/tickets/` | List tickets (paginated, filterable) | any |
| `POST` | `/tickets/` | Create ticket | owner, admin |
| `GET` | `/tickets/{id}` | Get ticket | any |
| `PATCH` | `/tickets/{id}` | Update ticket | any (scoped by role) |
| `GET` | `/tickets/{id}/comments` | List comments | any |
| `POST` | `/tickets/{id}/comments` | Add comment | any |

### Customers
| Method | Path | Description | Roles |
|---|---|---|---|
| `GET` | `/customers/` | List customers | owner, admin |
| `POST` | `/customers/` | Create customer | owner, admin |
| `GET` | `/customers/{id}` | Get customer | owner, admin |
| `PATCH` | `/customers/{id}` | Update customer | owner, admin |
| `DELETE` | `/customers/{id}` | Delete customer | owner |

### Billing
| Method | Path | Description | Roles |
|---|---|---|---|
| `GET` | `/billing` | Subscription status | owner |
| `POST` | `/billing/checkout-session` | Create Stripe Checkout URL | owner |
| `POST` | `/webhooks/stripe` | Stripe event handler | — |

---

## Database migrations

```bash
# Apply all pending migrations
alembic upgrade head

# Create a new migration after model changes
alembic revision --autogenerate -m "describe_the_change"

# Roll back one migration
alembic downgrade -1

# View migration history
alembic history --verbose
```

---

## Seed script

```bash
# Seed with default 3 tenants
python seed.py

# Seed with a custom number of tenants
python seed.py --tenants 5
```

Each tenant gets 1 owner, 1 admin, 2 agents, 10 customers, 30 tickets, and comments. All seed accounts use the password `Password1!`.

---

## Deployment

The project is ready to deploy on [Railway](https://railway.app), [Render](https://render.com), or [Fly.io](https://fly.io).

**Minimum required services:** PostgreSQL, Redis, and the FastAPI app container.

Before deploying:
1. Set all environment variables in your hosting platform's dashboard.
2. Generate a strong `SECRET_KEY`: `python -c "import secrets; print(secrets.token_hex(32))"`
3. Configure your Stripe webhook endpoint to point at `https://your-domain.com/webhooks/stripe`.
4. The app runs `alembic upgrade head` on container startup — no manual migration step needed.
