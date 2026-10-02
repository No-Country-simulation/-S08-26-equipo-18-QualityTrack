import { registerDecorator, ValidationOptions } from 'class-validator';

// bcrypt only processes the first 72 UTF-8 bytes. Never accept a truncated credential.
export function isSupportedPassword(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    Buffer.byteLength(value, 'utf8') <= 72
  );
}

export function IsSupportedPassword(
  options?: ValidationOptions,
): PropertyDecorator {
  return (target, propertyKey) =>
    registerDecorator({
      name: 'isSupportedPassword',
      target: target.constructor,
      propertyName: String(propertyKey),
      options,
      validator: {
        validate: isSupportedPassword,
        defaultMessage: () =>
          'La contraseña es obligatoria y no puede superar los 72 bytes UTF-8.',
      },
    });
}
