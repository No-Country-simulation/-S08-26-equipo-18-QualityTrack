import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { randomUUID, createHash } from 'node:crypto';
import { constants } from 'node:fs';
import { mkdir, writeFile, unlink, open } from 'node:fs/promises';
import { resolve, basename, extname, join } from 'node:path';

const SUPPORTED = ['pdf', 'png', 'jpg', 'jpeg', 'txt', 'csv'];
export function documentConfig() {
  const maxFileSize = Number(
    process.env.DOCUMENT_MAX_FILE_BYTES ?? 10 * 1024 * 1024,
  );
  if (
    !Number.isInteger(maxFileSize) ||
    maxFileSize < 1 ||
    maxFileSize > 100 * 1024 * 1024
  )
    throw new Error(
      'DOCUMENT_MAX_FILE_BYTES debe estar entre 1 y 104857600 (almacenamiento con buffer limitado).',
    );
  const allowedExtensions = [
    ...new Set(
      (process.env.DOCUMENT_ALLOWED_EXTENSIONS ?? SUPPORTED.join(','))
        .split(',')
        .map((v) => v.trim().toLowerCase()),
    ),
  ];
  if (
    !allowedExtensions.length ||
    allowedExtensions.some((v) => !SUPPORTED.includes(v))
  )
    throw new Error(
      'DOCUMENT_ALLOWED_EXTENSIONS admite pdf,png,jpg,jpeg,txt,csv.',
    );
  return { maxFileSize, allowedExtensions };
}
export interface UploadedDocumentFile {
  originalname: string;
  buffer: Buffer;
  size: number;
  mimetype: string;
}
const hash = (bytes: Buffer) =>
  createHash('sha256').update(bytes).digest('hex');
export const managedKey = (key: string, sha?: string | null) =>
  /^[a-f0-9-]{36}\.(pdf|png|jpg|jpeg|txt|csv)$/.test(key) &&
  typeof sha === 'string' &&
  /^[a-f0-9]{64}$/.test(sha);
@Injectable()
export class DocumentStorage {
  private readonly directory = resolve(
    process.env.DOCUMENT_STORAGE_DIR ||
      join(process.cwd(), 'uploads', 'documents'),
  );
  readonly config = documentConfig();
  prepare(file?: UploadedDocumentFile) {
    if (!file?.buffer?.length)
      throw new BadRequestException('Seleccioná un archivo no vacío.');
    if (file.buffer.length > this.config.maxFileSize)
      throw new BadRequestException('El archivo supera el tamaño configurado.');
    let original = file.originalname;
    // Multipart filenames may arrive as Latin-1. Preserve valid UTF-8 names.
    try {
      original = new TextDecoder('utf-8', { fatal: true }).decode(
        Buffer.from(original, 'latin1'),
      );
    } catch {}
    const fileName = basename(original.replaceAll('\\', '/'))
      .replace(/[\u0000-\u001f\u007f]/g, '')
      .normalize('NFC')
      .trim();
    if (!fileName || fileName.length > 500)
      throw new BadRequestException(
        'Nombre de archivo inválido o mayor a 500 caracteres.',
      );
    const extension = extname(fileName).slice(1).toLowerCase();
    if (!this.config.allowedExtensions.includes(extension))
      throw new BadRequestException(
        'Formato no admitido por la configuración de documentos.',
      );
    const b = file.buffer;
    let mimeType: string;
    if (extension === 'pdf' && b.subarray(0, 5).toString('ascii') === '%PDF-')
      mimeType = 'application/pdf';
    else if (
      extension === 'png' &&
      b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    )
      mimeType = 'image/png';
    else if (
      ['jpg', 'jpeg'].includes(extension) &&
      b.length >= 3 &&
      b[0] === 255 &&
      b[1] === 216 &&
      b[2] === 255
    )
      mimeType = 'image/jpeg';
    else if (['txt', 'csv'].includes(extension)) {
      try {
        const text = new TextDecoder('utf-8', { fatal: true }).decode(b);
        if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(text))
          throw Error();
      } catch {
        throw new BadRequestException(
          'El archivo de texto debe contener UTF-8 válido.',
        );
      }
      mimeType = extension === 'csv' ? 'text/csv' : 'text/plain';
    } else
      throw new BadRequestException(
        'El contenido del archivo no coincide con su formato.',
      );
    return {
      fileName,
      mimeType,
      fileSize: b.length,
      sha256: hash(b),
      storagePath: `${randomUUID()}.${extension}`,
      buffer: b,
    };
  }
  async save(key: string, bytes: Buffer) {
    await mkdir(this.directory, { recursive: true, mode: 0o700 });
    await writeFile(join(this.directory, key), bytes, {
      flag: 'wx',
      mode: 0o600,
    });
  }
  async discard(key: string) {
    await unlink(join(this.directory, key));
  }
  async read(key: string, sha: string | null | undefined, size: number) {
    if (!managedKey(key, sha))
      throw new ConflictException(
        'El archivo histórico no está disponible en el almacenamiento gestionado.',
      );
    let file;
    try {
      file = await open(
        join(this.directory, key),
        constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0),
      );
    } catch (error) {
      if (
        ['ENOENT', 'ENOTDIR', 'ELOOP'].includes(
          (error as NodeJS.ErrnoException).code ?? '',
        )
      )
        throw new NotFoundException(
          'El archivo no está disponible en el almacenamiento.',
        );
      throw error;
    }
    try {
      const stat = await file.stat();
      if (!stat.isFile() || stat.size !== size || size > 100 * 1024 * 1024)
        throw new ConflictException(
          'El archivo no coincide con la evidencia registrada.',
        );
      const bytes = await file.readFile();
      if (hash(bytes) !== sha)
        throw new ConflictException(
          'El contenido del archivo no coincide con la evidencia registrada.',
        );
      return bytes;
    } finally {
      await file.close();
    }
  }
}
