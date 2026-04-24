import { LanguageUtils } from '#shared/language/index.js';
import { ProcessedPDFDBO } from '../../mongodb/files/schemas/filesTypes.js';
import { FullTextElasticDocument } from './FullTextElasticDocument.js';

type MappedDocument = { id: string; document: FullTextElasticDocument };

class FullTextElasticDocumentMapper {
  static toDocument(file: ProcessedPDFDBO, tenantId: string): FullTextElasticDocument | null {
    const pages = file.fullText;
    if (!pages) {
      return null;
    }

    const nonEmptyPages = Object.values(pages).filter(p => p.trim().length > 0);
    if (nonEmptyPages.length === 0) {
      return null;
    }

    const joinedText = nonEmptyPages.join('\f');
    const language = LanguageUtils.fromISO639_3(file.language)?.elastic ?? 'other';

    return {
      [`fullText_${language}`]: joinedText,
      filename: file.filename,
      fullText: {
        name: 'fullText',
        parent: `${tenantId}__${file.entity}`,
      },
    } as FullTextElasticDocument;
  }

  static toDocuments(files: ProcessedPDFDBO[], tenantId: string): MappedDocument[] {
    return files.flatMap(file => {
      const document = this.toDocument(file, tenantId);
      if (!document) return [];
      return [{ id: `${file.entity}_${file._id.toString()}`, document }];
    });
  }
}

export { FullTextElasticDocumentMapper };
export type { MappedDocument };
