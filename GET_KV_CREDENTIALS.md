# Quick Guide: Get Cloudflare KV Credentials

## Step 1: Get Account ID (You Already Have This!)

Your Account ID is the same as your R2 Account ID:
```
CLOUDFLARE_ACCOUNT_ID=af00a006cb... (use your existing R2_ACCOUNT_ID value)
```

## Step 2: Create KV Namespace

1. Go to: https://dash.cloudflare.com
2. Click **Workers & Pages** (left sidebar)
3. Click **KV** (under Workers & Pages)
4. Click **Create a namespace**
5. Name it: `spectral-cache` (or any name)
6. Click **Add**
7. **Copy the Namespace ID** (looks like: `abc123def456...`)

## Step 3: Create API Token

1. Go to: https://dash.cloudflare.com/profile/api-tokens
2. Click **Create Token**
3. Click **Use template** → **Edit Cloudflare Workers**
4. Under **Permissions**, add:
   - **Account** → **Cloudflare Workers** → **Edit**
   - **Account** → **Workers KV** → **Edit**
5. Under **Account Resources**, select your account
6. Click **Continue to summary**
7. Click **Create Token**
8. **COPY THE TOKEN** (you won't see it again!)

## Step 4: Add to Your .env File

Add these 3 lines to your `.env.local` (keep your R2 vars):

```bash
# Keep all your existing R2 variables:
R2_ACCOUNT_ID=af00a006cb...
R2_ACCESS_KEY_ID=TtLvEQw...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=bucket250
R2_PUBLIC_URL=https://...

# Add these NEW KV variables:
CLOUDFLARE_ACCOUNT_ID=af00a006cb...  # Same as R2_ACCOUNT_ID
CLOUDFLARE_KV_NAMESPACE_ID=your_namespace_id_from_step_2
CLOUDFLARE_API_TOKEN=your_api_token_from_step_3
```

## That's It! 🎉

Your env file should have both R2 (for images) and KV (for caching) variables.

