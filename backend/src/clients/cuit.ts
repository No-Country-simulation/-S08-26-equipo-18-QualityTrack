import { registerDecorator, ValidationOptions } from "class-validator";

const CHECK_DIGIT_WEIGHTS = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];

export function onlyDigits(value: string): string {
    return value.replace(/\D/g, "");
}

// Módulo 11 sobre los diez primeros dígitos. Cuando el cálculo da 10 el número no
// existe: AFIP no asigna ese verificador, cambia el prefijo. Varias implementaciones
// dan por válido un 9 en ese caso y aceptan CUIT inexistentes; acá se rechaza.
export function isValidCuit(value: string): boolean {
    const digits = onlyDigits(value);
    if (digits.length !== 11) {
        return false;
    }

    const sum = CHECK_DIGIT_WEIGHTS.reduce((acc, weight, index) => acc + weight * Number(digits[index]), 0);
    const remainder = 11 - (sum % 11);
    if (remainder === 10) {
        return false;
    }

    const checkDigit = remainder === 11 ? 0 : remainder;
    return checkDigit === Number(digits[10]);
}

export function IsCuit(validationOptions?: ValidationOptions) {
    return function (object: object, propertyName: string) {
        registerDecorator({
            name: "isCuit",
            target: object.constructor,
            propertyName,
            options: validationOptions,
            validator: {
                validate(value: unknown) {
                    return typeof value === "string" && isValidCuit(value);
                },
                defaultMessage() {
                    return "El CUIT no es válido: revisá los once dígitos.";
                },
            },
        });
    };
}
