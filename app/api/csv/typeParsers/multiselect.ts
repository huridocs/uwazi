import _ from 'lodash';

import thesauri from 'api/thesauri';
import { RawEntity } from 'api/csv/entityRow';
import { normalizeThesaurusLabel } from 'api/thesauri/thesauri';
import { ThesaurusSchema } from 'shared/types/thesaurusType';
import { MetadataObjectSchema, PropertySchema } from 'shared/types/commonTypes';
import { ensure } from 'shared/tsUtils';
import { sanitizeStringValue } from '../sanitizationUtils';

import { LabelInfo, determineParentChildRelationship, generateMetadataValue } from './select';
import { csvConstants } from '../csvDefinitions';

type ParserResult = {
  data: MetadataObjectSchema[];
  warnings: Array<{ property: string; value: string; reason: string }>;
};

function labelNotNull(label: string | null): label is string {
  return label !== null;
}

const parseParentChildWithSpaces = (value: string): LabelInfo | null => {
  if (!value) return null;

  const separator = '::';
  const parts = value.split(separator);

  if (parts.length > 2) {
    return null;
  }

  if (parts.length === 1) {
    const trimmedLabel = parts[0].trim();
    const normalizedLabel = normalizeThesaurusLabel(trimmedLabel);
    if (!normalizedLabel) return null;

    return {
      label: trimmedLabel,
      normalizedLabel,
      child: null,
    };
  }

  const parentLabel = parts[0].trim();
  const childLabel = parts[1].trim();

  const normalizedParentLabel = normalizeThesaurusLabel(parentLabel);
  const normalizedChildLabel = normalizeThesaurusLabel(childLabel);

  if (!normalizedParentLabel || !normalizedChildLabel) {
    return null;
  }

  return {
    label: parentLabel,
    normalizedLabel: normalizedParentLabel,
    child: {
      label: childLabel,
      normalizedLabel: normalizedChildLabel,
    },
  };
};

function splitMultiselectLabels(labelString: string): {
  labelInfos: LabelInfo[];
  parsingFailures: string[];
} {
  if (!labelString) {
    return { labelInfos: [], parsingFailures: [] };
  }
  const labels = labelString
    .split(csvConstants.multiValueSeparator)
    .map(l => l.trim())
    .filter(l => l.length > 0);
  const labelInfos: LabelInfo[] = [];
  const parsingFailures: string[] = [];
  
  labels.forEach(label => {
    let labelInfo = determineParentChildRelationship(label);
    
    if (!labelInfo) {
      const sanitizedValue = sanitizeStringValue(label, 'multiselect').value;
      labelInfo = determineParentChildRelationship(sanitizedValue);
    }
    
    if (!labelInfo) {
      labelInfo = parseParentChildWithSpaces(label);
    }
    
    if (labelInfo) {
      labelInfos.push(labelInfo);
    } else {
      parsingFailures.push(label);
    }
  });

  return { labelInfos, parsingFailures };
}

function normalizeMultiselectLabels(labelArray: string[]): string[] {
  const normalizedLabels = labelArray.map(l => normalizeThesaurusLabel(l)).filter(labelNotNull);
  return Array.from(new Set(normalizedLabels));
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
