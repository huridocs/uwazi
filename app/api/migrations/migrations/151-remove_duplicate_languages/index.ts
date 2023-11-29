/* eslint-disable no-await-in-loop */
import _ from 'lodash';
import { Db, ObjectId } from 'mongodb';

import { Entity, Page, Settings } from './types';

export default {
  delta: 151,

  name: 'remove_duplicate_languages',

  description: 'Remove duplicate languages from settings, entities and pages.',

  reindex: false,

  async removeDuplicatedLanguagesFromSettings(db: Db) {
    const settingsCollection = db.collection<Settings>('settings');
    const [settings] = await settingsCollection.find().toArray();
    const languages = settings.languages || [];
    const byKey = _.groupBy(languages, 'key');
    const remainingLanguages = Object.values(byKey).map(
      langList => langList.find(l => l.default) || langList[0]
    );
    await settingsCollection.updateOne(
      { _id: settings._id },
      { $set: { languages: remainingLanguages } }
    );
  },

  // eslint-disable-next-line max-statements
  async removeDuplicationFromCollection(db: Db, collectionName: string) {
    const collection = db.collection<Page | Entity>(collectionName);
    const cursor = collection.find({});
    const seenIndices: Set<string> = new Set();
    const idsToRemove: ObjectId[] = [];

    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      if (
        doc &&
        doc.sharedId &&
        doc.language &&
        doc._id &&
        typeof doc.sharedId === 'string' &&
        typeof doc.language === 'string'
      ) {
        const index = `${doc.sharedId}_${doc.language}`;
        if (seenIndices.has(index)) {
          idsToRemove.push(doc._id);
        } else {
          seenIndices.add(index);
        }
      }
    }

    if (idsToRemove.length) {
      await collection.deleteMany({ _id: { $in: idsToRemove } });
    }

    return idsToRemove.length;
  },

  async up(db: Db) {
    process.stdout.write(`${this.name}...\r\n`);

    await this.removeDuplicatedLanguagesFromSettings(db);
    await this.removeDuplicationFromCollection(db, 'pages');
    const removedEntitiesCount = await this.removeDuplicationFromCollection(db, 'entities');
    this.reindex = removedEntitiesCount > 0;
  },
};
