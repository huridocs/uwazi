import thesauri from 'api/thesauri';
import { unique, emptyString } from 'api/utils/filters';
import { RawEntity } from 'api/csv/entityRow';
import { ThesaurusSchema } from 'shared/types/thesaurusType';
import { MetadataObjectSchema, PropertySchema } from 'shared/types/commonTypes';
import { ensure } from 'shared/tsUtils';

import { normalizeThesaurusLabel } from './select';

function labelNotNull(label: string | null): label is string {
  return label !== null;
}

export function splitMultiselectLabels(labelString: string): { [k: string]: string } {
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

export function normalizeMultiselectLabels(labelArray: string[]): string[] {
  const normalizedLabels = labelArray.map(l => normalizeThesaurusLabel(l)).filter(labelNotNull);
  return Array.from(new Set(normalizedLabels));
}

const multiselect = async (
  entityToImport: RawEntity,
  property: PropertySchema
): Promise<MetadataObjectSchema[]> => {
  const currentThesauri = (await thesauri.getById(property.content)) || ({} as ThesaurusSchema);
  const thesauriValues = currentThesauri.values || [];

  const values = entityToImport[ensure<string>(property.name)]
    .split('|')
    .map(v => v.trim())
    .filter(emptyString)
    .filter(unique);

  const newValues = values.filter(
    v => !thesauriValues.find(cv => cv.label.trim().toLowerCase() === v.toLowerCase())
  );

  const lowerCaseValues = values.map(v => v.toLowerCase());
  if (!newValues.length) {
    return thesauriValues
      .filter(value => lowerCaseValues.includes(value.label.trim().toLowerCase()))
      .map(value => ({ value: ensure<string>(value.id), label: value.label }));
  }

  const updated = await thesauri.save({
    ...currentThesauri,
    values: thesauriValues.concat(newValues.map(label => ({ label }))),
  });

  return (updated.values || [])
    .filter(value => lowerCaseValues.includes(value.label.toLowerCase()))
    .map(value => ({ value: ensure<string>(value.id), label: value.label }));
};

export default multiselect;
