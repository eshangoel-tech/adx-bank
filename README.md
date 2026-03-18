# ADX Bank — Frontend

A production-style digital banking UI built with **Next.js 14**, **TypeScript**, and **Tailwind CSS**, connected to the ADX Bank Python/FastAPI backend.

> **Disclaimer:** ADX Bank is NOT a real bank. This is an educational project.

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + custom component classes in `globals.css` |
| HTTP | Axios — JWT interceptor + auto-logout on 401 |
| Auth | JWT stored in `localStorage`, managed via React Context |

---

## Project Structure

```
src/
├── app/
│   ├── layout.tsx            # Root layout: Navbar + Providers
│   ├── globals.css           # Custom classes: .card, .input, .btn-primary, .label, .loan-slider …
│   ├── page.tsx              # Root redirect → /dashboard or /login
│   ├── login/                # Step 1 of login — email/phone + password
│   ├── verify-login/         # Step 2 — OTP verification, saves JWT on success
│   ├── register/             # New account registration
│   ├── verify-email/         # Email OTP verification after registration
│   ├── dashboard/            # Home — balance hero card + 7-feature grid + recent transactions
│   ├── transfer/             # 2-step transfer: account number or mobile number
│   ├── wallet/               # 2-step OTP wallet top-up
│   ├── loans/                # 4-step loan wizard + Manage Loans with auto-load
│   ├── transactions/         # Paginated transaction history
│   ├── account/              # Account details + copy account number
│   ├── profile/              # Edit profile — pre-filled from API, saves phone + address
│   └── assistant/            # Multi-agent AI banking assistant with chat history restore
│
├── components/
│   ├── Navbar.tsx            # Logo + Logout only (all navigation via dashboard cards)
│   ├── Providers.tsx         # AuthProvider wrapper
│   └── ProtectedRoute.tsx    # Redirects unauthenticated users to /login
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
| 2 | `/verify-email` | `POST /auth/verify-email` — activates account, triggers ₹500 joining bonus via Celery |
| 3 | `/login` | `POST /auth/login` — sends login OTP to email |
| 4 | `/verify-login` | `POST /auth/verify-login-otp` — returns JWT + session ID |

Identifier (email/phone) is stored in `sessionStorage` after step 3 so step 4 pre-fills it automatically.

---

### Dashboard (`/dashboard`)

- **Balance hero card** — live balance, masked account number, account type, status
- **Feature grid** — 7 clickable cards (Transfer, Add Money, Loans, AI Assistant, Transactions, Account, Edit Profile), each navigates to the relevant page
- **Recent transactions** — last 5 entries with credit/debit color coding and "View all →" link

---

### Transfer (`/transfer`)

Two-step OTP-verified fund transfer with **two recipient lookup methods**:

| Method | Field sent | Notes |
|--------|-----------|-------|
| Account number | `to_account_number` | e.g. `ADX0000012` |
| Mobile number | `to_phone` | 10 digits; `+91`/`91` prefix stripped automatically by backend |

**Flow:**
1. Toggle method → enter identifier + amount → `POST /transfer/initiate`
   - Returns `receiver_name`, `receiver_account` (masked), `transfer_id`, `amount`
2. **Recipient confirmation screen** — shows name + masked account with "Verified" badge and irreversibility warning before OTP entry
3. Enter OTP → `POST /transfer/confirm` → success screen with full transfer details

---

### Wallet — Add Money (`/wallet`)

Two-step OTP-verified top-up (max ₹50,000 per transaction):

1. Enter amount (quick preset: ₹500 / ₹1k / ₹5k / ₹10k) → `POST /wallet/add-money/initiate` — returns `topup_id`
2. Enter OTP → `POST /wallet/add-money/confirm` (`{ topup_id, otp }`)
3. Success screen — "Add More Money" or "Back to Home"

---

### Loans (`/loans`)

4-step application wizard + **Manage Loans** tab (auto-loads on open):

| Step | Endpoint | Notes |
|------|----------|-------|
| 1 — Eligibility | `GET /loan/eligibility` | Auto-advances after 1.8s; passes `max_eligible_amount`, `min_loan_amount`, `interest_rate`, `allowed_tenures`, `processing_fee_percent` to step 2 |
| 2 — Simulate | `POST /loan/simulate` | Interactive range slider for amount; tenure pill buttons showing only `allowed_tenures`; live EMI + interest breakdown + principal/interest bar — all calculated client-side as the slider moves; API called once on "Proceed" |
| 3 — Book | `POST /loan/book` | Amount/tenure pre-filled from step 2; triggers OTP email; returns `booking_id` |
| 4 — Confirm | `POST /loan/confirm` | `booking_id` auto-filled; OTP from email; on success redirects to Manage Loans |
| Manage Loans | `GET /loan/list` | Auto-fetches on tab open; loan cards with status badge, EMI, outstanding balance |
| Pay EMI | `POST /loan/{id}/pay` | Per-card inline button; deducts one EMI; refreshes list on success |

**Live EMI formula (client-side, no API call on slider move):**
```
r  = annual_rate / 100 / 12
EMI = P × r × (1+r)^n / ((1+r)^n − 1)
```

---

### Transactions (`/transactions`)

- `GET /transactions?page=1&limit=10` — paginated, "Load More" on scroll
- CREDIT (green) / DEBIT (red) color coding, reference type label, balance after each entry

---

### Account Details (`/account`)

- `GET /account/details` — balance hero card, account type, currency, status, member since
- One-click copy account number to clipboard

---

### Edit Profile (`/profile`)

- On load: `GET /user/profile` — pre-fills phone, city, state from existing data
- On save: `PUT /user/profile` — sends `{ phone, address: { city, state } }`

---

### AI Assistant (`/assistant`)

Multi-agent AI chat powered by the backend's RAG + LLM pipeline:

- **Start** → `POST /ai/assistant/start` — creates session; **restores previous chat history** from `chat_history` array in response (each turn rendered as user + assistant bubbles); shows greeting only if history is empty
- **Chat** → `POST /ai/assistant/chat` — full multi-agent response + optional action buttons
- **End** → `POST /ai/assistant/stop` — closes session, returns to dashboard

Action buttons in assistant responses navigate directly to the relevant page.

| Agent | Handles |
|-------|---------|
| bank_manager | Balance, account summary, charges |
| loan_officer | Eligibility, EMI calculation, rejections |
| accountant | Payment failures, transaction analysis |
| support | Policy/rules questions, OTP issues (RAG-powered) |
| receptionist | Greetings, ambiguous queries, routing |

---

## Running Locally

```bash
# 1 — install dependencies
npm install

# 2 — set backend URL
echo "NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1" > .env.local

# 3 — start dev server
npm run dev
# → http://localhost:3000
```

The FastAPI backend must be running separately. See the `banking-platform` repo for setup.

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_BASE_URL` | Base URL of the FastAPI backend — default: `http://localhost:8000/api/v1` |

**Never commit `.env.local`.**

---

## Design Notes

- **Dashboard-first navigation** — navbar shows only logo + logout. All features are accessed via the dashboard card grid.
- **No raw JSON viewers** — all API responses are rendered as structured UI. Errors appear as inline red banners.
- **ProtectedRoute** — client-side auth guard; shows spinner while auth hydrates from `localStorage`, then redirects if unauthenticated.
- **Axios interceptors** — Bearer token attached on every request; any `401` clears auth and redirects to `/login`.
- **OTP carry-over** — login identifier stored in `sessionStorage` so the verify-login page pre-fills it.
- **Eligibility → Simulate data flow** — eligibility API response is passed as props to the Simulate step so the slider uses real min/max/tenure values from the backend.
- **Interactive EMI simulator** — range slider + tenure pills with real-time breakdown; zero extra API calls until the user clicks "Proceed".
- **Chat history restore** — assistant session start response includes previous turns which are pre-rendered into the chat UI before the user types anything.
