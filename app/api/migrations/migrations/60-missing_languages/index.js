import { inheritance } from './inheritance.js';
import { translator } from './translator.js';

const supportedLanguages = new Set([
  'da',
  'nl',
  'en',
  'fi',
  'fr',
  'de',
  'hu',
  'it',
  'nb',
  'pt',
  'ro',
  'ru',
  'es',
  'sv',
  'tr',
]);

const reverseStringRelation = dict => {
  const result = {};
  Object.entries(dict).forEach(([key, value]) => {
    if (!(value in result)) {
      result[value] = new Set([key]);
    } else {
      result[value].add(key);
    }
  });
  return result;
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
  delta: 60,

  name: 'missing_languages',

  description:
    'Migrate missing languages per sharedId, according to the expected languages in the collection.',

  reindex: false,

  batchLimit: 1000,

  sharedIdToMissing: {},
  sharedIdToAssigned: {},
  completedSharedIds: new Set(),
  assignedToSharedId: {},

  removeFromMappedSets(key, item) {
    const set = this.sharedIdToMissing[key];
    set.delete(item);
    if (set.size === 0) {
      delete this.sharedIdToMissing[key];
      delete this.sharedIdToAssigned[key];
      this.completedSharedIds.add(key);
    }
  },

  async findMissing(db) {
    const settings = await db.collection('settings').findOne({});
    const defaultLanguage = settings.languages.find(l => l.default).key;
    const expectedLanguages = new Set(settings.languages.map(l => l.key));

    this.sharedIdToMissing = {};
    this.sharedIdToAssigned = {};
    this.completedSharedIds = new Set();
    const entities = db
      .collection('entities')
      .find({}, { projection: { sharedId: 1, language: 1 } });

    await entities.forEach(entity => {
      const { sharedId, language } = entity;
      if (expectedLanguages.has(language) && !this.completedSharedIds.has(sharedId)) {
        if (!(sharedId in this.sharedIdToAssigned) || language === defaultLanguage) {
          this.sharedIdToAssigned[sharedId] = language;
        }

        if (!(sharedId in this.sharedIdToMissing)) {
          this.sharedIdToMissing[sharedId] = new Set(expectedLanguages);
          this.removeFromMappedSets(sharedId, language);
        } else {
          this.removeFromMappedSets(sharedId, language);
        }
      }
    });
    this.assignedToSharedId = Object.entries(reverseStringRelation(this.sharedIdToAssigned));
    this.reindex = Boolean(Object.keys(this.sharedIdToAssigned).length);
  },

  async buildResources(db) {
    await translator.build(db);
    await inheritance.build(db);
  },

  prepareLanguage(index) {
    const assignedLanguage = this.assignedToSharedId[index][0];
    const allSharedIds = Array.from(this.assignedToSharedId[index][1]);
    const sharedIdBatches = createBatches(allSharedIds, this.batchLimit);
    return [assignedLanguage, sharedIdBatches];
  },

  async processBatch(db, sharedIds, assignedLanguage) {
    const newEntities = [];
    const processedIds = new Set();
    const assignedEntities = await db
      .collection('entities')
      .find({ language: assignedLanguage, sharedId: { $in: sharedIds } })
      .toArray();
    await inheritance.prepareForBatch(
      db,
      assignedEntities,
      this.sharedIdToMissing,
      this.sharedIdToAssigned
    );
    await assignedEntities.forEach(entity => {
      if (!processedIds.has(entity.sharedId)) {
        const { sharedId } = entity;
        const newLanguages = Array.from(this.sharedIdToMissing[sharedId]);
        newLanguages.forEach(language => {
          const copy = {
            ...entity,
            language,
            mongoLanguage: supportedLanguages.has(language) ? language : 'none',
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
          processedIds.add(entity.sharedId);
        });
      }
    });

    if (newEntities.length > 0) {
      await db.collection('entities').insertMany(newEntities);
    }
  },

  async up(db) {
    process.stdout.write(`${this.name}...\r\n`);

    await this.findMissing(db);
    if (!this.reindex) {
      return;
    }

    await this.buildResources(db);

    for (let i = 0; i < this.assignedToSharedId.length; i += 1) {
      const [assignedLanguage, sharedIdBatches] = this.prepareLanguage(i);
      for (let j = 0; j < sharedIdBatches.length; j += 1) {
        const sharedIds = sharedIdBatches[j];
        // eslint-disable-next-line no-await-in-loop
        await this.processBatch(db, sharedIds, assignedLanguage);
      }
    }
  },
};

export default migration;
