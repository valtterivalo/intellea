# 🛠️ Local Development Setup

## 1. Environment Variables

Create `.env.local` in your project root:

```env
# OpenAI API Key
OPENAI_API_KEY=sk-your-openai-key

# Supabase - DEVELOPMENT PROJECT
NEXT_PUBLIC_SUPABASE_URL=https://your-dev-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-dev-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-dev-service-role-key

# Redis - DEVELOPMENT DATABASE
REDIS_URL=redis://localhost:6379/1

# Stripe - TEST MODE
STRIPE_SECRET_KEY=sk_test_your-test-key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your-test-key
STRIPE_PRICE_ID=price_test_your-test-price
STRIPE_WEBHOOK_SECRET=whsec_your-test-webhook-secret

# Local URLs
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Admin access
ADMIN_SECRET_KEY=your-local-admin-key

# Debug flags
NEXT_PUBLIC_DEBUG=true
APP_DEBUG=true
```

## 2. Supabase Development Setup

### Option A: Separate Development Project (Recommended)

1. **Create a new Supabase project** for development
2. **Set up the same database schema** as production:
   - Tables: `profiles`, `sessions`, `expanded_concepts`
   - RLS policies
   - Storage buckets (if any)

3. **Configure Authentication:**
   - Site URL: `http://localhost:3000`
   - Redirect URLs: `http://localhost:3000/auth/callback`
   - Enable desired providers (Google, GitHub, etc.)

### Option B: Supabase Local Development

```bash
# Install Supabase CLI
pnpm add -g supabase

# Initialize local Supabase
supabase init

# Start local Supabase stack
supabase start

# This will give you local URLs like:
# API URL: http://localhost:54321
# DB URL: postgresql://postgres:postgres@localhost:54322/postgres
```

## 3. Redis Development Setup

### Option A: Local Redis Instance

```bash
# Install Redis locally
# macOS
brew install redis
brew services start redis

# Ubuntu/Debian
sudo apt install redis-server
sudo systemctl start redis

# Test connection
redis-cli ping
```

### Option B: Upstash Development Database

1. Create a separate Redis database on Upstash for development
2. Use database index 1 instead of 0: `redis://...your-url.../1`

## 4. Stripe Test Environment

1. **Use Stripe Test Mode** (toggle in Stripe Dashboard)
2. **Create test products and prices**
3. **Set up test webhook endpoint:**
   - URL: `http://localhost:3000/api/stripe/webhook` 
   - Use ngrok for webhook testing: `ngrok http 3000`
   - Update webhook URL to: `https://your-ngrok-url.ngrok.io/api/stripe/webhook`

### Test Cards for Stripe:
```
# Successful payment
4242 4242 4242 4242

# Declined payment  
4000 0000 0000 0002

# Requires authentication
4000 0025 0000 3155
```

### Webhook Events to Configure:
When setting up your webhook endpoint (either local via ngrok or test environment), make sure to listen for these events:
- `checkout.session.completed`
- `customer.subscription.updated` 
- `customer.subscription.deleted`
- `customer.subscription.trial_will_end`
- `invoice.payment_failed`
- `invoice.payment_succeeded`

## 5. Development Commands

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Run tests
pnpm test

# Run linting
pnpm lint

# Type check
pnpm type-check
```

## 6. Database Setup Scripts

Create `scripts/setup-dev-db.sql`:

```sql
-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  stripe_customer_id TEXT,
  subscription_status TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create sessions table  
CREATE TABLE IF NOT EXISTS sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT DEFAULT 'Untitled Session',
  session_data JSONB,
  last_prompt TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create expanded_concepts table
CREATE TABLE IF NOT EXISTS expanded_concepts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  node_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  related_concepts JSONB NOT NULL DEFAULT '[]',
  graph_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE expanded_concepts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own sessions" ON sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own sessions" ON sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sessions" ON sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own sessions" ON sessions FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view expanded concepts for own sessions" ON expanded_concepts FOR SELECT USING (
  session_id IN (SELECT id FROM sessions WHERE user_id = auth.uid())
);
CREATE POLICY "Users can create expanded concepts for own sessions" ON expanded_concepts FOR INSERT WITH CHECK (
  session_id IN (SELECT id FROM sessions WHERE user_id = auth.uid())
);
```

## 7. Testing Local Admin API

```bash
# Set your admin key
export ADMIN_SECRET_KEY="your-local-admin-key"

# Test admin endpoints
curl -X GET "http://localhost:3000/api/admin/user?email=test@example.com" \
  -H "Authorization: Bearer $ADMIN_SECRET_KEY"

# Grant free subscription locally
curl -X POST "http://localhost:3000/api/admin/user" \
  -H "Authorization: Bearer $ADMIN_SECRET_KEY" \
  -H "Content-Type: application/json" \
  -d '{"action": "grant_free_subscription", "userId": "test-user-id"}'
```

## 8. Webhook Testing with ngrok

```bash
# Install ngrok
pnpm add -g ngrok

# Start your local dev server
pnpm dev

# In another terminal, expose local server
ngrok http 3000

# Update Stripe webhook URL to:
# https://your-ngrok-url.ngrok.io/api/stripe/webhook

# Test webhook
curl -X POST "https://your-ngrok-url.ngrok.io/api/stripe/webhook" \
  -H "Content-Type: application/json" \
  -d '{"test": "webhook"}' \
  -v
```

## 9. Development vs Production Checklist

### Development Environment:
- ✅ `.env.local` with development credentials
- ✅ Separate Supabase project
- ✅ Local/separate Redis database  
- ✅ Stripe test mode
- ✅ Debug flags enabled
- ✅ Local webhook testing with ngrok

### Production Environment:
- ✅ Vercel environment variables
- ✅ Production Supabase project
- ✅ Production Redis (Upstash)
- ✅ Stripe live mode
- ✅ Debug flags disabled
- ✅ Real domain webhook endpoints

## 10. Troubleshooting

### Common Issues:

**Redis Connection Error:**
```bash
# Check if Redis is running
redis-cli ping
# Should return "PONG"
```

**Supabase Auth Issues:**
- Check Site URL and Redirect URLs
- Verify environment variables
- Check RLS policies

**Stripe Webhook Issues:**
- Use ngrok for local testing
- Check webhook secret matches
- Verify test vs live mode consistency

**Database Schema Issues:**
```bash
# Reset local Supabase
supabase db reset

# Apply migrations
supabase db push
```

## 11. Quick Setup Script

Create `scripts/setup-dev.sh`:

```bash
#!/bin/bash
echo "Setting up development environment..."

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "Creating .env.local template..."
    cp .env.example .env.local
    echo "Please update .env.local with your development credentials"
fi

# Install dependencies
pnpm install

# Start Redis if not running
if ! pgrep redis-server > /dev/null; then
    echo "Starting Redis..."
    redis-server --daemonize yes
fi

echo "Development environment ready!"
echo "Run 'pnpm dev' to start the development server"
```

Make it executable:
```bash
chmod +x scripts/setup-dev.sh
./scripts/setup-dev.sh
``` 