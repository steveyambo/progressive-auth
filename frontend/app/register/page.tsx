"use client";

import Link from "next/link";
import React, { useState } from "react";
import { register, resendVerificationEmail } from "../../lib/api";

type RegistrationResult = {
  email: string;
  message: string;
  emailSent: boolean;
};

export default function RegisterPage() {
  const [registrationResult, setRegistrationResult] =
    useState<RegistrationResult | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setIsLoading(true);

    try {
      const response = await register({
        name,
        email,
        password,
      });

      setRegistrationResult({
        email: email.trim().toLowerCase(),
        message: response.message,
        emailSent: response.verificationEmailSent,
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : "Registration failed.");
    } finally {
      setIsLoading(false);
    }
  }
  async function handleResend() {
    if (!registrationResult) {
      return;
    }

    setError("");
    setIsResending(true);

    try {
      const response = await resendVerificationEmail(registrationResult.email);

      setRegistrationResult({
        ...registrationResult,
        message: response.message,
        emailSent: true,
      });
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

  if (registrationResult) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
        <section className="w-full max-w-md rounded-lg border border-slate-800 bg-slate-900 p-6 shadow-xl">
          <p className="text-sm uppercase text-cyan-300">Account created</p>

          <h1 className="mt-2 text-2xl font-semibold">
            {registrationResult.emailSent
              ? "Check your inbox"
              : "Email not sent"}
          </h1>

          <p className="mt-3 text-sm text-slate-400">
            {registrationResult.message}
          </p>

          <p className="mt-3 text-sm text-slate-300">
            {registrationResult.email}
          </p>

          {error ? (
            <p className="mt-4 rounded-md border border-red-900 bg-red-950 px-3 py-2 text-sm text-red-200">
              {error}
            </p>
          ) : null}

          <button
            className="mt-6 w-full rounded-md bg-cyan-400 px-4 py-2 font-medium text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isResending}
            onClick={handleResend}
            type="button"
          >
            {isResending ? "Sending..." : "Resend verification email"}
          </button>

          <Link
            className="mt-3 block rounded-md border border-slate-700 px-4 py-2 text-center font-medium text-slate-200 hover:border-cyan-400"
            href="/login"
          >
            Continue to login
          </Link>
        </section>
      </main>
    );
  }
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
      <section className="w-full max-w-md rounded-lg border border-slate-800 bg-slate-900 p-6 shadow-xl">
        <h1 className="text-2xl font-semibold">Create account</h1>
        <p className="mt-2 text-sm text-slate-400">
          Register to access your protected dashboard.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="text-sm text-slate-300">Name</span>
            <input
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-cyan-400"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </label>

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

          {error ? (
            <p className="rounded-md border border-red-900 bg-red-950 px-3 py-2 text-sm text-red-200">
              {error}
            </p>
          ) : null}

          <button
            className="w-full rounded-md bg-cyan-400 px-4 py-2 font-medium text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isLoading}
            type="submit"
          >
            {isLoading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-4 text-sm text-slate-400">
          Already have an account?{" "}
          <Link className="text-cyan-300 hover:text-cyan-200" href="/login">
            Login
          </Link>
        </p>
      </section>
    </main>
  );
}
