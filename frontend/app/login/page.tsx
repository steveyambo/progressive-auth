"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { ApiError, login, resendVerificationEmail } from "../../lib/api";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [requiresEmailVerification, setRequiresEmailVerification] =
    useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setIsLoading(true);
    setResendMessage("");
    setRequiresEmailVerification(false);

    try {
      await login({
        email,
        password,
        rememberMe,
      });
      router.push("/dashboard");
    } catch (error) {
      if (error instanceof ApiError && error.code === "EMAIL_NOT_VERIFIED") {
        setRequiresEmailVerification(true);
        setError(error.message);
      } else {
        setError(error instanceof Error ? error.message : "Login failed.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResend() {
    setError("");
    setResendMessage("");
    setIsResending(true);

    try {
      const response = await resendVerificationEmail(
        email.trim().toLowerCase(),
      );

      setResendMessage(response.message);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Verification email could not be resent.",
      );
    } finally {
      setIsResending(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
      <section className="w-full max-w-md rounded-lg border border-slate-800 bg-slate-900 p-6 shadow-xl">
        <h1 className="text-2xl font-semibold">Login</h1>
        <p className="mt-2 text-sm text-slate-400">
          Sign in to continue to your protected dashboard.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="text-sm text-slate-300">Email</span>
            <input
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-cyan-400"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          <label className="block">
            <span className="text-sm text-slate-300">Password</span>
            <input
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-cyan-400"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>

          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(event) => setRememberMe(event.target.checked)}
              className="h-4 w-4 rounded border-slate-700 bg-slate-950"
            />
            Remember me
          </label>

          {error ? (
            <p className="rounded-md border border-red-900 bg-red-950 px-3 py-2 text-sm text-red-200">
              {error}
            </p>
          ) : null}

          {requiresEmailVerification ? (
            <button
              className="w-full rounded-md border border-cyan-700 px-4 py-2 font-medium text-cyan-200 hover:border-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isResending}
              onClick={handleResend}
              type="button"
            >
              {isResending ? "Sending..." : "Resend verification email"}
            </button>
          ) : null}

          {resendMessage ? (
            <p className="rounded-md border border-emerald-900 bg-emerald-950 px-3 py-2 text-sm text-emerald-200">
              {resendMessage}
            </p>
          ) : null}
          
          <button
            className="w-full rounded-md bg-cyan-400 px-4 py-2 font-medium text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isLoading}
            type="submit"
          >
            {isLoading ? "Signing in..." : "Login"}
          </button>
        </form>

        <p className="mt-4 text-sm text-slate-400">
          No account yet?{" "}
          <Link className="text-cyan-300 hover:text-cyan-200" href="/register">
            Create one
          </Link>
        </p>
      </section>
    </main>
  );
}
