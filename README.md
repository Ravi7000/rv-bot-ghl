# 🤖 RV Bot - GHL Standalone Version

**Complete WordPress-free version of RV Bot for GoHighLevel integration**

Zero WordPress dependency | Full GHL integration | Production-ready | Free hosting

---

## ⚡ Quick Start (5 Minutes)

```bash
# 1. Clone & Setup
git clone https://github.com/YOUR_USERNAME/rv-bot-ghl.git
cd rv-bot-ghl

# 2. Follow Quick Start Guide
cat QUICK_START.md

# 3. Deploy (see DEPLOYMENT.md)
# 4. Configure GHL (see docs/GHL_SETUP.md)
```

**📚 Complete Guides:**
- **[QUICK_START.md](./QUICK_START.md)** - 5 steps to get started
- **[DEPLOYMENT.md](./docs/DEPLOYMENT.md)** - Deploy to Vercel + Supabase
- **[GHL_SETUP.md](./docs/GHL_SETUP.md)** - GHL integration step-by-step
- **[CHECKLIST.md](./CHECKLIST.md)** - Deployment checklist
- **[SUMMARY.md](./SUMMARY.md)** - Complete overview

---

## 🚀 Features

### Core Features
- ✅ **AI Chatbot** - OpenAI GPT-4o-mini + Google Gemini 2.5 Flash
- ✅ **Streaming Responses** - Real-time typing effect
- ✅ **Chat History** - Persistent conversation management
- ✅ **User Authentication** - JWT-based secure login
- ✅ **Subscription Management** - 3 plans with auto-expiry

### GHL Integration
- ✅ **Auto User Creation** - Payment → Webhook → User account
- ✅ **Contact Sync** - Chat data syncs to GHL contacts
- ✅ **Custom Fields** - Store chat metadata in GHL
- ✅ **Custom Menu Link** - Access bot from GHL dashboard
- ✅ **Webhook Processing** - Secure payment webhooks

### Additional Features
- ✅ **Service Provider Directory** - Location-based search
- ✅ **Lead Tracking** - Conversion tracking & analytics
- ✅ **Email System** - Password reset & notifications
- ✅ **Rate Limiting** - API abuse prevention
- ✅ **Error Logging** - Comprehensive monitoring

---

## 📁 Project Structure

```
rv-bot-ghl/
├── backend/                    # Node.js + Express API
│   ├── config/                # Database configuration
│   ├── database/              # SQL schema & migrations
│   ├── middleware/            # Auth & validation
│   ├── routes/                # API endpoints
│   │   ├── auth.js           # Login, register, password reset
│   │   ├── chat.js           # Chat API with streaming
│   │   ├── ghl.js            # GHL webhook handler
│   │   ├── billing.js        # Plans & subscriptions
│   │   ├── providers.js      # Service provider directory
│   │   └── leads.js          # Lead tracking
│   ├── utils/                 # Utilities
│   │   ├── ai-providers.js   # OpenAI & Gemini integration
│   │   ├── email.js          # Email sending
│   │   └── ghl-api.js        # GHL API client
│   ├── server.js              # Main server file
│   ├── package.json
│   └── .env.example           # Environment variables template
│
├── frontend/                   # React application
│   ├── public/                # Static files
│   ├── src/
│   │   ├── pages/            # React pages
│   │   │   ├── Login.js      # Login page
│   │   │   ├── Register.js   # Registration page
│   │   │   ├── ResetPassword.js # Password reset
│   │   │   └── Chat.js       # Main chat interface
│   │   ├── App.js            # Main app component
│   │   ├── App.css           # Styling
│   │   ├── api.js            # API client
│   │   └── index.js          # Entry point
│   ├── package.json
│   └── .env.example           # Environment variables template
│
├── docs/                       # Documentation
│   ├── DEPLOYMENT.md          # Deployment guide
│   └── GHL_SETUP.md           # GHL integration guide
│
├── README.md                   # This file
├── QUICK_START.md              # 5-step quick start
├── SUMMARY.md                  # Complete overview
├── CHECKLIST.md                # Deployment checklist
└── .gitignore                  # Git ignore rules
```

---

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js 16+
- **Framework**: Express.js
- **Database**: PostgreSQL (Supabase)
- **Authentication**: JWT (jsonwebtoken)
- **AI Providers**: OpenAI API, Google Gemini API
- **Email**: Nodemailer (SMTP)
- **HTTP Client**: Axios
- **Security**: Helmet, CORS, bcrypt

### Frontend
- **Framework**: React 18
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Streaming**: EventSource (Server-Sent Events)
- **Styling**: Custom CSS (Poppins font)

### Infrastructure
- **Hosting**: Vercel (Serverless)
- **Database**: Supabase (PostgreSQL)
- **Cost**: **$0/month** (free tier)

---

## 🎯 How It Works

### Payment Flow
```
1. User pays in GHL (Stripe/GHL payment link)
   ↓
2. GHL workflow triggers webhook
   ↓
3. Backend receives webhook → Creates user account
   ↓
4. Email sent with password setup link
   ↓
5. User sets password → Logs in
   ↓
6. User accesses chatbot
```

### Chat Flow
```
1. User sends message
   ↓
2. Backend validates subscription
   ↓
3. AI provider (OpenAI/Gemini) generates response
   ↓
4. Response streams back to frontend (real-time)
   ↓
5. Message saved to database
   ↓
6. GHL contact updated with chat metadata
```

---

## 🔐 Environment Variables

### Backend (.env)
```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/db

# JWT
JWT_SECRET=your-super-secret-key-min-32-chars

# AI Providers
OPENAI_API_KEY=sk-your-openai-key
GEMINI_API_KEY=your-gemini-key

# GHL
GHL_WEBHOOK_SECRET=your-webhook-secret
GHL_API_KEY=your-ghl-api-key
GHL_LOCATION_ID=your-location-id

# Email (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
EMAIL_FROM=RV Bot <noreply@rvbot.com>

# App Config
NODE_ENV=production
FRONTEND_URL=https://your-frontend.vercel.app
AI_PROVIDER=openai
MAX_MESSAGES=10
TRIAL_DAYS=7
```

### Frontend (.env)
```bash
REACT_APP_API_URL=https://your-backend.vercel.app/api
```

---

## 📊 Database Schema

**Tables:**
- `users` - User accounts
- `plans` - Subscription plans (3 default plans)
- `subscriptions` - Active subscriptions
- `chat_sessions` - Chat conversations
- `chat_messages` - Individual messages
- `payments` - Payment records
- `service_providers` - RV service directory
- `leads` - Lead tracking
- `password_reset_tokens` - Password reset tokens
- `webhook_logs` - Webhook debugging logs

**See**: `backend/database/schema.sql` for complete schema

---

## 🚀 Deployment

### Prerequisites
- GitHub account
- Vercel account (free)
- Supabase account (free)
- OpenAI API key
- GHL account

### Steps
1. **Database**: Setup Supabase (5 min)
2. **Backend**: Deploy to Vercel (10 min)
3. **Frontend**: Deploy to Vercel (10 min)
4. **GHL**: Configure webhooks & menu link (15 min)

**Total Time**: ~40 minutes

**Detailed Guide**: See [DEPLOYMENT.md](./docs/DEPLOYMENT.md)

---

## 🔗 GHL Integration

### 1. Payment Webhook
```
GHL Payment Link → Workflow → Custom Webhook
URL: https://backend.vercel.app/api/ghl/webhook?secret=SECRET
Method: POST
Body: {
  "email": "{{contact.email}}",
  "name": "{{contact.name}}",
  "planId": "1"
}
```

### 2. Custom Menu Link
```
GHL Settings → Custom Menu Links
Name: RV Bot
URL: https://frontend.vercel.app
Icon: Chat bubble
```

### 3. Contact Sync
Automatic sync of:
- Last message
- Last chat date
- Total messages
- Session ID
- Subscription status

**Detailed Guide**: See [GHL_SETUP.md](./docs/GHL_SETUP.md)

---

## 🧪 Testing

### Local Testing
```bash
# Backend
cd backend
npm install
cp .env.example .env
# Edit .env
npm run dev

# Frontend (new terminal)
cd frontend
npm install
cp .env.example .env
# Edit .env
npm start
```

### Production Testing
- [ ] Health check: `GET /health`
- [ ] Plans endpoint: `GET /api/billing/plans`
- [ ] Register & login
- [ ] Send chat message
- [ ] Verify streaming response
- [ ] Test GHL webhook
- [ ] Verify email delivery
- [ ] Check GHL contact sync

**Complete Checklist**: See [CHECKLIST.md](./CHECKLIST.md)

---

## 💰 Cost Breakdown

### Free Tier (Recommended)
- **Vercel**: Free (Hobby plan)
- **Supabase**: Free (500MB database)
- **Total**: **$0/month**

### Usage Costs
- **OpenAI API**: ~$0.01 per chat
- **Gemini API**: Free tier available
- **Email**: Free (Gmail)

### Estimated Monthly Cost
- **Low usage** (100 chats/month): $1-2
- **Medium usage** (1000 chats/month): $10-15
- **High usage** (5000 chats/month): $50-75

---

## 🐛 Troubleshooting

### Common Issues

**Webhook not working?**
- Check webhook secret matches
- Verify URL is correct
- Check Vercel logs
- Check `webhook_logs` table

**Email not sending?**
- Use Gmail App Password (not regular password)
- Enable 2-Step Verification
- Check SMTP credentials

**Chat not working?**
- Verify API keys (OpenAI/Gemini)
- Check subscription status
- Check browser console

**GHL sync failing?**
- Verify GHL API key
- Check Location ID
- Verify custom fields exist

**Detailed Troubleshooting**: See [GHL_SETUP.md](./docs/GHL_SETUP.md#troubleshooting)

---

## 📚 Documentation

- **[QUICK_START.md](./QUICK_START.md)** - Get started in 5 steps
- **[DEPLOYMENT.md](./docs/DEPLOYMENT.md)** - Complete deployment guide
- **[GHL_SETUP.md](./docs/GHL_SETUP.md)** - GHL integration guide
- **[CHECKLIST.md](./CHECKLIST.md)** - Deployment checklist
- **[SUMMARY.md](./SUMMARY.md)** - Project overview

---

## 🤝 Support

### Resources
- **Documentation**: See `docs/` folder
- **Issues**: Check troubleshooting sections
- **Logs**: Vercel dashboard + Supabase logs

### Getting Help
1. Check documentation first
2. Review troubleshooting guides
3. Check Vercel logs
4. Check database logs
5. Check GHL workflow history

---

## 📄 License

Proprietary - All rights reserved

---

## 🎉 Ready to Deploy?

1. **Read**: [QUICK_START.md](./QUICK_START.md)
2. **Deploy**: [DEPLOYMENT.md](./docs/DEPLOYMENT.md)
3. **Configure**: [GHL_SETUP.md](./docs/GHL_SETUP.md)
4. **Verify**: [CHECKLIST.md](./CHECKLIST.md)

**Questions?** Check [SUMMARY.md](./SUMMARY.md) for complete overview.

---

**Built with ❤️ for RV Journey Genie**
