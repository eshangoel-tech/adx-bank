"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, getErrorMessage } from "@/services/api";
import { ProtectedRoute } from "@/components/ProtectedRoute";

interface DashboardData {
  user: { full_name: string; email: string; phone: string };
  account: {
    account_number_masked: string;
    balance: string;
    account_type: string;
    currency: string;
    status: string;
  };
  recent_transactions: Array<{
    id: string;
    entry_type: string;
    amount: string;
    balance_after: string;
    reference_type: string;
    description: string;
    created_at: string;
  }>;
}

const FEATURES = [
  {
    href: "/transfer",
    label: "Transfer",
    desc: "Send money to any account",
    color: "blue",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    ),
  },
  {
    href: "/wallet",
    label: "Add Money",
    desc: "Top up your account balance",
    color: "emerald",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
    ),
  },
  {
    href: "/loans",
    label: "Loans",
    desc: "Apply or manage your loans",
    color: "violet",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
      </svg>
    ),
  },
  {
    href: "/assistant",
    label: "AI Assistant",
    desc: "Ask anything about your account",
    color: "amber",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
    ),
  },
  {
    href: "/transactions",
    label: "Transactions",
    desc: "View your full transaction history",
    color: "cyan",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    href: "/account",
    label: "Account",
    desc: "View account details",
    color: "slate",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
  },
  {
    href: "/profile",
    label: "Edit Profile",
    desc: "Update your phone & address",
    color: "rose",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
];

const COLOR_MAP: Record<string, { bg: string; icon: string; border: string; hover: string }> = {
  blue:    { bg: "bg-blue-600/10",    icon: "text-blue-400",    border: "border-blue-800/40",    hover: "hover:border-blue-600/60 hover:bg-blue-600/15" },
  emerald: { bg: "bg-emerald-600/10", icon: "text-emerald-400", border: "border-emerald-800/40", hover: "hover:border-emerald-600/60 hover:bg-emerald-600/15" },
  violet:  { bg: "bg-violet-600/10",  icon: "text-violet-400",  border: "border-violet-800/40",  hover: "hover:border-violet-600/60 hover:bg-violet-600/15" },
  amber:   { bg: "bg-amber-600/10",   icon: "text-amber-400",   border: "border-amber-800/40",   hover: "hover:border-amber-600/60 hover:bg-amber-600/15" },
  cyan:    { bg: "bg-cyan-600/10",    icon: "text-cyan-400",    border: "border-cyan-800/40",    hover: "hover:border-cyan-600/60 hover:bg-cyan-600/15" },
  slate:   { bg: "bg-slate-700/30",   icon: "text-slate-300",   border: "border-slate-700/50",   hover: "hover:border-slate-500/60 hover:bg-slate-700/50" },
  rose:    { bg: "bg-rose-600/10",    icon: "text-rose-400",    border: "border-rose-800/40",    hover: "hover:border-rose-600/60 hover:bg-rose-600/15" },
};

function DashboardContent() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get("/dashboard/summary")
      .then(({ data: res }) => setData(res?.data ?? res))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-3 text-slate-400 py-20 justify-center">
        <span className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        Loading...
      </div>
    );
  }

  if (error) {
    return <div className="error-box">{error}</div>;
  }

  return (
    <div className="space-y-8">
      {/* Balance hero card */}
      {data && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-900/60 to-slate-900 border border-blue-800/40 p-6 shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(37,99,235,0.15),transparent_70%)]" />
          <div className="relative z-10">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold mb-1">Available Balance</p>
                <p className="text-4xl font-bold text-white tracking-tight">
                  ₹{parseFloat(data.account.balance).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-slate-400 mt-2 font-mono">{data.account.account_number_masked}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-slate-200">{data.user.full_name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{data.user.email}</p>
                <span className={`mt-2 inline-block text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                  data.account.status === "ACTIVE"
                    ? "bg-emerald-900/50 text-emerald-400 border border-emerald-700/50"
                    : "bg-red-900/50 text-red-400 border border-red-700/50"
                }`}>
                  {data.account.status}
                </span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-white/10 flex gap-4 text-xs text-slate-500">
              <span>{data.account.account_type}</span>
              <span>·</span>
              <span>{data.account.currency}</span>
            </div>
          </div>
        </div>
      )}

      {/* Feature grid */}
      <div>
        <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-4">Quick Actions</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {FEATURES.map((f) => {
            const c = COLOR_MAP[f.color];
            return (
              <button
                key={f.href}
                onClick={() => router.push(f.href)}
                className={`group text-left p-4 rounded-xl border ${c.border} ${c.hover} bg-slate-900/80 transition-all duration-200 cursor-pointer`}
              >
                <div className={`w-10 h-10 rounded-xl ${c.bg} ${c.icon} flex items-center justify-center mb-3 transition-transform duration-200 group-hover:scale-110`}>
                  {f.icon}
                </div>
                <p className="text-sm font-semibold text-slate-100">{f.label}</p>
                <p className="text-xs text-slate-500 mt-0.5 leading-tight">{f.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent transactions */}
      {data && data.recent_transactions.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest">Recent Transactions</h2>
            <button
              onClick={() => router.push("/transactions")}
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              View all →
            </button>
          </div>
          <div className="divide-y divide-slate-800">
            {data.recent_transactions.slice(0, 5).map((tx) => (
              <div key={tx.id} className="py-3 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    tx.entry_type === "CREDIT" ? "bg-emerald-900/30" : "bg-red-900/30"
                  }`}>
                    <svg className={`w-4 h-4 ${tx.entry_type === "CREDIT" ? "text-emerald-400" : "text-red-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      {tx.entry_type === "CREDIT"
                        ? <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        : <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7M12 3v18" />
                      }
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-200">{tx.description || tx.reference_type}</p>
                    <p className="text-xs text-slate-500">{new Date(tx.created_at).toLocaleString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${tx.entry_type === "CREDIT" ? "text-emerald-400" : "text-red-400"}`}>
                    {tx.entry_type === "CREDIT" ? "+" : "−"}₹{parseFloat(tx.amount).toLocaleString("en-IN")}
                  </p>
                  <p className="text-xs text-slate-600">Bal: ₹{parseFloat(tx.balance_after).toLocaleString("en-IN")}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
