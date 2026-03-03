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
      <div className="flex items-center gap-2 text-gray-500">
        <span className="inline-block w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        Loading dashboard...
      </div>
    );

  if (error)
    return <div className="text-red-600 bg-red-50 rounded p-3">{error}</div>;

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* User + Account summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Profile
          </h2>
          <p className="text-lg font-bold">{data.user.full_name}</p>
          <p className="text-sm text-gray-600">{data.user.email}</p>
          <p className="text-sm text-gray-600">{data.user.phone}</p>
        </div>

        <div className="card">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Account
          </h2>
          <p className="text-2xl font-bold text-green-600">
            ₹{data.account.balance}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            {data.account.account_number_masked}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {data.account.account_type} · {data.account.currency} ·{" "}
            <span
              className={
                data.account.status === "ACTIVE"
                  ? "text-green-600"
                  : "text-red-600"
              }
            >
              {data.account.status}
            </span>
          </p>
        </div>
      </div>

      {/* Recent transactions */}
      <div className="card">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Recent Transactions
        </h2>
        {data.recent_transactions.length === 0 ? (
          <p className="text-sm text-gray-400">No transactions yet.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {data.recent_transactions.map((tx) => (
              <div key={tx.id} className="py-2 flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">{tx.description || tx.reference_type}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(tx.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className={`text-sm font-bold ${
                      tx.entry_type === "CREDIT"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {tx.entry_type === "CREDIT" ? "+" : "-"}₹{tx.amount}
                  </p>
                  <p className="text-xs text-gray-400">Bal: ₹{tx.balance_after}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Raw API response */}
      <details className="text-sm">
        <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
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
