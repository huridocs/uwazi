/* eslint-disable max-statements */

const removeFromMappedSets = (missingMap, assignmentMap, completedSet, key, item) => {
  const set = missingMap.get(key);
  set.delete(item);
  if (set.size === 0) {
    missingMap.delete(key);
    assignmentMap.delete(key);
    completedSet.add(key);
  }
};

const findMissing = async (db, expectedLanguages, defaultLanguage) => {
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

const migration = {
  delta: 59,

  name: 'missing_languages',

  description:
    'Migrate missing languages per sharedId, according to the expected languages in the collection.',

  reindex: false,

  async up(db) {
    process.stdout.write(`${this.name}...\r\n`);

    const settings = await db.collection('settings').findOne({});
    const defaultLanguage = settings.languages.find(l => l.default).key;
    const expectedLanguages = new Set(settings.languages.map(l => l.key));

    const { sharedIdToMissing, sharedIdToAssigned } = await findMissing(
      db,
      expectedLanguages,
      defaultLanguage
    );

    console.log(sharedIdToMissing.size);
    console.log(sharedIdToAssigned);

    const assignedToSharedId = flipStringMap(sharedIdToAssigned);

    console.log(assignedToSharedId);
    this.reindex = Boolean(sharedIdToAssigned.size);
  },
};

export default migration;
