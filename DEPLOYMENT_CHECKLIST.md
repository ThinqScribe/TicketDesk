# ✅ Production Deployment Checklist

Use this checklist to ensure everything is properly configured before going live.

## 🔐 Security & Secrets

- [ ] Generated strong `SECRET_KEY` using `openssl rand -hex 32`
- [ ] Set `DEBUG=false` in production environment
- [ ] Verified `.env.production` is in `.gitignore`
- [ ] All API keys are from **LIVE** mode (not test mode)
- [ ] CORS `ALLOWED_ORIGINS` only includes production domain(s)
- [ ] Database credentials are secure and not committed to git
- [ ] Redis password set (if using Redis)

## 🗄️ Database

- [ ] PostgreSQL database created
- [ ] `DATABASE_URL` connection string copied to environment
- [ ] Database accessible from hosting provider
- [ ] Ran migrations: `alembic upgrade head`
- [ ] Database backups enabled (daily recommended)
- [ ] Verified connection pool settings for PostgreSQL

## 🖥️ Backend Deployment

- [ ] Backend deployed to Railway/Render/AWS
- [ ] Environment variables configured in hosting dashboard
- [ ] Health check works: `GET /health` returns 200 OK
- [ ] API docs accessible: `GET /docs`
- [ ] Logs are visible in hosting dashboard
- [ ] Backend URL copied for frontend configuration

## 🎨 Frontend Deployment

- [ ] Frontend deployed to Vercel/Netlify
- [ ] `VITE_API_URL` points to production backend
- [ ] Custom domain configured (optional)
- [ ] SSL certificate active (should be automatic)
- [ ] Can access landing page
- [ ] Frontend routes work (no 404s on refresh)

## 💳 Stripe Configuration

### Live Mode Keys
- [ ] Switched to Stripe **Live Mode** (not Test Mode)
- [ ] `STRIPE_SECRET_KEY` starts with `sk_live_`
- [ ] `STRIPE_PUBLIC_KEY` starts with `pk_live_`
- [ ] Created product and price in Live Mode
- [ ] `STRIPE_PAID_PRICE_ID` from Live Mode product

### Webhooks
- [ ] Webhook endpoint added: `https://your-backend/api/webhooks/stripe`
- [ ] Events selected: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
- [ ] `STRIPE_WEBHOOK_SECRET` (starts with `whsec_`) added to backend
- [ ] Tested webhook with Stripe CLI or dashboard
- [ ] Webhooks showing as "Active" in Stripe dashboard

### Customer Portal
- [ ] Customer Portal enabled in Stripe dashboard
- [ ] Portal configured with allowed features (cancel, update payment)
- [ ] Branding customized (logo, colors)

## 📧 Email Configuration (Resend)

- [ ] Resend account created
- [ ] Domain added and verified in Resend
- [ ] DNS records (SPF, DKIM, DMARC) configured
- [ ] Domain showing as "Verified" in Resend
- [ ] `RESEND_API_KEY` added to environment
- [ ] `RESEND_FROM_EMAIL` matches verified domain
- [ ] Sent test email successfully
- [ ] Inbound email configured (optional)

## 🔍 Monitoring & Logging

### Sentry (Error Monitoring)
- [ ] Sentry project created
- [ ] `SENTRY_DSN` added to backend environment
- [ ] Sentry SDK installed: `pip install sentry-sdk[fastapi]`
- [ ] Test error sent and visible in Sentry dashboard
- [ ] Alert rules configured for critical errors

### Application Logs
- [ ] Backend logs accessible in Railway/Render dashboard
- [ ] Frontend logs accessible in Vercel/Netlify dashboard
- [ ] Log retention period understood

### Uptime Monitoring (Recommended)
- [ ] Set up [UptimeRobot](https://uptimerobot.com) or [Better Uptime](https://betteruptime.com)
- [ ] Monitor `/health` endpoint every 5 minutes
- [ ] Email/SMS alerts configured for downtime

## 🔄 Rate Limiting (Optional)

- [ ] Redis instance provisioned
- [ ] `REDIS_URL` added to environment
- [ ] Rate limits configured: `RATE_LIMIT_FREE`, `RATE_LIMIT_PAID`
- [ ] Tested rate limiting works

## ✨ Application Testing

### Authentication Flow
- [ ] Can create new account
- [ ] Email verification works
- [ ] Can log in with credentials
- [ ] Forgot password flow works
- [ ] Reset password email arrives
- [ ] Refresh tokens work correctly

### Ticket Management
- [ ] Can create tickets
- [ ] Tickets appear in dashboard
- [ ] Search tickets works
- [ ] Filter by status/priority works
- [ ] Ticket detail page loads
- [ ] Can update ticket status
- [ ] Can delete tickets (owner/admin only)

### Comments
- [ ] Can add comments to tickets
- [ ] Comments display with author names
- [ ] Internal comments work (hidden from agents)
- [ ] Comment notifications sent

### Customer Management
- [ ] Can create customers
- [ ] Customers appear in list
- [ ] Customer emails validated

### User Management
- [ ] Can invite users (owner/admin)
- [ ] Invitation emails sent
- [ ] Role permissions work correctly
- [ ] Can update user roles (owner only)
- [ ] Can deactivate users

### Billing & Subscriptions
- [ ] Free tier restrictions work (50 tickets, 3 agents)
- [ ] "Upgrade to Pro" button works
- [ ] Checkout redirects to Stripe
- [ ] Test payment completes successfully
- [ ] Webhook updates subscription in database
- [ ] Pro features unlock after payment
- [ ] "Manage Subscription" portal works
- [ ] Can cancel subscription through portal
- [ ] Subscription downgrades to free after cancel

### Notifications
- [ ] Notification settings page accessible
- [ ] Can toggle notification preferences
- [ ] Settings save correctly
- [ ] Email notifications sent based on preferences

## 📊 Performance & Optimization

- [ ] Frontend build optimized: `npm run build` succeeds
- [ ] Lighthouse score > 90 on landing page
- [ ] API response times < 200ms for most endpoints
- [ ] Database queries optimized (check slow query log)
- [ ] Static assets cached properly
- [ ] Images optimized and compressed

## 📖 Documentation

- [ ] README updated with production details
- [ ] API documentation up to date (`/docs`)
- [ ] Environment variables documented
- [ ] Deployment process documented
- [ ] Troubleshooting guide created

## 🚀 Launch Preparation

- [ ] Beta testers invited and tested
- [ ] Support email configured (e.g., support@yourdomain.com)
- [ ] Terms of Service page created
- [ ] Privacy Policy page created
- [ ] Contact page or support form available
- [ ] Pricing page matches Stripe prices
- [ ] Social media accounts created (optional)
- [ ] Google Analytics or Plausible added (optional)

## 🎉 Post-Launch

- [ ] Monitoring first 24 hours for errors
- [ ] Check Stripe dashboard for payments
- [ ] Verify webhooks processing correctly
- [ ] Monitor Sentry for unexpected errors
- [ ] Check email deliverability (Resend dashboard)
- [ ] Respond to user feedback
- [ ] Plan first update/improvement

---

## 📞 Quick Links (Fill These In)

- **Frontend URL:** https://_______________
- **Backend URL:** https://_______________
- **Stripe Dashboard:** https://dashboard.stripe.com
- **Resend Dashboard:** https://resend.com/emails
- **Sentry Dashboard:** https://sentry.io
- **Railway/Render Dashboard:** https://_______________
- **Vercel/Netlify Dashboard:** https://_______________

---

## 🆘 Emergency Contacts

- **Hosting Support:** _______________ 
- **Stripe Support:** https://support.stripe.com
- **Resend Support:** support@resend.com
- **Your Team Slack/Discord:** _______________

---

## ✅ Sign Off

- [ ] **Technical Lead:** Reviewed and approved
- [ ] **Product Manager:** Reviewed and approved  
- [ ] **Security:** Reviewed and approved
- [ ] **Ready to launch!** 🚀

---

**Deployed by:** _______________  
**Date:** _______________  
**Version:** 0.1.0
