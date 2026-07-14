# EventPilot Server

TypeScript Express API for EventPilot. It handles MongoDB data, JWT auth, role authorization, Google token verification, event management, saved/attending events, reviews, admin moderation, and Stripe checkout/webhooks.

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Configure `.env` with MongoDB, JWT, Google, Stripe, and seed credentials.

Required keys:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=...
JWT_SECRET=...
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:3000
GOOGLE_CLIENT_ID=...
STRIPE_SECRET_KEY=...
STRIPE_PREMIUM_PRICE_ID=...
STRIPE_WEBHOOK_SECRET=
STRIPE_SUCCESS_URL=http://localhost:3000/dashboard?payment=success
STRIPE_CANCEL_URL=http://localhost:3000/explore
ADMIN_EMAIL=...
ADMIN_PASSWORD=...
DEMO_USER_EMAIL=...
DEMO_USER_PASSWORD=...
SEED_USER_EMAIL=...
SEED_USER_PASSWORD=...
```

3. Seed MongoDB:

```bash
npm run seed
```

4. Run locally:

```bash
npm run dev
```

## Auth Rules

- New registration creates either a `user` or `organizer` account based on the selected role.
- Email and role are unique together, so the same email can have separate `user` and `organizer` accounts.
- Login requires the same role that was used during registration.
- Google login does not create new accounts. If the selected role/email is not registered, the API returns a register-first message.
- Google registration creates either a `user` or `organizer` account based on the selected role.
- Demo login is only a normal user account and is blocked from data-changing actions.
- Admin is seeded from `ADMIN_EMAIL` and `ADMIN_PASSWORD`; admin does not register through the public registration page.
- Admin cannot use Google login.

## Event Management

- `GET /api/events/manage/list` returns manageable event records for organizer/admin dashboards.
- Organizers only receive their own events; admins receive all events.
- `POST /api/events` accepts an optional image URL and stores a default event image when none is provided.
- Existing MongoDB event gallery arrays were repaired non-destructively so details pages can show multiple images.

## Deployment Notes

Render can use `render.yaml`. Set the same production env keys in the Render dashboard. After the server is live, create a Stripe webhook endpoint pointing to:

```text
https://<render-service-url>/api/payments/webhook
```

Then copy Stripe's signing secret into `STRIPE_WEBHOOK_SECRET` in Render.

Health check:

```text
/api/health
```

## Recent Configuration Work

- Added `/api/health` for Render health checks.
- Added Stripe webhook handling for successful Checkout sessions.
- Moved seeded admin, demo, and seed user credentials to env variables.
- Added role-aware login/registration for users and organizers.
- Added organizer/admin event management listing for `/items/manage`.
- Dashboard counts now come from MongoDB activity, event, user, payment, and review records.
- Event creation now supports optional image URLs and stores a gallery fallback.
- Stopped Google login from auto-registering unknown emails.
- Updated JWT signing types for production TypeScript builds.
