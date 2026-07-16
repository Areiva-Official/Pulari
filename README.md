# Pulari Restaurant

A modern, full‑stack website for **Pulari Restaurant** — authentic Kerala & South Indian cuisine in Temple Bar, Dublin. The project includes a public marketing site, an online menu and cart, and a full admin dashboard (menu, orders, reservations, offers, coupons, blog, reviews and settings) backed by a serverless AWS API.

## Features

- 🍽️ **Interactive Menu** — categorised Kerala menu with dietary flags and images
- 🛒 **Cart & Ordering** — cart with persistence; ordering via delivery partners
- 📝 **Blog** — articles managed from the admin and served via the API
- 🗓️ **Reservations & Contact** — table booking and enquiry forms
- 🔐 **Authentication** — email/password sign‑in with email OTP verification (Amazon Cognito)
- 🛠️ **Admin Dashboard** — manage menu, orders, reservations, offers, coupons, blog, reviews and settings
- 📱 **Fully Responsive** — optimised for mobile, tablet and desktop
- 🔎 **SEO‑ready** — per‑page metadata, Open Graph tags and JSON‑LD structured data

## Tech Stack

**Frontend**

- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS
- Lucide React (icons)

**Backend (AWS, serverless)**

- API Gateway (HTTP API) → AWS Lambda (Node.js, ESM)
- Amazon DynamoDB (data store)
- Amazon Cognito (authentication & admin authorisation)
- Amazon S3 + CloudFront (static hosting & CDN)
- Stripe (payments — optional, enabled when keys are configured)

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
# Install dependencies
npm install

# Start the dev server
npm run dev

# Type-check and build for production
npm run build

# Preview the production build
npm run preview
```

### Environment Variables

Create a `.env` file in the project root. **Do not commit real values** — keep `.env` out of version control. Only the variable *names* are documented here:

```bash
# API
VITE_API_BASE_URL=        # HTTPS endpoint of the API Gateway stage

# Auth (Amazon Cognito)
VITE_AWS_REGION=
VITE_COGNITO_USER_POOL_ID=
VITE_COGNITO_CLIENT_ID=

# Optional integrations
VITE_STRIPE_PUBLISHABLE_KEY=   # publishable key only — never the secret key
VITE_PINPOINT_APP_ID=          # analytics (optional)
```

If `VITE_API_BASE_URL` is left empty, the frontend runs in a local mock mode so the UI works end‑to‑end without a backend.

## Project Structure

```
src/
├── components/      # Reusable UI (Navigation, SEO, etc.)
├── contexts/        # React contexts (Auth, Cart, Settings)
├── pages/           # Public pages (Home, Menu, Blog, Contact, …)
├── admin/           # Admin dashboard (pages, hooks, data)
├── lib/             # API client and utilities
└── types/           # Shared TypeScript types

lambda/
├── src/handlers/    # One handler per domain (menu, orders, blog, …)
├── src/shared/      # Auth, DynamoDB, router, schemas, responses
└── seed*.mjs        # Local data seeding scripts

scripts/             # Infrastructure / deployment helper scripts
```

## Backend & Deployment

The backend is a set of Lambda handlers fronted by an API Gateway HTTP API, with DynamoDB for storage and Cognito for auth. Helper scripts under `scripts/` provision and deploy the infrastructure (DynamoDB tables, Lambda functions, routes, hosting). Configure your own AWS account, region and resource identifiers via environment variables and your AWS CLI profile — no account‑specific identifiers or credentials are stored in this repository.

```bash
# Build the Lambda bundles
cd lambda && npm install && npm run build

# Build the frontend
npm run build
```

## Restaurant Information

- **Name**: Pulari Restaurant
- **Location**: The Design House, Crow St, Temple Bar, Dublin, D02 F884
- **Phone**: 083 068 1518
- **Hours**: Sun–Thu 12 PM – 9 PM · Fri–Sat 12 PM – 10 PM
- **Website**: https://www.pulari.ie

## License

© 2026 Pulari Restaurant. All rights reserved.
