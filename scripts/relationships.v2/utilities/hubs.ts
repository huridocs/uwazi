import { Collection, ObjectId } from "mongodb";

const batchsize = 1000;

type HubType = {
    _id: ObjectId;
  };
  
type ConnectionType = {
    _id: ObjectId;
    hub: ObjectId;
    entity: string;
    template: ObjectId;
};

const insertHubs = async (_ids: ObjectId[], hubCollection: Collection<HubType>) => {
    let ids = Array.from(new Set(_ids.map(id => id.toString())));
    const hubs = await hubCollection
      .find({ _id: { $in: ids.map(id => new ObjectId(id)) } })
      .toArray();
    const existing = new Set(hubs.map(({ _id }) => _id.toString()));
    ids = ids.filter(id => !existing.has(id));
    return hubCollection.insertMany(ids.map(id => ({ _id: new ObjectId(id) })));
};

const gatherHubs = async (connections: Collection<ConnectionType>, hubs: Collection<HubType>) => {
    process.stdout.write('Writing temporary hub collection...\n');
    const connectionsCursor = connections.find({}, { projection: { hub: 1 } });
  
    let toBeInserted: ObjectId[] = [];
    while (await connectionsCursor.hasNext()) {
      const next = (await connectionsCursor.next()) as ConnectionType;
      const { hub } = next;
      toBeInserted.push(hub);
      if (toBeInserted.length > batchsize) {
        await insertHubs(toBeInserted, hubs);
        toBeInserted = [];
      }
    }
    if (toBeInserted.length) await insertHubs(toBeInserted, hubs);
    process.stdout.write('Temporary hub collection done.\n');
};

export type { ConnectionType, HubType };
export { gatherHubs };