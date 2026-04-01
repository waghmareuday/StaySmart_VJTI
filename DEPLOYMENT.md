# StaySmart Deployment Guide

This project is deployment-ready for a split setup:
- Backend: Render Web Service
- Frontend: Vercel

## 1) Deploy Backend on Render

1. Go to Render dashboard and create a new Web Service from your GitHub repo.
2. Configure:
   - Root Directory: Backend
   - Build Command: npm install
   - Start Command: npm start
3. Add environment variables:
   - PORT=5000
   - MONGO_URI=your_mongodb_connection
   - JWT_SECRET=your_strong_secret
   - NODE_ENV=production
   - CORS_ORIGIN=https://your-frontend-domain.vercel.app
   - SMTP_USER=your_email
   - SMTP_PASSWORD=your_app_password
   - CHIEF_WARDEN_EMAIL=chiefwarden@vjti.ac.in
   - ADMIN_EMAIL=your_admin_email
   - ADMIN_PASSWORD=your_admin_password
   - TEST_STUDENT_DEFAULT_PASSWORD=student123
4. Deploy and copy backend URL, for example:
   - https://staysmart-backend.onrender.com

## 2) Deploy Frontend on Vercel

1. Import GitHub repo in Vercel.
2. Configure:
   - Root Directory: Frontend
   - Build Command: npm run build
   - Output Directory: dist
3. Add environment variable:
   - VITE_API_URL=https://your-backend-domain.onrender.com
4. Deploy.

## 3) Update Backend CORS

After frontend deploy URL is ready:
1. Open Render backend service environment.
2. Set:
   - CORS_ORIGIN=https://your-frontend-domain.vercel.app
3. Redeploy backend.

## 4) Verify Production

- Backend health: GET /api/v1/health
- Frontend loads and login works for:
  - student (Auth login)
  - admin (env admin credentials)
  - warden (warden login)

## Notes

- No hardcoded credentials are required in UI now.
- Keep secrets only in platform environment variables, never in git.
- For React Router deep links, Vercel SPA rewrite is set in Frontend/vercel.json.
