import { formatPrice } from "@patipaket/shared";
import Link from "next/link";
import { Icon, type IconName } from "@/components/icons";
import { Notice } from "@/components/ui";
import { getAdminStats } from "@/server/services/admin";
import { runRenewalsAction } from "./actions";

function Stat({ icon, label, value, hint }: { icon: IconName; label: string; value: string; hint?: string }) {
  return (
    <div className="card p-5">
      <span className="grid h-10 w-10 place-items-center rounded-2xl bg-brand-50 text-brand-700">
        <Icon name={icon} />
      </span>
      <p className="mt-4 text-sm font-medium text-ink/55">{label}</p>
      <p className="font-display text-3xl font-semibold">{value}</p>
      {hint && <p className="mt-1 text-[13px] text-ink/50">{hint}</p>}
    </div>
  );
}

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const stats = await getAdminStats();

  return (
    <div className="space-y-8">
      {query.calisti && (
        <Notice tone="success">
          Yenileme görevi çalıştı: {String(query.yenilenen ?? 0)} teslimat oluşturuldu, {String(query.basarisiz ?? 0)}{" "}
          ödeme alınamadı, {String(query.ertelenen ?? 0)} teslimat stok nedeniyle ertelendi.
        </Notice>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          icon="repeat"
          label="Aktif abonelik"
          value={String(stats.activeSubscriptions)}
          hint={stats.pausedSubscriptions + " duraklatılmış"}
        />
        <Stat
          icon="calendar"
          label="7 gün içinde yenilenecek"
          value={String(stats.renewalsNext7Days)}
          hint="Stok planlaması için"
        />
        <Stat icon="package" label="Hazırlanacak sipariş" value={String(stats.ordersToFulfil)} hint="Ödemesi alınmış" />
        <Stat
          icon="chart"
          label="Son 30 gün ciro"
          value={formatPrice(stats.revenueLast30Days)}
          hint={stats.ordersLast30Days + " sipariş · " + stats.customers + " müşteri"}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
        <section className="card p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Stoku azalan ürünler</h2>
            <Link href="/yonetim/urunler" className="link text-sm">
              Tüm ürünler
            </Link>
          </div>
          {stats.lowStock.length > 0 ? (
            <ul className="mt-3 divide-y divide-ink/[0.07]">
              {stats.lowStock.map((product) => (
                <li key={product.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <Link href={"/yonetim/urunler/" + product.id} className="min-w-0 hover:underline">
                    <span className="block truncate font-semibold">
                      {product.brand} {product.name}
                    </span>
                    <span className="text-ink/55">{product.packageSize}</span>
                  </Link>
                  <span className={"badge " + (product.stock === 0 ? "badge-danger" : "badge-warn")}>
                    {product.stock === 0 ? "Tükendi" : product.stock + " adet"}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-ink/60">Stoku kritik seviyede ürün yok.</p>
          )}
        </section>

        <section className="card p-5 sm:p-6">
          <h2 className="text-lg font-semibold">Abonelik yenilemeleri</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink/65">
            Teslimat günü gelen abonelikler zamanlanmış görevle her gün otomatik işlenir. Gerekirse buradan elle de
            çalıştırabilirsiniz; aynı gün tekrar çalıştırmak mükerrer tahsilat yapmaz.
          </p>
          <form action={runRenewalsAction} className="mt-4">
            <button type="submit" className="btn btn-primary">
              <Icon name="zap" className="h-4 w-4" />
              Yenilemeleri şimdi çalıştır
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
