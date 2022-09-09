export default {
  delta: 106,

  name: 'reindex_if_topic_classification_active',

  description: 'reindex if topic classification is active to use fixed mappings',

  reindex: false,

  async up(db) {
    const entitiesWithSuggestedMetadata = await db
      .collection('entities')
      .countDocuments({ suggestedMetadata: { $exists: true } });

    if (entitiesWithSuggestedMetadata > 0) {
      this.reindex = true;
    }
  },
};
