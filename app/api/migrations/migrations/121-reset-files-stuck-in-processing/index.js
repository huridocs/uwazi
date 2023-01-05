export default {
  delta: 121,

  name: 'reset-files-stuck-in-processing',

  description:
    'The migration resets the status of files stuck on "processing" according to the fullText property value',

  reindex: false,

  async up(db) {
    process.stdout.write(`${this.name}...\r\n`);

    const stuckFiles = await db
      .collection('files')
      .find({
        $and: [{ status: { $exists: true } }, { status: 'processing' }],
      })
      .toArray();

    if (stuckFiles.length) {
      this.reindex = true;

      const withText = [];
      const withoutText = [];

      stuckFiles.forEach(file => {
        if (Object.keys(file).includes('fullText')) {
          withText.push(file._id);
        } else {
          withoutText.push(file._id);
        }
      });

      if (withText.length) {
        await db
          .collection('files')
          .updateMany({ _id: { $in: withText } }, { $set: { status: 'ready' } });
      }

      if (withoutText.length) {
        await db
          .collection('files')
          .updateMany({ _id: { $in: withoutText } }, { $set: { status: 'failed' } });
      }
    }
  },
};
