import { cursorTo } from 'readline';

export default {
  delta: 36,

  name: 'populate-mimetype-to-attachment',

  description: 'Populates mimetype of an attachment from a url ',

  async up(db) {
    process.stdout.write(`${this.name}...\r\n`);
    const cursor = await db.collection('files').find();

    // eslint-disable-next-line no-await-in-loop
    while (await cursor.hasNext()) {
      const file = cursor.next();
      if (file.url && !file.mimetype) {
        //
      }
    }
  },
};
