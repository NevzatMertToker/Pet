import { SUBSCRIPTION_DISCOUNT_PERCENT } from "@patipaket/shared";
import { Icon } from "./icons";
import { SpeciesArt } from "./product-art";

const POINTS = [
  "Abonelikte her teslimatta %" + SUBSCRIPTION_DISCOUNT_PERCENT + " indirim",
  "Abonelik siparişlerinde ücretsiz kargo",
  "Teslimatı atla, ertele veya tek tıkla iptal et",
];

/** Giriş ve kayıt sayfalarının ortak iki sütunlu düzeni. */
export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="container-page py-10 lg:py-16">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-[2.25rem] bg-white shadow-lift ring-1 ring-ink/5 lg:grid-cols-2">
        <div className="p-7 sm:p-10">
          <h1 className="text-3xl font-semibold">{title}</h1>
          <p className="mt-2 text-ink/60">{subtitle}</p>
          <div className="mt-7">{children}</div>
        </div>
        <div className="relative hidden bg-brand-800 p-10 text-white lg:block">
          <div className="grid grid-cols-3 gap-3">
            {(["cat", "dog", "bird"] as const).map((species) => (
              <div key={species} className="aspect-square overflow-hidden rounded-3xl ring-2 ring-white/20">
                <SpeciesArt species={species} />
              </div>
            ))}
          </div>
          <p className="mt-9 font-display text-3xl leading-tight font-semibold">
            Mama bitmeden <span className="text-accent-300">kapında.</span>
          </p>
          <ul className="mt-6 space-y-3">
            {POINTS.map((point) => (
              <li key={point} className="flex items-center gap-3 text-white/85">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/15">
                  <Icon name="check" className="h-3.5 w-3.5" />
                </span>
                {point}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
