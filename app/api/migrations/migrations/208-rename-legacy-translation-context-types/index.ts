import { Db } from 'mongodb';

// eslint-disable-next-line import/no-default-export
export default {
  delta: 208,

  name: 'rename-legacy-translation-context-types',

  description:
    'Renames leftover translationsV2 context.type values Document to Entity and Dictionary to Thesaurus so they pass the collection validator from 207 and the Postgres translations CHECK.',

  reindex: false,

  requiresSchema: 15,

  async up(db: Db) {
    process.stdout.write(`${this.name}...\r\n`);

    const documents = await db
      .collection('translationsV2')
      .updateMany({ 'context.type': 'Document' }, { $set: { 'context.type': 'Entity' } });

    process.stdout.write(
      `${this.name}: renamed ${documents.modifiedCount} Document context(s) to Entity.\r\n`
    );

    const dictionaries = await db
      .collection('translationsV2')
      .updateMany({ 'context.type': 'Dictionary' }, { $set: { 'context.type': 'Thesaurus' } });

    process.stdout.write(
      `${this.name}: renamed ${dictionaries.modifiedCount} Dictionary context(s) to Thesaurus.\r\n`
    );
  },
};
