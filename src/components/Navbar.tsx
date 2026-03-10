"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/transfer", label: "Transfer" },
  { href: "/wallet", label: "Wallet" },
  { href: "/loans", label: "Loans" },
  { href: "/assistant", label: "Assistant" },
];

const AUTH_LINKS = [
  { href: "/login", label: "Login" },
  { href: "/register", label: "Register" },
];

export function Navbar() {
  const { isAuthenticated, logout } = useAuth();
  const pathname = usePathname();
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
          <span className="w-6 h-6 rounded bg-blue-600 text-white text-xs font-black flex items-center justify-center leading-none shrink-0">
            A
          </span>
          ADX Bank
        </Link>

        <div className="flex items-center gap-0.5">
          {isAuthenticated
            ? NAV_LINKS.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    pathname.startsWith(href)
                      ? "bg-blue-600 text-white"
                      : "text-slate-400 hover:text-slate-100 hover:bg-slate-800"
                  }`}
                >
                  {label}
                </Link>
              ))
            : AUTH_LINKS.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    pathname === href
                      ? "bg-blue-600 text-white"
                      : "text-slate-400 hover:text-slate-100 hover:bg-slate-800"
                  }`}
                >
                  {label}
                </Link>
              ))}

          {isAuthenticated && (
            <button
              onClick={handleLogout}
              className="ml-2 px-3 py-1.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
            >
              Logout
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
