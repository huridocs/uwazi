import thesauri from 'api/thesauri';
import { RawEntity } from 'api/csv/entityRow';
import { ThesaurusSchema } from 'shared/types/thesaurusType';
import { MetadataObjectSchema, PropertySchema } from 'shared/types/commonTypes';
import { ensure } from 'shared/tsUtils';

import { flatThesaurusValues } from 'api/thesauri/thesauri';
import { normalizeThesaurusLabel } from './select';

function labelNotNull(label: string | null): label is string {
  return label !== null;
}

function splitMultiselectLabels(labelString: string): { [k: string]: string } {
  const labels = labelString
    .split('|')
    .map(l => l.trim())
    .filter(l => l.length > 0);
  const result: { [k: string]: string } = {};
  labels.forEach(label => {
    const normalizedLabel = normalizeThesaurusLabel(label);
    if (labelNotNull(normalizedLabel) && !result.hasOwnProperty(normalizedLabel)) {
      result[normalizedLabel] = label;
    }
  });
  return result;
}

function normalizeMultiselectLabels(labelArray: string[]): string[] {
  const normalizedLabels = labelArray.map(l => normalizeThesaurusLabel(l)).filter(labelNotNull);
  return Array.from(new Set(normalizedLabels));
}

const multiselect = async (
  entityToImport: RawEntity,
  property: PropertySchema
): Promise<MetadataObjectSchema[]> => {
  const currentThesauri = (await thesauri.getById(property.content)) || ({} as ThesaurusSchema);

  const values = splitMultiselectLabels(entityToImport[ensure<string>(property.name)]);
  const thesaurusValues = flatThesaurusValues(currentThesauri);

  return Object.keys(values)
    .map(key => thesaurusValues.find(tv => normalizeThesaurusLabel(tv.label) === key))
    .map(tv => tv)
    .map(tv => ({ value: ensure<string>(tv?.id), label: ensure<string>(tv?.label) }));
};

export default multiselect;
export { splitMultiselectLabels, normalizeMultiselectLabels };
