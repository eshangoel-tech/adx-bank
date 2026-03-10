"use client";

import { useState, useEffect } from "react";
import { api, getErrorMessage } from "@/services/api";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ApiResponseViewer } from "@/components/ApiResponseViewer";

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
                ) : (
                  i + 1
                )}
              </button>
              <span
                className={`mt-2 text-xs font-semibold text-center leading-tight ${
                  done || active ? "text-slate-200" : "text-slate-600"
                }`}
              >
                {step.label}
              </span>
              <span
                className={`text-[10px] text-center leading-tight ${
                  active ? "text-slate-400" : "text-slate-600"
                }`}
              >
                {step.desc}
              </span>
            </div>

            {i < WIZARD_STEPS.length - 1 && (
              <div
                className={`flex-1 h-0.5 mt-5 mx-1.5 rounded-full transition-colors duration-300 ${
                  i < completedUpTo ? "bg-blue-600" : "bg-slate-800"
                }`}
              />
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
function EligibilityStep({ onNext }: { onNext: () => void }) {
  const [response, setResponse] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  const handleCheck = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);
    try {
      const { data } = await api.get("/loan/eligibility");
      setResponse(data);
      setChecked(true);
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

      <button onClick={handleCheck} disabled={loading} className="btn-primary">
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Checking...
          </span>
        ) : (
          "Check Eligibility"
        )}
      </button>

      <ApiResponseViewer response={response} loading={loading} error={error} />

      {checked && !error && (
        <div className="flex justify-end pt-2">
          <button onClick={onNext} className="btn-primary">
            Proceed to Simulate →
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 2: Simulate
// ---------------------------------------------------------------------------
function SimulateStep({
  onNext,
  onPrefill,
}: {
  onNext: () => void;
  onPrefill: (amount: string, tenure: string) => void;
}) {
  const [amount, setAmount] = useState("");
  const [tenure, setTenure] = useState("");
  const [response, setResponse] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [simulated, setSimulated] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResponse(null);
    setSimulated(false);
    try {
      const { data } = await api.post("/loan/simulate", {
        amount: parseFloat(amount),
        tenure_months: parseInt(tenure),
      });
      setResponse(data);
      setSimulated(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleProceed = () => {
    onPrefill(amount, tenure);
    onNext();
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-slate-100">Simulate EMI</h2>
        <p className="text-sm text-slate-400 mt-1">
          Enter your desired loan amount and tenure to preview the monthly instalment.
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
          <label className="label">Tenure (months, max 24)</label>
          <input
            className="input"
            type="number"
            min="1"
            max="24"
            value={tenure}
            onChange={(e) => setTenure(e.target.value)}
            placeholder="12"
            required
          />
        </div>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Calculating...
            </span>
          ) : (
            "Simulate EMI"
          )}
        </button>
      </form>

      <ApiResponseViewer response={response} loading={loading} error={error} />

      {simulated && !error && (
        <div className="flex justify-end pt-2">
          <button onClick={handleProceed} className="btn-primary">
            Proceed to Book →
          </button>
        </div>
      )}
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
  const [response, setResponse] = useState<unknown>(null);
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
    setResponse(null);
    try {
      const { data } = await api.post("/loan/book", {
        amount: parseFloat(amount),
        tenure_months: parseInt(tenure),
      });
      setResponse(data);
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
          <label className="label">Tenure (months, max 24)</label>
          <input
            className="input"
            type="number"
            min="1"
            max="24"
            value={tenure}
            onChange={(e) => setTenure(e.target.value)}
            placeholder="12"
            required
          />
        </div>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Booking...
            </span>
          ) : (
            "Book Loan"
          )}
        </button>
      </form>

      <ApiResponseViewer response={response} loading={loading} error={error} />
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
  const [response, setResponse] = useState<unknown>(null);
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
    setResponse(null);
    try {
      const { data } = await api.post("/loan/confirm", {
        booking_id: bookingId,
        otp,
      });
      setResponse(data);
      setConfirmed(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

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
            Booking ID auto-filled:{" "}
            <span className="font-mono text-xs text-blue-400">{prefillBookingId}</span>
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
        <button type="submit" disabled={loading || otp.length < 6} className="btn-primary w-full">
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Confirming...
            </span>
          ) : (
            "Confirm Loan"
          )}
        </button>
      </form>

      <ApiResponseViewer response={response} loading={loading} error={error} />

      {confirmed && !error && (
        <div className="bg-emerald-900/20 border border-emerald-800/60 rounded-xl p-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-emerald-400">Loan Confirmed!</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Your loan has been approved. Check &quot;Manage Loans&quot; to view details and pay EMIs.
            </p>
          </div>
          <button onClick={onConfirmed} className="ml-auto btn-secondary text-xs py-1.5 px-3">
            View Loans →
          </button>
        </div>
      )}
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
  const [raw, setRaw] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pay EMI state
  const [selectedLoan, setSelectedLoan] = useState<LoanItem | null>(null);
  const [payRes, setPayRes] = useState<unknown>(null);
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  const fetchLoans = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get("/loan/list");
      setRaw(data);
      setLoans(data?.data?.loans ?? data?.loans ?? []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handlePayEmi = async (loan: LoanItem) => {
    setSelectedLoan(loan);
    setPayRes(null);
    setPayError(null);
    setPayLoading(true);
    try {
      const { data } = await api.post(`/loan/${loan.id}/pay`, {});
      setPayRes(data);
      // Refresh list
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
          ) : (
            "Refresh Loans"
          )}
        </button>
      </div>

      {error && <div className="error-box">{error}</div>}

      {loans.length > 0 ? (
        <div className="space-y-3">
          {loans.map((loan) => (
            <div
              key={loan.id}
              className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-100 text-base">
                      ₹{loan.principal_amount}
                    </span>
                    <span className={STATUS_BADGE[loan.status] ?? "badge-gray"}>
                      {loan.status}
                    </span>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wide">EMI</p>
                      <p className="text-sm font-semibold text-slate-200">₹{loan.emi_amount}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wide">Outstanding</p>
                      <p className="text-sm font-semibold text-slate-200">₹{loan.outstanding_amount}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wide">Tenure</p>
                      <p className="text-sm font-semibold text-slate-200">
                        {loan.tenure_months}mo @ {loan.interest_rate}%
                      </p>
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
                    ) : (
                      "Pay EMI"
                    )}
                  </button>
                )}
              </div>

              {/* Pay result for this loan */}
              {selectedLoan?.id === loan.id && (payRes || payError) && (
                <div className="mt-3 pt-3 border-t border-slate-700">
                  <ApiResponseViewer response={payRes} loading={false} error={payError} title="EMI Payment Result" />
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

      {raw !== null && (
        <details className="text-sm">
          <summary className="cursor-pointer text-slate-500 hover:text-slate-300 select-none">
            Raw API response
          </summary>
          <ApiResponseViewer response={raw} loading={false} error={null} />
        </details>
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

  // Wizard state
  const [wizardStep, setWizardStep] = useState(0);
  const [completedUpTo, setCompletedUpTo] = useState(0);
  const [bookingId, setBookingId] = useState("");
  const [prefillAmount, setPrefillAmount] = useState("");
  const [prefillTenure, setPrefillTenure] = useState("");

  const goToStep = (step: number) => {
    setWizardStep(step);
  };

  const advance = () => {
    const next = wizardStep + 1;
    setCompletedUpTo(Math.max(completedUpTo, next));
    setWizardStep(next);
  };

  const handleBooked = (id: string) => {
    setBookingId(id);
    advance();
  };

  const handleConfirmed = () => {
    setSection("manage");
  };

  return (
    <div>
      {/* Section switcher */}
      <div className="flex gap-1 mb-8 bg-slate-900 border border-slate-800 rounded-xl p-1 w-fit">
        <button
          onClick={() => setSection("apply")}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-150 ${
            section === "apply"
              ? "bg-blue-600 text-white shadow-lg shadow-blue-900/40"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Apply for a Loan
        </button>
        <button
          onClick={() => setSection("manage")}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-150 ${
            section === "manage"
              ? "bg-blue-600 text-white shadow-lg shadow-blue-900/40"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Manage Loans
        </button>
      </div>

      {/* Apply section: stepper wizard */}
      {section === "apply" && (
        <div className="card">
          <Stepper
            current={wizardStep}
            completedUpTo={completedUpTo}
            onChange={goToStep}
          />

          <div className="border-t border-slate-800 pt-6">
            {wizardStep === 0 && <EligibilityStep onNext={advance} />}
            {wizardStep === 1 && (
              <SimulateStep
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
                onConfirmed={handleConfirmed}
              />
            )}
          </div>
        </div>
      )}

      {/* Manage section */}
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
