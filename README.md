# HitecApp (HitecMedia) — Automated Deployment Guide

Automated continuous deployment pipeline connecting **Antigravity Desktop** → **GitHub** → **Cloudflare Pages** (`app.hitec.id`).

---

## TASK 1: CONNECT GITHUB

1. **Verify `.gitignore`** is present in the project root:
   ```gitignore
   node_modules
   dist
   .env
   .env.local
   ```
2. **Initialize Git & Push to GitHub Repository**:
   Open your terminal in the project root directory (`c:\Users\Administrator\Documents\AntiGravity`) and run:
   ```bash
   git init
   git add .
   git commit -m "feat: initial HitecApp production setup"
   git branch -M main
   git remote add origin https://github.com/yourusername/hitecmedia.git
   git push -u origin main
   ```
   *(Replace `yourusername` with your actual GitHub username).*

---

## TASK 2: CONNECT CLOUDFLARE PAGES

In the **Cloudflare Pages Dashboard**:

1. Navigate to **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
2. Select your `hitecmedia` GitHub repository and click **Begin setup**.
3. Configure **Build Settings**:
   - **Framework preset**: `Vite` (or None)
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `/`
4. Configure **Environment Variables** (Production):
   Add all `VITE_FIREBASE_*` keys from your `.env` / `.env.production` file:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
5. Configure **Custom Domain**:
   - Under **Custom domains**, link `app.hitec.id` and let Cloudflare provision the SSL certificate automatically.

---

## TASK 3: ANTIGRAVITY WORKFLOW

Whenever you make code updates or improvements in **Antigravity Desktop**, deploy changes automatically with 3 simple terminal commands:

```bash
1. Make changes in Antigravity Desktop
2. git add .
3. git commit -m "fix: mobile scroll"
4. git push origin main
5. Cloudflare auto builds and deploys in 60 seconds
```

No manual file uploads or drag-and-dropping to hosting providers needed.

---

## TASK 4: PRODUCTION ENV

A `.env.production` file is included in the project root:
```env
VITE_FIREBASE_API_KEY=mock-api-key-hitecmedia
VITE_FIREBASE_AUTH_DOMAIN=hitecmedia-app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=hitecmedia-app
VITE_FIREBASE_STORAGE_BUCKET=hitecmedia-app.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
VITE_FIREBASE_APP_ID=1:1234567890:web:abcdef123456
```
Cloudflare Pages automatically reads `.env.production` during production builds (`npm run build`). You can override any of these keys securely in the Cloudflare Pages Environment Variables settings.

---

## VERIFICATION

1. Push a commit to the `main` branch:
   ```bash
   git add .
   git commit -m "docs: update deployment documentation"
   git push origin main
   ```
2. Cloudflare Pages detects the push automatically and completes the build within **60–120 seconds**.
3. Visit `https://app.hitec.id/` to verify the live update immediately.
