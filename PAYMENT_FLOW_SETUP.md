# Payment Flow Setup & Testing

## How the Automatic Payment-to-Pro Flow Works

### The Complete Flow:
1. **User clicks "Upgrade to Pro"** → Frontend calls `POST /billing/checkout-session`
2. **Backend creates Stripe checkout** → Returns checkout URL
3. **User completes payment on Stripe** → Stripe processes payment
4. **Stripe sends webhook** → `POST /webhooks/stripe` with `checkout.session.completed` event
5. **Backend processes webhook** → Updates database: `subscription_tier = "paid"`, `is_subscribed = true`
6. **User returns to success page** → `BillingSuccessPage` polls for subscription confirmation
7. **Frontend detects Pro subscription** → Calls `refreshSubscription()` in context
8. **Sidebar updates immediately** → "Free Plan" becomes "⭐ Pro Plan"

### Key Components:

#### Backend (`routers/billing.py`)
- `GET /billing` - Returns current subscription status
- `POST /billing/checkout-session` - Creates Stripe checkout URL
- `POST /webhooks/stripe` - Processes Stripe webhook events
- `_handle_checkout_completed()` - Upgrades tenant to paid plan

#### Frontend Subscription Context (`DashboardLayout.tsx`)
- Provides `SubscriptionContext` with `refreshSubscription()` function
- Fetches initial subscription data when user logs in
- Allows components to trigger subscription refresh globally

#### Success Page (`BillingSuccessPage.tsx`)
- Polls backend until subscription is confirmed as "paid"
- Calls `refreshSubscription()` to update entire app
- Shows celebration UI and renewal date

#### Sidebar (`Sidebar.tsx`)
- Displays current plan status based on `subscription?.subscription_tier`
- Updates immediately when subscription context changes
- Shows "⭐ Pro Plan" when `tier === "paid"`

---

## Development Setup

### Prerequisites
1. **Stripe CLI installed** - `stripe --version` should work
2. **Backend running** - `http://localhost:8000`
3. **Frontend running** - `http://localhost:5174`

### Start Webhook Forwarding
```bash
cd backend
stripe listen --forward-to localhost:8000/api/webhooks/stripe
```

This forwards Stripe webhook events from the cloud to your local backend.
**Keep this running** while testing payments.

### Testing the Flow

#### Option 1: Real Stripe Checkout (Recommended)
1. Go to `http://localhost:5174/dashboard/billing`
2. Click "Upgrade to Pro" 
3. Use test card: `4242 4242 4242 4242` (any expiry/CVC)
4. Complete payment
5. You'll be redirected to success page
6. Watch the sidebar update to "⭐ Pro Plan"

#### Option 2: Manual Webhook Simulation
```bash
cd backend
python test_payment_flow.py test acme-inc
python test_payment_flow.py check acme-inc
```

### Troubleshooting

#### "Sidebar still shows Free Plan"
1. **Check Stripe CLI** - Should show webhook events being received
2. **Check backend logs** - Look for webhook processing messages  
3. **Verify database** - Run `python test_subscription_update.py list`
4. **Check browser network** - Subscription API calls should return `"paid"`

#### "Webhook not received"
1. **Stripe CLI running?** - Should show "Ready! Webhook signing secret is..."
2. **Correct endpoint?** - Should forward to `localhost:8000/api/webhooks/stripe`
3. **Backend running?** - `curl http://localhost:8000/api` should return 404, not connection error

#### "Payment succeeds but no upgrade"
1. **Check webhook secret** - `.env` STRIPE_WEBHOOK_SECRET should match Stripe CLI output
2. **Check customer ID** - Tenant must have `stripe_customer_id` (created on first checkout)
3. **Check logs** - Backend should log webhook processing

### Manual Database Operations

#### Reset tenant to Free (for testing)
```bash
cd backend
python test_subscription_update.py revert acme-inc
python test_subscription_update.py list  # Verify it's Free
```

#### Upgrade tenant to Pro (manual testing)
```bash
cd backend  
python test_subscription_update.py upgrade acme-inc
python test_subscription_update.py list  # Verify it's Pro
```

---

## Production Deployment

### Webhook Configuration
1. **Set up webhook endpoint** in Stripe Dashboard:
   - URL: `https://yourdomain.com/api/webhooks/stripe`
   - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`

2. **Update environment variables**:
   - `STRIPE_WEBHOOK_SECRET` - Real webhook secret from Stripe Dashboard
   - `FRONTEND_URL` - Real frontend domain for success/cancel URLs

### Security Notes
- Webhook signatures are verified using `STRIPE_WEBHOOK_SECRET`
- Only authenticated owners can create checkout sessions
- Subscription data is tenant-isolated via JWT claims

---

## Architecture Notes

### Why This Design Works
1. **Webhook-driven** - Upgrades happen server-side via Stripe webhooks (secure, reliable)
2. **Context-based refresh** - Frontend can update subscription globally without page refresh
3. **Polling for confirmation** - Success page waits for webhook processing (handles timing issues)
4. **Denormalized tier data** - `tenant.subscription_tier` mirrors `subscription.subscription_tier` for JWT efficiency

### Database Schema
```sql
-- Tenant stores the tier for fast JWT lookups
tenant.subscription_tier: 'free' | 'paid'

-- Subscription stores the full billing details
subscription.subscription_tier: 'free' | 'paid' 
subscription.is_subscribed: boolean
subscription.current_period_end: timestamp
subscription.stripe_subscription_id: string
```

Both `tier` fields are kept in sync by webhook handlers in `routers/billing.py`.