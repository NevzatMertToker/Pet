import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "Gizlilik ve KVKK" };

const SECTIONS = [
  {
    heading: "Topladığımız veriler",
    body: "Hesap oluştururken ad soyad ve e-posta adresinizi; sipariş verirken teslimat adresinizi ve telefon numaranızı alırız. İsteğe bağlı olarak evcil hayvanınızın adı, türü ve kilosu gibi bilgileri ekleyebilirsiniz.",
  },
  {
    heading: "Ödeme bilgileri",
    body: "Kart numaranız ve güvenlik kodunuz sunucularımızda saklanmaz. Kartınız, anlaşmalı ödeme kuruluşunda saklanır; bizde yalnızca kartın markası, son dört hanesi ve ödeme kuruluşunun verdiği anahtar tutulur.",
  },
  {
    heading: "Verilerin kullanım amacı",
    body: "Verileriniz siparişlerinizi hazırlamak ve teslim etmek, abonelik teslimatlarınızı oluşturmak, ödemeleri almak ve sizi siparişleriniz hakkında bilgilendirmek için işlenir.",
  },
  {
    heading: "Haklarınız",
    body: "6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında verilerinize erişme, düzeltilmesini veya silinmesini isteme haklarına sahipsiniz. Taleplerinizi bize iletebilirsiniz.",
  },
];

export default function PrivacyPage() {
  return <LegalPage title="Gizlilik ve KVKK Aydınlatma Metni" sections={SECTIONS} />;
}
