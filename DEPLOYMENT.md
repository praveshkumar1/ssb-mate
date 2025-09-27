# Free Deployment Guide for SSB Connect

## Quick Deploy (Recommended)

### Backend: Render.com
1. Push code to GitHub
2. Go to [render.com](https://render.com) → Sign up with GitHub
3. "New" → "Web Service" → Connect your repo
4. Settings:
   - Root Directory: `backend`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Auto-deploy: Yes
5. Add Environment Variables:
   ```
   NODE_ENV=production
   MONGODB_URI=your_atlas_connection_string
   JWT_SECRET=your-jwt-secret
   MAILGUN_API_KEY=your-mailgun-key
   MAILGUN_DOMAIN=your-domain
   CORS_ORIGIN=https://your-netlify-app.netlify.app
   ```

### Frontend: Netlify
1. Go to [netlify.com](https://netlify.com) → Sign up
2. "New site from Git" → Connect GitHub → Select repo
3. Settings:
   - Base directory: `frontend`
   - Build command: `npm run build`
   - Publish directory: `dist`
4. Update `frontend/.env` with your Render backend URL:
   ```
   VITE_API_URL=https://your-render-app.onrender.com
   ```

## Alternative Options

### Backend Alternatives
- **Railway**: `npm i -g @railway/cli` → `railway login` → `railway up`
- **Cyclic**: Connect GitHub, auto-deploys Node.js apps
- **Deta**: Micro services, 10GB free

### Frontend Alternatives  
- **Vercel**: `npm i -g vercel` → `vercel` in frontend folder
- **GitHub Pages**: For static React apps
- **Surge**: `npm i -g surge` → `surge dist/`

## Database Setup (MongoDB Atlas)
1. Go to [mongodb.com/atlas](https://mongodb.com/atlas)
2. Create free cluster (512MB)
3. Create database user
4. Whitelist IP: 0.0.0.0/0 (allow all)
5. Get connection string → update MONGODB_URI

## Domain Setup (Optional)
- **Free domains**: .tk, .ml, .ga from Freenom
- **Custom domain**: Update CORS_ORIGIN and frontend API URL

## Cost Breakdown
- Backend (Render): FREE (750 hours/month)
- Frontend (Netlify): FREE (100GB bandwidth)
- Database (Atlas): FREE (512MB)
- Email (Mailgun): FREE (5,000 emails/month)
- **Total: $0/month**

## Deployment Commands

```bash
# 1. Prepare for deployment
git add .
git commit -m "Deploy setup"
git push origin main

# 2. Test local build
cd backend && npm run build
cd ../frontend && npm run build

# 3. Deploy backend (if using Railway)
npm i -g @railway/cli
railway login
railway init
railway up

# 4. Deploy frontend (if using Vercel)
cd frontend
npm i -g vercel
vercel
```

## Post-Deployment Checklist
- [ ] Backend health check: `https://your-app.onrender.com/health`
- [ ] Frontend loads: `https://your-app.netlify.app`
- [ ] Database connection works
- [ ] Email sending works
- [ ] OAuth redirects updated
- [ ] CORS configured for production

## Troubleshooting
- **Build fails**: Check Node.js version (use 18+)
- **CORS errors**: Update CORS_ORIGIN in backend
- **Database connection**: Check MongoDB Atlas IP whitelist
- **OAuth**: Update redirect URIs in Google Console