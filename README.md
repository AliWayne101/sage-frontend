# Sage Frontend

This repository contains the Next.js frontend for the Sage trading platform: a private automated Binance Futures dashboard for user management, bot configuration, live monitoring, and trade operations.

The app is built around a secure operator flow: sign in, create or manage a trading profile, connect Binance API keys, configure a strategy and execution mode, and monitor the bot's performance from a focused control panel.

---

## Overview

Sage Frontend is a production-style dashboard for managing a crypto trading bot environment. It includes:

- Secure authentication with email/password and Google OAuth
- MongoDB-backed account and user management
- Bot creation and operator profile setup
- Demo/live mode switching
- Binance API key management with encrypted secrets
- Trading dashboard with charts, PnL, log terminal, and heartbeat status
- Trade history, fees, fleet, and inspection screens
- Strategy and risk configuration for user accounts

This project is the UI layer for the Sage ecosystem and depends on the Sage backend/bot runtime for live execution data.

---

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS v4
- NextAuth
- MongoDB + Mongoose
- lightweight-charts
- Recharts
- lucide-react

---

## Project Structure

```text
app/
├── Auth/
├── AuthProvider.tsx
├── actions/
│   ├── seeder.actions.ts
│   ├── server.actions.ts
│   ├── trades.actions.ts
│   ├── transactions.actions.ts
│   └── user.actions.ts
├── api/
│   └── auth/[...nextauth]/route.ts
├── create/
├── dashboard/
├── fees/
├── fleet/
├── inspect/[botid]/
├── settings/
├── trades/
├── globals.css
├── layout.tsx
├── page.tsx
components/
├── ConfirmationModal.tsx
├── CustomBarChart.tsx
├── CustomLineChart.tsx
├── LogTerminal.tsx
├── TradingViewChart.tsx
lib/
├── authorizer.ts
├── encryption.ts
├── mongoose.ts
├── nextauth.ts
├── serverUtils.ts
mock/
├── mockTradingViewData.ts
schema/
├── trades.ts
├── transactions.ts
├── users.ts
section/
├── FeesPage.tsx
├── Footer.tsx
├── FullScreenLoading.tsx
├── LoginPage.tsx
├── UserDashboard.tsx
├── UserTrades.tsx
types/
├── global.d.ts
├── next-auth.d.ts
configs.ts
constants.ts
interfaces.ts
utils.ts
seeder.ts
```

---

## Application Flow

The app is organized around operator-managed trading profiles:

- `/` — landing/login page
- `/dashboard` — main live trading dashboard
- `/create` — create a user/operator profile and configure bot details
- `/settings` — configure strategy, demo/live mode, risk settings, and API keys
- `/fees` — fee and account charge overview
- `/fleet` — fleet or bot overview
- `/trades` — historical trade data
- `/inspect/[botid]` — bot-specific inspection screens

---

## Key Features

### Authentication and account access

- Credentials login using email and password
- Google OAuth provider integration
- Lockout/authorization checks for inactive or restricted accounts
- Session handling with NextAuth JWT sessions

### Dashboard and trading controls

- Real-time bot heartbeat checks
- Active position visibility and trade metrics
- Charting with `lightweight-charts` and Recharts components
- Recent trade history and analytics summaries
- Force-close/operational control actions via server requests

### User and bot management

- User creation with bot identifiers and account metadata
- Strategy selection and asset pair configuration
- Demo/live execution mode switching
- API key storage with encryption before persistence

### Data and monitoring

- MongoDB persistence for user and account records
- Trade and transaction models
- Terminal-style log streaming
- Fee reporting and strategy-specific monitoring

---

## Prerequisites

Before running the project locally, make sure you have:

- Node.js 20 or later
- npm
- MongoDB instance or MongoDB Atlas connection
- Optional: Google OAuth credentials

---

## Environment Variables

Create a `.env.local` file in the project root with values similar to the following:

```env
MONGODB_ACCESS=mongodb+srv://<username>:<password>@<cluster>/<database>
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://localhost:3000
ENCRYPTION_KEY=64_hexadecimal_characters
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

Notes:

- `MONGODB_ACCESS` is required for the MongoDB connection layer.
- `ENCRYPTION_KEY` must be exactly 64 hexadecimal characters and is used to encrypt stored Binance API secret data.
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are only required if Google sign-in is enabled.

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create your `.env.local` file and add the required values above.

### 3. Run the app in development mode

```bash
npm run dev
```

Then open:

```text
http://localhost:3000
```

---

## Production Build

```bash
npm run build
npm run start
```

---

## Linting

```bash
npm run lint
```

---

## Notes

- This frontend communicates with a Sage backend service over `http://localhost:4000` as defined in `constants.ts`.
- Without the backend/bot runtime, some dashboard sections and action flows will not populate live data.
- API credentials and sensitive secrets are encrypted before storage.

---

## Disclaimer

This project is intended for private automated trading workflows and operational monitoring. Cryptocurrency trading carries financial risk. Use caution, validate strategies thoroughly, and do not deploy production capital without proper risk controls and testing.
