# Skipline Now Challenge

Task management app for small teams. An Express backend serves a REST API, real-time chat over Socket.IO, and persists data in Firebase Firestore. A Next.js frontend provides the web UI.

## Structure

```
skiplinow-challenge/
  backend/   Express API, Firebase Admin SDK, Twilio SMS, Nodemailer email
  frontend/  Next.js app (React 19)
```

## Prerequisites

- Node.js 20 or newer
- npm
- A Firebase project (free Spark plan works for development; the Admin SDK needs the Blaze plan)
- Optional: a Twilio account (trial is fine) and an SMTP account for email

## 1. Firebase setup

1. Create a project at https://console.firebase.google.com
2. In the project, go to Build, Firestore Database, and create a database (production mode is fine for local development)
3. Go to Project settings, Service accounts tab, click Generate new private key, and download the JSON file
4. Move the file into `backend/` (for example `backend/firebase-service-account.json`)

The service account file is git-ignored. Never commit it.

## 2. Backend setup

```sh
cd backend
npm install
cp .env.example .env
```

Edit `backend/.env` and fill in these values:

- `FIREBASE_SERVICE_ACCOUNT`: path to the service account JSON, for example `./firebase-service-account.json`
- `JWT_SECRET`: a long random string. Leave the default only for local development.
- `OWNER_NAME` and `OWNER_PHONE`: the seed owner account, created on first boot. The phone must be E.164, for example `+84356176054`.
- `DEV_MODE`: keep `true` for local development. Codes and invite links are printed to the terminal instead of sent.
- Twilio (optional): `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM` (your trial number). On trial accounts, also set `TWILIO_BODY_TEMPLATE=sms_2fa` and add your test number to Verified Caller IDs in the Twilio console.
- SMTP (optional): `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` (for Gmail use an app password), `EMAIL_FROM`.

## 3. Frontend setup

```sh
cd frontend
npm install
cp .env.example .env.local
```

The defaults in `.env.local` point at `http://localhost:4000`, so no edits are needed to run locally. Set `NEXT_PUBLIC_USE_MOCK=false` if you ever want the browser mock instead of the real backend.

## 4. Run

Terminal 1 (backend, port 4000):

```sh
cd backend
npm run dev
```

Terminal 2 (frontend, port 3000):

```sh
cd frontend
npm run dev
```

Open http://localhost:3000 and log in with the owner phone from `.env`:

1. Enter the phone number on the login page
2. The access code is returned by the API (and printed to the backend terminal in dev mode)
3. Enter the code to receive a JWT and land on the dashboard

## Useful commands

Backend:

```sh
cd backend
npm run dev          # run with auto-reload
npm run build        # compile TypeScript to dist/
npm start            # run the compiled output
npm run typecheck    # type-check without emitting
```

Frontend:

```sh
cd frontend
npm run dev          # run the dev server
npm run build        # production build
npm start            # serve the production build
npm run lint         # run ESLint
```

## Architecture notes

- All client requests go through the backend API. The frontend uses axios with a Bearer token from localStorage (`Tasked.auth`).
- Access codes are stored hashed in the `accessCodes` collection with a 10 minute TTL, a 5 attempt limit, and are deleted after a successful validation.
- Employees receive an invite email with a setup link, then set a username and password. They can also log in with an email access code.
- Chat uses Socket.IO with token-based authentication on the socket handshake.
- The database adapter lives in `backend/src/db.ts`. When Firebase is configured it uses Firestore; otherwise it falls back to an in-memory store in dev mode.
