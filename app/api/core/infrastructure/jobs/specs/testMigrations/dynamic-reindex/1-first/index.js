export default {
  delta: 1,
  reindex: false,

  // mimics migration 205: the flag is recomputed from this tenant's own result so
  // the cached module cannot leak a stale `true` from a previous tenant
  async up(db) {
    const deleted = await db.collection('migrationProbe').deleteMany({});
    this.reindex = deleted.deletedCount > 0;
  },
};
