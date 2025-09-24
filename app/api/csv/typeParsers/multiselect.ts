import _ from 'lodash';

// @ts-expect-error TS(2307): Cannot find module '../thesauri.js' or its corresp... Remove this comment to see the full error message
import thesauri from '../thesauri.js';
// @ts-expect-error TS(2307): Cannot find module '../csv/entityRow.js' or its co... Remove this comment to see the full error message
import { RawEntity } from '../csv/entityRow.js';
// @ts-expect-error TS(2307): Cannot find module '../../shared/types/thesaurusTy... Remove this comment to see the full error message
import { ThesaurusSchema } from 'shared/types/thesaurusType.js';

import { MetadataObjectSchema, PropertySchema } from 'shared/types/commonTypes.js';

import { ensure } from 'shared/tsUtils.js';

import {
  LabelInfo,
  generateMetadataValue,
  splitMultiselectLabels,
  normalizeMultiselectLabels,
} from './shared.js';

type ParserResult = {
  data: MetadataObjectSchema[];
  warnings: Array<{ property: string; value: string; reason: string }>;
};

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

  const invalidValues = values.filter(v => v === null || v.value === undefined || v.value === null);

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
