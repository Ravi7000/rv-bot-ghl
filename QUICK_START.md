# 🚀 Quick Start Guide - RV Bot GHL

**5 Steps mein RV Bot ko GHL mein chalu karo!**

---

## ⚡ Step 1: Database Setup (5 minutes)

1. [Supabase.com](https://supabase.com) pe account banao
2. New project banao: **rv-bot-db**
3. SQL Editor mein jao
4. `backend/database/schema.sql` file ka content paste karo
5. Run karo
6. Connection string copy karo

✅ **Done!** Database ready hai.

---

## ⚡ Step 2: Deploy Backend (10 minutes)

1. Code ko GitHub pe push karo:
```bash
cd rv-bot-ghl
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/rv-bot-ghl.git
git push -u origin main
```

2. [Vercel.com](https://vercel.com) pe jao
3. GitHub repo import karo
4. Root Directory: **backend**
5. Environment variables add karo (`.env.example` dekho)
6. Deploy karo
7. Backend URL copy karo

✅ **Done!** Backend live hai.

---

## ⚡ Step 3: Deploy Frontend (10 minutes)

1. Frontend code banao:
```bash
cd rv-bot-ghl
npx create-react-app frontend
cd frontend
npm install react-router-dom axios
```

2. `.env` file banao:
```
REACT_APP_API_URL=https://your-backend.vercel.app/api
```

3. Vercel pe deploy karo (same repo, root: **frontend**)
4. Frontend URL copy karo

✅ **Done!** Frontend live hai.

---

## ⚡ Step 4: GHL Webhook Setup (15 minutes)

### 4.1 Create Payment Link

1. GHL → **Payments** → **Payment Links**
2. New link banao (e.g., "RV Bot - One Wish")
3. Payment Link ID copy karo

### 4.2 Create Workflow

1. GHL → **Automations** → **Workflows**
2. New workflow: "RV Bot Auto User Creation"
3. Trigger: **Payment Received**
4. Action: **Custom Webhook**
   - URL: `https://your-backend.vercel.app/api/ghl/webhook?secret=YOUR_SECRET`
   - Method: POST
   - Body:
   ```json
   {
     "email": "{{contact.email}}",
     "name": "{{contact.name}}",
     "planId": "1",
     "amount": "{{payment.amount}}"
   }
   ```
5. Save karo

✅ **Done!** Webhook ready hai.

---

## ⚡ Step 5: Add Custom Menu Link (5 minutes)

1. GHL → **Settings** → **Custom Menu Links**
2. Add new link:
   - Name: **RV Bot**
   - Icon: Chat bubble
   - URL: `https://your-frontend.vercel.app`
3. Save karo

✅ **Done!** Chatbot accessible hai GHL se!

---

## 🎯 Test Everything

### Test 1: Webhook
1. GHL mein test payment karo
2. Email check karo (password reset link)
3. Database check karo (new user)

### Test 2: Chatbot
1. GHL dashboard mein "RV Bot" click karo
2. Password set karo
3. Login karo
4. Message bhejo
5. AI response milna chahiye

### Test 3: Contact Sync
1. Chat karo
2. GHL Contacts check karo
3. Custom fields update hone chahiye

---

## 📚 Detailed Guides

Agar koi problem ho ya detail chahiye:

- **[Deployment Guide](./docs/DEPLOYMENT.md)** - Complete deployment steps
- **[GHL Setup Guide](./docs/GHL_SETUP.md)** - Detailed GHL integration
- **[API Documentation](./docs/API.md)** - API endpoints reference

---

## 🐛 Troubleshooting

### Webhook not working?
- Backend logs check karo (Vercel)
- Webhook secret match kar raha hai?
- GHL workflow history dekho

### Email not sending?
- Gmail App Password use karo
- SMTP credentials check karo
- Spam folder dekho

### Chatbot not loading?
- Frontend URL correct hai?
- Backend CORS configured hai?
- Browser console errors dekho

---

## 💡 Environment Variables Checklist

**Backend (.env):**
```
✅ DATABASE_URL
✅ JWT_SECRET
✅ OPENAI_API_KEY
✅ GHL_WEBHOOK_SECRET
✅ SMTP_USER
✅ SMTP_PASS
✅ FRONTEND_URL
```

**Frontend (.env):**
```
✅ REACT_APP_API_URL
```

---

## 🎉 You're Done!

Ab tumhara RV Bot fully functional hai GHL mein!

**Flow:**
1. User pays in GHL → 
2. Webhook creates user → 
3. Email sent with password link → 
4. User logs in → 
5. Chats with AI → 
6. Data syncs to GHL

**Questions?** Check detailed guides in `docs/` folder.

**Enjoy!** 🚀
