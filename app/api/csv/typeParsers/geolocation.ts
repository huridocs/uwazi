import { RawEntity } from '#api/csv/entityRow.js';
import { MetadataObjectSchema, PropertySchema } from '#shared/types/commonTypes.js';
import { ensure } from '#shared/tsUtils.js';
import { csvConstants } from '../csvDefinitions.js';
import { sanitizeMetadataValue, SanitizationWarning } from '../sanitizationUtils.js';

export interface ParserResult {
  data: MetadataObjectSchema[];
  warnings: SanitizationWarning[];
}

const geolocation = async (
  entityToImport: RawEntity,
  property: PropertySchema
): Promise<ParserResult> => {
  const rawValue = entityToImport.propertiesFromColumns[ensure<string>(property.name)];
  const sanitizationResult = sanitizeMetadataValue(
    rawValue,
    ensure<string>(property.name),
    property.type
  );

  // If the value becomes empty after sanitization, return empty array
  if (sanitizationResult.value === '') {
    return {
      data: [],
      warnings: sanitizationResult.warnings,
    };
  }

  const [lat, lon] = sanitizationResult.value.split(csvConstants.multiValueSeparator);
  if (lat && lon) {
    return {
      data: [{ value: { lat: Number(lat), lon: Number(lon), label: '' } }],
      warnings: sanitizationResult.warnings,
    };
  }

  return {
    data: [],
    warnings: sanitizationResult.warnings,
  };
};

export default geolocation;
