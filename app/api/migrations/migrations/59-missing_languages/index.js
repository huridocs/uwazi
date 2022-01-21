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

    const assignedToSharedId = Array.from(flipStringMap(sharedIdToAssigned).entries());

    this.reindex = Boolean(sharedIdToAssigned.size);

    const newEntities = [];

    for (let i = 0; i < assignedToSharedId.length; i += 1) {
      const assignedLanguage = assignedToSharedId[i][0];
      const sharedIds = Array.from(assignedToSharedId[i][1]);
      console.log(assignedLanguage);
      console.log(sharedIds);

      const assignedEntities = db
        .collection('entities')
        .find({ language: assignedLanguage, sharedId: { $in: sharedIds } });
      // eslint-disable-next-line no-await-in-loop
      await assignedEntities.forEach(entity => {
        const sharedId = entity.sharedId;
        const newLanguages = Array.from(sharedIdToMissing.get(sharedId));
        newLanguages.forEach(language => {
          const copy = { ...entity, language, mongoLanguage: language };
          delete copy._id;
          newEntities.push(copy);
        });
      });
    }

    if (newEntities.length > 0) {
      await db.collection('entities').insert(newEntities);
    }

    // console.log(newEntities);
    console.log(sharedIdToMissing);
    // console.log(sharedIdToAssigned);
    // console.log(assignedToSharedId);
  },
};

export default migration;
