# Messages

A real-time one-on-one chat app. React/Vite frontend, Express/Socket.IO backend, MongoDB for storage, Clerk for auth, and ImageKit for media attachments.

## Features

- Realtime messaging over Socket.IO, with an online-presence indicator
- Clerk-based sign up / sign in, with a webhook that syncs user records into MongoDB
- Image and video attachments (up to 25MB) uploaded to ImageKit
- Theme presets and wallpaper picker
- Ships as a single Docker image: Express serves both the API and the built SPA

## Tech stack

**Frontend** — React 19, Vite, React Router, Zustand, HeroUI, Tailwind CSS v4, `@clerk/react`, `socket.io-client`

**Backend** — Express 5, Mongoose, Socket.IO, `@clerk/express` + Clerk webhooks, ImageKit SDK, Multer, `cron`

## Project structure

```
backend/
  src/
    controllers/    # request handlers (auth, messages)
    middleware/      # Clerk route protection, multer upload config
    models/           # Mongoose schemas (User, Message)
    routes/            # Express routers
    webhooks/          # Clerk user.created/updated/deleted sync
    lib/                 # db connection, socket.io server, ImageKit client, cron
frontend/
  src/
    components/     # UI components (chat/, auth/)
    context/          # Theme & wallpaper providers
    pages/             # ChatPage, AuthPage
    store/              # Zustand stores (auth, chat)
    lib/                  # axios instance, ImageKit helper
```

## Prerequisites

- Node.js 22+
- A MongoDB database (e.g. [MongoDB Atlas](https://www.mongodb.com/atlas))
- A [Clerk](https://clerk.com) application (publishable key, secret key, and a webhook)
- An [ImageKit](https://imagekit.io) account (private key)

## Getting started

```bash
git clone <repo-url>
cd messages
```

**Backend**

```bash
cd backend
npm install
cp .env.example .env   # fill in Mongo URI, Clerk keys, ImageKit key, etc.
npm run dev             # runs on PORT from .env (default 3000)
```

**Frontend** (in a separate terminal)

```bash
cd frontend
npm install
cp .env.example .env   # fill in the Clerk publishable key
npm run dev             # http://localhost:5173
```

The frontend proxies API/auth calls to the backend via `axios`/Clerk; both must be running for the app to work locally.

## Environment variables

See [`backend/.env.example`](backend/.env.example) and [`frontend/.env.example`](frontend/.env.example) for the full list. Key points:

- `VITE_CLERK_PUBLISHABLE_KEY` (frontend) and `CLERK_PUBLISHABLE_KEY` (backend) must come from the **same** Clerk application.
- `CLERK_WEBHOOK_SECRET` comes from a Clerk webhook endpoint pointed at `POST /api/webhooks/clerk`, subscribed to `user.created`, `user.updated`, and `user.deleted` — this is how users end up in MongoDB.
- `FRONTEND_URL` is used both for CORS and by the production keep-alive cron job (pings `/health` every 14 minutes).

## Scripts

**Backend** (`backend/package.json`)

| Script | Description |
| --- | --- |
| `npm run dev` | Run the API with `node --watch` |
| `npm start` | Run the API (production) |
| `npm run build` | Copy `src/` to `dist/` (used by the Docker build) |
| `npm run db:seed` | Seed sample users |
| `npm run db:clear-messages` | Clear all messages from the database |

**Frontend** (`frontend/package.json`)

| Script | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Build the production SPA |
| `npm run lint` | Run Oxlint |
| `npm run preview` | Preview the production build locally |

## Docker

The `Dockerfile` at the repo root builds both apps into a single production image (build the SPA, copy the backend, serve the SPA as static files from Express):

```bash
docker build \
  --build-arg VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxx \
  -t messages .

docker run -p 3001:3001 \
  -e MONGO_URI=... \
  -e CLERK_PUBLISHABLE_KEY=... \
  -e CLERK_SECRET_KEY=... \
  -e CLERK_WEBHOOK_SECRET=... \
  -e IMAGEKIT_PRIVATE_KEY=... \
  -e FRONTEND_URL=https://your-deployed-url \
  -e NODE_ENV=production \
  messages
```

The Clerk publishable key is embedded at build time (it ends up in client JS); everything else is passed at runtime as backend env vars.

## Health check

`GET /health` returns `{ ok: true }` and is used by the production keep-alive cron job and can be used for uptime/deploy health checks.
