# GHL Setup Guide - Step by Step

Is guide mein main tumhe **step-by-step** bataunga ki RV Bot ko GHL mein kaise setup karein.

## 📋 Prerequisites

Pehle yeh cheezein ready rakho:

1. ✅ GHL account (Agency ya Sub-account)
2. ✅ Backend deployed on Vercel (deployment guide dekho)
3. ✅ Frontend deployed on Vercel
4. ✅ Database setup complete (Supabase)
5. ✅ OpenAI/Gemini API keys

---

## 🔧 Step 1: GHL Webhook Setup (Payment Integration)

### 1.1 Create Webhook Secret

Pehle ek strong secret generate karo:

```bash
# Terminal mein run karo
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Yeh secret copy karo aur apne backend `.env` mein add karo:

```
GHL_WEBHOOK_SECRET=your-generated-secret-here
```

### 1.2 Create Payment Link in GHL

1. **GHL Dashboard** mein jao
2. **Payments** → **Payment Links** pe click karo
3. **Create New Payment Link** button click karo
4. Fill karo:
   - **Name**: "RV Bot - One Wish" (ya jo plan ho)
   - **Amount**: Plan ka price (e.g., $0 for free, $19 for paid)
   - **Description**: Plan details
5. **Save** karo
6. **Payment Link ID** copy karo (URL mein dikhega)

### 1.3 Create Workflow for Payment

1. **Automations** → **Workflows** pe jao
2. **Create Workflow** click karo
3. **Name**: "RV Bot - Auto User Creation"
4. **Trigger**: Select "Payment Received"
5. **Filter**: Select your payment link

### 1.4 Add Webhook Action

1. Workflow mein **Add Action** click karo
2. **Custom Webhook** select karo
3. Fill karo:
   - **Webhook URL**: `https://your-backend.vercel.app/api/ghl/webhook?secret=YOUR_SECRET`
   - **Method**: POST
   - **Headers**: 
     ```
     Content-Type: application/json
     ```
   - **Body** (JSON):
     ```json
     {
       "email": "{{contact.email}}",
       "name": "{{contact.name}}",
       "planId": "1",
       "amount": "{{payment.amount}}",
       "paymentLinkId": "{{payment.payment_link_id}}",
       "orderId": "{{payment.id}}"
     }
     ```

**Important**: `planId` ko change karo based on plan:
- One Wish = 1
- 3 Wishes = 2
- 12 Wishes = 3

4. **Save** karo

### 1.5 Add Email Action (Optional)

Webhook ke baad ek aur action add karo:

1. **Add Action** → **Send Email**
2. **To**: {{contact.email}}
3. **Subject**: "Your RV Bot Access is Ready!"
4. **Body**:
   ```
   Hi {{contact.name}},

   Thanks for your purchase! 

   You'll receive a password setup email shortly at {{contact.email}}.

   Click the link in that email to set your password and start using RV Bot.

   Questions? Reply to this email.

   Best regards,
   RV Journey Genie Team
   ```

5. **Save Workflow**

---

## 🔗 Step 2: GHL Custom Menu Link (Chatbot Access)

### 2.1 Add Custom Menu Link

1. **Settings** → **Custom Menu Links** pe jao
2. **Add Custom Menu Link** click karo
3. Fill karo:
   - **Name**: "RV Bot"
   - **Icon**: Chat bubble icon select karo
   - **URL**: `https://your-frontend.vercel.app`
   - **Open in**: New Tab (ya Same Tab)
4. **Save** karo

Ab GHL dashboard mein left sidebar mein "RV Bot" link dikhega!

### 2.2 Embed in GHL Page (Optional)

Agar tum chatbot ko GHL page mein embed karna chahte ho:

1. **Sites** → **Funnels/Websites** pe jao
2. Koi page open karo ya naya banao
3. **Custom HTML** element add karo
4. Yeh code paste karo:

```html
<iframe 
  src="https://your-frontend.vercel.app/embed" 
  width="100%" 
  height="600px" 
  frameborder="0"
  style="border-radius: 8px;"
></iframe>
```

5. **Save** karo

---

## 🔐 Step 3: GHL API Integration (Contact Sync)

### 3.1 Get GHL API Key

1. **Settings** → **Integrations** → **API Keys** pe jao
2. **Create API Key** click karo
3. **Name**: "RV Bot Backend"
4. **Scopes** select karo:
   - `contacts.readonly`
   - `contacts.write`
   - `locations.readonly`
5. **Create** karo
6. API Key copy karo

### 3.2 Get Location ID

1. GHL dashboard URL dekho: `https://app.gohighlevel.com/location/LOCATION_ID/...`
2. `LOCATION_ID` copy karo

### 3.3 Add to Backend Environment

Apne backend `.env` mein add karo:

```
GHL_API_KEY=your-api-key-here
GHL_LOCATION_ID=your-location-id-here
```

Vercel dashboard mein bhi add karo:
1. Vercel project open karo
2. **Settings** → **Environment Variables**
3. Add karo:
   - `GHL_API_KEY`
   - `GHL_LOCATION_ID`
4. **Redeploy** karo

---

## 📊 Step 4: GHL Custom Fields Setup

Contact custom fields banao taaki chat data store ho sake:

1. **Settings** → **Custom Fields** pe jao
2. **Add Custom Field** click karo
3. Yeh fields banao:

| Field Name | Field Type | Description |
|------------|------------|-------------|
| `subscription_status` | Text | active/inactive |
| `subscription_plan_id` | Number | 1, 2, or 3 |
| `subscription_end_date` | Date | Expiry date |
| `last_chat_date` | Date | Last chat timestamp |
| `last_message` | Text | Last user message |
| `total_messages` | Number | Total chat count |
| `session_id` | Text | Current session ID |

4. **Save** karo

---

## ✅ Step 5: Test the Integration

### 5.1 Test Webhook

1. GHL mein test payment karo (ya test mode use karo)
2. Backend logs check karo (Vercel dashboard → Logs)
3. Database check karo ki user create hua ya nahi
4. Email check karo (password reset link aana chahiye)

### 5.2 Test Chatbot

1. GHL dashboard mein "RV Bot" link click karo
2. Password set karo (email se link use karke)
3. Login karo
4. Chat message bhejo
5. AI response aana chahiye

### 5.3 Test Contact Sync

1. Chat karo
2. GHL Contacts mein jao
3. Apna contact open karo
4. Custom fields check karo (last_message, last_chat_date, etc.)

---

## 🐛 Troubleshooting

### Webhook Not Working

**Problem**: Payment ke baad user create nahi ho raha

**Solutions**:
1. Webhook URL check karo (correct hai?)
2. Secret match kar raha hai? (backend `.env` aur webhook URL mein)
3. Backend logs dekho (Vercel dashboard)
4. Webhook logs dekho (database → `webhook_logs` table)
5. GHL workflow history check karo

### Email Not Sending

**Problem**: Password reset email nahi aa raha

**Solutions**:
1. SMTP credentials check karo (`.env` file)
2. Gmail App Password use kar rahe ho? (normal password nahi chalega)
3. Backend logs dekho
4. Spam folder check karo

### Chatbot Not Loading

**Problem**: Frontend load nahi ho raha

**Solutions**:
1. Frontend URL correct hai?
2. Backend URL frontend `.env` mein correct hai?
3. CORS enabled hai backend mein?
4. Browser console errors check karo

### GHL Contact Sync Not Working

**Problem**: Custom fields update nahi ho rahe

**Solutions**:
1. GHL API key valid hai?
2. Location ID correct hai?
3. Custom fields GHL mein create kiye hain?
4. API key mein correct scopes hain?

---

## 📞 Support

Agar koi problem ho to:

1. Backend logs check karo (Vercel)
2. Database logs check karo (`webhook_logs` table)
3. GHL workflow history check karo
4. Browser console check karo

---

## 🎉 Done!

Ab tumhara RV Bot GHL mein fully integrated hai!

**Flow**:
1. User GHL mein payment karta hai
2. Webhook trigger hota hai
3. Backend user create karta hai
4. Email bhejta hai (password setup)
5. User login karta hai
6. Chatbot use karta hai
7. Data GHL contacts mein sync hota hai

**Enjoy!** 🚀
