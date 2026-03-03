# ADX Bank — Frontend (Next.js)

Developer testing UI for the ADX Bank Python/FastAPI backend. Built with **Next.js 14**, **TypeScript**, and **Tailwind CSS**.

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS (utility-first, custom components in `globals.css`) |
| HTTP | Axios with request/response interceptors |
| Auth | JWT stored in `localStorage`, managed via React Context |

---

## Project Structure

```
src/
├── app/                      # Next.js App Router pages
│   ├── page.tsx              # Root redirect → /dashboard or /login
│   ├── layout.tsx            # Root layout: Navbar + Providers wrapper
│   ├── globals.css           # Tailwind base + reusable CSS classes (.card, .input, .btn-primary …)
│   ├── login/                # POST /auth/login → stores pending identifier → redirects to /verify-login
│   ├── register/             # POST /auth/register
│   ├── verify-email/         # POST /auth/verify-email (OTP after registration)
│   ├── verify-login/         # POST /auth/verify-login-otp → on success saves JWT, goes to dashboard
│   ├── dashboard/            # GET /dashboard/summary — balance, profile, recent transactions
│   ├── transfer/             # POST /transfer/initiate → POST /transfer/confirm (OTP)
│   ├── wallet/               # POST /wallet/add-money/initiate → opens Razorpay checkout (test mode)
│   └── loans/                # Tabbed UI: Eligibility / Simulate / Book / Confirm / My Loans / Pay EMI
│
├── components/
│   ├── Navbar.tsx            # Top nav; shows auth links or protected links depending on login state
│   ├── Providers.tsx         # Wraps app with AuthProvider
│   ├── ProtectedRoute.tsx    # Redirects to /login if not authenticated
│   └── ApiResponseViewer.tsx # Shows raw JSON response / error / spinner for every API call
│
├── context/
│   └── AuthContext.tsx       # Holds token + sessionId in state; syncs with localStorage
│
├── services/
│   └── api.ts                # Axios instance; attaches Bearer token on every request; 401 → auto-logout
│
└── types/
    └── razorpay.d.ts         # Window.Razorpay type declaration for Razorpay checkout SDK
```

---

## Pages & Flows

### Auth Flow
1. **Register** (`/register`) — fill name, email, phone, password, address, salary.
2. **Verify Email** (`/verify-email`) — enter email + OTP from the registration email.
3. **Login** (`/login`) — enter email/phone + password. On success the identifier is saved in `sessionStorage` and you are redirected to `/verify-login`.
4. **Verify Login OTP** (`/verify-login`) — the identifier is pre-filled automatically. Enter the 6-digit OTP. On success the JWT is saved and you land on the dashboard.

### Dashboard (`/dashboard`)
Fetches `GET /dashboard/summary`. Displays:
- User profile (name, email, phone)
- Account card (masked account number, balance, type, currency, status)
- Recent transactions list (CREDIT green / DEBIT red, balance after each)
- Collapsible raw API response

### Transfer (`/transfer`) — requires login
Two-step form side by side:
1. **Initiate** — account number + amount → `POST /transfer/initiate`. The returned `transfer_id` is auto-filled in step 2.
2. **Confirm** — transfer ID + 6-digit OTP → `POST /transfer/confirm`.

### Wallet (`/wallet`) — requires login
Enters an amount and calls `POST /wallet/add-money/initiate`. Lazily loads the Razorpay checkout.js SDK and opens the payment modal in **test mode** (no real money).

Test card: `4111 1111 1111 1111` · any future expiry · CVV: any 3 digits · OTP: `1234`

### Loans (`/loans`) — requires login
Six-tab interface:

| Tab | Endpoint | Purpose |
|-----|----------|---------|
| Eligibility | `GET /loan/eligibility` | Max eligible amount based on salary |
| Simulate | `POST /loan/simulate` | Calculate EMI for amount + tenure |
| Book | `POST /loan/book` | Request a loan, triggers OTP email |
| Confirm | `POST /loan/confirm` | Confirm with booking ID + OTP (auto-filled from Book step) |
| My Loans | `GET /loan/list` | List all loans; "Pay EMI" button auto-fills the Pay EMI tab |
| Pay EMI | `POST /loan/:id/pay` | Deducts one EMI from wallet balance |

---

## Running Locally

```bash
# 1 — install dependencies
npm install

# 2 — set the backend URL
echo "NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1" > .env.local

# 3 — start dev server
npm run dev
# → http://localhost:3000
```

The backend (Python/FastAPI) must be running separately. See the `banking-platform` repo.

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:8000/api/v1` | Base URL of the FastAPI backend |

Copy `.env.local.example` (if it exists) and fill in values. **Never commit `.env.local`.**

---

## Key Design Decisions

- **`ApiResponseViewer`** — every page shows the raw backend JSON in a dark code block. Useful for API debugging.
- **`ProtectedRoute`** — client-side guard. Shows a spinner while the auth state is loading from `localStorage`, then redirects unauthenticated users.
- **Axios interceptors** — the request interceptor attaches the JWT automatically. The response interceptor clears auth and redirects to `/login` on any `401`.
- **OTP identifier carry-over** — after a successful login POST, the identifier (email/phone) is stored in `sessionStorage` so `/verify-login` can pre-fill it without asking the user to type it again.
