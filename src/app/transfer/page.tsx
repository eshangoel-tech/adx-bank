"use client";

import { useState } from "react";
import { api, getErrorMessage } from "@/services/api";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ApiResponseViewer } from "@/components/ApiResponseViewer";

function TransferContent() {
  // --- Initiate ---
  const [receiverAccount, setReceiverAccount] = useState("");
  const [amount, setAmount] = useState("");
  const [initiateRes, setInitiateRes] = useState<unknown>(null);
  const [initiateLoading, setInitiateLoading] = useState(false);
  const [initiateError, setInitiateError] = useState<string | null>(null);

  // --- Confirm ---
  const [transferId, setTransferId] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmRes, setConfirmRes] = useState<unknown>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const handleInitiate = async (e: React.FormEvent) => {
    e.preventDefault();
    setInitiateLoading(true);
    setInitiateError(null);
    setInitiateRes(null);
    try {
      const { data } = await api.post("/transfer/initiate", {
        receiver_account_number: receiverAccount,
        amount: parseFloat(amount),
      });
      setInitiateRes(data);
      // Pre-fill transfer_id for confirm step
      const tid = data?.data?.transfer_id ?? data?.transfer_id;
      if (tid) setTransferId(tid);
    } catch (err) {
      setInitiateError(getErrorMessage(err));
    } finally {
      setInitiateLoading(false);
    }
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setConfirmLoading(true);
    setConfirmError(null);
    setConfirmRes(null);
    try {
      const { data } = await api.post("/transfer/confirm", {
        transfer_id: transferId,
        otp,
      });
      setConfirmRes(data);
    } catch (err) {
      setConfirmError(getErrorMessage(err));
    } finally {
      setConfirmLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Step 1: Initiate */}
      <div className="card">
        <h2 className="text-base font-semibold mb-4">
          Step 1 — Initiate Transfer
        </h2>
        <form onSubmit={handleInitiate} className="space-y-3">
          <div>
            <label className="label">Receiver Account Number</label>
            <input
              className="input"
              type="text"
              value={receiverAccount}
              onChange={(e) => setReceiverAccount(e.target.value)}
              placeholder="ACC0000000001"
              required
            />
          </div>
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
          <button
            type="submit"
            disabled={initiateLoading}
            className="btn-primary w-full"
          >
            {initiateLoading ? "Initiating..." : "Initiate Transfer"}
          </button>
        </form>
        <ApiResponseViewer
          response={initiateRes}
          loading={initiateLoading}
          error={initiateError}
        />
      </div>

      {/* Step 2: Confirm */}
      <div className="card">
        <h2 className="text-base font-semibold mb-4">
          Step 2 — Confirm with OTP
        </h2>
        <form onSubmit={handleConfirm} className="space-y-3">
          <div>
            <label className="label">Transfer ID</label>
            <input
              className="input"
              type="text"
              value={transferId}
              onChange={(e) => setTransferId(e.target.value)}
              placeholder="Auto-filled after initiate"
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
          <button
            type="submit"
            disabled={confirmLoading}
            className="btn-primary w-full"
          >
            {confirmLoading ? "Confirming..." : "Confirm Transfer"}
          </button>
        </form>
        <ApiResponseViewer
          response={confirmRes}
          loading={confirmLoading}
          error={confirmError}
        />
      </div>
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
