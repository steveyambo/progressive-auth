import { Suspense } from "react";
import VerifyEmailContent from "./verify-email-content";

export default function VerifyEmailPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
      <Suspense
        fallback={
          <p className="text-sm text-slate-400">
            Loading verification...
          </p>
        }
      >
        <VerifyEmailContent />
      </Suspense>
    </main>
  );
}