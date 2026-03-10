"use client";

import { useState } from "react";
import { api, getErrorMessage } from "@/services/api";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ApiResponseViewer } from "@/components/ApiResponseViewer";

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function WalletContent() {
  const [amount, setAmount] = useState("");
  const [response, setResponse] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkoutStatus, setCheckoutStatus] = useState<string | null>(null);

  const handleInitiate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResponse(null);
    setCheckoutStatus(null);

    try {
      const { data } = await api.post("/wallet/add-money/initiate", {
        amount: parseFloat(amount),
      });
      setResponse(data);

      const payload = data?.data ?? data;
      const { order_id, razorpay_key_id, amount: orderAmount, currency } = payload;

      // Load Razorpay script and open checkout
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        setError("Failed to load Razorpay checkout script.");
        return;
      }

      const rzp = new window.Razorpay({
        key: razorpay_key_id,
        order_id: order_id,
        amount: String(parseFloat(orderAmount) * 100), // paise
        currency: currency || "INR",
        name: "ADX Bank",
        description: "Add Money to Wallet",
        handler: () => {
          setCheckoutStatus(
            "Payment submitted! Your balance will be updated shortly via webhook."
          );
        },
        modal: {
          ondismiss: () => {
            setCheckoutStatus("Checkout closed.");
          },
        },
      });

      rzp.open();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md">
      <div className="card">
        <h2 className="text-base font-semibold text-slate-100 mb-4">Add Money to Wallet</h2>

        <form onSubmit={handleInitiate} className="space-y-4">
          <div>
            <label className="label">Amount (INR)</label>
            <input
              className="input"
              type="number"
              min="1"
              max="20000"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Min ₹1, Max ₹20,000"
              required
            />
            <p className="text-xs text-slate-500 mt-1">
              Uses Razorpay Test Mode — no real money charged.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? "Creating order..." : "Add Money"}
          </button>
        </form>

        {checkoutStatus && (
          <div className="mt-4 bg-blue-900/20 border border-blue-800/60 rounded-lg p-3 text-sm text-blue-400">
            {checkoutStatus}
          </div>
        )}

        <ApiResponseViewer response={response} loading={loading} error={error} title="Order Response" />

        <div className="mt-4 p-3 bg-amber-900/20 border border-amber-800/50 rounded-lg text-xs text-amber-400">
          <strong>Test card:</strong> 4111 1111 1111 1111 · Exp: any future date ·
          CVV: any 3 digits · OTP: 1234
        </div>
      </div>
    </div>
  );
}

export default function WalletPage() {
  return (
    <ProtectedRoute>
      <h1 className="page-title">Wallet — Add Money</h1>
      <WalletContent />
    </ProtectedRoute>
  );
}
