import { PXExtractionId } from '../PXExtractionId';

describe('PXExtractionId', () => {
  it('should create a PXExtractionId instance with correct properties', () => {
    const extractionId = PXExtractionId.create({
      extractorId: 'extractor123',
      entitySharedId: 'entity456',
      tenantName: 'tenant name',
      userId: 'user id',
    });

    expect(extractionId).toBeInstanceOf(PXExtractionId);
    expect(extractionId.id).toBe('extractor123_____entity456_____tenant name_____user id');
    expect(extractionId.extractorId).toBe('extractor123');
    expect(extractionId.entitySharedId).toBe('entity456');
    expect(extractionId.tenantName).toBe('tenant name');
    expect(extractionId.userId).toBe('user id');
  });

  it('should create an instance with correct properties ', () => {
    const extractionId = new PXExtractionId(
      'extractor123_____entity456_____tenant name_____user id'
    );

    expect(extractionId).toBeInstanceOf(PXExtractionId);
    expect(extractionId.id).toBe('extractor123_____entity456_____tenant name_____user id');
    expect(extractionId.extractorId).toBe('extractor123');
    expect(extractionId.entitySharedId).toBe('entity456');
    expect(extractionId.userId).toBe('user id');
    expect(extractionId.tenantName).toBe('tenant name');
  });

  it('should throw an error if id format is incorrect', () => {
    expect(() => new PXExtractionId('incorrectFormat')).toThrow();
  });
});
