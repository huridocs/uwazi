/* eslint-disable max-statements */
import { inheritance } from './inheritance.js';
import { translator } from './translator.js';

const removeFromMappedSets = (missingMap, assignmentMap, completedSet, key, item) => {
  const set = missingMap.get(key);
  set.delete(item);
  if (set.size === 0) {
    missingMap.delete(key);
    assignmentMap.delete(key);
    completedSet.add(key);
  }
};

const findMissing = async db => {
  const settings = await db.collection('settings').findOne({});
  const defaultLanguage = settings.languages.find(l => l.default).key;
  const expectedLanguages = new Set(settings.languages.map(l => l.key));

  const sharedIdToMissing = new Map();
  const sharedIdToAssigned = new Map();
  const completed = new Set();
  const entities = db.collection('entities').find({}, { projection: { sharedId: 1, language: 1 } });

  await entities.forEach(entity => {
    const { sharedId, language } = entity;
    if (expectedLanguages.has(language) && !completed.has(sharedId)) {
      if (!sharedIdToAssigned.get(sharedId) || language === defaultLanguage) {
        sharedIdToAssigned.set(sharedId, language);
      }

      if (!sharedIdToMissing.has(sharedId)) {
        sharedIdToMissing.set(sharedId, new Set(expectedLanguages));
        removeFromMappedSets(sharedIdToMissing, sharedIdToAssigned, completed, sharedId, language);
      } else {
        removeFromMappedSets(sharedIdToMissing, sharedIdToAssigned, completed, sharedId, language);
      }
    }
  });

  return { sharedIdToMissing, sharedIdToAssigned };
};

const flipStringMap = map => {
  const resultMap = new Map();
  map.forEach((value, key) => {
    if (!resultMap.has(value)) {
      resultMap.set(value, new Set([key]));
    } else {
      resultMap.get(value).add(key);
    }
  });
  return resultMap;
};

const createBatches = (array, size) => {
  const totalCount = Math.ceil(array.length / size);
  const batches = [];
  for (let i = 0; i < totalCount; i += 1) {
    const start = i * size;
    const end = (i + 1) * size;
    batches.push(array.slice(start, end));
  }
  return batches;
};

const migration = {
  delta: 59,

  name: 'missing_languages',

  description:
    'Migrate missing languages per sharedId, according to the expected languages in the collection.',

  reindex: false,

  batchLimit: 1000,

  async up(db) {
    process.stdout.write(`${this.name}...\r\n`);

    const { sharedIdToMissing, sharedIdToAssigned } = await findMissing(db);

    this.reindex = Boolean(sharedIdToAssigned.size);
    if (!this.reindex) {
      return;
    }

    const assignedToSharedId = Array.from(flipStringMap(sharedIdToAssigned).entries());
    await translator.build(db);
    await inheritance.build(db);

    for (let i = 0; i < assignedToSharedId.length; i += 1) {
      const assignedLanguage = assignedToSharedId[i][0];
      const allSharedIds = Array.from(assignedToSharedId[i][1]);
      const sharedIdBatches = createBatches(allSharedIds, this.batchLimit);

      for (let j = 0; j < sharedIdBatches.length; j += 1) {
        const newEntities = [];
        const sharedIds = sharedIdBatches[j];
        // console.log(sharedIds);
        // eslint-disable-next-line no-await-in-loop
        const assignedEntities = await db
          .collection('entities')
          .find({ language: assignedLanguage, sharedId: { $in: sharedIds } })
          .toArray();
        // eslint-disable-next-line no-await-in-loop
        await inheritance.prepareForBatch(
          db,
          assignedEntities,
          sharedIdToMissing,
          sharedIdToAssigned
        );
        // eslint-disable-next-line no-await-in-loop
        await assignedEntities.forEach(entity => {
          const { sharedId } = entity;
          const newLanguages = Array.from(sharedIdToMissing.get(sharedId));
          newLanguages.forEach(language => {
            const copy = {
              ...entity,
              language,
              mongoLanguage: language,
              metadata: translator.translateMetadata(
                inheritance.inheritMetadata(
                  entity.metadata,
                  entity.template,
                  entity.sharedId,
                  language
                ),
                language
              ),
            };
            delete copy._id;
            newEntities.push(copy);
          });
        });

        if (newEntities.length > 0) {
          // eslint-disable-next-line no-await-in-loop
          await db.collection('entities').insertMany(newEntities);
        }
      }
      // console.log(newEntities);
      // console.log(sharedIdToMissing);
      // console.log(sharedIdToAssigned);
      // console.log(assignedToSharedId);
    }
  },
};

export default migration;
