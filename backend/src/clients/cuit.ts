import { registerDecorator, ValidationOptions } from "class-validator";

export function onlyDigits(value: string): string {
    return value.replace(/\D/g, "");
}

// Validación de CUIT: exactamente 11 dígitos numéricos
export function isValidCuit(value: string): boolean {
    const digits = onlyDigits(value);
    return digits.length === 11;
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
                    return "El CUIT debe tener exactamente 11 dígitos numéricos.";
                },
            },
        });
    };
}
