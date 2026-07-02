/* eslint-disable max-statements */
import { BaseFile, FileContentLoader } from '#api/core/domain/files/BaseFile.js';
import { PDFDocument } from '#api/core/domain/files/PDFDocument.js';
import { FileAttachment } from '#api/core/domain/files/FileAttachment.js';
import { URLAttachment } from '#api/core/domain/files/URLAttachment.js';
import { Thumbnail } from '#api/core/domain/files/Thumbnail.js';
import { CustomUpload } from '#api/core/domain/files/CustomUpload.js';
import { LanguageUtils } from '#shared/language/index.js';
import type { FilesRow } from './PostgresFilesRow.js';

export class PostgresFilesMapper {
  private static baseFields(row: Omit<FilesRow, 'tenant_id'>) {
    return {
      id: row._id,
      originalname: row.originalname,
      filename: row.filename,
      mimetype: row.mimetype,
      size: row.size ?? 0,
      creationDate: row.creationDate ?? 0,
    };
  }

  static toDomain(row: Omit<FilesRow, 'tenant_id'>, contentLoader: FileContentLoader) {
    switch (row.type) {
      case 'document': {
        if (row.status === 'ready') {
          return new PDFDocument({
            ...this.baseFields(row),
            entity: row.entity!,
            status: 'ready',
            language: LanguageUtils.fromISO639_3(row.language!).ISO639_1,
            totalPages: row.totalPages ?? undefined,
            generatedToc: row.generatedToc ?? false,
            toc: row.toc ?? undefined,
            propertySelections: row.propertySelections ?? undefined,
            fullText: row.fullText ?? undefined,
            content: contentLoader({ type: 'document', filename: row.filename }),
          });
        }
        return new PDFDocument({
          ...this.baseFields(row),
          entity: row.entity!,
          status: row.status ?? 'processing',
          propertySelections: row.propertySelections ?? undefined,
          content: contentLoader({ type: 'document', filename: row.filename }),
        });
      }
      case 'attachment':
        if (row.url) {
          return new URLAttachment({
            ...this.baseFields(row),
            entity: row.entity!,
            url: row.url,
          });
        }
        return new FileAttachment({
          ...this.baseFields(row),
          entity: row.entity!,
          content: contentLoader({ type: 'attachment', filename: row.filename }),
        });
      case 'thumbnail':
        return new Thumbnail({
          ...this.baseFields(row),
          entity: row.entity!,
          language: LanguageUtils.fromISO639_3(row.language!).ISO639_1,
          content: contentLoader({ type: 'thumbnail', filename: row.filename }),
        });
      case 'custom':
        return new CustomUpload({
          ...this.baseFields(row),
          content: contentLoader({ type: 'custom', filename: row.filename }),
        });
      default:
        throw new Error(`Unknown file type: ${(row as { type: string }).type}`);
    }
  }

  static toDBO(file: BaseFile) {
    const dto = file.toDTO();

    const base: Omit<FilesRow, 'tenant_id'> = {
      _id: file.id,
      originalname: dto.originalname,
      filename: dto.filename,
      mimetype: dto.mimetype,
      size: dto.size,
      creationDate: dto.creationDate,
      type: dto.type,
      entity: null,
      status: null,
      totalPages: null,
      language: null,
      generatedToc: null,
      url: null,
      toc: null,
      propertySelections: null,
      fullText: null,
    };

    switch (dto.type) {
      case 'document':
        base.entity = dto.entity;
        base.status = dto.status;
        if (dto.status === 'ready') {
          base.totalPages = dto.totalPages;
          base.language = dto.language;
          base.generatedToc = dto.generatedToc;
          base.toc = dto.toc ?? null;
          base.fullText = dto.fullText ?? null;
          base.propertySelections = dto.propertySelections ?? null;
        } else {
          base.propertySelections = dto.propertySelections ?? null;
        }
        break;
      case 'attachment':
        base.entity = dto.entity;
        if ('url' in dto) base.url = dto.url;
        break;
      case 'thumbnail':
        base.entity = dto.entity;
        base.language = dto.language;
        break;
      case 'custom':
        break;

      default:
        throw new Error(`Document type "${base.type}" cannot be mapped`);
    }

    return base;
  }
}
