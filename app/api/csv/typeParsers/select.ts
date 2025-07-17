import thesauri from 'api/thesauri';
import { RawEntity } from 'api/csv/entityRow';
import { ThesaurusSchema } from 'shared/types/thesaurusType';
import { MetadataObjectSchema, PropertySchema } from 'shared/types/commonTypes';
import { ensure } from 'shared/tsUtils';
import { sanitizeStringValue } from '../sanitizationUtils';
import {
  LabelInfo,
  determineParentChildRelationship,
  generateMetadataValue,
  parseParentChildWithSpaces,
} from './shared';

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
