import groupBy from 'lodash/groupBy.js';
import { LanguageUtils } from '#shared/language/index.js';
import { FileType } from '#shared/types/fileType.js';
import { AdapterEntity, ProcessingContext } from '#V2/application/services/processors/types.js';

export class SupportingFilesProcessor {
  private readonly context: ProcessingContext;

  constructor(context: ProcessingContext) {
    this.context = context;
  }

  private documentsByLanguage(
    documents: FileType[],
    entityLanguage?: string
  ): {
    mainDocuments: FileType[];
    otherDocuments: FileType[];
  } {
    const entityDocuments = documents.map(document => {
      const lang = LanguageUtils.fromISO639_3(document.language as string)?.ISO639_1;
      return { ...document, iso639_3: document.language, language: lang };
    });

    const documentsByLang = groupBy(entityDocuments, 'language');
    const mainDocuments: FileType[] = [];
    const addedLanguages = new Set<string | undefined>();

    const addMainDocument = (lang: string | undefined) => {
      if (addedLanguages.has(lang)) return;
      const key = lang === undefined ? 'undefined' : lang;
      const doc = documentsByLang[key]?.[0];
      if (doc) {
        mainDocuments.push(doc);
        addedLanguages.add(lang);
      }
    };

    const languageToMatch = entityLanguage || this.context.language;
    addMainDocument(languageToMatch);
    if (languageToMatch !== this.context.defaultLanguage) {
      addMainDocument(this.context.defaultLanguage);
    }

    if (mainDocuments.length === 0 && entityDocuments.length > 0) {
      mainDocuments.push(entityDocuments[0]);
    }

    const mainDocumentIds = new Set(mainDocuments.map(doc => doc._id));
    const otherDocuments = entityDocuments.filter(doc => !mainDocumentIds.has(doc._id));

    return { mainDocuments, otherDocuments };
  }

  attachSupportingFiles(entities: AdapterEntity[]): void {
    entities.forEach(entity => {
      const { rawEntity } = entity;
      const toAssign: Partial<AdapterEntity> = {};

      if (this.hasDocuments(rawEntity)) {
        const { mainDocuments, otherDocuments } = this.documentsByLanguage(
          rawEntity.documents,
          entity.language
        );
        toAssign.mainDocument = mainDocuments;
        toAssign.documents = otherDocuments;
      }

      if (this.hasAttachments(rawEntity)) {
        toAssign.attachments = rawEntity.attachments;
      }

      if (Object.keys(toAssign).length > 0) {
        Object.assign(entity, toAssign);
      }
    });
  }

  private hasDocuments(
    rawEntity: AdapterEntity['rawEntity']
  ): rawEntity is AdapterEntity['rawEntity'] & { documents: FileType[] } {
    return Array.isArray(rawEntity?.documents) && rawEntity.documents.length > 0;
  }

  private hasAttachments(
    rawEntity: AdapterEntity['rawEntity']
  ): rawEntity is AdapterEntity['rawEntity'] & { attachments: FileType[] } {
    return Array.isArray(rawEntity?.attachments) && rawEntity.attachments.length > 0;
  }
}
