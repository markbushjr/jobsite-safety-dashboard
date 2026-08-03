# Jobsite Safety Compliance Dashboard

A full-stack web application for tracking weekly OSHA safety inspections across multiple construction jobsites. Site supervisors log inspection checklists, flag violations with photo evidence, and admins get a real-time compliance dashboard across all sites.

## Why this project

Built to solve a real problem: manually tracking safety compliance across job sites in a spreadsheet doesn't scale, doesn't alert anyone when a site is overdue, and gives no visibility into trends. This app replaces that process with a proper system of record.

## Tech Stack

- **Frontend:** React, React Router, Recharts (dashboard charts)
- **Backend:** Node.js, Express
- **Database:** MongoDB (Mongoose)
- **Auth:** JWT-based authentication with role-based access (Admin / Site Supervisor)
- **File uploads:** Multer (violation photos)

## Features

- Role-based auth (Admin sees all sites, Supervisor sees assigned site)
- Site management (create/edit jobsites)
- Weekly inspection checklists (OSHA-style items)
- Violation flagging with photo upload and resolution tracking
- Compliance dashboard: rates by site, by week/month, overdue-inspection alerts, trend charts

## Project Status

🚧 In active development. See commit history for build progress.

## Setup

Instructions will be added as the backend and frontend come online.
