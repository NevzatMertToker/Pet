import {
  CATEGORIES,
  FREE_SHIPPING_THRESHOLD,
  SPECIES,
  SPECIES_LABELS,
  SUBSCRIPTION_DISCOUNT_PERCENT,
  formatPrice,
  productArtSvg,
  svgDataUri,
} from "@patipaket/shared";
import Link from "next/link";
import { Icon, type IconName } from "@/components/icons";
import { SpeciesArt } from "@/components/product-art";
import { ProductGrid } from "@/components/product-card";
import { productsHref } from "@/lib/routes";
import { listProducts } from "@/server/services/catalog";

const STEPS: { icon: IconName; title: string; text: string }[] = [
  {
    icon: "package",
    title: "Ürünlerini seç",
    text: "Dostunun mamasını, kumunu ve sarf malzemelerini sepete ekle. Tek seferlik ya da abonelikle al.",
  },
  {
    icon: "calendar",
    title: "Sıklığını belirle",
    text: "2 haftadan 12 haftaya kadar teslimat aralığını seç. Her ürün için ne kadar sürede bittiğini öneriyoruz.",
  },
  {
    icon: "truck",
    title: "Arkana yaslan",
    text: "Biz zamanı gelince kargoya veririz. Bitmeden kapında olur; tarih değişikliği tek dokunuş.",
  },
];

const BENEFITS: { icon: IconName; title: string; text: string }[] = [
  {
    icon: "percent",
    title: "%" + SUBSCRIPTION_DISCOUNT_PERCENT + " abonelik indirimi",
    text: "İlk sipariş dahil her teslimatta, tüm abonelik ürünlerinde.",
  },
  { icon: "truck", title: "Ücretsiz kargo", text: "Abonelik içeren her siparişte kargo bizden." },
  {
    icon: "skip",
    title: "Atla, ertele, duraklat",
    text: "Mama birikti mi? Teslimatı atla ya da tarihini değiştir.",
  },
  { icon: "shield", title: "Taahhüt yok", text: "Cayma bedeli yok. Dilediğin an tek tıkla iptal et." },
];

const FAQ = [
  {
    q: "Abonelik nasıl çalışır?",
    a: "Ürünü sepete eklerken “Düzenli gönder” seçeneğini ve teslimat sıklığını seçersiniz. İlk siparişiniz hemen hazırlanır; sonraki teslimatlar seçtiğiniz aralıkla otomatik oluşturulur ve kayıtlı kartınızdan teslimat günü tahsil edilir.",
  },
  {
    q: "İstediğim zaman iptal edebilir miyim?",
    a: "Evet. Taahhüt veya cayma bedeli yoktur. Hesabınızdaki Aboneliklerim sayfasından aboneliği duraklatabilir, bir teslimatı atlayabilir ya da tamamen iptal edebilirsiniz.",
  },
  {
    q: "Teslimat sıklığını ve tarihini sonradan değiştirebilir miyim?",
    a: "Evet. Sıklığı 2, 4, 6, 8 veya 12 hafta olarak değiştirebilir, bir sonraki teslimat tarihini ileri ya da geri alabilir, acil durumda “Hemen gönder” ile beklemeden sipariş oluşturabilirsiniz.",
  },
  {
    q: "Kargo ücreti ne kadar?",
    a:
      "Abonelik ürünü içeren tüm siparişlerde kargo ücretsizdir. Yalnızca tek seferlik ürünlerden oluşan siparişlerde " +
      formatPrice(FREE_SHIPPING_THRESHOLD) +
      " ve üzeri kargo ücretsizdir.",
  },
  {
    q: "Ödeme ne zaman alınır?",
    a: "İlk siparişin tutarı sipariş anında, sonraki teslimatların tutarı ise her teslimatın oluşturulduğu gün kayıtlı kartınızdan alınır. Ürün fiyatı değişirse o günkü güncel fiyat üzerinden indirim uygulanır.",
  },
];

const HERO_ART = [
  { species: "dog", type: "food", seed: "hero-dog", className: "left-0 top-10 w-[46%] -rotate-[9deg]" },
  { species: "bird", type: "food", seed: "hero-bird-2", className: "right-0 top-4 w-[44%] rotate-[8deg]" },
  { species: "cat", type: "litter", seed: "hero-cat", className: "left-[24%] top-[26%] w-[52%] rotate-[1deg] z-10" },
] as const;

export default async function HomePage() {
  const featured = await listProducts({ featured: true });

  return (
    <>
      {/* ------------------------------------------------------------ hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-40 -right-32 h-[520px] w-[520px] rounded-full bg-accent-100/70 blur-3xl" />
        <div className="pointer-events-none absolute top-40 -left-40 h-[420px] w-[420px] rounded-full bg-brand-100/70 blur-3xl" />

        <div className="container-page relative grid items-center gap-10 pt-12 pb-16 lg:grid-cols-[1.05fr_1fr] lg:pt-20 lg:pb-24">
          <div>
            <span className="badge badge-brand px-3 py-1.5 text-[13px]">
              <Icon name="repeat" className="h-4 w-4" />
              Kedi · Köpek · Kuş için abonelikli alışveriş
            </span>
            <h1 className="mt-5 text-[2.6rem] leading-[1.05] font-semibold text-ink sm:text-6xl">
              Mama bitmeden <span className="text-brand-600">kapında.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink/70">
              Mamayı, kumu ve sarf malzemelerini bir kez seç; biz senin belirlediğin sıklıkta getirelim. Abonelikte her
              teslimatta <strong className="font-semibold text-ink">%{SUBSCRIPTION_DISCOUNT_PERCENT} indirim</strong> ve{" "}
              <strong className="font-semibold text-ink">ücretsiz kargo</strong>.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/urunler" className="btn btn-lg btn-primary">
                Ürünleri keşfet
                <Icon name="arrow-right" className="h-5 w-5" />
              </Link>
              <Link href="/#nasil-calisir" className="btn btn-lg btn-outline">
                Nasıl çalışır?
              </Link>
            </div>

            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-ink/70">
              {["Taahhüt yok", "Dilediğinde atla veya iptal et", "Ücretsiz kargo"].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-brand-600 text-white">
                    <Icon name="check" className="h-3 w-3" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative mx-auto aspect-square w-full max-w-[520px]" aria-hidden="true">
            {HERO_ART.map((art) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={art.seed}
                src={svgDataUri(productArtSvg(art))}
                alt=""
                className={"absolute aspect-square rounded-[2rem] shadow-lift ring-4 ring-white " + art.className}
              />
            ))}
            <div className="absolute bottom-[6%] left-0 z-20 flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-lift">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-100 text-brand-700">
                <Icon name="calendar" />
              </span>
              <div>
                <p className="text-xs font-medium text-ink/50">Sonraki teslimat</p>
                <p className="text-sm font-bold text-ink">4 haftada bir · Salı</p>
              </div>
            </div>
            <div className="absolute right-0 bottom-[20%] z-20 rounded-2xl bg-ink px-4 py-3 text-white shadow-lift">
              <p className="text-xs font-medium text-white/60">Abonelik fiyatı</p>
              <p className="font-display text-xl font-semibold text-accent-300">−%{SUBSCRIPTION_DISCOUNT_PERCENT}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------ kategoriler */}
      <section className="container-page">
        <div className="grid gap-5 md:grid-cols-3">
          {SPECIES.map((species) => (
            <div key={species} className="card group overflow-hidden">
              <Link href={productsHref({ species })} className="block aspect-[5/3] overflow-hidden" tabIndex={-1}>
                <SpeciesArt species={species} className="transition duration-500 group-hover:scale-105" />
              </Link>
              <div className="p-5">
                <Link href={productsHref({ species })} className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold">{SPECIES_LABELS[species]}</h2>
                  <Icon name="arrow-right" className="h-5 w-5 text-brand-600 transition group-hover:translate-x-1" />
                </Link>
                <div className="mt-3 flex flex-wrap gap-2">
                  {CATEGORIES.filter((category) => category.species === species).map((category) => (
                    <Link
                      key={category.label}
                      href={productsHref({ species, type: category.type })}
                      className="rounded-full bg-sand px-3 py-1.5 text-[13px] font-semibold text-ink/75 transition hover:bg-brand-100 hover:text-brand-800"
                    >
                      {category.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------- nasıl çalışır */}
      <section id="nasil-calisir" className="container-page scroll-mt-28 pt-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-bold tracking-[0.12em] text-brand-600 uppercase">Nasıl çalışır?</p>
          <h2 className="section-title mt-2">Üç adımda kur, bir daha düşünme</h2>
        </div>
        <ol className="mt-10 grid gap-5 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.title} className="card relative p-7">
              <span className="absolute top-6 right-7 font-display text-5xl font-semibold text-brand-100">
                {index + 1}
              </span>
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-600 text-white">
                <Icon name={step.icon} className="h-6 w-6" />
              </span>
              <h3 className="mt-5 text-xl font-semibold">{step.title}</h3>
              <p className="mt-2 leading-relaxed text-ink/65">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* -------------------------------------------------- öne çıkanlar */}
      {featured.length > 0 && (
        <section className="container-page pt-24">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-bold tracking-[0.12em] text-brand-600 uppercase">Çok tercih edilenler</p>
              <h2 className="section-title mt-2">Abonelerin favorileri</h2>
            </div>
            <Link href="/urunler" className="btn btn-outline hidden sm:inline-flex">
              Tümünü gör
              <Icon name="arrow-right" className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-8">
            <ProductGrid products={featured.slice(0, 8)} />
          </div>
          <Link href="/urunler" className="btn btn-outline mt-6 w-full sm:hidden">
            Tümünü gör
          </Link>
        </section>
      )}

      {/* ---------------------------------------------------- avantajlar */}
      <section className="container-page pt-24">
        <div className="relative overflow-hidden rounded-[2.25rem] bg-brand-800 px-6 py-12 text-white sm:px-12 sm:py-14">
          <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-brand-600/50 blur-2xl" />
          <div className="relative">
            <h2 className="max-w-xl text-3xl font-semibold sm:text-4xl">Abonelik, hem senin hem dostunun işine gelir</h2>
            <ul className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {BENEFITS.map((benefit) => (
                <li key={benefit.title}>
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/12 text-accent-300">
                    <Icon name={benefit.icon} />
                  </span>
                  <p className="mt-4 font-display text-lg font-semibold">{benefit.title}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-white/70">{benefit.text}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ SSS */}
      <section id="sss" className="container-page scroll-mt-28 pt-24">
        <div className="mx-auto max-w-3xl">
          <h2 className="section-title text-center">Sık sorulan sorular</h2>
          <div className="mt-8 space-y-3">
            {FAQ.map((item) => (
              <details key={item.q} className="card group px-6 py-1 open:shadow-lift">
                <summary className="flex list-none items-center justify-between gap-4 py-4 font-semibold text-ink [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <Icon name="chevron-down" className="h-5 w-5 text-ink/40 transition group-open:rotate-180" />
                </summary>
                <p className="pb-5 leading-relaxed text-ink/70">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ CTA */}
      <section className="container-page pt-24">
        <div className="card flex flex-col items-center gap-5 bg-gradient-to-br from-accent-50 to-white px-6 py-12 text-center">
          <h2 className="section-title max-w-lg">Bir daha “mama bitmiş” demeyin</h2>
          <p className="max-w-md text-ink/65">İlk teslimatınızı bugün oluşturun; indirimi ilk siparişten itibaren kazanın.</p>
          <Link href="/urunler" className="btn btn-lg btn-accent">
            Aboneliğini oluştur
            <Icon name="arrow-right" className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </>
  );
}
