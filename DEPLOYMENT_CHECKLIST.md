# 🚀 Deployment Checklist for Synapse

## Before Deployment

### ✅ Backend (Render)

- [ ] Environment variables set correctly:
  - `NODE_ENV=production`
  - `PORT=3000` (not 5432)
  - `DATABASE_URL=postgresql://...` (your Render DB URL)
  - Pinata API keys configured
- [ ] CORS origins include your Vercel URL
- [ ] Health endpoint works: `/health`
- [ ] Database connection is working

### ✅ Frontend (Vercel)

- [ ] Environment variable set:
  - `NEXT_PUBLIC_API_URL=https://synapse-ki0x.onrender.com/api`
- [ ] Build completes without errors
- [ ] API calls use the correct base URL

## After Deployment

### 🧪 Testing Steps

1. **Test Backend Health**

   ```bash
   curl https://synapse-ki0x.onrender.com/health
   ```

2. **Test API Endpoints**

   ```bash
   curl https://synapse-ki0x.onrender.com/api/datasets
   ```

3. **Test Frontend API Connection**

   - Open browser console on https://synapse-dusky.vercel.app
   - Look for: `🔗 API Base URL: https://synapse-ki0x.onrender.com/api`
   - Check for successful API requests without CORS errors

4. **Test Full User Flow**
   - [ ] Login/Connect wallet works
   - [ ] Dashboard loads user data
   - [ ] Marketplace shows datasets
   - [ ] File upload to IPFS works
   - [ ] Dataset purchase flow works

## 🚨 Troubleshooting

### If Frontend Can't Connect to Backend:

1. Check Network tab in browser for failed requests
2. Verify NEXT_PUBLIC_API_URL is set in Vercel
3. Check backend logs for CORS errors

### If Backend Returns 500 Errors:

1. Check Render logs
2. Verify DATABASE_URL is correct
3. Test database connection manually

### If CORS Errors Persist:

1. Verify the exact frontend URL (with/without trailing slash)
2. Check if it matches the CORS allowedOrigins in backend
3. Look for typos in domain names

## 📞 Support Commands

### Check Backend Status

```bash
curl -v https://synapse-ki0x.onrender.com/health
```

### Check API Response

```bash
curl -H "Content-Type: application/json" https://synapse-ki0x.onrender.com/api/datasets
```

### Test CORS

```bash
curl -H "Origin: https://synapse-dusky.vercel.app" \
     -H "Content-Type: application/json" \
     -X OPTIONS \
     https://synapse-ki0x.onrender.com/api/datasets
```
