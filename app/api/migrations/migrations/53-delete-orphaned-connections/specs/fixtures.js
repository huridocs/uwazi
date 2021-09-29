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
    {
      sharedId: 'sharedid1',
      title: 'test_doc',
    },
    {
      sharedId: 'sharedid3',
      title: 'test_doc_2',
    },
    {
      sharedId: 'sharedid1',
      title: 'test_doc',
    },
    {
      sharedId: 'sharedid3',
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
    {
      entity: 'sharedid2',
      hub: 'hub1',
    },
    {
      entity: 'sharedid3',
      hub: 'hub2',
    },
    {
      entity: 'sharedid1',
      hub: 'hub3',
    },
    {
      entity: 'shareid4',
      hub: 'hub3',
    },
  ],
};
