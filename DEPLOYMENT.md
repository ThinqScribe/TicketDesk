# 🚀 TicketDesk Production Deployment Guide

This guide walks you through deploying TicketDesk to production.

## 📋 Prerequisites

Before deploying, you'll need accounts with:

1. **[Railway](https://railway.app)** or **[Render](https://render.com)** - for backend hosting
2. **[Vercel](https://vercel.com)** or **[Netlify](https://netlify.com)** - for frontend hosting  
3. **[Stripe](https://stripe.com)** - payment processing (live mode)
4. **[Resend](https://resend.com)** - transactional email service
5. **[Sentry](https://sentry.io)** - error monitoring (optional but recommended)

---

## 🗄️ Step 1: Set Up PostgreSQL Database

### Option A: Railway (Recommended)
1. Go to [railway.app](https://railway.app) and create a new project
2. Click "+ New" → "Database" → "PostgreSQL"
3. Copy the `DATABASE_URL` connection string from the Connect tab
4. Format: `postgresql://user:password@host:port/database`

### Option B: Render
1. Go to [render.com](https://render.com) and create a new PostgreSQL database
2. Copy the "Internal Database URL" 
3. Use this for your `DATABASE_URL`

### Option C: Other providers
- **Supabase**: Free tier with PostgreSQL
- **Neon**: Serverless PostgreSQL
- **AWS RDS**: Enterprise option

---

## 🔧 Step 2: Configure Backend Environment

1. **Copy the production environment template:**
   ```bash
   cp backend/.env.production.example backend/.env.production
   ```

2. **Fill in all values in `.env.production`:**

   ```bash
   # Database
   DATABASE_URL=postgresql://user:password@host:5432/ticketdesk
   
   # Security
   SECRET_KEY=$(openssl rand -hex 32)  # Generate this!
   
   # URLs
   FRONTEND_URL=https://yourdomain.com
   ALLOWED_ORIGINS=https://yourdomain.com
   
   # Email (Resend)
   RESEND_API_KEY=re_xxxxx  # From resend.com
   RESEND_FROM_EMAIL=noreply@yourdomain.com
   
   # Stripe LIVE keys
   STRIPE_SECRET_KEY=sk_live_xxxxx
   STRIPE_PUBLIC_KEY=pk_live_xxxxx
   STRIPE_WEBHOOK_SECRET=whsec_xxxxx
   STRIPE_PAID_PRICE_ID=price_xxxxx
   
   # Redis (optional, for rate limiting)
   REDIS_URL=redis://host:6379
   ```

---

## 🖥️ Step 3: Deploy Backend

### Option A: Railway (Recommended for FastAPI)

1. **Install Railway CLI** (optional):
   ```bash
   npm install -g @railway/cli
   railway login
   ```

2. **Deploy via GitHub:**
   - Push your code to GitHub
   - Create new project in Railway dashboard
   - Connect your GitHub repo
   - Select the `backend` directory as root
   - Railway will auto-detect Python and deploy

3. **Add environment variables:**
   - Go to project settings → Variables
   - Paste all variables from `.env.production`
   - Save and redeploy

4. **Run migrations:**
   ```bash
   railway run alembic upgrade head
   ```

5. **Get your backend URL:**
   - Railway provides: `https://your-project.railway.app`
   - Copy this URL for frontend configuration

### Option B: Render

1. **Create Web Service:**
   - Connect GitHub repo
   - Select `backend` directory
   - Build command: `pip install -r requirements.txt`
   - Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

2. **Add environment variables** in Render dashboard

3. **Run migrations** via Render shell:
   ```bash
   alembic upgrade head
   ```

---

## 🎨 Step 4: Deploy Frontend

### Option A: Vercel (Recommended for React/Vite)

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   cd frontend
   vercel login
   ```

2. **Configure environment:**
   Create `frontend/.env.production`:
   ```bash
   VITE_API_URL=https://your-backend.railway.app/api
   ```

3. **Deploy:**
   ```bash
   vercel --prod
   ```

4. **Or deploy via GitHub:**
   - Import project in Vercel dashboard
   - Add environment variable `VITE_API_URL`
   - Vercel auto-deploys on push

### Option B: Netlify

1. **Build command:** `npm run build`
2. **Publish directory:** `dist`
3. **Add environment variable:**
   ```
   VITE_API_URL=https://your-backend.railway.app/api
   ```

---

## 💳 Step 5: Configure Stripe Webhooks

1. **Go to [Stripe Dashboard](https://dashboard.stripe.com/webhooks)**

2. **Add endpoint:** `https://your-backend.railway.app/api/webhooks/stripe`

3. **Select events:**
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`

4. **Copy webhook secret** and update `STRIPE_WEBHOOK_SECRET` in backend

5. **Test webhook:**
   ```bash
   stripe listen --forward-to https://your-backend.railway.app/api/webhooks/stripe
   ```

---

## 📧 Step 6: Configure Email Service

### Resend Setup

1. **Go to [resend.com](https://resend.com)** and create account

2. **Add and verify your domain:**
   - Add DNS records to your domain provider
   - Wait for verification (usually < 5 minutes)

3. **Get API key:**
   - Go to API Keys → Create
   - Copy and add to `RESEND_API_KEY`

4. **Configure inbound email (optional):**
   - Set up `INBOUND_EMAIL_DOMAIN` for email-to-ticket
   - Add inbound webhook URL in Resend dashboard

---

## 🔍 Step 7: Add Error Monitoring (Sentry)

1. **Create [Sentry](https://sentry.io) account**

2. **Create project** for FastAPI

3. **Install Sentry SDK:**
   ```bash
   cd backend
   pip install sentry-sdk[fastapi]
   ```

4. **Add to `backend/main.py`:**
   ```python
   import sentry_sdk
   from sentry_sdk.integrations.fastapi import FastApiIntegration
   
   # Add after imports
   if settings.SENTRY_DSN:
       sentry_sdk.init(
           dsn=settings.SENTRY_DSN,
           integrations=[FastApiIntegration()],
           traces_sample_rate=1.0,
           environment="production",
       )
   ```

5. **Add `SENTRY_DSN` to environment variables**

---

## ✅ Step 8: Verification Checklist

After deployment, verify everything works:

- [ ] Backend health check: `curl https://your-backend.railway.app/api/health`
- [ ] Frontend loads at your domain
- [ ] Can create account and login
- [ ] Email verification works
- [ ] Can create tickets
- [ ] Stripe checkout works (test with live mode)
- [ ] Stripe portal works for Pro users
- [ ] Webhooks are receiving events (check Stripe dashboard)
- [ ] Search and filters work
- [ ] Notification settings save properly
- [ ] Customer emails are sent (Resend dashboard)

---

## 🔒 Security Best Practices

1. **Never commit secrets:**
   - Add `.env.production` to `.gitignore` ✅
   - Use environment variables only

2. **Enable HTTPS:**
   - Railway/Render/Vercel provide this automatically
   - Force HTTPS in production

3. **Set strong SECRET_KEY:**
   ```bash
   openssl rand -hex 32
   ```

4. **Use live Stripe keys** (not test mode)

5. **Enable rate limiting** with Redis

6. **Set up CORS properly:**
   - Only allow your frontend domain in `ALLOWED_ORIGINS`

---

## 🔄 CI/CD Pipeline (Optional)

### GitHub Actions for Backend

Create `.github/workflows/deploy-backend.yml`:

```yaml
name: Deploy Backend

on:
  push:
    branches: [main]
    paths:
      - 'backend/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Railway
        run: |
          npm install -g @railway/cli
          railway up --service backend
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

---

## 📊 Post-Deployment

1. **Monitor logs:**
   - Backend: Railway/Render logs
   - Frontend: Vercel/Netlify logs
   - Errors: Sentry dashboard

2. **Set up backups:**
   - Database: Enable automatic backups in Railway/Render
   - Frequency: Daily recommended

3. **Performance monitoring:**
   - Add APM (Application Performance Monitoring)
   - Consider: New Relic, DataDog, or Sentry Performance

4. **Set up alerts:**
   - Downtime alerts (UptimeRobot, Better Uptime)
   - Error rate alerts (Sentry)
   - Payment failures (Stripe email notifications)

---

## 🆘 Troubleshooting

### Database connection fails
- Check `DATABASE_URL` format
- Ensure IP whitelist allows Railway/Render IPs
- Verify database is running

### Stripe webhooks not working
- Check endpoint URL is correct
- Verify webhook secret matches
- Check backend logs for errors
- Test with Stripe CLI first

### Emails not sending
- Verify domain in Resend
- Check DNS records
- Verify API key
- Check Resend logs

### Frontend can't reach backend
- Verify `VITE_API_URL` is correct
- Check CORS settings
- Ensure backend is running

---

## 📞 Need Help?

- Backend logs: Check Railway/Render dashboard
- Frontend logs: Check Vercel/Netlify dashboard  
- Stripe issues: Check Stripe dashboard logs
- Email issues: Check Resend dashboard

---

## 🎉 You're Live!

Once everything is verified, your TicketDesk instance is production-ready!

**Next steps:**
- Share with beta users
- Set up monitoring dashboards
- Configure custom domain
- Add SSL certificate (auto on Railway/Vercel)
- Start collecting feedback
