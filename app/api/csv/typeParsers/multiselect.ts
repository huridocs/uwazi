import _ from 'lodash';

import thesauri from 'api/thesauri';
import { RawEntity } from 'api/csv/entityRow';
import { normalizeThesaurusLabel } from 'api/thesauri/thesauri';
import { ThesaurusSchema } from 'shared/types/thesaurusType';
import { MetadataObjectSchema, PropertySchema } from 'shared/types/commonTypes';
import { ensure } from 'shared/tsUtils';
import { sanitizeStringValue } from '../sanitizationUtils';

import {
  LabelInfo,
  determineParentChildRelationship,
  generateMetadataValue,
  parseParentChildWithSpaces,
  splitMultiselectLabels,
  normalizeMultiselectLabels,
} from './shared';
import { csvConstants } from '../csvDefinitions';

type ParserResult = {
  data: MetadataObjectSchema[];
  warnings: Array<{ property: string; value: string; reason: string }>;
};

function labelNotNull(label: string | null): label is string {
  return label !== null;
}

const multiselect = async (
  entityToImport: RawEntity,
  property: PropertySchema
): Promise<ParserResult> => {
  const currentThesaurus = (await thesauri.getById(property.content)) || ({} as ThesaurusSchema);
  const propValue = entityToImport.propertiesFromColumns[ensure<string>(property.name)];
  const warnings: Array<{ property: string; value: string; reason: string }> = [];

  if (!propValue) {
    return { data: [], warnings: [] };
  }

  const { labelInfos, parsingFailures } = splitMultiselectLabels(propValue);

  if (parsingFailures.length > 0) {
    warnings.push({
      property: property.name,
      value: propValue,
      reason: `${parsingFailures.length} value(s) have invalid format`,
    });
  }

  const info = _.uniqBy(labelInfos, i => i.child?.normalizedLabel || i.normalizedLabel);

  const values = info.map(i => generateMetadataValue(currentThesaurus, i));

  const validValues = values.filter(
    v => v !== null && v.value !== undefined && v.value !== null
  ) as MetadataObjectSchema[];

  const invalidValues = values.filter(
    v => v === null || v.value === undefined || v.value === null
  );

  if (invalidValues.length > 0) {
    warnings.push({
      property: property.name,
      value: propValue,
      reason: `${invalidValues.length} thesaurus value(s) not found`,
    });
  }

  return { data: validValues, warnings };
};

export default multiselect;
export { splitMultiselectLabels, normalizeMultiselectLabels };
export type { LabelInfo };
