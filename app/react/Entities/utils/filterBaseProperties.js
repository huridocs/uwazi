export default {
  filterBaseProperties: (data) => {
    const properties = ['_id', 'language', 'metadata', 'sharedId', 'template', 'title', 'icon', 'type'];
    return Object.assign({}, ...properties.map(p => ({ [p]: data[p] })));
  }
};
