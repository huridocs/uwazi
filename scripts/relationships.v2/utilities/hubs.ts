import _ from "lodash";

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

type ConnectionWithEntityInfoType = ConnectionType & { entityTemplateId: ObjectId, entityTitle: string, transformable?: boolean};

const insertHubs = async (_ids: ObjectId[], hubCollection: Collection<HubType>) => {
    let ids = Array.from(new Set(_ids.map(id => id.toString())));
    const hubs = await hubCollection
      .find({ _id: { $in: ids.map(id => new ObjectId(id)) } })
      .toArray();
    const existing = new Set(hubs.map(({ _id }) => _id.toString()));
    ids = ids.filter(id => !existing.has(id));
    return hubCollection.insertMany(ids.map(id => ({ _id: new ObjectId(id) })));
};

const gatherHubs = async (connections: Collection<ConnectionType>, hubs: Collection<HubType>, limit?: number) => {
    process.stdout.write('Writing temporary hub collection...\n');
    const cursorOptions: { projection: { hub: number }, limit?: number } = { projection: { hub: 1 } };
    if (limit) cursorOptions.limit = limit;
    const connectionsCursor = connections.find({}, cursorOptions);
  
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

const getConnectionsFromHub = (hub: HubType, connectionsCollection: Collection<ConnectionType>) => connectionsCollection.aggregate<ConnectionWithEntityInfoType>([
  {
      $match: { hub: hub._id }
  },
  {
      $lookup: {
          from: 'entities',
          localField: 'entity',
          foreignField: 'sharedId',
          as: 'entityInfo'
      }
  },
  {
      $set: {
          pickedEntity: { $arrayElemAt: ['$entityInfo', 0] }
      }
  },
  {
      $set: {
          entityTemplateId: '$pickedEntity.template',
          entityTitle: '$pickedEntity.title'
      }
  },
  {
      $unset: ['entityInfo', 'pickedEntity']
  }
  ]).toArray();

const countRelTypeGroups = (connections: ConnectionWithEntityInfoType[]) => {
    const groups = _.groupBy(connections, c => c.template?.toHexString());
    const groupCounts = Object.fromEntries(Object.entries(groups).map(([type, group]) => [type, group.length]));
    return {groups, groupCounts};
}

const countEntityTemplateGroups = (connections: ConnectionWithEntityInfoType[]) => {
  const groups = _.groupBy(connections, c => c.entityTemplateId?.toHexString());
  const groupCounts = Object.fromEntries(Object.entries(groups).map(([template, group]) => [template, group.length]));
  return {groups, groupCounts};  
}

export type { ConnectionType, ConnectionWithEntityInfoType, HubType };
export { countEntityTemplateGroups, countRelTypeGroups, gatherHubs, getConnectionsFromHub };