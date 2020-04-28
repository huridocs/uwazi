import thesauri from 'api/thesauri';
import { unique, emptyString } from 'api/utils/filters';
import { RawEntity } from 'api/csv/entityRow';
import { ThesaurusSchema } from 'shared/types/thesaurusType';
import { MetadataObjectSchema, PropertySchema } from 'shared/types/commonTypes';
import { ensure } from 'shared/tsUtils';

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
