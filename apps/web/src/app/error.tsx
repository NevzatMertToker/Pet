"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container-page flex flex-col items-center py-24 text-center">
      <h1 className="text-4xl font-semibold">Bir şeyler ters gitti</h1>
      <p className="mt-3 max-w-md text-ink/60">
        Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin; sorun sürerse biraz sonra yeniden uğrayın.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button type="button" className="btn btn-primary" onClick={reset}>
          Tekrar dene
        </button>
        <Link href="/" className="btn btn-outline">
          Ana sayfaya dön
        </Link>
      </div>
    </div>
  );
}
