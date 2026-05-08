# ✅ Deployment Checklist

Is checklist ko follow karo step-by-step. Har step complete hone ke baad checkbox tick karo.

---

## 📋 Pre-Deployment

### Environment Setup
- [ ] Node.js installed (v16 or higher)
- [ ] Git installed
- [ ] GitHub account created
- [ ] Vercel account created
- [ ] Supabase account created

### API Keys Ready
- [ ] OpenAI API key obtained
- [ ] Google Gemini API key obtained (optional)
- [ ] Gmail App Password created
- [ ] GHL account access confirmed

---

## 🗄️ Database Setup

- [ ] Supabase project created
- [ ] Database password saved securely
- [ ] SQL schema executed successfully
- [ ] Default plans inserted (3 plans visible)
- [ ] Database connection string copied
- [ ] Connection tested (can query tables)

---

## 🚀 Backend Deployment

### Code Preparation
- [ ] Code pushed to GitHub repository
- [ ] Repository is public or Vercel has access

### Vercel Setup
- [ ] Vercel project created
- [ ] Root directory set to `backend`
- [ ] All environment variables added:
  - [ ] DATABASE_URL
  - [ ] JWT_SECRET (min 32 characters)
  - [ ] OPENAI_API_KEY
  - [ ] GEMINI_API_KEY (optional)
  - [ ] GHL_WEBHOOK_SECRET
  - [ ] GHL_API_KEY
  - [ ] GHL_LOCATION_ID
  - [ ] SMTP_HOST
  - [ ] SMTP_PORT
  - [ ] SMTP_USER
  - [ ] SMTP_PASS
  - [ ] EMAIL_FROM
  - [ ] NODE_ENV=production
  - [ ] AI_PROVIDER=openai
  - [ ] FRONTEND_URL (will add after frontend deploy)

### Deployment
- [ ] Backend deployed successfully
- [ ] Backend URL copied
- [ ] Health check works: `/health` returns `{"status":"ok"}`
- [ ] Plans endpoint works: `/api/billing/plans` returns 3 plans

---

## 🎨 Frontend Deployment

### Code Preparation
- [ ] Frontend code created (React app)
- [ ] Dependencies installed locally
- [ ] `.env` file configured with backend URL

### Vercel Setup
- [ ] Vercel project created (same repo)
- [ ] Root directory set to `frontend`
- [ ] Build command: `npm run build`
- [ ] Output directory: `build`
- [ ] Environment variable added:
  - [ ] REACT_APP_API_URL (backend URL)

### Deployment
- [ ] Frontend deployed successfully
- [ ] Frontend URL copied
- [ ] Frontend loads in browser
- [ ] Login page accessible

### Backend Update
- [ ] FRONTEND_URL added to backend environment variables
- [ ] Backend redeployed with new FRONTEND_URL

---

## 🔗 GHL Integration

### Webhook Secret
- [ ] Strong secret generated (32+ characters)
- [ ] Secret added to backend `.env`
- [ ] Secret saved for webhook URL

### Payment Link
- [ ] Payment link created in GHL
- [ ] Plan name set (e.g., "RV Bot - One Wish")
- [ ] Price configured
- [ ] Payment link ID copied

### Workflow Setup
- [ ] Workflow created: "RV Bot Auto User Creation"
- [ ] Trigger set: "Payment Received"
- [ ] Payment link selected in filter
- [ ] Custom webhook action added
- [ ] Webhook URL configured: `https://backend.vercel.app/api/ghl/webhook?secret=SECRET`
- [ ] Webhook method set to POST
- [ ] Webhook body configured with JSON:
  ```json
  {
    "email": "{{contact.email}}",
    "name": "{{contact.name}}",
    "planId": "1",
    "amount": "{{payment.amount}}"
  }
  ```
- [ ] Workflow saved and activated

### Custom Menu Link
- [ ] Custom menu link added in GHL
- [ ] Name set: "RV Bot"
- [ ] Icon selected (chat bubble)
- [ ] URL set: `https://frontend.vercel.app`
- [ ] Link visible in GHL sidebar

### API Integration
- [ ] GHL API key created
- [ ] API key scopes configured:
  - [ ] contacts.readonly
  - [ ] contacts.write
  - [ ] locations.readonly
- [ ] Location ID copied from GHL URL
- [ ] API key added to backend environment variables
- [ ] Location ID added to backend environment variables
- [ ] Backend redeployed

### Custom Fields
- [ ] Custom fields created in GHL:
  - [ ] subscription_status (Text)
  - [ ] subscription_plan_id (Number)
  - [ ] subscription_end_date (Date)
  - [ ] last_chat_date (Date)
  - [ ] last_message (Text)
  - [ ] total_messages (Number)
  - [ ] session_id (Text)

---

## ✅ Testing

### Backend Tests
- [ ] Health check: `GET /health` returns 200
- [ ] Plans endpoint: `GET /api/billing/plans` returns 3 plans
- [ ] Register works: `POST /api/auth/register` creates user
- [ ] Login works: `POST /api/auth/login` returns token
- [ ] Chat requires auth: `POST /api/chat` returns 401 without token

### Frontend Tests
- [ ] Homepage loads
- [ ] Can navigate to register page
- [ ] Can create account
- [ ] Can login
- [ ] Chat interface loads
- [ ] Can create new chat session
- [ ] Can send message
- [ ] AI responds with streaming
- [ ] Chat history saves
- [ ] Can logout

### GHL Webhook Test
- [ ] Test payment made in GHL (or test mode)
- [ ] Webhook triggered successfully
- [ ] User created in database
- [ ] Email received with password reset link
- [ ] Can set password using link
- [ ] Can login with new password
- [ ] Subscription active in database

### GHL Contact Sync Test
- [ ] User chats with bot
- [ ] Contact found in GHL
- [ ] Custom fields updated:
  - [ ] last_message shows recent message
  - [ ] last_chat_date updated
  - [ ] total_messages incremented
  - [ ] session_id populated

### Email Test
- [ ] Welcome email received on registration
- [ ] Password reset email received
- [ ] Email links work correctly
- [ ] Emails not in spam folder

---

## 📊 Monitoring Setup

### Vercel
- [ ] Backend logs accessible
- [ ] Frontend logs accessible
- [ ] Error alerts configured (optional)

### Supabase
- [ ] Database logs accessible
- [ ] Can query webhook_logs table
- [ ] Can query users table
- [ ] Can query subscriptions table

### GHL
- [ ] Workflow history accessible
- [ ] Can see webhook execution logs
- [ ] Can see contact updates

---

## 🐛 Troubleshooting Verified

- [ ] Know how to check backend logs
- [ ] Know how to check database logs
- [ ] Know how to check webhook logs
- [ ] Know how to check GHL workflow history
- [ ] Know how to check browser console
- [ ] Have backup of all environment variables
- [ ] Have backup of all API keys

---

## 📚 Documentation

- [ ] README.md reviewed
- [ ] QUICK_START.md reviewed
- [ ] DEPLOYMENT.md reviewed
- [ ] GHL_SETUP.md reviewed
- [ ] SUMMARY.md reviewed
- [ ] All URLs documented:
  - [ ] Backend URL: _______________
  - [ ] Frontend URL: _______________
  - [ ] Database URL: _______________
  - [ ] GHL Webhook URL: _______________

---

## 🎉 Final Verification

- [ ] Complete end-to-end flow tested:
  1. User pays in GHL
  2. Webhook creates user
  3. Email arrives
  4. User sets password
  5. User logs in
  6. User chats with bot
  7. AI responds
  8. Data syncs to GHL
  9. Custom fields update

- [ ] All team members have access to:
  - [ ] GitHub repository
  - [ ] Vercel projects
  - [ ] Supabase project
  - [ ] GHL account
  - [ ] Environment variables document

- [ ] Backup created:
  - [ ] Database backup taken
  - [ ] Environment variables saved
  - [ ] API keys saved securely

---

## 🚀 Go Live!

- [ ] All checklist items completed
- [ ] Production URLs shared with team
- [ ] GHL users notified about new feature
- [ ] Monitoring in place
- [ ] Support process defined

---

## 📞 Emergency Contacts

**If something breaks:**

1. Check Vercel logs (backend/frontend)
2. Check Supabase logs (database)
3. Check webhook_logs table
4. Check GHL workflow history
5. Check browser console

**Rollback Plan:**
- Vercel: Redeploy previous version
- Database: Restore from backup
- GHL: Disable workflow temporarily

---

**Congratulations! 🎉**

Tumhara RV Bot ab fully deployed aur operational hai!

**Date Completed**: _______________  
**Deployed By**: _______________  
**Production URLs**: _______________
