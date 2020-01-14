/** @format */

import entities from 'api/entities';
import { unique, emptyString } from 'api/utils/filters';

const relationship = async (entityToImport, templateProperty) => {
  const values = entityToImport[templateProperty.name]
    .split('|')
    .filter(emptyString)
    .filter(unique);

  const current = await entities.get({ title: { $in: values } });
  const newValues = values.filter(v => !current.map(c => c.title).includes(v));

  await newValues.reduce(async (promise, title) => {
    await promise;
    return entities.save(
      {
        title,
        template: templateProperty.content,
      },
      {
        language: 'en',
        user: {},
      }
    );
  }, Promise.resolve([]));

  const toRelateEntities = await entities.get({ title: { $in: values } });
  return toRelateEntities
    .map(e => ({ value: e.sharedId, label: e.title }))
    .filter((mo, index, mos) => mos.findIndex(e => e.value === mo.value) === index);
};

export default relationship;
