"use client";

import { ApiError, errorMessage } from "@patipaket/shared";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { api } from "@/lib/api";
import { Notice, TextField } from "./ui";

export function AuthForm({ mode, redirectTo }: { mode: "login" | "register"; redirectTo: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const isRegister = mode === "register";
  const otherHref = (isRegister ? "/giris" : "/kayit") + "?sonra=" + encodeURIComponent(redirectTo);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "");
    const password = String(data.get("password") ?? "");
    setPending(true);
    setError(null);
    setFields({});
    try {
      if (isRegister) {
        await api.auth.register({ name: String(data.get("name") ?? ""), email, password });
      } else {
        await api.auth.login({ email, password });
      }
      // Sunucu bileşenleri (üst menü vb.) yeni oturumla yeniden çizilsin.
      router.replace(redirectTo);
      router.refresh();
    } catch (caught) {
      setError(errorMessage(caught));
      if (caught instanceof ApiError) setFields(caught.fields);
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {error && <Notice tone="error">{error}</Notice>}
      {isRegister && (
        <TextField label="Ad soyad" name="name" autoComplete="name" error={fields.name} required autoFocus />
      )}
      <TextField
        label="E-posta"
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        error={fields.email}
        required
        autoFocus={!isRegister}
      />
      <TextField
        label="Şifre"
        name="password"
        type="password"
        autoComplete={isRegister ? "new-password" : "current-password"}
        hint={isRegister ? "En az 8 karakter" : undefined}
        error={fields.password}
        required
      />
      <button type="submit" className="btn btn-lg btn-primary w-full" disabled={pending}>
        {pending ? "Lütfen bekleyin…" : isRegister ? "Hesap oluştur" : "Giriş yap"}
      </button>
      <p className="text-center text-sm text-ink/60">
        {isRegister ? "Zaten hesabınız var mı? " : "Henüz hesabınız yok mu? "}
        <Link href={otherHref} className="link">
          {isRegister ? "Giriş yapın" : "Hemen oluşturun"}
        </Link>
      </p>
    </form>
  );
}
