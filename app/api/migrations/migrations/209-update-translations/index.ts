/* eslint-disable import/no-default-export */
import { Db } from 'mongodb';

interface Translation {
  key: string;
}

const newKeys: Translation[] = [
  { key: 'Copy from' },
  { key: 'values are staged, not saved' },
  { key: 'Search by title' },
  { key: 'Any type' },
  { key: 'Copy from this entity' },
  { key: 'Pick another' },
];

const deletedKeys: Translation[] = [];

export default {
  delta: 209,

  reindex: false,

  name: 'update_translations',

  description: 'Adds System UI translations for V2 Copy from.',

  async up(db: Db) {
    const settings = await db.collection('settings').findOne();
    const languages = (settings?.languages || [])
      .map((l: any) => l.key)
      .filter((value: string, index: number, array: any[]) => array.indexOf(value) === index);

    await db.collection('translationsV2').deleteMany({
      key: { $in: deletedKeys.concat(newKeys).map(k => k.key) },
      'context.id': 'System',
    });

    if (newKeys.length > 0) {
      const insertMany = languages.map(async (l: any) =>
        db.collection('translationsV2').insertMany(
          newKeys.map(k => ({
            key: k.key,
            value: k.key,
            language: l,
            context: { id: 'System', type: 'Uwazi UI', label: 'User Interface' },
          }))
        )
      );
      await Promise.all(insertMany);
    }

    process.stdout.write(`${this.name}...\r\n`);
  },
};

export { newKeys, deletedKeys };
