import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { DocumentStorage, documentConfig } from './document-storage';
import { DocumentAccessGuard } from './document-access.guard';
@Module({
  imports: [
    MulterModule.registerAsync({
      useFactory: () => ({
        limits: {
          fileSize: documentConfig().maxFileSize,
          files: 1,
          fields: 5,
          parts: 6,
          fieldSize: 20000,
        },
      }),
    }),
  ],
  controllers: [DocumentsController],
  providers: [DocumentsService, DocumentStorage, DocumentAccessGuard],
})
export class DocumentsModule {}
