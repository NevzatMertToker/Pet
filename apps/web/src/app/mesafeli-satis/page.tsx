import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "Mesafeli Satış Sözleşmesi" };

const SECTIONS = [
  {
    heading: "Taraflar ve konu",
    body: "Bu sözleşme, satıcı ile sitemiz veya mobil uygulamamız üzerinden sipariş veren alıcı arasında, siparişe konu ürünlerin satışı ve teslimine ilişkin hak ve yükümlülükleri düzenler.",
  },
  {
    heading: "Abonelikli satış",
    body: "Abonelik seçeneğiyle alınan ürünler, alıcının seçtiği sıklıkta yeniden sipariş edilir ve tutarı her teslimat günü kayıtlı karttan tahsil edilir. Alıcı aboneliği dilediği an, herhangi bir bedel ödemeden duraklatabilir veya iptal edebilir.",
  },
  {
    heading: "Teslimat",
    body: "Ürünler, alıcının sipariş sırasında belirttiği adrese kargo ile teslim edilir. Abonelik içeren siparişlerde kargo ücreti alınmaz.",
  },
  {
    heading: "Cayma hakkı",
    body: "Alıcı, ürünü teslim aldığı tarihten itibaren 14 gün içinde cayma hakkını kullanabilir. Ambalajı açılmış ve iadesi sağlık ve hijyen açısından uygun olmayan ürünler bu hakkın kapsamı dışındadır.",
  },
];

export default function DistanceSalesPage() {
  return <LegalPage title="Mesafeli Satış Sözleşmesi" sections={SECTIONS} />;
}
