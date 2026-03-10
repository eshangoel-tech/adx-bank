"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, getErrorMessage } from "@/services/api";
import { ApiResponseViewer } from "@/components/ApiResponseViewer";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [response, setResponse] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResponse(null);
    try {
      const { data } = await api.post("/auth/login", { identifier, password });
      setResponse(data);
      // Pass identifier to the OTP page so the user doesn't have to retype it
      sessionStorage.setItem("adx_pending_identifier", identifier);
      // Redirect to OTP step after a short delay
      setTimeout(() => router.push("/verify-login"), 800);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <h1 className="page-title">Login</h1>

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Email or Phone</label>
            <input
              className="input"
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="you@example.com or +91..."
              required
            />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Sending OTP..." : "Login"}
          </button>
        </form>

        <ApiResponseViewer response={response} loading={loading} error={error} />

        <div className="mt-4 text-sm text-slate-500 text-center">
          <p>
            No account?{" "}
            <Link href="/register" className="text-blue-400 hover:text-blue-300 hover:underline">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
