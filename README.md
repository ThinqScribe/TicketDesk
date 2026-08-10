# 🎫 TicketDesk

**A modern, multi-tenant SaaS support ticketing platform built with FastAPI and React.**

TicketDesk helps businesses manage customer support tickets efficiently with features like ticket management, team collaboration, customer portal, and integrated billing.

[![Deploy Backend](https://github.com/yourusername/ticketdesk/actions/workflows/backend-deploy.yml/badge.svg)](https://github.com/yourusername/ticketdesk/actions/workflows/backend-deploy.yml)
[![Deploy Frontend](https://github.com/yourusername/ticketdesk/actions/workflows/frontend-deploy.yml/badge.svg)](https://github.com/yourusername/ticketdesk/actions/workflows/frontend-deploy.yml)

---

## ✨ Features

### 🎫 **Ticket Management**
- Create, update, and track support tickets
- Priority levels: Low, Normal, High, Urgent
- Status tracking: Open, Pending, Resolved, Closed
- Full-text search across tickets
- Rich commenting system with internal notes
- Email notifications for ticket updates

### 👥 **Team Collaboration**
- Role-based permissions (Owner, Admin, Agent)
- Assign tickets to team members
- Internal notes for agent collaboration
- User invitation system
- Activity tracking and audit logs

### 🏢 **Multi-Tenancy**
- Complete tenant isolation
- Custom branding per tenant
- Subdomain support ready
- Shared-nothing architecture

### 💳 **Billing & Subscriptions**
- Stripe integration for payments
- Free and Pro tier plans
- Usage-based quota enforcement
- Self-service subscription management
- Stripe Customer Portal integration

### 🔐 **Security & Authentication**
- JWT-based authentication
- Bcrypt password hashing
- Email verification
- Password reset flow
- Refresh token rotation
- Rate limiting per tenant

### 📧 **Email Integration**
- Transactional emails via Resend
- Ticket notifications
- User invitations
- Password reset emails
- Customizable templates

### 📊 **Analytics & Reporting**
- Ticket statistics dashboard
- Agent performance metrics
- Status and priority breakdowns
- Real-time updates

---

## 🚀 Quick Start

### Prerequisites

- **Python 3.13+**
- **Node.js 20+**
- **PostgreSQL 15+** (production) or SQLite (development)
- **Redis** (optional, for rate limiting)

### Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/ticketdesk.git
   cd ticketdesk
   ```

2. **Set up the backend:**
   ```bash
   cd backend
   pip install -r requirements.txt
   cp .env.example .env
   # Edit .env with your configuration
   alembic upgrade head
   python -m uvicorn main:app --reload
   ```

3. **Set up the frontend:**
   ```bash
   cd frontend
   npm install
   cp .env.example .env
   # Edit .env with your backend URL
   npm run dev
   ```

4. **Access the application:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

---

## 📦 Tech Stack

### Backend
- **Framework:** FastAPI 0.136+
- **Database:** PostgreSQL + SQLAlchemy
- **Authentication:** JWT with python-jose
- **Migrations:** Alembic
- **Email:** Resend
- **Payments:** Stripe
- **Rate Limiting:** Redis
- **Monitoring:** Sentry

### Frontend
- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite
- **Routing:** React Router v6
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **HTTP Client:** Fetch API

---

## 🏗️ Architecture

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────┐
│   React SPA     │─────▶│   FastAPI API    │─────▶│ PostgreSQL  │
│   (Frontend)    │      │    (Backend)     │      │  Database   │
└─────────────────┘      └──────────────────┘      └─────────────┘
                                │
                                ├─────▶ Stripe (Payments)
                                ├─────▶ Resend (Email)
                                ├─────▶ Redis (Rate Limiting)
                                └─────▶ Sentry (Monitoring)
```

---

## 🔧 Configuration

### Backend Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/ticketdesk

# Security
SECRET_KEY=your-secret-key-here
DEBUG=false

# URLs
FRONTEND_URL=https://yourdomain.com
ALLOWED_ORIGINS=https://yourdomain.com

# Email (Resend)
RESEND_API_KEY=re_xxxxx
RESEND_FROM_EMAIL=noreply@yourdomain.com

# Stripe
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_PUBLIC_KEY=pk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
STRIPE_PAID_PRICE_ID=price_xxxxx

# Redis (optional)
REDIS_URL=redis://localhost:6379

# Monitoring (optional)
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
```

### Frontend Environment Variables

```bash
VITE_API_URL=https://api.yourdomain.com/api
```

---

## 🚢 Deployment

See the comprehensive [DEPLOYMENT.md](./DEPLOYMENT.md) guide for detailed production deployment instructions.

### Quick Deploy

1. **Backend to Railway:**
   ```bash
   railway login
   railway link
   railway up
   ```

2. **Frontend to Vercel:**
   ```bash
   vercel login
   vercel --prod
   ```

3. **Run migrations:**
   ```bash
   railway run alembic upgrade head
   ```

### GitHub Actions

Automatic deployments are configured for:
- Backend → Railway (on push to `main`)
- Frontend → Vercel (on push to `main`)
- Tests run on all PRs

---

## 📖 API Documentation

Once the backend is running, visit:
- **Interactive Docs:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

### Key Endpoints

```
POST   /api/auth/signup           - Create new account
POST   /api/auth/login            - Login
POST   /api/auth/refresh          - Refresh token
GET    /api/users/me              - Get current user
GET    /api/tickets               - List tickets
POST   /api/tickets               - Create ticket
GET    /api/tickets/:id           - Get ticket details
PATCH  /api/tickets/:id           - Update ticket
DELETE /api/tickets/:id           - Delete ticket
POST   /api/tickets/:id/comments  - Add comment
POST   /api/billing/checkout-session  - Create Stripe checkout
POST   /api/billing/portal-session    - Open billing portal
POST   /api/webhooks/stripe       - Stripe webhook handler
```

---

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest
```

### Frontend Tests
```bash
cd frontend
npm run test
```

### E2E Tests (Coming Soon)
```bash
npm run test:e2e
```

---

## 📊 Database Schema

```sql
- tenant (companies)
- user (team members)
- customer (end users who create tickets)
- ticket (support tickets)
- comment (ticket comments and notes)
- subscription (billing information)
```

See [backend/models/](./backend/models/) for complete schema definitions.

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines

- Follow existing code style
- Write clear commit messages
- Add tests for new features
- Update documentation as needed

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🆘 Support

- **Documentation:** [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Issues:** [GitHub Issues](https://github.com/yourusername/ticketdesk/issues)
- **Email:** support@yourdomain.com

---

## 🗺️ Roadmap

- [ ] Mobile app (React Native)
- [ ] Real-time updates (WebSockets)
- [ ] File attachments
- [ ] Email-to-ticket
- [ ] Customer portal
- [ ] Advanced analytics
- [ ] Slack integration
- [ ] API webhooks
- [ ] Custom fields
- [ ] Automated workflows

---

## 🙏 Acknowledgments

Built with:
- [FastAPI](https://fastapi.tiangolo.com/) - Modern Python web framework
- [React](https://react.dev/) - UI library
- [Stripe](https://stripe.com/) - Payment processing
- [Resend](https://resend.com/) - Email delivery
- [Railway](https://railway.app/) - Backend hosting
- [Vercel](https://vercel.com/) - Frontend hosting

---

## 📸 Screenshots

### Dashboard
![Dashboard](./docs/screenshots/dashboard.png)

### Ticket Management
![Tickets](./docs/screenshots/tickets.png)

### Billing
![Billing](./docs/screenshots/billing.png)

---

**Made with ❤️ by [Your Name](https://github.com/yourusername)**
