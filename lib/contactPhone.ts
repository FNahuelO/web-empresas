export const CONTACT_PHONE_ERROR =
  'Ingresá un teléfono válido con código de área (ej: 11 2345-6789)';

export function isValidContactPhone(value?: string | null): boolean {
  const raw = (value || '').trim();
  if (!raw) return true;
  const digits = raw.replace(/\D/g, '');
  return /^[+\d\s().-]+$/.test(raw) && digits.length >= 8 && digits.length <= 15;
}
