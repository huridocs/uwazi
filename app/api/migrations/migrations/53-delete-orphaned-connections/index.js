/* eslint-disable no-await-in-loop */
export default {
  delta: 53,

  name: 'delete-orphaned-connections',

  description: 'Removes all orphaned connections',

  async up(db) {
    // For every connection, check if the entity connected exists
    // If the entity does not exist, delete the connection
    // Check whether there is only one connections in the hub contained in the connection
    // If there is only one connection, delete that connection
    const cursor = await db.collection('connections').find({});

    while (await cursor.hasNext()) {
      const connection = await cursor.next();
      const { hub: hubId, entity: sharedId } = connection;

      // Checking if entity exists
      const entity = await db.collection('entities').findOne({ sharedId });
      if (!entity) {
        await db.collection('connections').deleteOne({ _id: connection._id });
      }

      const connectionsInHub = await db.collection('connections').find({ hub: hubId });
      const count = await connectionsInHub.count();
      if (count === 1) {
        const { _id } = await connectionsInHub.next();
        await db.collection('connections').deleteOne({ _id });
      }
    }
  },
};
