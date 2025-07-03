# 🧠 Intellea - Interactive LLM-Based Learning Interface

Intellea is an interactive learning platform that uses Large Language Models to create dynamic, explorable knowledge graphs. Transform any topic into an interconnected web of concepts with AI-powered explanations, visual relationships, and expandable content.

## ✨ Key Features

- **🌐 Dynamic Knowledge Graphs**: Auto-generated visual networks of interconnected concepts
- **🤖 AI-Powered Explanations**: LLM-generated content with context-aware detail levels  
- **🔍 Interactive Exploration**: Click, expand, and navigate through related concepts seamlessly
- **🎙️ Voice Assistant**: Voice-controlled navigation and content reading (Ctrl+Shift+V)
- **💾 Session Management**: Save and restore your learning sessions
- **🎨 Visual Clustering**: Color-coded concept groupings and depth visualization
- **🔐 Subscription System**: Secure payment processing with Stripe integration

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and pnpm
- Supabase project (database + auth)
- OpenAI API key
- Redis instance  
- Stripe account (for payments)

### Development Setup

1. **Clone and install dependencies:**
```bash
git clone <repo-url>
cd llm-visualization-tool
pnpm install
```

2. **Environment configuration:**
```bash
cp .env.example .env.local
# Fill in your environment variables (see table below)
```

3. **Start development server:**
```bash
pnpm dev
```

4. **Visit** `http://localhost:3000`

For detailed local development setup including database configuration, see [LOCAL_DEVELOPMENT.md](LOCAL_DEVELOPMENT.md).

## 🌍 Production Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for complete production setup instructions including:
- Vercel deployment configuration
- Stripe webhook setup (⚠️ Critical: must include `/api/stripe/webhook` path)
- Supabase authentication configuration
- Environment variable requirements

## ⚙️ Environment Variables

### Core Services
| Variable | Description | Example |
|----------|-------------|---------|
| `OPENAI_API_KEY` | OpenAI API key for content generation | `sk-test-123...` |
| `REDIS_URL` | Redis connection for caching | `redis://localhost:6379` |

### Database & Auth (Supabase)
| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://xyz.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase public key | `eyJhbGciOiJIUzI1...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase admin key (bypasses RLS) | `eyJhbGciOiJIUzI1...` |

### Payments (Stripe)
| Variable | Description | Example |
|----------|-------------|---------|
| `STRIPE_SECRET_KEY` | Stripe secret key | `sk_test_123...` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe public key | `pk_test_123...` |
| `STRIPE_PRICE_ID` | Subscription product price ID | `price_123...` |
| `STRIPE_WEBHOOK_SECRET` | Webhook signature verification | `whsec_123...` |

### Application Configuration
| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_SITE_URL` | Your site URL (for redirects) | `https://intellea.app` |
| `ADMIN_SECRET_KEY` | Admin API access key | `your-secret-key` |
| `NEXT_PUBLIC_DEBUG` | Enable client-side debug logs | `false` |
| `APP_DEBUG` | Enable backend debug logs | `true` |

## 🛠️ Development Commands

```bash
# Development
pnpm dev                    # Start dev server with Turbopack
pnpm dev:logs              # Dev server with filtered logs
pnpm dev:reset             # Clear .next cache and restart

# Testing
pnpm test                  # Run unit tests
pnpm test:watch           # Watch mode testing
pnpm e2e                  # Run Cypress end-to-end tests

# Code Quality
pnpm lint                 # ESLint
pnpm type-check          # TypeScript checking
pnpm knip                # Find unused dependencies

# Subscription Debugging
pnpm debug:subscription user@example.com  # Check user subscription status
```

## 🔧 Subscription Management Tools

### Debug User Issues
```bash
# Check user's subscription status and sync if needed
node debug-subscription.js user@example.com

# This shows:
# - User data from Supabase
# - Stripe customer/subscription info  
# - Status mismatches
# - Options to sync or manually fix
```

### Admin API
Programmatic user management via `/api/admin/user`:

```bash
# Check user status
curl -X GET "https://your-site.com/api/admin/user?email=user@example.com" \
  -H "Authorization: Bearer $ADMIN_SECRET_KEY"

# Grant free subscription
curl -X POST "https://your-site.com/api/admin/user" \
  -H "Authorization: Bearer $ADMIN_SECRET_KEY" \
  -H "Content-Type: application/json" \
  -d '{"action": "grant_free_subscription", "userId": "user-id"}'

# Sync from Stripe
curl -X POST "https://your-site.com/api/admin/user" \
  -H "Authorization: Bearer $ADMIN_SECRET_KEY" \
  -H "Content-Type: application/json" \
  -d '{"action": "sync_stripe_subscription", "userId": "user-id"}'
```

## 🎮 Usage Guide

### Basic Navigation
1. **Enter a topic** in the input field and click "Generate"
2. **Explore the graph**: Click nodes to focus, drag to pan, scroll to zoom
3. **Expand concepts**: Click the "Expand" button for detailed explanations
4. **Voice control**: Press `Ctrl+Shift+V` to enable voice assistant

### Voice Commands
- **"search and select node [term]"** - Focus on a node by name
- **"read expanded concept"** - Have current concept read aloud
- **Hold Space** - Push-to-talk when voice is enabled

### Graph Features
- **Node colors**: By depth (default) or community clusters (toggle available)
- **Session management**: Save/load your exploration sessions
- **Knowledge cards**: Persistent cards showing visited concepts

## 🔍 Troubleshooting

### Common Issues

**Subscription not working after payment:**
```bash
# 1. Check webhook delivery in Stripe Dashboard
# 2. Verify webhook URL includes full path: /api/stripe/webhook  
# 3. Debug user status:
node debug-subscription.js user@example.com
```

**User can't access features:**
```bash
# Check their subscription status
curl -X GET "https://your-site.com/api/admin/user?email=user@example.com" \
  -H "Authorization: Bearer $ADMIN_SECRET_KEY"
```

**Development issues:**
- Check environment variables are properly set
- Ensure Redis is running locally
- Verify Supabase service role key has proper permissions

### Debug Logging
Set `NEXT_PUBLIC_DEBUG=true` and `APP_DEBUG=true` for verbose logging during development.

## 🏗️ Architecture

- **Frontend**: Next.js 15 with React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes, OpenAI Agents framework
- **Database**: Supabase (PostgreSQL + Auth + Storage)
- **Caching**: Redis for API response caching
- **Payments**: Stripe with webhook-based subscription management
- **Visualization**: Force-directed graphs with react-force-graph
- **State**: Zustand for client-side state management

## 📈 Recent Updates (January 2025)

✅ **Subscription System Overhaul:**
- Fixed RLS policy violations in profile updates
- Resolved webhook delivery path issues  
- Added comprehensive subscription lifecycle handling
- Enhanced error handling and debug logging

✅ **New Management Tools:**
- Interactive debug script for troubleshooting users
- Admin API for manual subscription management  
- Webhook handling for payment failures and trials
- Automatic subscription expiration processing

✅ **Production Hardening:**
- Robust error handling and recovery
- Comprehensive monitoring and logging
- Manual sync capabilities for edge cases

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
