/* eslint-disable import/no-default-export */
import { Db } from 'mongodb';

const RELATIONTYPES_FILTER = { properties: { $exists: true } };
const CONNECTIONS_FILTER = { metadata: { $exists: true } };

export default {
  delta: 200,

  name: 'remove-legacy-relationshiptype-properties-and-connection-metadata',

  description:
    'Removes legacy relationtypes.properties and connections.metadata fields that are no longer used by the backend.',

  reindex: false,

  requiresSchema: 5,

  async up(db: Db) {
    process.stdout.write(`${this.name}...\r\n`);

    const relationtypesResult = await db
      .collection('relationtypes')
      .updateMany(RELATIONTYPES_FILTER, { $unset: { properties: '' } });

    const connectionsResult = await db
      .collection('connections')
      .updateMany(CONNECTIONS_FILTER, { $unset: { metadata: '' } });

    process.stdout.write(
      `${this.name}: removed properties from ${relationtypesResult.modifiedCount} relationtype(s), ` +
        `removed metadata from ${connectionsResult.modifiedCount} relationship(s).\r\n`
    );
  },
};
