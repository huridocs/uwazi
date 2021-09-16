export default {
  delta: 51,

  name: 'remove-pdfinfo-property',

  description:
    'pdfInfo property is not part of entity anymore, to pass  AdditionalProperties false validation this will remove that property',

  async up(db) {
    process.stdout.write(`${this.name}...\r\n`);

    const { modifiedEntitiesCount } = await db
      .collection('entities')
      .updateMany({}, { $unset: { pdfInfo: 1 } });

    process.stdout.write(`${modifiedEntitiesCount} entities updated...\r\n`);

    const { modifiedFilesCount } = await db
      .collection('files')
      .updateMany({}, { $unset: { pdfInfo: 1 } });

    process.stdout.write(`${modifiedFilesCount} files updated...\r\n`);
  },
};
