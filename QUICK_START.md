# ⚡ Quick Start Guide

## 🏃 Local Development (5 minutes)

### Prerequisites
- Python 3.13+
- Node.js 20+
- Git

### Setup

```bash
# 1. Clone and navigate
git clone <your-repo>
cd ticketdesk

# 2. Backend
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your Stripe test keys
alembic upgrade head
uvicorn main:app --reload

# 3. Frontend (new terminal)
cd frontend
npm install
cp .env.example .env
npm run dev

# 4. Visit http://localhost:5173
```

---

## 🚀 Production Deployment (1 hour)

### Step 1: Create Accounts
- [Railway](https://railway.app) - Backend + PostgreSQL
- [Vercel](https://vercel.com) - Frontend
- [Stripe](https://stripe.com) - Payments (live mode)
- [Resend](https://resend.com) - Email

### Step 2: Deploy Backend
```bash
railway login
railway link
railway up
# Set env vars in Railway dashboard
railway run alembic upgrade head
```

### Step 3: Deploy Frontend
```bash
vercel login
vercel --prod
# Set VITE_API_URL in Vercel dashboard
```

### Step 4: Configure Stripe
1. Add webhook: `https://your-backend/api/webhooks/stripe`
2. Select events: `checkout.session.completed`, `customer.subscription.*`, `invoice.payment_failed`
3. Copy webhook secret to Railway

### Step 5: Configure Resend
1. Add and verify your domain
2. Copy API key to Railway

**Done!** 🎉

---

## 📚 Documentation

- **Complete Guide**: `DEPLOYMENT.md`
- **Checklist**: `DEPLOYMENT_CHECKLIST.md`
- **Summary**: `DEPLOYMENT_SUMMARY.md`
- **Changes**: `PRODUCTION_READY.md`

---

## 🔧 Common Commands

### Backend
```bash
# Start server
uvicorn main:app --reload

# Create migration
alembic revision --autogenerate -m "description"

# Run migrations
alembic upgrade head

# Generate secrets
python scripts/generate-secrets.py

# Run seed data
python seed.py
```

### Frontend
```bash
# Development
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Lint
npm run lint
```

### Deployment
```bash
# Deploy backend
railway up

# Deploy frontend
vercel --prod

# Run migrations on Railway
railway run alembic upgrade head
```

---

## 🆘 Quick Troubleshooting

### Backend won't start
- Check DATABASE_URL is set
- Verify all required env vars in .env
- Run `alembic upgrade head`

### Frontend can't reach backend
- Check VITE_API_URL matches backend URL
- Verify backend is running
- Check CORS settings in backend

### Stripe webhooks failing
- Verify webhook secret matches
- Check endpoint URL is accessible
- Review backend logs

### Emails not sending
- Verify Resend API key
- Check domain is verified
- Review Resend dashboard logs

---

## 🔐 Environment Variables

### Backend (Required)
```bash
DATABASE_URL=
SECRET_KEY=
FRONTEND_URL=
ALLOWED_ORIGINS=
STRIPE_SECRET_KEY=
STRIPE_PUBLIC_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PAID_PRICE_ID=
RESEND_API_KEY=
RESEND_FROM_EMAIL=
```

### Frontend (Required)
```bash
VITE_API_URL=
```

---

## 📞 Support

- **Docs**: All in project root
- **API Docs**: `/docs` on backend
- **Issues**: GitHub Issues
- **Railway**: railway.app/help
- **Vercel**: vercel.com/support

---

**Happy building!** 🚀
