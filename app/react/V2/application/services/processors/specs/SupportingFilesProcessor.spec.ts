import { SupportingFilesProcessor } from '../SupportingFilesProcessor.js';
import { ProcessingContext, AdapterEntity } from '../types.js';
import { EntitySchema } from '#shared/types/entityType.js';
import { processingContext } from './PropertyProcessorsFixtures.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { FileType } from '#shared/types/fileType.js';

describe('SupportingFilesProcessor', () => {
  const createContext = (
    language: string,
    languages: Array<{
      _id: string;
      label: string;
      key: LanguageISO6391;
      default: boolean;
      ISO639_3: string;
    }>
  ): ProcessingContext => ({
    ...processingContext,
    language,
    defaultLanguage: languages.find(l => l.default)?.key || 'en',
    settings: {
      ...processingContext.settings,
      languages,
    },
  });

  const createDocument = (id: string, filename: string, language?: string): FileType => ({
    _id: id,
    filename,
    language,
    type: 'document',
  });

  const createAttachment = (id: string, filename: string): FileType => ({
    _id: id,
    filename,
    type: 'attachment',
  });

  const createEntity = (rawEntity: Partial<EntitySchema>): AdapterEntity => {
    const entityId = typeof rawEntity._id === 'string' ? rawEntity._id : 'entity.test';
    const entity: AdapterEntity = {
      _id: entityId,
      title: rawEntity.title || 'Test Entity',
      sharedId: rawEntity.sharedId || 'test-001',
      language: rawEntity.language || 'en',
      template: {
        _id: 'template.test',
        name: 'Test Template',
        label: 'Test Template',
        color: '#000000',
        properties: new Map(),
        commonProperties: new Map(),
      },
      creationDate: {
        name: 'creationDate',
        type: 'date' as const,
        label: 'Creation Date',
        translatedLabel: 'Creation Date',
        values: [],
        _id: 'creationDate',
        entity: {} as AdapterEntity,
        index: 0,
        value: [],
        properties: {
          _id: 'creationDate',
          inherited: false,
        },
      },
      editDate: {
        name: 'editDate',
        type: 'date' as const,
        label: 'Edit Date',
        translatedLabel: 'Edit Date',
        values: [],
        _id: 'editDate',
        entity: {} as AdapterEntity,
        index: 0,
        value: [],
        properties: {
          _id: 'editDate',
          inherited: false,
        },
      },
      metadata: [],
      rawEntity: rawEntity as EntitySchema,
    };
    entity.creationDate.entity = entity;
    entity.editDate.entity = entity;
    return entity;
  };

  const singleLanguageContext = createContext('en', [
    { _id: '1', label: 'English', key: 'en' as LanguageISO6391, default: true, ISO639_3: 'eng' },
  ]);

  describe('Language matching', () => {
    it('should select mainDocument based on entity language (ISO639_3)', () => {
      const context = createContext('en', [
        {
          _id: '1',
          label: 'English',
          key: 'en' as LanguageISO6391,
          default: true,
          ISO639_3: 'eng',
        },
        {
          _id: '2',
          label: 'Spanish',
          key: 'es' as LanguageISO6391,
          default: false,
          ISO639_3: 'spa',
        },
      ]);

      const processor = new SupportingFilesProcessor(context);
      const entity = createEntity({
        _id: 'entity.test',
        language: 'en',
        documents: [
          createDocument('d1', 'doc1.pdf', 'eng'),
          createDocument('d2', 'doc2.pdf', 'spa'),
        ],
      });

      processor.attachSupportingFiles([entity]);

      expect(entity.mainDocument?.[0]._id).toBe('d1');
      expect(entity.documents).toHaveLength(1);
      expect(entity.documents?.[0]._id).toBe('d2');
    });

    it('should select mainDocument for Spanish entity', () => {
      const context = createContext('es', [
        {
          _id: '1',
          label: 'English',
          key: 'en' as LanguageISO6391,
          default: true,
          ISO639_3: 'eng',
        },
        {
          _id: '2',
          label: 'Spanish',
          key: 'es' as LanguageISO6391,
          default: false,
          ISO639_3: 'spa',
        },
      ]);

      const processor = new SupportingFilesProcessor(context);
      const entity = createEntity({
        _id: 'entity.test',
        language: 'es',
        documents: [
          createDocument('d1', 'doc1.pdf', 'eng'),
          createDocument('d2', 'doc2.pdf', 'spa'),
        ],
      });

      processor.attachSupportingFiles([entity]);

      expect(entity.mainDocument?.[0]?._id).toBe('d2');
      expect(entity.mainDocument?.[0]?.language).toBe('es');
      expect(entity.mainDocument?.[1]?._id).toBe('d1');
      expect(entity.mainDocument?.[1]?.language).toBe('en');
      expect(entity.documents).toHaveLength(0);
    });

    it('should select mainDocument for French entity', () => {
      const context = createContext('fr', [
        {
          _id: '1',
          label: 'English',
          key: 'en' as LanguageISO6391,
          default: true,
          ISO639_3: 'eng',
        },
        {
          _id: '2',
          label: 'French',
          key: 'fr' as LanguageISO6391,
          default: false,
          ISO639_3: 'fra',
        },
      ]);

      const processor = new SupportingFilesProcessor(context);
      const entity = createEntity({
        _id: 'entity.test',
        language: 'fr',
        documents: [
          createDocument('d1', 'doc1.pdf', 'eng'),
          createDocument('d2', 'doc2.pdf', 'fra'),
        ],
      });

      processor.attachSupportingFiles([entity]);

      expect(entity.mainDocument?.[0]?._id).toBe('d2');
      expect(entity.mainDocument?.[0]?.language).toBe('fr');
      expect(entity.mainDocument?.[1]?._id).toBe('d1');
      expect(entity.mainDocument?.[1]?.language).toBe('en');
      expect(entity.documents).toHaveLength(0);
    });
  });

  describe('Fallback to context language', () => {
    it('should fallback to context language when no document matches entity language', () => {
      const context = createContext('en', [
        {
          _id: '1',
          label: 'English',
          key: 'en' as LanguageISO6391,
          default: true,
          ISO639_3: 'eng',
        },
        {
          _id: '2',
          label: 'Spanish',
          key: 'es' as LanguageISO6391,
          default: false,
          ISO639_3: 'spa',
        },
      ]);

      const processor = new SupportingFilesProcessor(context);
      const entity = createEntity({
        _id: 'entity.test',
        language: 'fr',
        documents: [
          createDocument('d1', 'doc1.pdf', 'eng'),
          createDocument('d2', 'doc2.pdf', 'spa'),
        ],
      });

      processor.attachSupportingFiles([entity]);

      expect(entity.mainDocument?.[0]?._id).toBe('d1');
      expect(entity.documents).toHaveLength(1);
      expect(entity.documents?.[0]._id).toBe('d2');
    });

    it('should fallback to context language when entity language has no matching documents', () => {
      const context = createContext('es', [
        {
          _id: '1',
          label: 'English',
          key: 'en' as LanguageISO6391,
          default: true,
          ISO639_3: 'eng',
        },
        {
          _id: '2',
          label: 'Spanish',
          key: 'es' as LanguageISO6391,
          default: false,
          ISO639_3: 'spa',
        },
      ]);

      const processor = new SupportingFilesProcessor(context);
      const entity = createEntity({
        _id: 'entity.test',
        language: 'fr',
        documents: [createDocument('d1', 'doc1.pdf', 'spa')],
      });

      processor.attachSupportingFiles([entity]);

      expect(entity.mainDocument?.[0]?._id).toBe('d1');
      expect(entity.documents).toHaveLength(0);
    });
  });

  describe('Fallback to first document', () => {
    it('should fallback to first document when no language matches', () => {
      const context = createContext('en', [
        {
          _id: '1',
          label: 'English',
          key: 'en' as LanguageISO6391,
          default: true,
          ISO639_3: 'eng',
        },
        {
          _id: '2',
          label: 'Spanish',
          key: 'es' as LanguageISO6391,
          default: false,
          ISO639_3: 'spa',
        },
      ]);

      const processor = new SupportingFilesProcessor(context);
      const entity = createEntity({
        _id: 'entity.test',
        language: 'fr',
        documents: [
          createDocument('d1', 'doc1.pdf', 'fra'),
          createDocument('d2', 'doc2.pdf', 'fra'),
        ],
      });

      processor.attachSupportingFiles([entity]);

      expect(entity.mainDocument?.[0]?._id).toBe('d1');
      expect(entity.documents).toHaveLength(1);
      expect(entity.documents?.[0]?._id).toBe('d2');
    });
  });

  describe('Multiple documents in same language', () => {
    it('should select first document when multiple documents match entity language', () => {
      const context = createContext('en', [
        {
          _id: '1',
          label: 'English',
          key: 'en' as LanguageISO6391,
          default: true,
          ISO639_3: 'eng',
        },
      ]);

      const processor = new SupportingFilesProcessor(context);
      const entity = createEntity({
        _id: 'entity.test',
        language: 'en',
        documents: [
          createDocument('d1', 'doc1.pdf', 'eng'),
          createDocument('d2', 'doc2.pdf', 'eng'),
          createDocument('d3', 'doc3.pdf', 'eng'),
        ],
      });

      processor.attachSupportingFiles([entity]);

      expect(entity.mainDocument?.[0]?._id).toBe('d1');
      expect(entity.documents).toHaveLength(2);
      expect(entity.documents?.[0]?._id).toBe('d2');
      expect(entity.documents?.[1]?._id).toBe('d3');
    });
  });

  describe('Edge cases', () => {
    it('should handle entity with no documents', () => {
      const processor = new SupportingFilesProcessor(singleLanguageContext);
      const entity = createEntity({
        _id: 'entity.test',
        language: 'en',
        documents: [],
      });

      processor.attachSupportingFiles([entity]);

      expect(entity.mainDocument).toBeUndefined();
      expect(entity.documents).toBeUndefined();
    });

    it('should handle entity with only attachments', () => {
      const processor = new SupportingFilesProcessor(singleLanguageContext);
      const entity = createEntity({
        _id: 'entity.test',
        language: 'en',
        attachments: [createAttachment('a1', 'attachment.jpg')],
      });

      processor.attachSupportingFiles([entity]);

      expect(entity.mainDocument).toBeUndefined();
      expect(entity.documents).toBeUndefined();
      expect(entity.attachments).toHaveLength(1);
    });

    it('should handle documents without language property', () => {
      const processor = new SupportingFilesProcessor(singleLanguageContext);
      const entity = createEntity({
        _id: 'entity.test',
        language: 'en',
        documents: [createDocument('d1', 'doc1.pdf')],
      });

      processor.attachSupportingFiles([entity]);

      expect(entity.mainDocument?.[0]?._id).toBe('d1');
      expect(entity.documents).toHaveLength(0);
    });

    it('should handle empty documents array', () => {
      const processor = new SupportingFilesProcessor(singleLanguageContext);
      const entity = createEntity({
        _id: 'entity.test',
        language: 'en',
      });

      processor.attachSupportingFiles([entity]);

      expect(entity.mainDocument).toBeUndefined();
      expect(entity.documents).toBeUndefined();
    });
  });

  describe('Documents and attachments processing', () => {
    it('should assign other documents (excluding mainDocument) to entity.documents', () => {
      const processor = new SupportingFilesProcessor(singleLanguageContext);
      const entity = createEntity({
        _id: 'entity.test',
        language: 'en',
        documents: [
          createDocument('d1', 'doc1.pdf', 'eng'),
          createDocument('d2', 'doc2.pdf', 'eng'),
        ],
      });

      processor.attachSupportingFiles([entity]);

      expect(entity.documents).toHaveLength(1);
      expect(entity.documents?.[0]._id).toBe('d2');
    });

    it('should assign all attachments to entity.attachments', () => {
      const processor = new SupportingFilesProcessor(singleLanguageContext);
      const entity = createEntity({
        _id: 'entity.test',
        language: 'en',
        documents: [createDocument('d1', 'doc1.pdf', 'eng')],
        attachments: [
          createAttachment('a1', 'attachment1.jpg'),
          createAttachment('a2', 'attachment2.jpg'),
        ],
      });

      processor.attachSupportingFiles([entity]);

      expect(entity.attachments).toHaveLength(2);
      expect(entity.attachments?.[0]._id).toBe('a1');
      expect(entity.attachments?.[1]._id).toBe('a2');
    });

    it('should not create undefined properties for empty arrays', () => {
      const processor = new SupportingFilesProcessor(singleLanguageContext);
      const entity = createEntity({
        _id: 'entity.test',
        language: 'en',
      });

      processor.attachSupportingFiles([entity]);

      expect(entity.documents).toBeUndefined();
      expect(entity.attachments).toBeUndefined();
      expect(entity.mainDocument).toBeUndefined();
    });
  });

  describe('Batch processing', () => {
    it('should process multiple entities with different languages', () => {
      const context = createContext('en', [
        {
          _id: '1',
          label: 'English',
          key: 'en' as LanguageISO6391,
          default: true,
          ISO639_3: 'eng',
        },
        {
          _id: '2',
          label: 'Spanish',
          key: 'es' as LanguageISO6391,
          default: false,
          ISO639_3: 'spa',
        },
      ]);

      const processor = new SupportingFilesProcessor(context);
      const entity1 = createEntity({
        _id: 'entity.test1',
        language: 'en',
        documents: [
          createDocument('d1', 'doc1.pdf', 'eng'),
          createDocument('d2', 'doc2.pdf', 'spa'),
        ],
      });

      const entity2 = createEntity({
        _id: 'entity.test2',
        language: 'es',
        documents: [
          createDocument('d3', 'doc3.pdf', 'eng'),
          createDocument('d4', 'doc4.pdf', 'spa'),
        ],
      });

      processor.attachSupportingFiles([entity1, entity2]);

      expect(entity1.mainDocument?.[0]?._id).toBe('d1');
      expect(entity1.mainDocument?.[0]?.language).toBe('en');
      expect(entity1.documents).toHaveLength(1);
      expect(entity1.documents?.[0]?._id).toBe('d2');
      expect(entity2.mainDocument?.[0]?._id).toBe('d4');
      expect(entity2.mainDocument?.[0]?.language).toBe('es');
      expect(entity2.mainDocument?.[1]?._id).toBe('d3');
      expect(entity2.mainDocument?.[1]?.language).toBe('en');
      expect(entity2.documents).toHaveLength(0);
    });
  });
});
