const run = () => {
  console.log(`Current db is: ${db.getName()}`);

  const MISSING_ID = new ObjectId('5f3f937eee015104c8aaee26');

  const NOWSTAMP = Date.now();
  let stampCount = 0;

  const timestamp = () => {
    stampCount += 1;
    return NOWSTAMP + stampCount;
  };

  const recoveredType = {
    _id: MISSING_ID,
    name: 'RECOVERED TYPE',
    properties: [],
    __v: 0,
  };

  const translationKeys = [
    {
      _id: new ObjectId(),
      language: 'en',
      key: 'RECOVERED TYPE',
      value: 'RECOVERED TYPE',
      context: {
        type: 'Relationship Type',
        label: 'RECOVERED TYPE',
        id: '5f3f937eee015104c8aaee26',
      },
    },
    {
      _id: new ObjectId(),
      language: 'ko',
      key: 'RECOVERED TYPE',
      value: 'RECOVERED TYPE',
      context: {
        type: 'Relationship Type',
        label: 'RECOVERED TYPE',
        id: '5f3f937eee015104c8aaee26',
      },
    },
  ];

  const translationsUpdateLogs = [
    {
      namespace: 'translationsV2',
      deleted: false,
      mongoId: translationKeys[0]._id,
      timestamp: timestamp(),
    },
    {
      namespace: 'translationsV2',
      deleted: false,
      mongoId: translationKeys[1]._id,
      timestamp: timestamp(),
    },
  ];

  db.relationtypes.insertOne(recoveredType);

  db.translationsV2.insertMany(translationKeys);

  db.updatelogs.insertMany(translationsUpdateLogs);

  db.updatelogs.updateOne(
    { mongoId: MISSING_ID },
    { $set: { deleted: false, timestamp: timestamp() } }
  );
};

run();
