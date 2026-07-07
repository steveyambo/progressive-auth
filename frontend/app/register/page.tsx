"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { register } from "../../lib/api";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setIsLoading(true);

    try {
      await register({
        name,
        email,
        password,
      });
      router.push("/login");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Registration failed.");
    } finally {
      setIsLoading(false);
    }
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
