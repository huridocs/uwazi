import thesauri from 'api/thesauri';
import { RawEntity } from 'api/csv/entityRow';
import { ThesaurusSchema } from 'shared/types/thesaurusType';
import { MetadataObjectSchema, PropertySchema } from 'shared/types/commonTypes';
import { ensure } from 'shared/tsUtils';
import { flatThesaurusValues } from 'api/thesauri/thesauri';

function normalizeThesaurusLabel(label: string): string | null {
  const trimmed = label.trim().toLowerCase();
  return trimmed.length > 0 ? trimmed : null;
}

const findThesaurusValue = (currentThesauri: ThesaurusSchema, normalizedPropValue: string) => {
  const thesaurusValues = flatThesaurusValues(currentThesauri);
  return thesaurusValues.find(tv => normalizeThesaurusLabel(tv.label) === normalizedPropValue);
};

const select = async (
  entityToImport: RawEntity,
  property: PropertySchema
): Promise<MetadataObjectSchema[] | null> => {
  const currentThesauri = (await thesauri.getById(property.content)) || ({} as ThesaurusSchema);
  const propValue = entityToImport.propertiesFromColumns[ensure<string>(property.name)];
  const normalizedPropValue = normalizeThesaurusLabel(propValue);

  if (!normalizedPropValue) {
    return null;
  }

  const thesaurusValue = findThesaurusValue(currentThesauri, normalizedPropValue);
  if (thesaurusValue?.id) {
    return [{ value: thesaurusValue.id, label: thesaurusValue.label }];
  }

  return null;
};

export default select;
export { normalizeThesaurusLabel };
