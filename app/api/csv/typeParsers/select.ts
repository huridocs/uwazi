import _ from 'lodash';
import thesauri from 'api/thesauri';
import { RawEntity } from 'api/csv/entityRow';
import { ThesaurusSchema } from 'shared/types/thesaurusType';
import { MetadataObjectSchema, PropertySchema } from 'shared/types/commonTypes';
import { ensure } from 'shared/tsUtils';

function normalizeThesaurusLabel(label: string): string | null {
  const trimmed = label.trim().toLowerCase();
  return trimmed.length > 0 ? trimmed : null;
}

const select = async (
  entityToImport: RawEntity,
  property: PropertySchema
): Promise<MetadataObjectSchema[] | null> => {
  const currentThesauri = (await thesauri.getById(property.content)) || ({} as ThesaurusSchema);
  const thesauriValues = currentThesauri.values || [];

  const propValue = entityToImport[ensure<string>(property.name)];
  const normalizedPropValue = normalizeThesaurusLabel(propValue);
  if (!normalizedPropValue) {
    return null;
  }
  const thesaurusValues = _.flatMapDeep(thesauriValues, tv =>
    tv.values ? [tv, ...tv.values] : tv
  );

  const thesaurusValue = thesaurusValues.find(
    tv => normalizeThesaurusLabel(tv.label) === normalizedPropValue
  );

  if (thesaurusValue?.id) {
    return [{ value: thesaurusValue.id, label: thesaurusValue.label }];
  }

  return null;
};

export default select;
export { normalizeThesaurusLabel };
