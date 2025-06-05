import { PXExtractionKey } from '../PXExtractionKey';

describe('PXExtractionKey', () => {
  it('should create a PXExtractionKey instance with correct properties', () => {
    const extractionId = PXExtractionKey.create({
      tenantName: 'any_tenant_name',
      userId: 'any_user_id',
      entityStatusId: 'any_extraction_id',
    });

    expect(extractionId.key).toBe(
      `any_tenant_name${PXExtractionKey.separator}any_extraction_id${PXExtractionKey.separator}any_user_id`
    );
    expect(extractionId.tenantName).toBe('any_tenant_name');
    expect(extractionId.entityStatusId).toBe('any_extraction_id');
    expect(extractionId.userId).toBe('any_user_id');
  });

  it('should create an instance with correct properties ', () => {
    const extractionId = new PXExtractionKey(
      `any_tenant_name${PXExtractionKey.separator}any_extraction_id${PXExtractionKey.separator}any_user_id`
    );

    expect(extractionId).toBeInstanceOf(PXExtractionKey);
    expect(extractionId.key).toBe(
      `any_tenant_name${PXExtractionKey.separator}any_extraction_id${PXExtractionKey.separator}any_user_id`
    );
    expect(extractionId.userId).toBe('any_user_id');
    expect(extractionId.entityStatusId).toBe('any_extraction_id');
    expect(extractionId.tenantName).toBe('any_tenant_name');
  });

  it('should throw an error if id format is incorrect', () => {
    expect(() => new PXExtractionKey('incorrectFormat')).toThrow();
  });
});
