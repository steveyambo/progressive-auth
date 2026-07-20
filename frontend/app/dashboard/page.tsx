"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getDashboard, logout } from "../../lib/api";

type DashboardData = {
  message: string;
  user: {
    name: string;
    email: string;
    role: "USER" | "ADMIN";
    emailVerified: boolean;
  };
  stats: {
    authenticationLevel: string;
    isProtected: boolean;
  };
};

export default function DashboardPage() {
  const router = useRouter();

  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const data = await getDashboard();
        setDashboard(data);
      } catch {
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    }
    loadDashboard();
  }, [router]);

  async function handleLogout() {
    setIsLoggingOut(true);
    setError("");

    try {
      await logout();
      router.push("/login");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Logout Faild");
      setIsLoggingOut(false);
    }
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
        <p className="text-sm text-slate-400">Loading dashboard...</p>
      </main>
    );
  }

  if (!dashboard) {
    return null;
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <section className="mx-auto max-w-3xl">
        <div className="flex flex-col gap-4 border-b border-slate-800 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-wide text-cyan-300">
              Protected area
            </p>
            <h1 className="mt-2 text-3xl font-semibold">Dashboard</h1>
            <p className="mt-2 text-slate-400">{dashboard.message}</p>
          </div>

          <button
            className="rounded-md border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 hover:border-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isLoggingOut}
            onClick={handleLogout}
            type="button"
          >
            {isLoggingOut ? "Logging out..." : "Logout"}
          </button>
        </div>

        {error ? (
          <p className="mt-6 rounded-md border border-red-900 bg-red-950 px-3 py-2 text-sm text-red-200">
            {error}
          </p>
        ) : null}

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <article className="rounded-lg border border-slate-800 bg-slate-900 p-5">
            <h2 className="text-sm font-medium text-slate-400">User</h2>
            <p className="mt-3 text-lg font-semibold">{dashboard.user.name}</p>
            <p className="mt-1 text-sm text-slate-400">
              {dashboard.user.email}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-md border border-slate-700 px-2 py-1 text-xs font-medium text-cyan-200">
                {dashboard.user.role}
              </span>

              <span className="rounded-md border border-emerald-800 px-2 py-1 text-xs font-medium text-emerald-300">
                {dashboard.user.emailVerified
                  ? "Email verified"
                  : "Email unverified"}
              </span>
            </div>
          </article>

          <article className="rounded-lg border border-slate-800 bg-slate-900 p-5">
            <h2 className="text-sm font-medium text-slate-400">Session</h2>
            <p className="mt-3 text-lg font-semibold">
              {dashboard.stats.authenticationLevel}
            </p>
            <p className="mt-1 text-sm text-slate-400">
              Protected: {dashboard.stats.isProtected ? "yes" : "no"}
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}
