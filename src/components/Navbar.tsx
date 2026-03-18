"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export function Navbar() {
  const { isAuthenticated, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <nav className="bg-slate-900/80 backdrop-blur border-b border-slate-800 px-4 py-3 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <Link
          href={isAuthenticated ? "/dashboard" : "/login"}
          className="font-bold text-blue-400 text-lg tracking-tight flex items-center gap-2"
        >
          <span className="w-7 h-7 rounded-lg bg-blue-600 text-white text-sm font-black flex items-center justify-center leading-none shrink-0">
            A
          </span>
          ADX Bank
        </Link>

        {isAuthenticated && (
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        )}

        {!isAuthenticated && (
          <div className="flex items-center gap-1">
            <Link href="/login" className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors">
              Login
            </Link>
            <Link href="/register" className="px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-500 transition-colors">
              Register
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
