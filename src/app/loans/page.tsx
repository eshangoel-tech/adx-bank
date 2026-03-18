"use client";

import { useState, useEffect, useMemo } from "react";
import { api, getErrorMessage } from "@/services/api";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function calcEMI(principal: number, annualRatePct: number, months: number): number {
  if (!principal || !months) return 0;
  const r = annualRatePct / 100 / 12;
  if (r === 0) return principal / months;
  return (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
}

function inr(n: number) {
  return n.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

// ---------------------------------------------------------------------------
// Stepper
// ---------------------------------------------------------------------------
const WIZARD_STEPS = [
  { label: "Eligibility", desc: "Check limit" },
  { label: "Simulate", desc: "Calculate EMI" },
  { label: "Book", desc: "Submit request" },
  { label: "Confirm", desc: "Verify OTP" },
] as const;

function Stepper({
  current,
  completedUpTo,
  onChange,
}: {
  current: number;
  completedUpTo: number;
  onChange: (step: number) => void;
}) {
  return (
    <div className="flex items-start w-full mb-8 select-none">
      {WIZARD_STEPS.map((step, i) => {
        const done = i < completedUpTo;
        const active = i === current;
        const clickable = i <= completedUpTo;
        return (
          <div key={step.label} className="flex items-start flex-1">
            <div className="flex flex-col items-center">
              <button
                onClick={() => clickable && onChange(i)}
                disabled={!clickable}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-200 ${
                  done
                    ? "bg-blue-600 border-blue-600 text-white"
                    : active
                    ? "bg-blue-600/20 border-blue-500 text-blue-400 ring-4 ring-blue-500/10"
                    : "bg-slate-800 border-slate-700 text-slate-500"
                } ${clickable ? "cursor-pointer" : "cursor-default"}`}
              >
                {done ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : i + 1}
              </button>
              <span className={`mt-2 text-xs font-semibold text-center leading-tight ${done || active ? "text-slate-200" : "text-slate-600"}`}>
                {step.label}
              </span>
              <span className={`text-[10px] text-center leading-tight ${active ? "text-slate-400" : "text-slate-600"}`}>
                {step.desc}
              </span>
            </div>
            {i < WIZARD_STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mt-5 mx-1.5 rounded-full transition-colors duration-300 ${i < completedUpTo ? "bg-blue-600" : "bg-slate-800"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 1: Eligibility
// ---------------------------------------------------------------------------
interface EligibilityData {
  max_eligible_amount: string;
  min_loan_amount?: string;
  interest_rate: string;
  max_tenure_months?: number;
  allowed_tenures?: number[];
  processing_fee_percent?: number;
}

function EligibilityStep({ onNext }: { onNext: (data: EligibilityData) => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<EligibilityData | null>(null);

  const handleCheck = async () => {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const { data: res } = await api.get("/loan/eligibility");
      const d: EligibilityData = res?.data ?? res;
      setData(d);
      setTimeout(() => onNext(d), 1800);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-slate-100">Check Loan Eligibility</h2>
        <p className="text-sm text-slate-400 mt-1">
          We&apos;ll calculate your maximum eligible loan amount based on your account and salary.
        </p>
      </div>

      {!data && (
        <button onClick={handleCheck} disabled={loading} className="btn-primary">
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Checking...
            </span>
          ) : "Check Eligibility"}
        </button>
      )}

      {error && <p className="text-sm text-red-400 bg-red-900/10 border border-red-800/40 rounded-lg px-3 py-2">{error}</p>}

      {data && (
        <div className="space-y-4">
          <div className="bg-emerald-900/10 border border-emerald-800/40 rounded-xl p-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-600/20 border border-emerald-500/50 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-emerald-400">You&apos;re eligible for a loan!</p>
              <p className="text-xs text-slate-400 mt-0.5">Taking you to the next step...</p>
            </div>
            <span className="ml-auto w-5 h-5 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 text-center">
              <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1">Max Amount</p>
              <p className="text-sm font-bold text-slate-100">₹{inr(parseFloat(data.max_eligible_amount))}</p>
            </div>
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 text-center">
              <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1">Interest Rate</p>
              <p className="text-sm font-bold text-slate-100">{data.interest_rate}% p.a.</p>
            </div>
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 text-center">
              <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1">Tenures</p>
              <p className="text-sm font-bold text-slate-100">
                {data.allowed_tenures
                  ? `${data.allowed_tenures[0]}–${data.allowed_tenures[data.allowed_tenures.length - 1]} mo`
                  : `Up to ${data.max_tenure_months} mo`}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 2: Simulate — interactive slider + live EMI
// ---------------------------------------------------------------------------
function SimulateStep({
  onNext,
  onPrefill,
  eligibilityData,
}: {
  onNext: () => void;
  onPrefill: (amount: string, tenure: string) => void;
  eligibilityData: EligibilityData | null;
}) {
  const minAmount = parseInt(eligibilityData?.min_loan_amount ?? "1000");
  const maxAmount = Math.floor(parseFloat(eligibilityData?.max_eligible_amount ?? "600000"));
  const annualRate = parseFloat(eligibilityData?.interest_rate ?? "12");
  const allowedTenures: number[] = eligibilityData?.allowed_tenures ?? [6, 12, 18, 24];
  const processingFeePct = eligibilityData?.processing_fee_percent ?? 1;

  const defaultAmount = Math.min(100000, maxAmount);
  const [amount, setAmount] = useState(defaultAmount);
  const [tenure, setTenure] = useState(allowedTenures[1] ?? allowedTenures[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emi = useMemo(() => calcEMI(amount, annualRate, tenure), [amount, annualRate, tenure]);
  const totalPayable = emi * tenure;
  const totalInterest = totalPayable - amount;
  const processingFee = Math.round(amount * (processingFeePct / 100));

  const sliderPct = ((amount - minAmount) / (maxAmount - minAmount)) * 100;
  const interestPct = Math.round((totalInterest / totalPayable) * 100);

  const handleProceed = async () => {
    setLoading(true);
    setError(null);
    try {
      await api.post("/loan/simulate", {
        amount,
        tenure_months: tenure,
      });
      onPrefill(String(amount), String(tenure));
      onNext();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-100">Simulate EMI</h2>
        <p className="text-sm text-slate-400 mt-1">Adjust the sliders to find the plan that suits you.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: controls */}
        <div className="space-y-7">
          {/* Amount slider */}
          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <label className="text-sm font-semibold text-slate-300">Loan Amount</label>
              <div className="bg-blue-600/15 border border-blue-600/30 rounded-lg px-3 py-1">
                <span className="text-base font-bold text-blue-400">₹{inr(amount)}</span>
              </div>
            </div>
            <input
              type="range"
              className="loan-slider"
              min={minAmount}
              max={maxAmount}
              step={1000}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              style={{
                background: `linear-gradient(to right, #2563eb ${sliderPct}%, #1e293b ${sliderPct}%)`,
              }}
            />
            <div className="flex justify-between text-xs text-slate-500">
              <span>₹{inr(minAmount)}</span>
              <span>₹{inr(maxAmount)}</span>
            </div>
          </div>

          {/* Tenure pills */}
          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <label className="text-sm font-semibold text-slate-300">Tenure</label>
              <span className="text-sm font-bold text-blue-400">{tenure} months</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {allowedTenures.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTenure(t)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all duration-150 ${
                    tenure === t
                      ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/30"
                      : "bg-slate-800/60 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200"
                  }`}
                >
                  {t} mo
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: EMI summary card */}
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/60 rounded-2xl p-5 space-y-4">
          {/* EMI hero */}
          <div className="text-center pb-4 border-b border-slate-700/50">
            <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Monthly EMI</p>
            <p className="text-4xl font-bold text-white">₹{inr(Math.round(emi))}</p>
            <p className="text-xs text-slate-500 mt-1">for {tenure} months</p>
          </div>

          {/* Breakdown */}
          <div className="space-y-2.5">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">Principal</span>
              <span className="text-sm font-semibold text-slate-200">₹{inr(amount)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">Total Interest</span>
              <span className="text-sm font-semibold text-amber-400">₹{inr(Math.round(totalInterest))}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">Processing Fee ({processingFeePct}%)</span>
              <span className="text-sm font-semibold text-slate-300">₹{inr(processingFee)}</span>
            </div>
            <div className="border-t border-slate-700/60 pt-2 flex justify-between items-center">
              <span className="text-sm font-semibold text-slate-300">Total Payable</span>
              <span className="text-sm font-bold text-white">₹{inr(Math.round(totalPayable))}</span>
            </div>
          </div>

          {/* Principal vs Interest bar */}
          <div className="space-y-1.5">
            <div className="flex rounded-full overflow-hidden h-2">
              <div
                className="bg-blue-500 transition-all duration-300"
                style={{ width: `${100 - interestPct}%` }}
              />
              <div
                className="bg-amber-500 transition-all duration-300"
                style={{ width: `${interestPct}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-500">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                Principal {100 - interestPct}%
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                Interest {interestPct}%
              </span>
            </div>
          </div>

          <p className="text-[10px] text-slate-600 text-center">
            @ {annualRate}% p.a. · Indicative values only
          </p>
        </div>
      </div>

      {error && <p className="text-sm text-red-400 bg-red-900/10 border border-red-800/40 rounded-lg px-3 py-2">{error}</p>}

      <div className="flex justify-end pt-1">
        <button onClick={handleProceed} disabled={loading} className="btn-primary px-6">
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving...
            </span>
          ) : "Proceed to Book →"}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 3: Book
// ---------------------------------------------------------------------------
function BookStep({
  prefillAmount,
  prefillTenure,
  onBooked,
}: {
  prefillAmount: string;
  prefillTenure: string;
  onBooked: (bookingId: string) => void;
}) {
  const [amount, setAmount] = useState(prefillAmount);
  const [tenure, setTenure] = useState(prefillTenure);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (prefillAmount) setAmount(prefillAmount);
    if (prefillTenure) setTenure(prefillTenure);
  }, [prefillAmount, prefillTenure]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post("/loan/book", {
        amount: parseFloat(amount),
        tenure_months: parseInt(tenure),
      });
      const bid = data?.data?.booking_id ?? data?.booking_id;
      if (bid) onBooked(bid);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-slate-100">Book Your Loan</h2>
        <p className="text-sm text-slate-400 mt-1">
          Submit the loan booking. A 6-digit OTP will be sent to your registered email.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
        <div>
          <label className="label">Principal Amount (INR)</label>
          <input
            className="input"
            type="number"
            min="1"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="100000"
            required
          />
        </div>
        <div>
          <label className="label">Tenure (months)</label>
          <input
            className="input"
            type="number"
            min="1"
            value={tenure}
            onChange={(e) => setTenure(e.target.value)}
            placeholder="12"
            required
          />
        </div>
        {error && <p className="text-sm text-red-400 bg-red-900/10 border border-red-800/40 rounded-lg px-3 py-2">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Booking...
            </span>
          ) : "Book Loan"}
        </button>
      </form>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 4: Confirm
// ---------------------------------------------------------------------------
function ConfirmStep({
  prefillBookingId,
  onConfirmed,
}: {
  prefillBookingId: string;
  onConfirmed: () => void;
}) {
  const [bookingId, setBookingId] = useState(prefillBookingId);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (prefillBookingId) setBookingId(prefillBookingId);
  }, [prefillBookingId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.post("/loan/confirm", { booking_id: bookingId, otp });
      setConfirmed(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (confirmed) {
    return (
      <div className="space-y-5">
        <div className="bg-emerald-900/10 border border-emerald-800/40 rounded-xl p-6 flex flex-col items-center gap-4 text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-600/20 border-2 border-emerald-500 flex items-center justify-center">
            <svg className="w-7 h-7 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="text-base font-bold text-emerald-400">Loan Confirmed!</p>
            <p className="text-sm text-slate-400 mt-1">
              Your loan is being processed and will be active shortly. View details in Manage Loans.
            </p>
          </div>
          <button onClick={onConfirmed} className="btn-primary">View My Loans →</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-slate-100">Confirm with OTP</h2>
        <p className="text-sm text-slate-400 mt-1">
          Enter the 6-digit OTP sent to your registered email to finalise the loan.
        </p>
      </div>

      {prefillBookingId && (
        <div className="flex items-center gap-2 bg-blue-900/20 border border-blue-800/50 rounded-lg px-4 py-3">
          <svg className="w-4 h-4 text-blue-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-blue-300">
            Booking ID: <span className="font-mono text-xs text-blue-400">{prefillBookingId}</span>
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
        <div>
          <label className="label">Booking ID</label>
          <input
            className="input font-mono text-xs"
            type="text"
            value={bookingId}
            onChange={(e) => setBookingId(e.target.value)}
            placeholder="Auto-filled after Book step"
            required
          />
        </div>
        <div>
          <label className="label">OTP (6 digits)</label>
          <input
            className="input tracking-[0.4em] text-center text-base font-bold"
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="• • • • • •"
            maxLength={6}
            required
          />
        </div>
        {error && <p className="text-sm text-red-400 bg-red-900/10 border border-red-800/40 rounded-lg px-3 py-2">{error}</p>}
        <button type="submit" disabled={loading || otp.length < 6} className="btn-primary w-full">
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Confirming...
            </span>
          ) : "Confirm Loan"}
        </button>
      </form>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Manage Loans Panel
// ---------------------------------------------------------------------------
interface LoanItem {
  id: string;
  principal_amount: string;
  emi_amount: string;
  outstanding_amount: string;
  interest_rate: string;
  tenure_months: number;
  status: string;
  created_at: string;
  approved_at: string | null;
}

const STATUS_BADGE: Record<string, string> = {
  PENDING: "badge-yellow",
  ACTIVE: "badge-green",
  CLOSED: "badge-gray",
  REJECTED: "badge-red",
};

function ManageLoansPanel() {
  const [loans, setLoans] = useState<LoanItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLoan, setSelectedLoan] = useState<LoanItem | null>(null);
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [paySuccess, setPaySuccess] = useState<string | null>(null);

  const fetchLoans = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get("/loan/list");
      setLoans(data?.data?.loans ?? data?.loans ?? []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, []);

  const handlePayEmi = async (loan: LoanItem) => {
    setSelectedLoan(loan);
    setPayError(null);
    setPaySuccess(null);
    setPayLoading(true);
    try {
      await api.post(`/loan/${loan.id}/pay`, {});
      setPaySuccess(loan.id);
      await fetchLoans();
    } catch (err) {
      setPayError(getErrorMessage(err));
    } finally {
      setPayLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-100">My Loans</h2>
          <p className="text-sm text-slate-400 mt-0.5">View all your loans and pay monthly EMIs.</p>
        </div>
        <button onClick={fetchLoans} disabled={loading} className="btn-primary">
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Loading...
            </span>
          ) : "Refresh Loans"}
        </button>
      </div>

      {error && <div className="error-box">{error}</div>}

      {loans.length > 0 ? (
        <div className="space-y-3">
          {loans.map((loan) => (
            <div key={loan.id} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-100 text-base">
                      ₹{parseFloat(loan.principal_amount).toLocaleString("en-IN")}
                    </span>
                    <span className={STATUS_BADGE[loan.status] ?? "badge-gray"}>{loan.status}</span>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wide">EMI</p>
                      <p className="text-sm font-semibold text-slate-200">₹{parseFloat(loan.emi_amount).toLocaleString("en-IN")}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wide">Outstanding</p>
                      <p className="text-sm font-semibold text-slate-200">₹{parseFloat(loan.outstanding_amount).toLocaleString("en-IN")}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wide">Tenure</p>
                      <p className="text-sm font-semibold text-slate-200">{loan.tenure_months}mo @ {loan.interest_rate}%</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-600 font-mono mt-2 truncate">{loan.id}</p>
                </div>
                {loan.status === "ACTIVE" && (
                  <button
                    onClick={() => handlePayEmi(loan)}
                    disabled={payLoading && selectedLoan?.id === loan.id}
                    className="btn-primary shrink-0 text-xs py-1.5 px-3"
                  >
                    {payLoading && selectedLoan?.id === loan.id ? (
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Paying...
                      </span>
                    ) : "Pay EMI"}
                  </button>
                )}
              </div>
              {selectedLoan?.id === loan.id && paySuccess === loan.id && (
                <div className="mt-3 pt-3 border-t border-slate-700 flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-sm text-emerald-400 font-medium">EMI paid successfully.</p>
                </div>
              )}
              {selectedLoan?.id === loan.id && payError && (
                <div className="mt-3 pt-3 border-t border-slate-700">
                  <p className="text-sm text-red-400">{payError}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        !loading && (
          <div className="text-center py-12 text-slate-500">
            <svg className="w-10 h-10 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm">No loans found. Click &quot;Refresh Loans&quot; to load.</p>
          </div>
        )
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Loans Page
// ---------------------------------------------------------------------------
type Section = "apply" | "manage";

function LoansContent() {
  const [section, setSection] = useState<Section>("apply");
  const [wizardStep, setWizardStep] = useState(0);
  const [completedUpTo, setCompletedUpTo] = useState(0);
  const [eligibilityData, setEligibilityData] = useState<EligibilityData | null>(null);
  const [bookingId, setBookingId] = useState("");
  const [prefillAmount, setPrefillAmount] = useState("");
  const [prefillTenure, setPrefillTenure] = useState("");

  const goToStep = (step: number) => setWizardStep(step);

  const advance = () => {
    const next = wizardStep + 1;
    setCompletedUpTo(Math.max(completedUpTo, next));
    setWizardStep(next);
  };

  const handleBooked = (id: string) => {
    setBookingId(id);
    advance();
  };

  return (
    <div>
      {/* Section switcher */}
      <div className="flex gap-1 mb-8 bg-slate-900 border border-slate-800 rounded-xl p-1 w-fit">
        <button
          onClick={() => setSection("apply")}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-150 ${
            section === "apply" ? "bg-blue-600 text-white shadow-lg shadow-blue-900/40" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Apply for a Loan
        </button>
        <button
          onClick={() => setSection("manage")}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-150 ${
            section === "manage" ? "bg-blue-600 text-white shadow-lg shadow-blue-900/40" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Manage Loans
        </button>
      </div>

      {section === "apply" && (
        <div className="card">
          <Stepper current={wizardStep} completedUpTo={completedUpTo} onChange={goToStep} />
          <div className="border-t border-slate-800 pt-6">
            {wizardStep === 0 && (
              <EligibilityStep
                onNext={(data) => {
                  setEligibilityData(data);
                  advance();
                }}
              />
            )}
            {wizardStep === 1 && (
              <SimulateStep
                eligibilityData={eligibilityData}
                onNext={advance}
                onPrefill={(amt, ten) => {
                  setPrefillAmount(amt);
                  setPrefillTenure(ten);
                  setCompletedUpTo(Math.max(completedUpTo, 2));
                }}
              />
            )}
            {wizardStep === 2 && (
              <BookStep
                prefillAmount={prefillAmount}
                prefillTenure={prefillTenure}
                onBooked={handleBooked}
              />
            )}
            {wizardStep === 3 && (
              <ConfirmStep
                prefillBookingId={bookingId}
                onConfirmed={() => setSection("manage")}
              />
            )}
          </div>
        </div>
      )}

      {section === "manage" && (
        <div className="card">
          <ManageLoansPanel />
        </div>
      )}
    </div>
  );
}

export default function LoansPage() {
  return (
    <ProtectedRoute>
      <h1 className="page-title">Loans</h1>
      <LoansContent />
    </ProtectedRoute>
  );
}
