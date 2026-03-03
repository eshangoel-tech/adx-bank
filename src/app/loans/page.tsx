"use client";

import { useState, useEffect } from "react";
import { api, getErrorMessage } from "@/services/api";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ApiResponseViewer } from "@/components/ApiResponseViewer";

// ---------------------------------------------------------------------------
// Tab definitions
// ---------------------------------------------------------------------------
const TABS = [
  "Eligibility",
  "Simulate",
  "Book",
  "Confirm",
  "My Loans",
  "Pay EMI",
] as const;

type Tab = (typeof TABS)[number];

// ---------------------------------------------------------------------------
// Sub-panel: Eligibility
// ---------------------------------------------------------------------------
function EligibilityPanel() {
  const [response, setResponse] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);
    try {
      const { data } = await api.get("/loan/eligibility");
      setResponse(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        Check your maximum eligible loan amount based on your salary.
      </p>
      <button onClick={fetch} disabled={loading} className="btn-primary">
        {loading ? "Fetching..." : "Check Eligibility"}
      </button>
      <ApiResponseViewer response={response} loading={loading} error={error} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-panel: Simulate
// ---------------------------------------------------------------------------
function SimulatePanel() {
  const [amount, setAmount] = useState("");
  const [tenure, setTenure] = useState("");
  const [response, setResponse] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResponse(null);
    try {
      const { data } = await api.post("/loan/simulate", {
        amount: parseFloat(amount),
        tenure_months: parseInt(tenure),
      });
      setResponse(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
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
        {loading ? "Calculating..." : "Simulate EMI"}
      </button>
      <ApiResponseViewer response={response} loading={loading} error={error} />
    </form>
  );
}

// ---------------------------------------------------------------------------
// Sub-panel: Book
// ---------------------------------------------------------------------------
function BookPanel({
  onBooked,
}: {
  onBooked: (bookingId: string) => void;
}) {
  const [amount, setAmount] = useState("");
  const [tenure, setTenure] = useState("");
  const [response, setResponse] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
      <p className="text-sm text-gray-500">
        Books the loan and sends a 6-digit OTP to your email.
      </p>
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
        {loading ? "Booking..." : "Book Loan"}
      </button>
      <ApiResponseViewer response={response} loading={loading} error={error} />
    </form>
  );
}

// ---------------------------------------------------------------------------
// Sub-panel: Confirm
// ---------------------------------------------------------------------------
function ConfirmPanel({ prefillBookingId }: { prefillBookingId: string }) {
  const [bookingId, setBookingId] = useState(prefillBookingId);

  // Sync when parent updates the prop (e.g. after a new Book step)
  useEffect(() => {
    if (prefillBookingId) setBookingId(prefillBookingId);
  }, [prefillBookingId]);
  const [otp, setOtp] = useState("");
  const [response, setResponse] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
      <p className="text-sm text-gray-500">
        Enter the OTP sent to your email to confirm the loan booking.
      </p>
      <div>
        <label className="label">Booking ID</label>
        <input
          className="input"
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
          className="input"
          type="text"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          placeholder="123456"
          maxLength={6}
          required
        />
      </div>
      <button type="submit" disabled={loading} className="btn-primary">
        {loading ? "Confirming..." : "Confirm Loan"}
      </button>
      <ApiResponseViewer response={response} loading={loading} error={error} />
    </form>
  );
}

// ---------------------------------------------------------------------------
// Sub-panel: My Loans
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

function MyLoansPanel({ onSelectLoan }: { onSelectLoan: (id: string) => void }) {
  const [loans, setLoans] = useState<LoanItem[]>([]);
  const [raw, setRaw] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const statusColor: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-700",
    ACTIVE: "bg-green-100 text-green-700",
    CLOSED: "bg-gray-100 text-gray-600",
    REJECTED: "bg-red-100 text-red-700",
  };

  return (
    <div className="space-y-4">
      <button onClick={fetchLoans} disabled={loading} className="btn-primary">
        {loading ? "Loading..." : "Fetch My Loans"}
      </button>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loans.length > 0 && (
        <div className="divide-y divide-gray-100 border rounded-lg overflow-hidden">
          {loans.map((loan) => (
            <div key={loan.id} className="p-4 bg-white hover:bg-gray-50">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">₹{loan.principal_amount}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        statusColor[loan.status] ?? "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {loan.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    EMI: ₹{loan.emi_amount} · Outstanding: ₹{loan.outstanding_amount} ·{" "}
                    {loan.tenure_months}mo @ {loan.interest_rate}% p.a.
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5 font-mono truncate">
                    {loan.id}
                  </p>
                </div>
                {loan.status === "ACTIVE" && (
                  <button
                    onClick={() => onSelectLoan(loan.id)}
                    className="btn-primary shrink-0 text-xs py-1 px-3"
                  >
                    Pay EMI
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <details className="text-sm">
        <summary className="cursor-pointer text-gray-500">Raw response</summary>
        <ApiResponseViewer response={raw} loading={false} error={null} />
      </details>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-panel: Pay EMI
// ---------------------------------------------------------------------------
function PayEmiPanel({ prefillLoanId }: { prefillLoanId: string }) {
  const [loanId, setLoanId] = useState(prefillLoanId);

  // Sync when parent selects a different loan
  useEffect(() => {
    if (prefillLoanId) setLoanId(prefillLoanId);
  }, [prefillLoanId]);
  const [response, setResponse] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResponse(null);
    try {
      const { data } = await api.post(`/loan/${loanId}/pay`, {});
      setResponse(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
      <p className="text-sm text-gray-500">
        Pays one EMI instalment from your wallet balance.
      </p>
      <div>
        <label className="label">Loan ID</label>
        <input
          className="input"
          type="text"
          value={loanId}
          onChange={(e) => setLoanId(e.target.value)}
          placeholder="Auto-filled from My Loans"
          required
        />
      </div>
      <button type="submit" disabled={loading} className="btn-primary">
        {loading ? "Processing..." : "Pay EMI"}
      </button>
      <ApiResponseViewer response={response} loading={loading} error={error} />
    </form>
  );
}

// ---------------------------------------------------------------------------
// Main Loans Page
// ---------------------------------------------------------------------------
function LoansContent() {
  const [activeTab, setActiveTab] = useState<Tab>("Eligibility");
  const [bookingId, setBookingId] = useState("");
  const [selectedLoanId, setSelectedLoanId] = useState("");

  const handleBooked = (id: string) => {
    setBookingId(id);
    setActiveTab("Confirm");
  };

  const handleSelectLoan = (id: string) => {
    setSelectedLoanId(id);
    setActiveTab("Pay EMI");
  };

  return (
    <div>
      {/* Tabs */}
      <div className="flex flex-wrap gap-1 mb-6 border-b border-gray-200 pb-0">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-t transition-colors -mb-px ${
              activeTab === tab
                ? "bg-white border border-b-white border-gray-200 text-blue-600"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="card">
        {activeTab === "Eligibility" && <EligibilityPanel />}
        {activeTab === "Simulate" && <SimulatePanel />}
        {activeTab === "Book" && <BookPanel onBooked={handleBooked} />}
        {activeTab === "Confirm" && (
          <ConfirmPanel prefillBookingId={bookingId} />
        )}
        {activeTab === "My Loans" && (
          <MyLoansPanel onSelectLoan={handleSelectLoan} />
        )}
        {activeTab === "Pay EMI" && (
          <PayEmiPanel prefillLoanId={selectedLoanId} />
        )}
      </div>
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
