export default {
  delta: 51,

  name: 'remove-pdfinfo-property',

  description:
    'pdfInfo property is not part of entity anymore, to pass  AdditionalProperties false validation this will remove that property',

  async up(db) {
    process.stdout.write(`${this.name}...\r\n`);

    let modifiedCount = 0;
    ({ modifiedCount } = await db
      .collection('entities')
      .updateMany({}, { $unset: { pdfInfo: 1 } }));

    process.stdout.write(`${modifiedCount} entities updated...\r\n`);

    ({ modifiedCount } = await db.collection('files').updateMany({}, { $unset: { pdfInfo: 1 } }));

    process.stdout.write(`${modifiedCount} files updated...\r\n`);
  },
};
