"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { verifyEmail } from "../../lib/api";

type VerificationStatus = "verifying" | "success" | "error";

export default function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const verificationStarted = useRef(false);
  const token = searchParams.get("token");

  const [status, setStatus] = useState<VerificationStatus>(
    token ? "verifying" : "error",
  );

  const [message, setMessage] = useState(
    token ? "Verifying your email..." : "The verification token is missing.",
  );

  useEffect(() => {
    if (!token || verificationStarted.current) {
      return;
    }
    verificationStarted.current = true;

    verifyEmail(token)
      .then((response) => {
        setStatus("success");
        setMessage(response.message);
      })
      .catch((error) => {
        setStatus("error");
        setMessage(
          error instanceof Error ? error.message : "Email verification failed.",
        );
      });
  }, [token]);

  return (
    <section className="w-full max-w-md rounded-lg border border-slate-800 bg-slate-900 p-6 shadow-xl">
      <p className="text-sm uppercase text-cyan-300">Email verification</p>
      <h1 className="mt-2 text-2xl font-semibold">
        {status === "verifying"
          ? "Checking your link"
          : status === "success"
            ? "Email verified"
            : "Verification failed"}
      </h1>

      <p className="mt-3 text-sm text-slate-400">{message}</p>

      {status === "success" ? (
        <Link
          className="mt-6 block rounded-md bg-cyan-400 px-4 py-2 text-center font-medium text-slate-950"
          href="/login"
        >
          Continue to login
        </Link>
      ) : null}

      {status === "error" ? (
        <Link
          className="mt-6 block rounded-md border border-slate-700 px-4 py-2 text-center font-medium text-slate-200 hover:border-cyan-400"
          href="/login"
        >
          Return to login
        </Link>
      ) : null}
    </section>
  );
}
