import thesauri from 'api/thesauri';
import { RawEntity } from 'api/csv/entityRow';
import { ThesaurusValueSchema, ThesaurusSchema } from 'shared/types/thesaurusType';
import { MetadataObjectSchema, PropertySchema } from 'shared/types/commonTypes';
import { ensure } from 'shared/tsUtils';

const select = async (
  entityToImport: RawEntity,
  property: PropertySchema
): Promise<MetadataObjectSchema[] | null> => {
  const currentThesauri = (await thesauri.getById(property.content)) || ({} as ThesaurusSchema);
  const thesauriValues = currentThesauri.values || [];

  if (entityToImport[ensure<string>(property.name)].trim() === '') {
    return null;
  }

  const thesauriMatching = (v: ThesaurusValueSchema) =>
    v.label.trim().toLowerCase() ===
    entityToImport[ensure<string>(property.name)].trim().toLowerCase();

  let value = thesauriValues.find(thesauriMatching);

  if (!value) {
    const updated = await thesauri.save({
      ...currentThesauri,
      values: thesauriValues.concat([
        {
          label: entityToImport[ensure<string>(property.name)],
        },
      ]),
    });
    value = (updated.values || []).find(thesauriMatching);
  }

  if (value?.id) {
    return [{ value: value.id, label: value.label }];
  }

  return null;
};

export default select;
