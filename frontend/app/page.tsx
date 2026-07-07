import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
      <section className="w-full max-w-2xl">
        <p className="text-sm uppercase tracking-wide text-cyan-300">
          Progressive Auth V1
        </p>

        <h1 className="mt-3 text-4xl font-semibold">
          Basic authentication with Next.js and ASP.NET Core
        </h1>

        <p className="mt-4 max-w-xl text-slate-400">
          Create an account, sign in, and access a protected dashboard backed by
          a C# API and SQLite.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            className="rounded-md bg-cyan-400 px-5 py-3 text-center font-medium text-slate-950"
            href="/register"
          >
            Create account
          </Link>

          <Link
            className="rounded-md border border-slate-700 px-5 py-3 text-center font-medium text-slate-200 hover:border-cyan-400"
            href="/login"
          >
            Login
          </Link>

          <Link
            className="rounded-md border border-slate-700 px-5 py-3 text-center font-medium text-slate-200 hover:border-cyan-400"
            href="/dashboard"
          >
            Dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}