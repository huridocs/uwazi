import entities from 'api/entities';
import { unique, emptyString } from 'api/utils/filters';
import { RawEntity } from 'api/csv/entityRow';
import { ensure } from 'shared/tsUtils';
import { PropertySchema } from 'shared/types/commonTypes';

interface Query {
  title: { $in: string[] };
  template?: string;
}

const relationship = async (entityToImport: RawEntity, property: PropertySchema) => {
  const values = entityToImport[ensure<string>(property.name)]
    .split('|')
    .filter(emptyString)
    .filter(unique);

  const query: Query = { title: { $in: values } };

  if (property.content) {
    query.template = property.content;
  }

  const current = await entities.get(query);
  const newValues = values.filter(v => !current.map(c => c.title).includes(v));

  if (property.content) {
    await newValues.reduce(async (promise: Promise<any>, title) => {
      await promise;
      return entities.save(
        {
          title,
          template: property.content,
        },
        {
          language: entityToImport.language,
          user: {},
        }
      );
    }, Promise.resolve([]));
  }

  const toRelateEntities = await entities.get(query);
  return toRelateEntities
    .map(e => ({ value: e.sharedId, label: e.title }))
    .filter((mo, index, mos) => mos.findIndex(e => e.value === mo.value) === index);
};

export default relationship;
