# 🔧 Render Deployment Fix Guide

## 🚨 Current Issue

Your backend is connecting to localhost database instead of Render database because environment variables are not properly configured in Render.

## 📋 Required Environment Variables for Render

Go to your Render dashboard → Your service → Environment tab and add these variables:

### Essential Variables:

```
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://synapse_database_txii_user:u3HvzQi1T3nJikP23inIJJyZn8ds5998@dpg-d3t0d76mcj7s73bcq9bg-a.singapore-postgres.render.com/synapse_database_txii
```

### Pinata Variables:

```
PINATA_API=2ac1d94de413e31ea7cd
PINATA_API_SECRET=cf789a0ba5dd01f288e54cb3b5a3345966f6258ec78b03e85c179d0f200873c0
PINATA_JWT_SECRET_ACCESS=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiJhNGIzNjlkYi1iZGQ3LTQ0MjEtYWY5Zi0xOGI5ZGI1MWRmNzUiLCJlbWFpbCI6InNoYW50YW5hdjdAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiRlJBMSJ9LHsiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiTllDMSJ9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6IjJhYzFkOTRkZTQxM2UzMWVhN2NkIiwic2NvcGVkS2V5U2VjcmV0IjoiY2Y3ODlhMGJhNWRkMDFmMjg4ZTU0Y2IzYjVhMzM0NTk2NmY2MjU4ZWM3OGIwM2U4NWMxNzlkMGYyMDA4NzNjMCIsImV4cCI6MTc5MjE4NTYyMn0.nTPZlW901DPqcgW_U9FEseExr0eZJFjdF8pEOLwKHB0
PINATA_GATEWAY_URI=https://gateway.pinata.cloud
```

## 🔄 Step-by-Step Fix

### 1. **Set Environment Variables in Render**

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click on your backend service
3. Go to "Environment" tab
4. Add each variable listed above
5. Click "Save Changes"

### 2. **Redeploy Your Service**

1. In your service dashboard, click "Deploy Latest Commit"
2. Wait for deployment to complete

### 3. **Check Logs**

After deployment, check logs for:

```
✅ Database connected successfully at: [timestamp]
Server running on port 3000
```

## 🧪 Verification Steps

### Test 1: Check Environment Variables

Your logs should show:

```
🔍 Environment Check:
   - NODE_ENV: production
   - PORT: 3000
   - DATABASE_URL: ✅ SET
```

### Test 2: Database Connection

Should see:

```
🔌 Attempting database connection...
✅ Database connected successfully at: [timestamp]
```

### Test 3: Server Port

Should see:

```
Server running on port 3000
```

(NOT port 5000)

## 🚨 Common Render Issues

### Issue: Environment Variables Not Loading

- **Solution**: Manually set variables in Render dashboard (not .env file)
- **Check**: Environment tab in your Render service

### Issue: Database Connection Refused

- **Solution**: Verify DATABASE_URL is exactly correct
- **Check**: Make sure it's the external URL, not internal

### Issue: Wrong Port

- **Solution**: Set PORT=3000 in Render environment variables
- **Check**: Render uses the PORT environment variable for web services

## 📞 Debug Commands

### Check if DATABASE_URL is being loaded:

Add this to your main.ts temporarily:

```javascript
console.log("DATABASE_URL exists:", !!process.env.DATABASE_URL);
console.log("PORT:", process.env.PORT);
```

### Test database connection manually:

```bash
# Test from your local machine
psql postgresql://synapse_database_txii_user:u3HvzQi1T3nJikP23inIJJyZn8ds5998@dpg-d3t0d76mcj7s73bcq9bg-a.singapore-postgres.render.com/synapse_database_txii
```

## ✅ Expected Final Result

After fixing, your Render logs should show:

```
🔍 Environment Check:
   - NODE_ENV: production
   - PORT: 3000
   - DATABASE_URL: ✅ SET
🔗 DATABASE_URL format: postgresql://***:***@dpg-d3t0d76mcj7s73bcq9bg-a.singapore-postgres.render.com/synapse_database_txii
🔌 Attempting database connection...
✅ Database connected successfully at: 2025-11-08T...
Server running on port 3000
```
