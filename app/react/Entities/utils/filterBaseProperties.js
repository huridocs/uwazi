export default {
  filterBaseProperties: data => {
    const properties = [
      '_id',
      '__v',
      'language',
      'metadata',
      'sharedId',
      'template',
      'title',
      'icon',
      'type',
      'attachments',
      'documents',
      'metadataAttributes',
    ];
    return Object.assign({}, ...properties.map(p => ({ [p]: data[p] })));
  },
};
