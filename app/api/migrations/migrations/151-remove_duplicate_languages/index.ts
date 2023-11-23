import _ from 'lodash';
import { Db } from 'mongodb';

import { Settings } from './types';

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

  async up(db: Db) {
    process.stdout.write(`${this.name}...\r\n`);

    await this.removeDuplicatedLanguagesFromSettings(db);
  },
};
