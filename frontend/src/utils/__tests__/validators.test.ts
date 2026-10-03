import { describe, expect, it } from "vitest";
import { validators } from "../validators";

describe("Motor de validadores (Prueba de logica y validaciones)", () => {
  it("required: debe retornar error para valores vacios y null para validos", () => {
    const validate = validators.required("Campo requerido");
    expect(validate("")).toBe("Campo requerido");
    expect(validate("   ")).toBe("Campo requerido");
    expect(validate(null)).toBe("Campo requerido");
    expect(validate("Acero SAE 1045")).toBeNull();
  });

  it("email: debe validar formato de correo electronico", () => {
    const validate = validators.email("Email invalido");
    expect(validate("invalido")).toBe("Email invalido");
    expect(validate("invalido@")).toBe("Email invalido");
    expect(validate("admin@qualitytrack.com")).toBeNull();
  });

  it("cuit: debe validar exactamente 11 digitos numericos", () => {
    const validate = validators.cuit("CUIT invalido");
    expect(validate("123")).toBe("CUIT invalido");
    expect(validate("30712345678")).toBeNull();
    expect(validate("20432906505")).toBeNull();
    expect(validate("20-43290650-5")).toBeNull();
    expect(validate("123456789012")).toBe("CUIT invalido");
  });

  it("phone: debe validar caracteres permitidos y cantidad de digitos", () => {
    const validate = validators.phone();
    expect(validate("123456")).toBe("El telefono debe tener al menos 7 digitos");
    expect(validate("1234abc567")).toBe(
      'El telefono solo puede contener numeros, espacios, guiones y el prefijo "+"',
    );
    expect(validate("+54 11 4522-8900")).toBeNull();
    expect(validate("3816665544")).toBeNull();
  });

  it("alphabetic: debe aceptar solo letras y espacios", () => {
    const validate = validators.alphabetic();
    expect(validate("Rosario")).toBeNull();
    expect(validate("San Miguel de Tucuman")).toBeNull();
    expect(validate("Rosario 123")).toBe("Solo se permiten letras y espacios");
    expect(validate("Cordoba#")).toBe("Solo se permiten letras y espacios");
  });

  it("date: debe validar formato YYYY-MM-DD y fecha valida", () => {
    const validate = validators.date("Fecha invalida");
    expect(validate("")).toBeNull();
    expect(validate("2026-03-15")).toBeNull();
    expect(validate("15/03/2026")).toBe("Fecha invalida");
    expect(validate("2026-02-31")).toBe("Fecha invalida");
  });

  it("dateAfterOrEqual: debe rechazar fechas anteriores a la fecha inicial", () => {
    const start = "2026-03-10";
    const validate = validators.dateAfterOrEqual(
      () => start,
      "No puede ser anterior",
    );
    expect(validate("2026-03-10")).toBeNull();
    expect(validate("2026-03-15")).toBeNull();
    expect(validate("2026-03-05")).toBe("No puede ser anterior");
  });

  it("positiveNumber: debe aceptar numeros positivos y rechazar negativos o cero", () => {
    const validate = validators.positiveNumber("Debe ser mayor a cero");
    expect(validate(-5)).toBe("Debe ser mayor a cero");
    expect(validate(0)).toBe("Debe ser mayor a cero");
    expect(validate(25)).toBeNull();
  });
});
