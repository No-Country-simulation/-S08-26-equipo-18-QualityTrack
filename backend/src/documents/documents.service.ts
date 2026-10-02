import {
  Injectable,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { LockMode, type FilterQuery } from '@mikro-orm/core';
import { Document } from '../entities/Document';
import { DocumentType } from '../entities/DocumentType';
import { WorkOrder } from '../entities/WorkOrder';
import { Request } from '../entities/Request';
import { Quotation } from '../entities/Quotation';
import { User } from '../entities/User';
import { hasPermission } from '../auth/permissions';
import {
  DocumentStorage,
  managedKey,
  type UploadedDocumentFile,
} from './document-storage';
import { UploadDocumentDto } from './documents.dto';
const response = (d: Document) => ({
  id: d.id,
  workOrderId: d.workOrder?.id ?? null,
  requestId: d.request?.id ?? null,
  quotationId: d.quotation?.id ?? null,
  documentTypeId: d.documentType.id,
  documentType: {
    id: d.documentType.id,
    name: d.documentType.name,
    description: d.documentType.description ?? null,
  },
  fileName: d.fileName,
  mimeType: d.mimeType,
  fileSize: d.fileSize,
  version: d.version,
  uploadedById: d.uploadedBy.id,
  uploadedBy: {
    id: d.uploadedBy.id,
    firstName: d.uploadedBy.firstName,
    lastName: d.uploadedBy.lastName,
  },
  uploadedAt: d.uploadedAt.toISOString(),
  description: d.description ?? null,
  downloadAvailable: managedKey(d.storagePath, d.sha256),
});
@Injectable()
export class DocumentsService {
  constructor(
    private readonly em: EntityManager,
    private readonly storage: DocumentStorage,
  ) {}
  config() {
    return this.storage.config;
  }
  async types() {
    return (
      await this.em.find(DocumentType, {}, { orderBy: { name: 'asc' } })
    ).map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description ?? null,
    }));
  }
  private id(id: number) {
    if (!Number.isInteger(id) || id < 1 || id > 2147483647)
      throw new BadRequestException('ID inválido.');
  }
  private async entity<T extends WorkOrder | Request | Quotation>(
    em: EntityManager,
    klass: new () => T,
    id: number,
    lock = false,
  ): Promise<T> {
    this.id(id);
    const item = await em.findOne(
      klass,
      { id } as FilterQuery<T>,
      lock ? { lockMode: LockMode.PESSIMISTIC_WRITE, refresh: true } : {},
    );
    if (!item)
      throw new NotFoundException('El origen del documento no existe.');
    return item as T;
  }
  private async canRead(
    em: EntityManager,
    u: User,
    d: Pick<Document, 'workOrder' | 'request' | 'quotation'>,
  ) {
    if (
      !d.workOrder &&
      !d.request &&
      !d.quotation &&
      hasPermission(u.role.name, 'users:manage')
    )
      return true;
    if (d.workOrder && hasPermission(u.role.name, 'workOrders:view'))
      return true;
    if (d.request && hasPermission(u.role.name, 'requests:view')) return true;
    if (d.quotation && hasPermission(u.role.name, 'quotations:view'))
      return true;
    if (hasPermission(u.role.name, 'workOrders:view')) {
      if (
        d.quotation &&
        (await em.count(WorkOrder, { quotation: d.quotation.id }))
      )
        return true;
      if (
        d.request &&
        (await em.count(WorkOrder, { quotation: { request: d.request.id } }))
      )
        return true;
    }
    return false;
  }
  private async permitted(
    em: EntityManager,
    u: User,
    d: Pick<Document, 'workOrder' | 'request' | 'quotation'>,
  ) {
    if (!(await this.canRead(em, u, d)))
      throw new ForbiddenException(
        'El rol no permite acceder a este expediente.',
      );
  }
  private async rows(filter: FilterQuery<Document>) {
    return this.em.find(Document, filter, {
      populate: ['documentType', 'uploadedBy'],
      orderBy: { uploadedAt: 'desc', id: 'desc' },
    });
  }
  async list(user: User) {
    const docs = await this.rows({});
    const visible: Document[] = [];
    for (const d of docs)
      if (await this.canRead(this.em, user, d)) visible.push(d);
    return visible.map(response);
  }
  async get(id: number, user: User) {
    this.id(id);
    const d = await this.em.findOne(
      Document,
      { id },
      { populate: ['documentType', 'uploadedBy'] },
    );
    if (!d) throw new NotFoundException('El documento no existe.');
    await this.permitted(this.em, user, d);
    return d;
  }
  async metadata(id: number, user: User) {
    return response(await this.get(id, user));
  }
  async forOrder(id: number, user: User) {
    if (!hasPermission(user.role.name, 'workOrders:view'))
      throw new ForbiddenException(
        'El rol no permite consultar el expediente de OT.',
      );
    const wo = await this.entity(this.em, WorkOrder, id);
    await this.em.populate(wo, ['quotation.request']);
    const quotationId = wo.quotation?.id,
      requestId = wo.quotation?.request.id;
    const docs = await this.rows({
      $or: [
        { workOrder: id },
        ...(quotationId ? [{ quotation: quotationId }] : []),
        ...(requestId ? [{ request: requestId }] : []),
      ],
    });
    // A document explicitly attached to another OT is never inherited by this one.
    return docs
      .filter(
        (d) =>
          (!d.workOrder || d.workOrder.id === id) &&
          (!d.quotation || d.quotation.id === quotationId) &&
          (!d.request || d.request.id === requestId),
      )
      .map(response);
  }
  async forRequest(id: number, user: User) {
    const request = await this.entity(this.em, Request, id);
    await this.permitted(this.em, user, { request });
    const docs = await this.rows({ request: id, workOrder: null });
    return docs.map(response);
  }
  async forQuotation(id: number, user: User) {
    const quotation = await this.entity(this.em, Quotation, id);
    await this.permitted(this.em, user, { quotation });
    return (await this.rows({ quotation: id, workOrder: null })).map(response);
  }
  async upload(
    dto: UploadDocumentDto,
    file: UploadedDocumentFile | undefined,
    actorId: number,
  ) {
    if (!dto.workOrderId && !dto.requestId && !dto.quotationId)
      throw new BadRequestException(
        'Vinculá el documento a una OT, solicitud o cotización.',
      );
    const prepared = this.storage.prepare(file);
    let saved = false;
    try {
      return await this.em.transactional(
        async (em) => {
          const user = await em.findOne(
            User,
            { id: actorId },
            { populate: ['role'] },
          );
          if (!user?.isActive)
            throw new ForbiddenException(
              'El rol no permite adjuntar documentos.',
            );
          if (
            (dto.workOrderId &&
              !hasPermission(user.role.name, 'workOrders:edit')) ||
            (dto.requestId &&
              !hasPermission(user.role.name, 'requests:edit')) ||
            (dto.quotationId &&
              !hasPermission(user.role.name, 'quotations:edit'))
          )
            throw new ForbiddenException(
              'Para adjuntar documentos necesitás editar cada origen indicado.',
            );
          const d = new Document();
          if (dto.workOrderId) {
            d.workOrder = await this.entity(
              em,
              WorkOrder,
              dto.workOrderId,
              true,
            );
            await em.populate(d.workOrder, ['quotation.request']);
          }
          if (dto.quotationId) {
            d.quotation = await this.entity(em, Quotation, dto.quotationId);
            await em.populate(d.quotation, ['request']);
          }
          if (dto.requestId)
            d.request = await this.entity(em, Request, dto.requestId);
          if (d.workOrder && (d.request || d.quotation)) {
            const quote = d.workOrder.quotation;
            if (
              !quote ||
              (d.quotation && d.quotation.id !== quote.id) ||
              (d.request && d.request.id !== quote.request.id)
            )
              throw new ConflictException(
                'Los vínculos del documento pertenecen a expedientes distintos.',
              );
          }
          if (
            d.request &&
            d.quotation &&
            d.request.id !== d.quotation.request.id
          )
            throw new ConflictException(
              'La solicitud no corresponde a la cotización.',
            );
          await this.permitted(em, user, d);
          d.documentType = await em.findOneOrFail(
            DocumentType,
            { id: dto.documentTypeId },
            {
              failHandler: () =>
                new NotFoundException('El tipo de documento no existe.'),
            },
          );
          d.uploadedBy = user;
          d.description = dto.description || null;
          const { buffer, ...metadata } = prepared;
          Object.assign(d, metadata);
          await this.storage.save(d.storagePath, buffer);
          saved = true;
          await em.persist(d).flush();
          return response(d);
        },
        { clear: true },
      );
    } catch (error) {
      if (saved) await this.storage.discard(prepared.storagePath);
      throw error;
    }
  }
  async download(id: number, user: User) {
    const d = await this.get(id, user);
    const bytes = await this.storage.read(d.storagePath, d.sha256, d.fileSize);
    return new StreamableFile(bytes, {
      type: d.mimeType,
      length: bytes.length,
      disposition: `attachment; filename="document-${d.id}${d.fileName.match(/\.[a-z0-9]+$/i)?.[0] ?? ''}"; filename*=UTF-8''${encodeURIComponent(d.fileName).replace(/['()*]/g, (c) => `%${c.charCodeAt(0).toString(16)}`)}`,
    });
  }
}
