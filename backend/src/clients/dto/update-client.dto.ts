import { PartialType } from "@nestjs/swagger";
import { CreateClientDto } from "./create-client.dto";

// Todos los campos opcionales: la ficha se completa de a partes sin reenviar el resto.
// undefined conserva el valor; null solo pasa los IsOptional de columnas anulables.
export class UpdateClientDto extends PartialType(CreateClientDto, { skipNullProperties: false }) {}
