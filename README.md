# EventPilot Server

EventPilot Server is the production Express API for the EventPilot full-stack TypeScript event platform. It provides MongoDB persistence, JWT authentication, role-based authorization, Google token verification, event management, dashboard activity, Stripe payment integration, and admin moderation.

Live API: https://eventpilot-server.onrender.com

Client repository: https://github.com/fahid2002/EventPilot-Client

## Features

- TypeScript Express API with modular routes, controllers, models, and middleware.
- MongoDB Atlas persistence with Mongoose models.
- JWT login sessions.
- Password hashing with bcrypt.
- Role-aware authentication for `user`, `organizer`, and `admin`.
- Separate user and organizer accounts for the same email by enforcing unique `email + role`.
- Google login for already registered user/organizer accounts.
- Google registration for new user/organizer accounts.
- Admin email/password login only.
- Demo user support with mutation blocking.
- Public event listing with search, filters, sorting, and pagination.
- Public event details endpoint.
- Organizer/admin event creation and deletion.
- Organizer/admin manageable event list.
- User dashboard summary from live MongoDB records.
- Saved event, attending event, and website review activity.
- Premium event attendance rules.
- Stripe Checkout session creation.
- Stripe webhook handling for successful payments.
- Demo premium upgrade for project demonstration.
- Admin event approval/rejection workflow.
- Admin user listing and role update endpoints.
- Seed script for initial admin, demo user, seed user, events, and activity data.
- Render-ready health check endpoint.

## Tech Stack

- Node.js
- Express.js
- TypeScript
- MongoDB Atlas
- Mongoose
- JWT
- bcryptjs
- Zod validation
- Google Auth Library
- Stripe SDK
- Render deployment

## Project Structure

```text
src/
  config/
    db.ts                    MongoDB connection
  controllers/
    authController.ts        Email/password and Google auth
    eventController.ts       Event listing, details, create, manage, delete
    userController.ts        Dashboard, saved, attending, reviews
    paymentController.ts     Stripe checkout, demo upgrade, webhook
    adminController.ts       Admin moderation and user tools
  middleware/
    auth.ts                  JWT auth, role checks, demo mutation guard
    error.ts                 Error handling and 404 middleware
  models/
    User.ts
    Event.ts
    SavedEvent.ts
    Attendance.ts
    Review.ts
    Payment.ts
  routes/
    authRoutes.ts
    eventRoutes.ts
    userRoutes.ts
    paymentRoutes.ts
    adminRoutes.ts
  seed/
    seed.ts                  Initial database seed
  index.ts                   Express app bootstrap
```

## Local Setup

### Prerequisites

- Node.js 20 or newer
- npm
- MongoDB Atlas database URI
- Google OAuth web client ID
- Optional Stripe test keys for checkout

### Installation

```bash
npm install
```

### Environment Variables

Create `.env` in the server root:

```env
NODE_ENV=development
PORT=5000

MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/eventpilot?retryWrites=true&w=majority

JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=365d

CLIENT_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your_google_oauth_client_id

STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PREMIUM_PRICE_ID=price_your_premium_membership_price_id
STRIPE_WEBHOOK_SECRET=
STRIPE_SUCCESS_URL=http://localhost:3000/dashboard?payment=success
STRIPE_CANCEL_URL=http://localhost:3000/explore

ADMIN_EMAIL=admin@eventpilot.dev
ADMIN_PASSWORD=TypeScript@123

DEMO_USER_EMAIL=demo@eventpilot.dev
DEMO_USER_PASSWORD=Demo@123

SEED_USER_EMAIL=fahid@example.com
SEED_USER_PASSWORD=TypeScript@123
```

Never commit real `.env` secrets. Keep MongoDB credentials, JWT secrets, Stripe secrets, admin password, and webhook secrets only in local environment files or deployment provider environment variables.

### Seed MongoDB

Run the seed script after configuring `.env`:

```bash
npm run seed
```

The seed script creates:

- Admin account from `ADMIN_EMAIL` and `ADMIN_PASSWORD`
- Demo user from `DEMO_USER_EMAIL` and `DEMO_USER_PASSWORD`
- Seed user from `SEED_USER_EMAIL` and `SEED_USER_PASSWORD`
- Approved and pending events
- Event galleries
- Saved events
- Attendance records
- Reviews
- Payment records

### Run Locally

```bash
npm run dev
```

The API runs at:

```text
http://localhost:5000
```

Health check:

```text
http://localhost:5000/api/health
```

### Production Build

```bash
npm run build
npm run start
```

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the TypeScript API with `tsx watch` |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run start` | Run the compiled production server |
| `npm run seed` | Seed MongoDB with required project data |

## API Endpoints

### Base

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/` | Public | API running message |
| `GET` | `/api/health` | Public | Render health check |

### Auth

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | Public | Register user or organizer |
| `POST` | `/api/auth/login` | Public | Login with email, password, and role |
| `POST` | `/api/auth/google` | Public | Login registered user/organizer with Google |
| `POST` | `/api/auth/google/register` | Public | Register user/organizer with Google |
| `GET` | `/api/auth/me` | Protected | Return current authenticated user |

### Events

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/events` | Public | List approved events by default with search/filter/sort/pagination |
| `GET` | `/api/events/:id` | Public | Get one event |
| `GET` | `/api/events/manage/list` | Organizer/Admin | List manageable events |
| `POST` | `/api/events` | Organizer/Admin | Create an event |
| `DELETE` | `/api/events/:id` | Organizer/Admin | Delete own event or any event as admin |

### User Activity

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/users/dashboard` | Protected | Dashboard summary, saved events, attending events, recommendations |
| `POST` | `/api/users/saved/:eventId` | Protected | Toggle saved event |
| `POST` | `/api/users/attend/:eventId` | Protected | Attend free event or enforce premium flow |
| `POST` | `/api/users/reviews` | Protected | Submit website review |

### Payments

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/payments/checkout/:eventId` | Protected | Create Stripe Checkout session |
| `POST` | `/api/payments/demo-upgrade/:eventId` | Protected | Demo premium upgrade and attendance |
| `POST` | `/api/payments/webhook` | Stripe | Handle Stripe checkout completion |

### Admin

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/admin/events/pending` | Admin | List pending events |
| `PATCH` | `/api/admin/events/:id/status` | Admin | Approve or reject event |
| `GET` | `/api/admin/users` | Admin | List users |
| `PATCH` | `/api/admin/users/:id/role` | Admin | Update user role |

## Auth and Role Rules

- User and organizer registration is public.
- Admin registration is not public.
- Admin credentials are created through the seed script.
- Login requires the selected role to match the stored account role.
- Google login does not auto-create accounts.
- Google registration creates accounts only for `user` or `organizer`.
- Admin cannot use Google login or Google registration.
- Demo account is a normal user account with `isDemo: true`.
- Demo users are blocked from mutations by middleware.
- Organizers can manage only their own events.
- Admins can manage all events and approve/reject pending event submissions.

## MongoDB Collections

The server uses these MongoDB collections:

- `users`
- `events`
- `savedevents`
- `attendances`
- `reviews`
- `payments`

Important indexes:

- `users`: unique compound index on `email + role`
- `events`: text index on title, category, and location

## Stripe Setup

For local checkout testing, configure:

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PREMIUM_PRICE_ID=price_...
STRIPE_SUCCESS_URL=http://localhost:3000/dashboard?payment=success
STRIPE_CANCEL_URL=http://localhost:3000/explore
```

For production, create a Stripe webhook endpoint:

```text
https://eventpilot-server.onrender.com/api/payments/webhook
```

Then set the signing secret:

```env
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Google OAuth Setup

Create a Google Cloud OAuth Web Client and add authorized JavaScript origins for the frontend:

```text
http://localhost:3000
https://eventpilot-client.vercel.app
```

Use the same client ID in:

- Server: `GOOGLE_CLIENT_ID`
- Client: `NEXT_PUBLIC_GOOGLE_CLIENT_ID`

The server verifies Google credentials using `google-auth-library`.

## Deployment

The server is deployed on Render from the GitHub repository.

Production URL:

```text
https://eventpilot-server.onrender.com
```

Recommended Render settings:

```text
Build Command: npm install && npm run build
Start Command: npm run start
Health Check Path: /api/health
```

Required Render environment variables:

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=your_mongodb_atlas_uri
JWT_SECRET=your_long_random_secret
JWT_EXPIRES_IN=365d
CLIENT_URL=https://eventpilot-client.vercel.app
GOOGLE_CLIENT_ID=your_google_oauth_client_id
STRIPE_SECRET_KEY=sk_live_or_test_key
STRIPE_PREMIUM_PRICE_ID=price_id
STRIPE_WEBHOOK_SECRET=whsec_if_configured
STRIPE_SUCCESS_URL=https://eventpilot-client.vercel.app/dashboard?payment=success
STRIPE_CANCEL_URL=https://eventpilot-client.vercel.app/explore
ADMIN_EMAIL=admin@eventpilot.dev
ADMIN_PASSWORD=your_admin_password
DEMO_USER_EMAIL=demo@eventpilot.dev
DEMO_USER_PASSWORD=your_demo_password
SEED_USER_EMAIL=seed@example.com
SEED_USER_PASSWORD=your_seed_password
```

Current production environment variables are configured directly in Render. Local `.env` values are for development only and should not be committed.

## Verification Checklist

Before deploying:

```bash
npm run build
```

Then verify:

- `GET /api/health` returns `status: ok`.
- `GET /api/events?limit=2` returns approved events.
- Demo login works only with role `user`.
- Admin login works with email/password.
- Unknown Google login returns a register-first message.
- `GET /api/events/manage/list` works for organizer/admin tokens.
- Normal user tokens cannot access organizer/admin event management.
- Demo user cannot save, attend, review, pay, add, manage, or delete.
- Newly issued production JWTs are valid for 365 days, based on `JWT_EXPIRES_IN=365d`.

## Security Notes

- Rotate any API key or token that has been shared publicly.
- Do not commit `.env`.
- Keep client variables limited to values that are safe to expose in the browser.
- Use a long random `JWT_SECRET` in production.
- Keep MongoDB Atlas network access as restrictive as possible for production needs.
- Use Stripe test keys for demos unless the project is ready for real billing.

## Credits

Developed by **Fahid Hasan**.

Built as a full-stack TypeScript project using Next.js, Express.js, MongoDB, JWT authentication, role-based authorization, Google login, Stripe payment integration, and responsive Tailwind CSS UI.
