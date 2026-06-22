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
  private static baseFields(row: FilesRow) {
    return {
      id: row._id,
      originalname: row.originalname,
      filename: row.filename,
      mimetype: row.mimetype,
      size: Number(row.size),
      creationDate: Number(row.creation_date),
    };
  }

  static toDomain(row: FilesRow, contentLoader: FileContentLoader) {
    switch (row.type) {
      case 'document': {
        if (row.status === 'ready') {
          return new PDFDocument({
            ...this.baseFields(row),
            entity: row.entity!,
            status: 'ready',
            language: LanguageUtils.fromISO639_3(row.language!).ISO639_1,
            totalPages: Number(row.total_pages!),
            generatedToc: row.generated_toc ?? false,
            toc: row.toc ?? undefined,
            propertySelections: row.property_selections ?? undefined,
            fullText: row.full_text ?? undefined,
            content: contentLoader({ type: 'document', filename: row.filename }),
          });
        }
        return new PDFDocument({
          ...this.baseFields(row),
          entity: row.entity!,
          status: row.status ?? 'processing',
          propertySelections: row.property_selections ?? undefined,
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

    const base: FilesRow = {
      _id: file.id,
      tenant_id: '',
      originalname: dto.originalname,
      filename: dto.filename,
      mimetype: dto.mimetype,
      size: dto.size,
      creation_date: dto.creationDate,
      type: dto.type,
      entity: null,
      status: null,
      total_pages: null,
      language: null,
      generated_toc: null,
      url: null,
      toc: null,
      property_selections: null,
      full_text: null,
    };

    switch (dto.type) {
      case 'document':
        base.entity = dto.entity;
        base.status = dto.status;
        if (dto.status === 'ready') {
          base.total_pages = dto.totalPages;
          base.language = dto.language;
          base.generated_toc = dto.generatedToc;
          base.toc = dto.toc ?? null;
          base.full_text = dto.fullText ?? null;
          base.property_selections = dto.propertySelections ?? null;
        } else {
          base.property_selections = dto.propertySelections ?? null;
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
