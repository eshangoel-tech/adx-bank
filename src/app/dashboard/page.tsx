"use client";

import { useEffect, useState } from "react";
import { api, getErrorMessage } from "@/services/api";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ApiResponseViewer } from "@/components/ApiResponseViewer";

interface Transaction {
  id: string;
  entry_type: string;
  amount: string;
  balance_after: string;
  reference_type: string;
  description: string;
  created_at: string;
}

interface DashboardData {
  user: { full_name: string; email: string; phone: string };
  account: {
    account_number_masked: string;
    balance: string;
    account_type: string;
    currency: string;
    status: string;
  };
  recent_transactions: Transaction[];
}

function DashboardContent() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [raw, setRaw] = useState<unknown>(null);

  useEffect(() => {
    api
      .get("/dashboard/summary")
      .then(({ data: res }) => {
        setRaw(res);
        setData(res?.data ?? res);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="flex items-center gap-2 text-slate-400">
        <span className="inline-block w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        Loading dashboard...
      </div>
    );

  if (error)
    return (
      <div className="bg-red-900/20 border border-red-800/60 rounded-lg p-3 text-red-400">
        {error}
      </div>
    );

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* User + Account summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
            Profile
          </h2>
          <p className="text-lg font-bold text-slate-100">{data.user.full_name}</p>
          <p className="text-sm text-slate-400 mt-0.5">{data.user.email}</p>
          <p className="text-sm text-slate-400">{data.user.phone}</p>
        </div>

        <div className="card">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
            Account
          </h2>
          <p className="text-3xl font-bold text-emerald-400">
            ₹{data.account.balance}
          </p>
          <p className="text-sm text-slate-400 mt-1 font-mono">
            {data.account.account_number_masked}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {data.account.account_type} · {data.account.currency} ·{" "}
            <span
              className={
                data.account.status === "ACTIVE"
                  ? "text-emerald-400"
                  : "text-red-400"
              }
            >
              {data.account.status}
            </span>
          </p>
        </div>
      </div>

      {/* Recent transactions */}
      <div className="card">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">
          Recent Transactions
        </h2>
        {data.recent_transactions.length === 0 ? (
          <p className="text-sm text-slate-500">No transactions yet.</p>
        ) : (
          <div className="divide-y divide-slate-800">
            {data.recent_transactions.map((tx) => (
              <div key={tx.id} className="py-3 flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-slate-200">
                    {tx.description || tx.reference_type}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {new Date(tx.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className={`text-sm font-bold ${
                      tx.entry_type === "CREDIT"
                        ? "text-emerald-400"
                        : "text-red-400"
                    }`}
                  >
                    {tx.entry_type === "CREDIT" ? "+" : "-"}₹{tx.amount}
                  </p>
                  <p className="text-xs text-slate-500">Bal: ₹{tx.balance_after}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Raw API response */}
      <details className="text-sm">
        <summary className="cursor-pointer text-slate-500 hover:text-slate-300 select-none">
          View raw API response
        </summary>
        <ApiResponseViewer response={raw} loading={false} error={null} />
      </details>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <h1 className="page-title">Dashboard</h1>
      <DashboardContent />
    </ProtectedRoute>
  );
}
