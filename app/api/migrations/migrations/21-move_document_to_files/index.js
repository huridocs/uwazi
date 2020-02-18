/* eslint-disable no-await-in-loop */
export default {
  delta: 21,

  name: 'move_document_to_files',

  description: 'move document from the entity to the files collection',

  async up(db) {
    process.stdout.write(`${this.name}...\r\n`);

    const cursor = db.collection('entities').find({});

    let index = 1;

    while (await cursor.hasNext()) {
      const entity = await cursor.next();
      if (entity.file) {
        const { file, toc, fullText, processed, totalPages, pdfInfo, ...newEntity } = entity;

        const fileToCreate = {
          type: 'document',
          toc,
          fullText,
          processed,
          totalPages,
          pdfInfo,
          entity: entity.sharedId,
          ...file,
        };

        const [alreadyExists] = await db
          .collection('files')
          .find({ entity: entity.sharedId, filename: entity.file.filename })
          .toArray();

        if (!alreadyExists) {
          await db.collection('files').save(fileToCreate);
        }
        await db.collection('entities').update({ _id: entity._id }, newEntity);

        process.stdout.write(` -> processed: ${index} \r`);
        index += 1;
      }
    }

    process.stdout.write('\r\n');
  },
};
