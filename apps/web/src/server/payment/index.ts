import { randomUUID } from "node:crypto";
import { cardBrand } from "@patipaket/shared";
import { invalid } from "../errors";

/**
 * Ödeme sağlayıcısı soyutlaması.
 *
 * Abonelikli satışta kart bir kez saklanır (sağlayıcıda, jeton karşılığında) ve
 * her teslimatta bu jetonla tahsilat yapılır. Uygulama kart numarasını veya
 * güvenlik kodunu hiçbir zaman veritabanına yazmaz.
 *
 * Gerçek bir sağlayıcı (iyzico, PayTR, Param, Stripe...) eklemek için bu arayüzü
 * uygulayan bir sınıf yazıp getPaymentProvider() içinde kaydetmek yeterlidir.
 * Üretimde kart formu sağlayıcının kendi barındırdığı alanlarla (hosted fields /
 * ortak ödeme sayfası) alınmalıdır ki kart verisi sunucunuza hiç uğramasın (PCI-DSS).
 */
export interface CardDetails {
  cardHolder: string;
  cardNumber: string;
  expMonth: number;
  expYear: number;
  cvc: string;
}

export interface SavedCard {
  token: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
}

export interface ChargeRequest {
  token: string;
  /** Kuruş */
  amount: number;
  currency: "TRY";
  description: string;
  /** Aynı anahtarla gelen ikinci istek mükerrer tahsilat yapmamalıdır. */
  idempotencyKey: string;
}

export type ChargeResult = { ok: true; reference: string } | { ok: false; message: string };

export interface PaymentProvider {
  readonly name: string;
  /** Gerçek para tahsil edilmiyorsa true — arayüz "test modu" uyarısı gösterir. */
  readonly isTestMode: boolean;
  saveCard(card: CardDetails): Promise<SavedCard>;
  charge(request: ChargeRequest): Promise<ChargeResult>;
}

/**
 * Geliştirme/test sağlayıcısı: gerçek tahsilat yapmaz.
 *  - 4242 4242 4242 4242 → her zaman onaylanır
 *  - 4000 0000 0000 0002 → kart kaydedilir ama her tahsilat reddedilir
 */
export class MockPaymentProvider implements PaymentProvider {
  readonly name = "mock";
  readonly isTestMode = true;
  private readonly seenKeys = new Map<string, ChargeResult>();

  async saveCard(card: CardDetails): Promise<SavedCard> {
    const now = new Date();
    const expired =
      card.expYear < now.getFullYear() ||
      (card.expYear === now.getFullYear() && card.expMonth < now.getMonth() + 1);
    if (expired) {
      throw invalid("Kartınızın son kullanma tarihi geçmiş.", { expMonth: "Son kullanma tarihi geçmiş" });
    }
    const declines = card.cardNumber.endsWith("0002");
    return {
      token: ["mock", declines ? "decline" : "ok", randomUUID()].join("_"),
      brand: cardBrand(card.cardNumber),
      last4: card.cardNumber.slice(-4),
      expMonth: card.expMonth,
      expYear: card.expYear,
    };
  }

  async charge(request: ChargeRequest): Promise<ChargeResult> {
    const previous = this.seenKeys.get(request.idempotencyKey);
    if (previous) return previous;
    const result: ChargeResult = request.token.startsWith("mock_decline_")
      ? { ok: false, message: "Kartınız banka tarafından reddedildi. Lütfen başka bir kart deneyin." }
      : { ok: true, reference: "mockpay_" + randomUUID() };
    this.seenKeys.set(request.idempotencyKey, result);
    return result;
  }
}

let provider: PaymentProvider | undefined;

export function getPaymentProvider(): PaymentProvider {
  if (provider) return provider;
  const name = process.env.PAYMENT_PROVIDER ?? "mock";
  if (name !== "mock") {
    throw new Error('Bilinmeyen PAYMENT_PROVIDER: "' + name + '". Şu an yalnızca "mock" tanımlıdır.');
  }
  if (process.env.NODE_ENV === "production") {
    console.warn("[payment] TEST sağlayıcısı etkin: gerçek tahsilat YAPILMIYOR.");
  }
  provider = new MockPaymentProvider();
  return provider;
}

/** Testlerin sağlayıcıyı değiştirebilmesi için. */
export function setPaymentProvider(next: PaymentProvider | undefined): void {
  provider = next;
}
