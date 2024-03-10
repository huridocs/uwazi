/* eslint-disable import/no-default-export */
import { Db } from 'mongodb';

interface Translation {
  key: string;
}

const newKeys: Translation[] = [];

const deletedKeys: Translation[] = [
  { key: '2fa QA scan tip' },
  { key: '2fa add account tip' },
  { key: 'Activate this feature for enhanced account security' },
  { key: 'Enter the 6-digit verification code generated by your Authenticator app:' },
  { key: 'Install the Google Authenticator app on your mobile device' },
  { key: 'Or enter this secret key into your Authenticator app' },
  { key: 'Two-step verification successfully' },
  { key: 'Using Google Authenticator' },
  { key: 'secret key recommendation' },
];

export default {
  delta: 162,

  reindex: false,

  name: 'update_translations',

  description: 'Updates some translations in settings',

  async up(db: Db) {
    const settings = await db.collection('settings').findOne();
    const languages = settings?.languages
      .map((l: any) => l.key)
      .filter((value: string, index: number, array: any[]) => array.indexOf(value) === index);

    await db.collection('translationsV2').deleteMany({
      key: { $in: deletedKeys.concat(newKeys).map(k => k.key) },
      'context.id': 'System',
    });

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

    process.stdout.write(`${this.name}...\r\n`);
  },
};

export { newKeys, deletedKeys };
