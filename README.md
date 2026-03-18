# ADX Bank — Frontend

A production-style digital banking UI built with **Next.js 14**, **TypeScript**, and **Tailwind CSS**, connected to the ADX Bank Python/FastAPI backend.

> **Disclaimer:** ADX Bank is NOT a real bank. This is an educational project.

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + custom CSS classes in `globals.css` |
| HTTP | Axios with JWT interceptor + auto-logout on 401 |
| Auth | JWT in `localStorage` via React Context |

---

## Project Structure

```
src/
├── app/
│   ├── layout.tsx            # Root layout: Navbar + Providers
│   ├── globals.css           # Custom classes: .card, .input, .btn-primary, .label …
│   ├── page.tsx              # Root redirect → /dashboard or /login
│   ├── login/                # Step 1 of login — email/phone + password
│   ├── verify-login/         # Step 2 — OTP verification, saves JWT on success
│   ├── register/             # New account registration
│   ├── verify-email/         # Email OTP verification after registration
│   ├── dashboard/            # Home screen — balance card + feature grid + recent transactions
│   ├── transfer/             # 2-step fund transfer with OTP
│   ├── wallet/               # 2-step wallet top-up with OTP
│   ├── loans/                # 4-step loan wizard (Eligibility → Simulate → Book → Confirm) + Manage
│   ├── transactions/         # Full paginated transaction history
│   ├── account/              # Account details with copy-to-clipboard account number
│   ├── profile/              # Edit phone number and address
│   └── assistant/            # AI banking assistant (multi-agent chat)
│
├── components/
│   ├── Navbar.tsx            # Logo + Logout only (navigation via dashboard cards)
│   ├── Providers.tsx         # AuthProvider wrapper
│   ├── ProtectedRoute.tsx    # Redirects unauthenticated users to /login
│   └── ApiResponseViewer.tsx # Debug JSON viewer (not shown in production UI)
│
├── context/
│   └── AuthContext.tsx       # token + sessionId state, synced with localStorage
│
└── services/
    └── api.ts                # Axios instance; attaches Bearer token; clears auth on 401
```

---

## Pages & Features

### Auth Flow
| Step | Page | API |
|------|------|-----|
| 1 | `/register` | `POST /auth/register` |
| 2 | `/verify-email` | `POST /auth/verify-email` — activates account + ₹500 joining bonus |
| 3 | `/login` | `POST /auth/login` — sends login OTP to email |
| 4 | `/verify-login` | `POST /auth/verify-login-otp` — returns JWT |

Identifier (email/phone) is passed from `/login` → `/verify-login` via `sessionStorage` so the user doesn't retype it.

---

### Dashboard (`/dashboard`)
- **Balance hero card** — live balance, masked account number, account status
- **Feature grid** — 7 clickable cards: Transfer, Add Money, Loans, AI Assistant, Transactions, Account, Edit Profile
- **Recent transactions** — last 5 entries with "View all →" link

---

### Transfer (`/transfer`)
Two-step OTP-verified fund transfer. Supports **two recipient lookup methods** (toggle on step 1):

| Method | Request field | Example |
|--------|--------------|---------|
| Account number | `to_account_number` | `ADX0000012` |
| Mobile number | `to_phone` | `9876543210` (91/+91 prefix stripped automatically) |

**Flow:**
1. Select method, enter recipient identifier + amount → `POST /transfer/initiate`
   - Response includes `receiver_name`, `receiver_account` (masked), `transfer_id`, `amount`
2. **Confirmation screen** — shows recipient name + masked account with a "Verified" badge and an irreversibility warning before the user enters the OTP
3. Enter OTP → `POST /transfer/confirm` → success screen

**Error handling:** 422 if both fields provided, neither provided, or phone not 10 digits; 404 if account not found.

---

### Wallet — Add Money (`/wallet`)
Two-step OTP-verified top-up (max ₹50,000):
1. Enter amount (preset quick buttons: ₹500 / ₹1k / ₹5k / ₹10k) → `POST /wallet/add-money/initiate` — returns `topup_id`
2. Enter OTP → `POST /wallet/add-money/confirm` (body: `{ topup_id, otp }`)
3. Success screen — "Add More Money" or "Back to Home"

---

### Loans (`/loans`)
4-step wizard for applying, with a separate **Manage Loans** tab:

| Step | Endpoint | Notes |
|------|----------|-------|
| 1 — Eligibility | `GET /loan/eligibility` | Auto-advances after 1.8s; returns `max_eligible_amount`, `interest_rate`, `allowed_tenures`, `processing_fee_percent` |
| 2 — Simulate | `POST /loan/simulate` | **Interactive slider** for amount (min/max from eligibility) + tenure pill buttons (only `allowed_tenures`). Live EMI calculated client-side as slider moves. EMI breakdown + principal/interest bar. API called once on "Proceed". |
| 3 — Book | `POST /loan/book` | Amount/tenure pre-filled; triggers OTP email; returns `booking_id` |
| 4 — Confirm | `POST /loan/confirm` | `booking_id` auto-filled; OTP from email |
| Manage | `GET /loan/list` | Cards for each loan with status badge, EMI, outstanding amount |
| Pay EMI | `POST /loan/{id}/pay` | Inline per-loan button; deducts one EMI from balance |

**Live EMI formula (client-side):**
```
r = annual_rate / 100 / 12
EMI = P × r × (1+r)^n / ((1+r)^n − 1)
```

---

### Transactions (`/transactions`)
- Paginated list (10 per page) — `GET /transactions?page=1&limit=10`
- Credit/Debit color coding, reference type labels, balance after each tx

---

### Account Details (`/account`)
- `GET /account/details` — balance card, account type, currency, status, member since
- Copy account number to clipboard

---

### Edit Profile (`/profile`)
- `PUT /user/profile` — update phone number and/or address (city, state)

---

### AI Assistant (`/assistant`)
Multi-agent AI chat powered by the backend's RAG + agent pipeline:

- **Start session** → `POST /ai/assistant/start`
- **Chat** → `POST /ai/assistant/chat` — sends message, receives reply + action buttons
- **End session** → `POST /ai/assistant/stop`

Action buttons in chat responses redirect to the relevant page (e.g. "Apply for Loan" → `/loans`).

| Agent | Handles |
|-------|---------|
| bank_manager | Account balance, summary, charges |
| loan_officer | Loan eligibility, EMI, rejections |
| accountant | Payment failures, transaction analysis |
| support | Policy questions, OTP issues (uses RAG) |
| receptionist | Greetings, unclear queries, routing |

---

## Running Locally

```bash
# 1 — install dependencies
npm install

# 2 — configure backend URL
echo "NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1" > .env.local

# 3 — start dev server
npm run dev
# → http://localhost:3000
```

The FastAPI backend must be running separately. See the `banking-platform` repo for backend setup.

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_BASE_URL` | Base URL of the FastAPI backend (default: `http://localhost:8000/api/v1`) |

**Never commit `.env.local`.**

---

## Design Notes

- **Navigation via dashboard** — the navbar is intentionally minimal (logo + logout only). All feature navigation happens through the dashboard card grid.
- **ProtectedRoute** — client-side auth guard. Shows a spinner while auth state loads from `localStorage`, then redirects unauthenticated users to `/login`.
- **Axios interceptors** — JWT is attached automatically on every request. Any `401` response clears auth and redirects to `/login`.
- **OTP carry-over** — identifier is stored in `sessionStorage` after login step 1 so step 2 (`/verify-login`) can pre-fill it automatically.
- **Auto-advance** — the loan eligibility step auto-advances to the simulate step after a successful check (1.8s delay with a spinner). Eligibility data (`max_eligible_amount`, `allowed_tenures`, `interest_rate`, `processing_fee_percent`) is passed to the Simulate step to power the interactive slider.
- **Interactive loan simulator** — the Simulate step uses a styled range slider for amount and pill buttons for tenure. EMI, total interest, total payable, and a principal/interest bar chart all update in real time without any API calls. The backend `POST /loan/simulate` is called once when the user proceeds.
