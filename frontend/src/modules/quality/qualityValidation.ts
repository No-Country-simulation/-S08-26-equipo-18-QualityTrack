export const validQualityDecimal = (value: string) =>
  !value.trim() || /^-?\d{1,10}(\.\d{1,4})?$/.test(value.trim());
export const qualityDecimalError = (value: string) =>
  validQualityDecimal(value)
    ? null
    : "Hasta 10 enteros y 4 decimales, sin exponentes ni tolerancias textuales.";
export const businessDateInput = (value?: string | null) =>
  !value
    ? ""
    : /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? value
      : new Intl.DateTimeFormat("en-CA", {
          timeZone: "America/Buenos_Aires",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(new Date(value));
