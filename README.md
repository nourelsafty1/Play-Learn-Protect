# Play-Learn-Protect

A web-based platform for children, parents, and educators in Egypt, supporting English and Arabic. Features:
- Children: Age-appropriate games/lessons, dashboard (points, level, streaks, achievements, screen time), cannot change safety settings.
- Parents: Manage child accounts, view dashboards (screen time, progress, achievements, leaderboard), set screen time limits, receive alerts, monitor and resolve safety alerts.
- Educators: Create/edit learning modules, monitor enrolled children, view progress/activity/alerts, resolve alerts when allowed.
- Safety: Tracks screen time, session frequency, accessed content, detects excessive gaming/inappropriate content/cyberbullying, provides educational alerts.
- System: Fast dashboards, multi-user, auto-save progress, secure authentication.

## How to Run

1. Install dependencies:
   - Backend: `cd backend && npm install`
   - Frontend: `cd frontend && npm install`
2. Start backend: `cd backend && npm start`
3. Start frontend: `cd frontend && npm start`
4. Access via browser (default: http://localhost:3000)

## Language Support

Switch between English and Arabic using the language toggle in the Navbar.

## SRS Document

To include your SRS Word document:
- Place your SRS .docx file in the root directory.
- Add a note in this README (see below).

## Including SRS Document

This project includes an SRS document describing requirements and design. To view:
- Open `Play-Learn-Protect-SRS.docx` in the root directory.

## Deployment

To push to GitHub:
1. `git remote add origin https://github.com/MunaSchool/Play-Learn-Protect.git`
2. `git branch -M main`
3. `git push -u origin main`

---
For troubleshooting, see `TROUBLESHOOTING_GAME_ERRORS.md`.
For self-hosted game setup, see `SELF_HOSTED_GAMES_SETUP.md`.
For updating games, see `UPDATE_GAMES_TO_SELF_HOSTED.md`.
