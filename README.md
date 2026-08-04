# Jobsite Safety Compliance Dashboard

A full-stack web application for tracking weekly OSHA-style safety inspections across multiple construction jobsites. Site supervisors log inspection checklists and flag violations; admins get a live compliance dashboard across every site — compliance rate, overdue-inspection alerts, and an 8-week trend chart.

**Live demo:** _add your deployed URL here once live_
**Login:** _add demo credentials here once you have real ones you're comfortable sharing_

## Why this project

Manually tracking safety compliance across job sites in a spreadsheet doesn't scale — it doesn't alert anyone when a site is overdue for inspection, and it gives no visibility into trends over time. This app replaces that process with a real system of record: role-scoped access, a computed compliance status per inspection, and a dashboard that surfaces what actually needs attention.

## Tech Stack

- **Frontend:** React (Vite), React Router, Recharts, Axios
- **Backend:** Node.js, Express
- **Database:** MongoDB (Mongoose), hosted on MongoDB Atlas
- **Auth:** JWT-based authentication with role-based access control (Admin / Site Supervisor)

## Features

- Role-based auth — Admins see and manage every site; Supervisors only see sites they're assigned to (enforced server-side, not just hidden in the UI)
- Site management — create sites, assign supervisors
- Weekly inspection checklists (OSHA-style items) with pass/fail per item
- Violation flagging with severity levels and open/resolved status tracking
- Compliance status is computed server-side on every inspection save, not recalculated ad hoc
- Dashboard: overall compliance rate, open violation count, overdue-site detection (based on each site's own inspection frequency), and an 8-week compliance trend chart

**Not yet implemented (noted honestly rather than overclaimed):**
- Violation photo upload — the data model supports a photo URL field, but the upload endpoint isn't built yet
- Email/notification alerts for overdue inspections
- PDF export of inspection reports

## Project Structure

```
jobsite-safety-dashboard/
├── client/          React frontend (Vite)
└── server/          Express API + MongoDB models
```

## Local Setup

### Backend
```bash
cd server
npm install
cp .env.example .env   # then fill in MONGO_URI and JWT_SECRET
npm run dev
```

### Frontend
```bash
cd client
npm install
npm run dev
```

### Seed demo data (optional)
```bash
cd server
npm run seed
```
Creates a few jobsites and several weeks of inspection history with a mix of clean, resolved, and open violations — useful for seeing the dashboard populated with realistic data. See `server/src/seed.js` for exactly what it creates.

### Creating your first account
There's no public sign-up form by design (this is an internal company tool). Create the first admin account by POSTing to `/api/auth/register`:
```json
{
  "name": "Your Name",
  "email": "you@example.com",
  "password": "your-password",
  "role": "admin"
}
```

## Deployment

- **Backend:** deployed on [Render](https://render.com) as a Node web service
- **Frontend:** deployed on [Vercel](https://vercel.com) as a static Vite build
- Set `CORS_ORIGIN` on the backend to your deployed frontend URL, and `VITE_API_URL` on the frontend to your deployed backend URL + `/api`

## Project Status

Actively developed, built incrementally with real commit history — see the commit log for the build progression from an empty scaffold through auth, CRUD, the dashboard, and deployment.
