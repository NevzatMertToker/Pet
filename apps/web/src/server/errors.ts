/** Servis katmanının fırlattığı, HTTP yanıtına çevrilebilen hata. */
export class HttpError extends Error {
  status: number;
  code: string;
  fields: Record<string, string>;

  constructor(status: number, code: string, message: string, fields: Record<string, string> = {}) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

export const badRequest = (message: string, fields?: Record<string, string>) =>
  new HttpError(400, "bad_request", message, fields);
export const invalid = (message: string, fields?: Record<string, string>) =>
  new HttpError(422, "validation_error", message, fields);
export const unauthorized = (message = "Bu işlem için giriş yapmalısınız.") =>
  new HttpError(401, "unauthorized", message);
export const forbidden = (message = "Bu işlem için yetkiniz yok.") => new HttpError(403, "forbidden", message);
export const notFound = (message = "Aradığınız kayıt bulunamadı.") => new HttpError(404, "not_found", message);
export const conflict = (message: string, code = "conflict") => new HttpError(409, code, message);
export const paymentFailed = (message: string) => new HttpError(402, "payment_failed", message);
export const tooManyRequests = (
  message = "Çok fazla deneme yaptınız. Lütfen birkaç dakika sonra tekrar deneyin.",
) => new HttpError(429, "too_many_requests", message);
