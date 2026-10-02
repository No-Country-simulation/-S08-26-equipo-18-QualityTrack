import { BadRequestException } from '@nestjs/common';

const MAX_CENTS = 99999999999999n;
export function decimalCents(value: unknown): bigint {
  if (
    (typeof value !== 'number' && typeof value !== 'string') ||
    !/^\d{1,12}(\.\d{1,2})?$/.test(String(value))
  ) {
    throw new BadRequestException('Cantidad o importe inválido.');
  }
  const [integer, fraction = ''] = String(value).split('.');
  return checked(BigInt(integer) * 100n + BigInt(fraction.padEnd(2, '0')));
}
export function checked(value: bigint): bigint {
  if (value < 0n || value > MAX_CENTS)
    throw new BadRequestException('El importe supera la capacidad admitida.');
  return value;
}
export function decimalText(value: bigint): string {
  if (value < 0n) return `-${decimalText(-value)}`;
  return `${value / 100n}.${String(value % 100n).padStart(2, '0')}`;
}
// Los importes históricos se muestran tal como fueron guardados, aun si requieren corrección.
export function storedTotal(subtotal: string, taxAmount: string): string {
  const signed = (value: string) =>
    value.startsWith('-') ? -decimalCents(value.slice(1)) : decimalCents(value);
  return decimalText(signed(subtotal) + signed(taxAmount));
}
export function itemCents(quantity: unknown, price: unknown): bigint {
  return checked((decimalCents(quantity) * decimalCents(price) + 50n) / 100n);
}
