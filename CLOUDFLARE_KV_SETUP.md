# Cloudflare KV Setup Guide

## ✅ Implementation Complete

Cloudflare KV has been fully implemented with:
- ✅ REST API support (works from Vercel)
- ✅ Cloudflare Workers binding support (if you migrate)
- ✅ In-memory fallback for local development
- ✅ Automatic cache key standardization
- ✅ TTL support (24 hours default)

## 🔧 Setup Instructions

### Option 1: Cloudflare KV REST API (Recommended for Vercel)

1. **Get your Cloudflare Account ID**
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
   - Click on any domain
   - Scroll down to find your **Account ID** (right sidebar)

2. **Create a KV Namespace**
   - Go to [Workers & Pages](https://dash.cloudflare.com/?to=/:account/workers-and-pages)
   - Click **KV** in the left sidebar
   - Click **Create a namespace**
   - Name it: `spectral-cache` (or any name you prefer)
   - Copy the **Namespace ID**

3. **Create an API Token**
   - Go to [API Tokens](https://dash.cloudflare.com/profile/api-tokens)
   - Click **Create Token**
   - Use **Edit Cloudflare Workers** template
   - Add these permissions:
     - **Account** → **Cloudflare Workers:Edit**
     - **Account** → **Workers KV:Edit**
   - Click **Continue to summary** → **Create Token**
   - **Copy the token** (you won't see it again!)

4. **Add Environment Variables to Vercel**
   - Go to your Vercel project settings
   - Navigate to **Environment Variables**
   - Add these variables:
     ```
     CLOUDFLARE_ACCOUNT_ID=your_account_id_here
     CLOUDFLARE_KV_NAMESPACE_ID=your_namespace_id_here
     CLOUDFLARE_API_TOKEN=your_api_token_here
     ```
   - Make sure to add them to **Production**, **Preview**, and **Development**

5. **For Local Development**
   - Add to your `.env.local` file:
     ```bash
     CLOUDFLARE_ACCOUNT_ID=your_account_id_here
     CLOUDFLARE_KV_NAMESPACE_ID=your_namespace_id_here
     CLOUDFLARE_API_TOKEN=your_api_token_here
     ```
   - Note: Local dev will use in-memory cache if KV is not configured

### Option 2: Cloudflare Workers (If you migrate)

If you deploy to Cloudflare Workers instead of Vercel:

1. Create a `wrangler.toml` file:
   ```toml
   name = "spectral-alignment"
   account_id = "your_account_id"
   
   [[kv_namespaces]]
   binding = "KV_NAMESPACE"
   id = "your_namespace_id"
   ```

2. The code will automatically use the KV binding - no REST API needed!

## 🧪 Testing

1. **Test locally:**
   ```bash
   npm run dev
   ```
   - Should work with in-memory cache (no errors)
   - Check console for cache hits/misses

2. **Test with KV:**
   - Add the env vars
   - Make a request that should be cached
   - Check Cloudflare dashboard → KV → your namespace
   - You should see keys like `spectral:analysis:12345`

3. **Check cache status:**
   - Visit: `http://localhost:3000/api/env-status` (dev only)
   - Should show KV configuration status

## 📊 Cache Keys Used

- `spectral:analysis:{fid}` - User analysis results
- `spectral:share-image:{fid}` - Share image URLs
- `spectral:share-image:{username}-{type}` - Share images by username/type

## 🔍 Monitoring

- **Cloudflare Dashboard**: View KV usage and keys
- **Vercel Logs**: Check for KV API errors
- **Console Logs**: Look for "Error reading/writing to KV" messages

## ⚠️ Troubleshooting

**Issue: "KV REST API error: 401"**
- Check your API token is correct
- Ensure token has KV permissions

**Issue: "KV REST API error: 404"**
- Check namespace ID is correct
- Verify namespace exists in your account

**Issue: Cache not working**
- Check env vars are set correctly
- Look for errors in console/logs
- Verify API token has correct permissions

**Issue: Works locally but not on Vercel**
- Ensure env vars are added to Vercel (not just `.env.local`)
- Redeploy after adding env vars
- Check Vercel function logs

## 💡 Notes

- **Free Tier**: Cloudflare KV free tier includes:
  - 100,000 reads/day
  - 1,000 writes/day
  - 1 GB storage
- **TTL**: Default cache TTL is 24 hours (configurable in `constants.js`)
- **Fallback**: If KV fails, the app will still work (just slower, no caching)

## 🎉 You're Done!

Once env vars are set, caching will work automatically. No code changes needed!

