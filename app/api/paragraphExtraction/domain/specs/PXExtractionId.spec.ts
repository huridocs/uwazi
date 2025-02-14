import { PXExtractionId } from '../PXExtractionId';

describe('PXExtractionId', () => {
  it('should create a PXExtractionId instance with correct properties', () => {
    const input = { extractorId: 'extractor123', entitySharedId: 'entity456' };
    const extractionId = PXExtractionId.create(input);

    expect(extractionId).toBeInstanceOf(PXExtractionId);
    expect(extractionId.id).toBe('extractor123_____entity456');
    expect(extractionId.extractorId).toBe('extractor123');
    expect(extractionId.entitySharedId).toBe('entity456');
  });

  it('should create an instance with correct properties ', () => {
    const extractionId = new PXExtractionId('extractor123_____entity456');

    expect(extractionId).toBeInstanceOf(PXExtractionId);
    expect(extractionId.id).toBe('extractor123_____entity456');
    expect(extractionId.extractorId).toBe('extractor123');
    expect(extractionId.entitySharedId).toBe('entity456');
  });

  it('should throw an error if id format is incorrect', () => {
    expect(() => new PXExtractionId('incorrectFormat')).toThrow();
  });
});
