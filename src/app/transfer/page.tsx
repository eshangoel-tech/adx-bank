"use client";

import { useState } from "react";
import { api, getErrorMessage } from "@/services/api";
import { ProtectedRoute } from "@/components/ProtectedRoute";

interface InitiateResponse {
  transfer_id: string;
  receiver_name: string;
  receiver_account: string;
  amount: string;
}

type Step = "initiate" | "confirm" | "success";
type TransferMethod = "account" | "phone";

function TransferContent() {
  const [step, setStep] = useState<Step>("initiate");
  const [method, setMethod] = useState<TransferMethod>("account");

  // Form fields
  const [accountNumber, setAccountNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");

  // After initiate
  const [initData, setInitData] = useState<InitiateResponse | null>(null);
  const [otp, setOtp] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInitiate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const body: Record<string, unknown> = { amount: parseFloat(amount) };
      if (method === "account") body.to_account_number = accountNumber;
      else body.to_phone = phone;

      const { data } = await api.post("/transfer/initiate", body);
      const d: InitiateResponse = data?.data ?? data;
      setInitData(d);
      setStep("confirm");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.post("/transfer/confirm", {
        transfer_id: initData?.transfer_id,
        otp,
      });
      setStep("success");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep("initiate");
    setAccountNumber("");
    setPhone("");
    setAmount("");
    setOtp("");
    setInitData(null);
    setError(null);
  };

  // ── Success screen ────────────────────────────────────────────────────────
  if (step === "success") {
    return (
      <div className="max-w-md mx-auto">
        <div className="card text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-600/20 border-2 border-emerald-500 flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100">Transfer Successful</h2>
            <p className="text-sm text-slate-400 mt-1">Your funds have been transferred successfully.</p>
          </div>
          <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 p-4 text-left space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500 uppercase tracking-wide">Recipient</span>
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-200">{initData?.receiver_name}</p>
                <p className="text-xs font-mono text-slate-500">{initData?.receiver_account}</p>
              </div>
            </div>
            <div className="border-t border-slate-700/50" />
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500 uppercase tracking-wide">Amount</span>
              <span className="text-xl font-bold text-emerald-400">
                ₹{parseFloat(initData?.amount ?? "0").toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="border-t border-slate-700/50" />
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500 uppercase tracking-wide">Transfer ID</span>
              <span className="text-xs font-mono text-slate-400 truncate max-w-[60%]">{initData?.transfer_id}</span>
            </div>
          </div>
          <button onClick={handleReset} className="btn-primary w-full">New Transfer</button>
        </div>
      </div>
    );
  }

  const stepIndex = step === "initiate" ? 0 : 1;
  const stepLabels = ["Enter Details", "Verify & Confirm"];

  return (
    <div className="max-w-md mx-auto space-y-6">
      {/* Stepper */}
      <div className="flex items-center">
        {stepLabels.map((label, i) => {
          const done = i < stepIndex;
          const active = i === stepIndex;
          return (
            <div key={label} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-200 ${
                  done ? "bg-blue-600 border-blue-600 text-white"
                  : active ? "bg-blue-600/20 border-blue-500 text-blue-400 ring-4 ring-blue-500/10"
                  : "bg-slate-800 border-slate-700 text-slate-500"
                }`}>
                  {done
                    ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    : i + 1}
                </div>
                <span className={`mt-1.5 text-xs font-medium ${done || active ? "text-slate-200" : "text-slate-600"}`}>{label}</span>
              </div>
              {i < stepLabels.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 mb-4 rounded-full transition-colors duration-300 ${stepIndex > i ? "bg-blue-600" : "bg-slate-800"}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* ── Step 1: Initiate ───────────────────────────────────────────────── */}
      {step === "initiate" && (
        <div className="card space-y-5">
          <div>
            <h2 className="text-base font-bold text-slate-100">Transfer Details</h2>
            <p className="text-sm text-slate-400 mt-0.5">Send money using an account number or mobile number.</p>
          </div>

          {/* Method toggle */}
          <div className="flex bg-slate-800/60 border border-slate-700/60 rounded-xl p-1 gap-1">
            <button
              type="button"
              onClick={() => { setMethod("account"); setError(null); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all duration-150 ${
                method === "account"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-900/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              Account No.
            </button>
            <button
              type="button"
              onClick={() => { setMethod("phone"); setError(null); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all duration-150 ${
                method === "phone"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-900/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              Mobile No.
            </button>
          </div>

          <form onSubmit={handleInitiate} className="space-y-4">
            {method === "account" ? (
              <div>
                <label className="label">Recipient Account Number</label>
                <input
                  className="input font-mono"
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value.toUpperCase())}
                  placeholder="ADX0000012"
                  required
                />
                <p className="text-xs text-slate-600 mt-1">e.g. ADX0000012</p>
              </div>
            ) : (
              <div>
                <label className="label">Recipient Mobile Number</label>
                <div className="flex gap-2 items-center">
                  <span className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-400 shrink-0 select-none">+91</span>
                  <input
                    className="input"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    placeholder="9876543210"
                    maxLength={10}
                    required
                  />
                </div>
                <p className="text-xs text-slate-600 mt-1">Enter 10-digit mobile number</p>
              </div>
            )}

            <div>
              <label className="label">Amount (INR)</label>
              <input
                className="input"
                type="number"
                min="1"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="500.00"
                required
              />
            </div>

            {error && <p className="text-sm text-red-400 bg-red-900/10 border border-red-800/40 rounded-lg px-3 py-2">{error}</p>}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading
                ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Looking up recipient...</span>
                : "Continue →"}
            </button>
          </form>
        </div>
      )}

      {/* ── Step 2: Confirm ────────────────────────────────────────────────── */}
      {step === "confirm" && initData && (
        <div className="card space-y-5">
          {/* Receiver verification card */}
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-3">Verify Recipient</p>
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl overflow-hidden">
              <div className="flex items-center gap-4 p-4">
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-blue-600/20 border border-blue-600/30 flex items-center justify-center shrink-0">
                  <span className="text-lg font-bold text-blue-400">
                    {initData.receiver_name?.charAt(0)?.toUpperCase() ?? "?"}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-bold text-slate-100">{initData.receiver_name}</p>
                  <p className="text-sm font-mono text-slate-400 mt-0.5">{initData.receiver_account}</p>
                </div>
                <div className="shrink-0">
                  <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-900/20 border border-emerald-800/40 px-2 py-1 rounded-full">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Verified
                  </span>
                </div>
              </div>
              <div className="border-t border-slate-700/50 px-4 py-3 flex justify-between items-center bg-slate-800/30">
                <span className="text-sm text-slate-400">Amount to send</span>
                <span className="text-xl font-bold text-white">
                  ₹{parseFloat(initData.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="flex items-start gap-2.5 bg-amber-900/10 border border-amber-800/40 rounded-lg px-3.5 py-2.5">
            <svg className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <p className="text-xs text-amber-300 leading-relaxed">
              Please verify the recipient details above before confirming. Transfers cannot be reversed once completed.
            </p>
          </div>

          {/* OTP */}
          <div className="flex items-center gap-2.5 bg-blue-900/20 border border-blue-800/40 rounded-lg px-3.5 py-2.5">
            <svg className="w-4 h-4 text-blue-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <p className="text-sm text-blue-300">An OTP has been sent to your registered email.</p>
          </div>

          <form onSubmit={handleConfirm} className="space-y-4">
            <div>
              <label className="label">Enter OTP</label>
              <input
                className="input tracking-[0.5em] text-center text-lg font-bold"
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="• • • • • •"
                maxLength={6}
                autoFocus
                required
              />
            </div>
            {error && <p className="text-sm text-red-400 bg-red-900/10 border border-red-800/40 rounded-lg px-3 py-2">{error}</p>}
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={handleReset} className="btn-secondary flex-1">← Back</button>
              <button type="submit" disabled={loading || otp.length < 6} className="btn-primary flex-1">
                {loading
                  ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Confirming...</span>
                  : "Confirm Transfer"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default function TransferPage() {
  return (
    <ProtectedRoute>
      <h1 className="page-title">Internal Transfer</h1>
      <TransferContent />
    </ProtectedRoute>
  );
}
