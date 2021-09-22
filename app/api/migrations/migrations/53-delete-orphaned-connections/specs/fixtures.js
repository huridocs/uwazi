export default {
  entities: [
    {
      sharedId: 'sharedid1',
      title: 'test_doc',
    },
    {
      sharedId: 'sharedid2',
      title: 'test_doc_2',
    },
  ],
  connections: [
    {
      entity: 'sharedid3',
      hub: 'hub1',
    },
    {
      entity: 'sharedid1',
      hub: 'hub1',
    },
  ],
};
