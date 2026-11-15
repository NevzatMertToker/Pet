import { Notice } from "./ui";

/**
 * Yasal metin sayfalarının ortak düzeni. Metinlerin kendisi işletmenize özeldir;
 * yayına almadan önce bir hukuk danışmanına hazırlatıp buraya yerleştirin.
 */
export function LegalPage({ title, sections }: { title: string; sections: { heading: string; body: string }[] }) {
  return (
    <div className="container-page py-12">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-4xl font-semibold">{title}</h1>
        <Notice tone="warn" className="mt-6">
          Bu sayfa bir <strong>taslak şablondur</strong>. Yayına almadan önce şirket bilgilerinizle ve hukuk
          danışmanınızın hazırlayacağı nihai metinle değiştirin.
        </Notice>
        <div className="mt-8 space-y-8">
          {sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-xl font-semibold">{section.heading}</h2>
              <p className="mt-2 leading-relaxed text-ink/70">{section.body}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
