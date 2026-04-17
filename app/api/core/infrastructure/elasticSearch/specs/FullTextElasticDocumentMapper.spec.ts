import { ObjectId } from 'mongodb';
import { ProcessedPDFDBO } from '../../mongodb/files/schemas/filesTypes.js';
import { FullTextElasticDocumentMapper } from '../entities/FullTextElasticDocumentMapper.js';

const entityId = new ObjectId('aaaaaaaaaaaaaaaaaaaaaaaa');
const fileId = new ObjectId('bbbbbbbbbbbbbbbbbbbbbbbb');
const tenantId = 'tenant-a';

const createFile = (override: Partial<ProcessedPDFDBO> = {}): ProcessedPDFDBO => ({
  _id: fileId,
  originalname: 'document.pdf',
  filename: 'document.pdf',
  mimetype: 'application/pdf',
  size: 1024,
  creationDate: 1000,
  type: 'document',
  entity: 'shared-abc',
  language: 'eng',
  totalPages: 2,
  generatedToc: false,
  status: 'ready',
  fullText: { 1: 'page one text', 2: 'page two text' },
  ...override,
});

describe('FullTextElasticDocumentMapper', () => {
  describe('toDocument()', () => {
    it('joins pages with \\f separator', () => {
      const file = createFile({ fullText: { 1: 'page one', 2: 'page two', 3: 'page three' } });
      const result = FullTextElasticDocumentMapper.toDocument(file, entityId, tenantId);

      expect(result).not.toBeNull();
      expect(result!.fullText_english).toBe('page one\fpage two\fpage three');
    });

    it('maps a known ISO639_3 language to its elastic name', () => {
      const file = createFile({ language: 'eng' });
      const result = FullTextElasticDocumentMapper.toDocument(file, entityId, tenantId);

      expect(result).not.toBeNull();
      expect(result).toHaveProperty('fullText_english');
    });

    it('maps arabic ISO639_3 language to arabic elastic name', () => {
      const file = createFile({ language: 'arb' });
      const result = FullTextElasticDocumentMapper.toDocument(file, entityId, tenantId);

      expect(result).not.toBeNull();
      expect(result).toHaveProperty('fullText_arabic');
    });

    it('falls back to fullText_other for an unrecognised language', () => {
      const file = createFile({ language: 'xyz' as any });
      const result = FullTextElasticDocumentMapper.toDocument(file, entityId, tenantId);

      expect(result).not.toBeNull();
      expect(result).toHaveProperty('fullText_other');
    });

    it('falls back to fullText_other when file language is undefined', () => {
      const file = createFile({ language: undefined as any });
      const result = FullTextElasticDocumentMapper.toDocument(file, entityId, tenantId);

      expect(result).not.toBeNull();
      expect(result).toHaveProperty('fullText_other');
    });

    it('returns null when fullText is undefined', () => {
      const file = createFile({ fullText: undefined });
      const result = FullTextElasticDocumentMapper.toDocument(file, entityId, tenantId);

      expect(result).toBeNull();
    });

    it('returns null when fullText is an empty object', () => {
      const file = createFile({ fullText: {} });
      const result = FullTextElasticDocumentMapper.toDocument(file, entityId, tenantId);

      expect(result).toBeNull();
    });

    it('sets the join parent to the prefixed entityId', () => {
      const result = FullTextElasticDocumentMapper.toDocument(createFile(), entityId, tenantId);

      expect(result).not.toBeNull();
      expect(result!.fullText).toEqual({
        name: 'fullText',
        parent: `${tenantId}__${entityId.toString()}`,
      });
    });

    it('includes sharedId equal to file.entity', () => {
      const file = createFile({ entity: 'shared-xyz' });
      const result = FullTextElasticDocumentMapper.toDocument(file, entityId, tenantId);

      expect(result).not.toBeNull();
    });

    it('does not include tenantId (stamped downstream by TenantAwareESClient)', () => {
      const result = FullTextElasticDocumentMapper.toDocument(createFile(), entityId, tenantId);

      expect(result).not.toBeNull();
      expect(result).not.toHaveProperty('tenantId');
    });
  });

  describe('toDocuments()', () => {
    it('returns one entry per pair with correct composite id', () => {
      const entityId2 = new ObjectId('cccccccccccccccccccccccc');
      const fileId2 = new ObjectId('dddddddddddddddddddddddd');
      const file1 = createFile({ _id: fileId });
      const file2 = createFile({ _id: fileId2, language: 'spa' });

      const results = FullTextElasticDocumentMapper.toDocuments(
        [
          { file: file1, entityId },
          { file: file2, entityId: entityId2 },
        ],
        tenantId
      );

      expect(results).toHaveLength(2);
      expect(results[0].id).toBe(`${entityId.toString()}_${fileId.toString()}`);
      expect(results[1].id).toBe(`${entityId2.toString()}_${fileId2.toString()}`);
    });

    it('omits pairs where toDocument returns null', () => {
      const fileWithText = createFile({ _id: fileId });
      const fileWithoutText = createFile({ _id: new ObjectId(), fullText: {} });

      const results = FullTextElasticDocumentMapper.toDocuments(
        [
          { file: fileWithText, entityId },
          { file: fileWithoutText, entityId },
        ],
        tenantId
      );

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe(`${entityId.toString()}_${fileId.toString()}`);
    });
  });
});
