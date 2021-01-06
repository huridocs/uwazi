import mongodb from 'mongodb';

const mongoUri = 'mongodb://localhost/';
const client = new mongodb.MongoClient(mongoUri, { useUnifiedTopology: true });

const fixNames = async () => {
  console.log('Fixing logs...');
  try {
    await client.connect();
    const database = client.db('uwazi_development');
    const entities = database.collection('entities');
    const logs = database.collection('updatelogs');

    const entityIds = await entities.find({}, { title: 1 }).toArray();
    const onlyIds = entityIds.reduce((memo, entity) => {
      memo.push(entity._id.toString());
      return memo;
    }, []);
    console.log(onlyIds);

    const cursor = logs.find({ namespace: 'entities' });

    let log;
    let fixed = 0;

    while ((log = await cursor.next())) {
      if (!onlyIds.includes(log.mongoId.toString())) {
        await logs.deleteOne({ _id: log._id });
        console.log('Deleted:', log._id);
        fixed += 1;
      }
      // process.stdout.write(`Fixing: ${object.metadata.object_id[0].value}\r`);
      // if (object.title.indexOf('|') !== -1) {
      //   fixed += 1;
      // }
    }
    process.stdout.write('\r\n');

    console.log('Fixed', fixed, 'objects.');
    await client.close();
  } catch (err) {
    await client.close();
    throw err;
  }
};

fixNames();
