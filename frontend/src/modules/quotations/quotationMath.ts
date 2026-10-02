const MAX = 99999999999999n;
export function cents(value: number | string): bigint {
  if (!/^\d{1,12}(\.\d{1,2})?$/.test(String(value)))
    throw new Error("Usá valores de hasta 12 enteros y 2 decimales.");
  const [integer, fraction = ""] = String(value).split(".");
  return BigInt(integer) * 100n + BigInt(fraction.padEnd(2, "0"));
}
const text = (value: bigint) =>
  `${value / 100n}.${String(value % 100n).padStart(2, "0")}`;
export function calculateAmounts(
  items: { quantity: number; unitPrice: number }[],
) {
  const lines = items.map((item) => {
    const quantity = cents(item.quantity),
      price = cents(item.unitPrice);
    if (quantity <= 0n) throw new Error("La cantidad debe ser mayor a cero.");
    const value = (quantity * price + 50n) / 100n;
    if (value > MAX)
      throw new Error("El importe supera la capacidad admitida.");
    return value;
  });
  const subtotal = lines.reduce((total, value) => total + value, 0n);
  const tax = (subtotal * 21n + 50n) / 100n;
  if (subtotal + tax > MAX)
    throw new Error("El total supera la capacidad admitida.");
  return {
    lines: lines.map((value) => Number(value) / 100),
    subtotal: text(subtotal),
    taxAmount: text(tax),
    total: text(subtotal + tax),
  };
}
