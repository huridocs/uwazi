import { RawEntity } from 'api/csv/entityRow';
import { MetadataObjectSchema, PropertySchema } from 'shared/types/commonTypes';
import { ensure } from 'shared/tsUtils';
import { generateID } from 'shared/IDGenerator';
import { sanitizeMetadataValue, SanitizationWarning } from '../sanitizationUtils';

export interface ParserResult {
  data: MetadataObjectSchema[];
  warnings: SanitizationWarning[];
}

const generatedid = async (
  entityToImport: RawEntity,
  property: PropertySchema
): Promise<ParserResult> => {
  const rawValue = entityToImport.propertiesFromColumns[ensure<string>(property.name)];

  // For generatedid, don't apply sanitization warnings for undefined values
  // since it's expected behavior to generate an ID when no value is provided
  if (rawValue === undefined || rawValue === null || rawValue === '') {
    const value = generateID(3, 4, 4);
    return {
      data: [{ value }],
      warnings: [],
    };
  }

  const sanitizationResult = sanitizeMetadataValue(
    rawValue,
    ensure<string>(property.name),
    property.type
  );
  const value = sanitizationResult.value || generateID(3, 4, 4);
  return {
    data: [{ value }],
    warnings: sanitizationResult.warnings,
  };
};

export default generatedid;
