# Deployment Guide - Vercel + Supabase

Is guide mein main step-by-step bataunga ki kaise deploy karein.

## 📋 What You Need

- GitHub account
- Vercel account (free)
- Supabase account (free)
- OpenAI API key
- Google Gemini API key (optional)

---

## 🗄️ Step 1: Database Setup (Supabase)

### 1.1 Create Supabase Project

1. [Supabase](https://supabase.com) pe jao
2. **New Project** click karo
3. Fill karo:
   - **Name**: rv-bot-db
   - **Database Password**: Strong password (save karo!)
   - **Region**: Closest to you
4. **Create Project** click karo (2-3 minutes lagenge)

### 1.2 Run Database Schema

1. Supabase dashboard mein **SQL Editor** pe jao
2. **New Query** click karo
3. `rv-bot-ghl/backend/database/schema.sql` file ka content copy-paste karo
4. **Run** click karo
5. Success message aana chahiye

### 1.3 Get Database URL

1. **Settings** → **Database** pe jao
2. **Connection String** section mein jao
3. **URI** copy karo (looks like: `postgresql://postgres:[YOUR-PASSWORD]@...`)
4. Password replace karo apne actual password se
5. Save karo (baad mein use hoga)

---

## 🚀 Step 2: Backend Deployment (Vercel)

### 2.1 Push Code to GitHub

```bash
# Terminal mein
cd rv-bot-ghl
git init
git add .
git commit -m "Initial commit"

# GitHub pe new repository banao (rv-bot-ghl)
git remote add origin https://github.com/YOUR_USERNAME/rv-bot-ghl.git
git push -u origin main
```

### 2.2 Deploy Backend to Vercel

1. [Vercel](https://vercel.com) pe jao
2. **Add New** → **Project** click karo
3. GitHub repository select karo: `rv-bot-ghl`
4. **Import** click karo
5. Configure karo:
   - **Framework Preset**: Other
   - **Root Directory**: `backend`
   - **Build Command**: (leave empty)
   - **Output Directory**: (leave empty)
6. **Environment Variables** add karo:

```
# Database
DATABASE_URL=postgresql://postgres:password@...supabase.co:5432/postgres

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long

# OpenAI
OPENAI_API_KEY=sk-your-openai-api-key

# Gemini (optional)
GEMINI_API_KEY=your-gemini-api-key

# GHL
GHL_WEBHOOK_SECRET=your-ghl-webhook-secret
GHL_API_KEY=your-ghl-api-key
GHL_LOCATION_ID=your-ghl-location-id

# Email (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
EMAIL_FROM=RV Bot <noreply@rvbot.com>

# App Config
NODE_ENV=production
AI_PROVIDER=openai
MAX_MESSAGES=10
TRIAL_DAYS=7
SYSTEM_PROMPT=You are an AI assistant specialized in RV maintenance and repair. Provide helpful, accurate advice for RV DIY questions.
```

7. **Deploy** click karo
8. Wait for deployment (2-3 minutes)
9. Backend URL copy karo (e.g., `https://rv-bot-backend.vercel.app`)

### 2.3 Test Backend

Browser mein jao:
```
https://your-backend.vercel.app/health
```

Response aana chahiye:
```json
{
  "status": "ok",
  "timestamp": "2026-05-08T..."
}
```

---

## 🎨 Step 3: Frontend Deployment (Vercel)

### 3.1 Create Frontend

Pehle frontend code banate hain (React app):

```bash
cd rv-bot-ghl
npx create-react-app frontend
cd frontend
npm install react-router-dom axios tailwindcss
```

### 3.2 Configure Frontend

Create `.env` file:

```
REACT_APP_API_URL=https://your-backend.vercel.app/api
```

### 3.3 Deploy Frontend to Vercel

1. Vercel dashboard mein **Add New** → **Project**
2. Same GitHub repo select karo
3. Configure karo:
   - **Framework Preset**: Create React App
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`
4. **Environment Variables** add karo:

```
REACT_APP_API_URL=https://your-backend.vercel.app/api
```

5. **Deploy** click karo
6. Frontend URL copy karo (e.g., `https://rv-bot-frontend.vercel.app`)

### 3.4 Update Backend CORS

Backend environment variables mein add karo:

```
FRONTEND_URL=https://your-frontend.vercel.app
```

Vercel backend project mein:
1. **Settings** → **Environment Variables**
2. `FRONTEND_URL` add karo
3. **Redeploy** karo

---

## ✅ Step 4: Verify Deployment

### 4.1 Test Backend Endpoints

```bash
# Health check
curl https://your-backend.vercel.app/health

# Get plans
curl https://your-backend.vercel.app/api/billing/plans
```

### 4.2 Test Frontend

1. Browser mein frontend URL open karo
2. Register page pe jao
3. Account banao
4. Login karo
5. Chat try karo

---

## 🔧 Step 5: Gmail App Password Setup

Agar Gmail use kar rahe ho email ke liye:

1. Google Account → **Security** pe jao
2. **2-Step Verification** enable karo (agar nahi hai)
3. **App Passwords** search karo
4. **Select app**: Mail
5. **Select device**: Other (Custom name)
6. **Name**: RV Bot
7. **Generate** click karo
8. 16-digit password copy karo
9. Backend `.env` mein `SMTP_PASS` mein paste karo
10. Vercel mein bhi update karo aur redeploy karo

---

## 📊 Step 6: Monitor Deployment

### Backend Logs (Vercel)

1. Vercel dashboard → Backend project
2. **Deployments** tab
3. Latest deployment click karo
4. **Logs** tab dekho

### Database Logs (Supabase)

1. Supabase dashboard
2. **Database** → **Logs**
3. Queries aur errors dekho

### Webhook Logs

Database mein `webhook_logs` table check karo:

```sql
SELECT * FROM webhook_logs ORDER BY created_at DESC LIMIT 10;
```

---

## 🐛 Common Issues

### Database Connection Error

**Error**: `Connection refused` ya `timeout`

**Solution**:
1. DATABASE_URL correct hai?
2. Supabase project active hai?
3. Password correct hai?
4. SSL enabled hai? (Supabase requires SSL)

### CORS Error

**Error**: `Access-Control-Allow-Origin`

**Solution**:
1. Backend `FRONTEND_URL` correct hai?
2. Frontend URL exactly match kar raha hai? (no trailing slash)
3. Backend redeploy karo

### Email Not Sending

**Error**: `Invalid login` ya `Authentication failed`

**Solution**:
1. Gmail App Password use karo (normal password nahi)
2. 2-Step Verification enabled hai?
3. SMTP credentials correct hain?

---

## 🔄 Update Deployment

Jab bhi code change karo:

```bash
git add .
git commit -m "Your changes"
git push
```

Vercel automatically redeploy karega!

---

## 💰 Cost Estimate

**Free Tier:**
- Vercel: Free (Hobby plan)
- Supabase: Free (500MB database)
- Total: **$0/month**

**Paid Usage:**
- OpenAI API: ~$0.01 per chat
- Gemini API: Free tier available
- Email: Free (Gmail)

**Estimated Monthly Cost**: $5-20 (depending on usage)

---

## 🎉 Done!

Tumhara RV Bot ab live hai!

**URLs**:
- Backend: `https://your-backend.vercel.app`
- Frontend: `https://your-frontend.vercel.app`
- Database: Supabase dashboard

**Next Steps**:
1. GHL integration setup karo ([GHL_SETUP.md](./GHL_SETUP.md) dekho)
2. Custom domain add karo (optional)
3. Analytics setup karo (optional)

**Enjoy!** 🚀
