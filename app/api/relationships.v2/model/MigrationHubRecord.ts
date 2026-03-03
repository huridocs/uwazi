import { ReadableV1Connection } from './V1Connection.js';

class MigrationHubRecord {
  hubId: string;

  connections: ReadableV1Connection[];

  constructor(hubId: string, connections: ReadableV1Connection[]) {
    this.hubId = hubId;
    this.connections = connections;
  }
}

export { MigrationHubRecord };
