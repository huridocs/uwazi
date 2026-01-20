import thesauri from '#api/thesauri/thesauri.js';

import { RawEntity } from '#api/csv/entityRow.js';

import { ThesaurusSchema } from '#shared/types/thesaurusType.js';

import { MetadataObjectSchema, PropertySchema } from '#shared/types/commonTypes.js';

import { ensure } from '#shared/tsUtils.js';
import { sanitizeStringValue } from '#api/csv/sanitizationUtils.js';
import {
  LabelInfo,
  determineParentChildRelationship,
  generateMetadataValue,
  parseParentChildWithSpaces,
} from '#api/csv/typeParsers/shared.js';

type ParserResult = {
  data: MetadataObjectSchema[];
  warnings: Array<{ property: string; value: string; reason: string }>;
};

const select = async (
  entityToImport: RawEntity,
  property: PropertySchema
): Promise<ParserResult> => {
  const currentThesauri = (await thesauri.getById(property.content)) || ({} as ThesaurusSchema);
  const propValue = entityToImport.propertiesFromColumns[ensure<string>(property.name)];
  const warnings: Array<{ property: string; value: string; reason: string }> = [];

  if (!propValue) {
    return { data: [], warnings: [] };
  }

  let labelInfo = determineParentChildRelationship(propValue);

  if (!labelInfo && propValue) {
    const sanitizedValue = sanitizeStringValue(propValue, property.name).value;
    labelInfo = determineParentChildRelationship(sanitizedValue);
  }

  if (!labelInfo && propValue) {
    labelInfo = parseParentChildWithSpaces(propValue);
  }

  if (!labelInfo) {
    warnings.push({
      property: property.name,
      value: propValue,
      reason: 'Invalid thesaurus value format',
    });
    return { data: [], warnings };
  }

  const value = generateMetadataValue(currentThesauri, labelInfo);

  if (!value || value.value === undefined || value.value === null) {
    warnings.push({
      property: property.name,
      value: propValue,
      reason: 'Thesaurus value not found',
    });
    return { data: [], warnings };
  }

  return { data: [value], warnings };
};

export default select;
export { determineParentChildRelationship, parseParentChildWithSpaces };
export type { LabelInfo };
