"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-3xl rounded-lg border border-error/30 bg-error-container p-6 text-on-background shadow-surface">
      <h2 className="mb-2 text-xl font-semibold text-error">Something went wrong</h2>
      <p className="text-sm text-on-surface-variant">
        The page could not be rendered. Try again, or return to the dashboard.
      </p>
      <div className="mt-4 flex gap-3">
        <Button onClick={reset}>Try again</Button>
        <Button variant="secondary" onClick={() => router.push("/")}>
          Dashboard
        </Button>
      </div>
    </div>
  );
}
