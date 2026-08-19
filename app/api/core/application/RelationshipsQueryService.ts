import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { LanguageUtils } from '#shared/language/index.js';
import { EntityNotFoundError } from '../domain/entity/errors.js';
import { EntitiesDAO } from './contracts/EntitiesDAO.js';
import {
  RelationshipAnchorDTO,
  RelationshipResolvedDTO,
  RelationshipSummaryDTO,
  SelectionRectDTO,
} from './RelationshipQueryDTOs.js';

type HubConnection = {
  _id: string;
  hub: string;
  entity: string;
  template: string | null;
  file?: string;
  reference?: {
    text: string;
    selectionRectangles?: SelectionRectDTO[];
  };
};

type FilesPort = {
  getByEntitySharedIds(
    sharedIds: string[],
    options: {
      types: ['document'];
      languages: string[];
      projection: { _id: 1 };
    }
  ): Promise<readonly { _id: { toString(): string } }[]>;
};

type RelationshipsPort = {
  getHubConnectionsForEntity(sharedId: string): Promise<HubConnection[]>;
};

type Deps = {
  entitiesDAO: EntitiesDAO;
  filesDAO: FilesPort;
  relationshipsDataSource: RelationshipsPort;
};

type EntityLabel = {
  title: string;
  template: string;
};

type ReadableHubRow = RelationshipSummaryDTO & {
  reference?: {
    text: string;
    selectionRectangles: SelectionRectDTO[];
  };
};

function uniqueById(rows: ReadableHubRow[]): ReadableHubRow[] {
  const seen = new Set<string>();
  return rows.filter(row => {
    if (seen.has(row._id)) return false;
    seen.add(row._id);
    return true;
  });
}

function dropRedundantEntityRows(rows: ReadableHubRow[]): ReadableHubRow[] {
  const withFile = new Set(rows.filter(row => row.file).map(row => `${row.hub}:${row.entity}`));
  return rows.filter(row => row.file || !withFile.has(`${row.hub}:${row.entity}`));
}

function dropSingletonHubs(rows: ReadableHubRow[]): ReadableHubRow[] {
  const counts = new Map<string, number>();
  rows.forEach(row => counts.set(row.hub, (counts.get(row.hub) ?? 0) + 1));
  return rows.filter(row => (counts.get(row.hub) ?? 0) >= 2);
}

function keepHubsWithSource(connections: HubConnection[], sharedId: string): HubConnection[] {
  const hubs = new Set(
    connections
      .filter(connection => connection.entity === sharedId)
      .map(connection => connection.hub)
  );
  return connections.filter(connection => hubs.has(connection.hub));
}

function toReadableRow(connection: HubConnection, entityData: EntityLabel): ReadableHubRow {
  return {
    _id: connection._id,
    hub: connection.hub,
    entity: connection.entity,
    template: connection.template,
    ...(connection.file ? { file: connection.file } : {}),
    ...(connection.reference
      ? {
          reference: {
            text: connection.reference.text,
            selectionRectangles: (connection.reference.selectionRectangles ?? []).map(rect => ({
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height,
              page: rect.page,
            })),
          },
        }
      : {}),
    entityData,
  };
}

class RelationshipsQueryService {
  constructor(private deps: Deps) {}

  async getSummary(input: {
    sharedId: string;
    language: LanguageISO6391;
  }): Promise<RelationshipSummaryDTO[]> {
    const rows = await this.loadReadableHubRows(input.sharedId, input.language);
    return rows.map(row => ({
      _id: row._id,
      hub: row.hub,
      entity: row.entity,
      template: row.template,
      ...(row.file ? { file: row.file } : {}),
      entityData: row.entityData,
    }));
  }

  async getAnchors(input: {
    sharedId: string;
    file: string;
    language: LanguageISO6391;
  }): Promise<RelationshipAnchorDTO[]> {
    const rows = await this.loadReadableHubRows(input.sharedId, input.language);
    const result: RelationshipAnchorDTO[] = [];
    rows.forEach(row => {
      if (row.file !== input.file) return;
      const first = row.reference?.selectionRectangles[0];
      if (!first) return;
      const selectionRectangles: readonly [SelectionRectDTO] = [first];
      result.push({ _id: row._id, reference: { selectionRectangles } });
    });
    return result;
  }

  async getResolved(input: {
    sharedId: string;
    language: LanguageISO6391;
  }): Promise<RelationshipResolvedDTO[]> {
    const rows = await this.loadReadableHubRows(input.sharedId, input.language);
    const result: RelationshipResolvedDTO[] = [];
    rows.forEach(row => {
      if (!row.reference) return;
      result.push({
        _id: row._id,
        reference: {
          text: row.reference.text,
          selectionRectangles: row.reference.selectionRectangles,
        },
      });
    });
    return result;
  }

  private async loadReadableHubRows(
    sharedId: string,
    language: LanguageISO6391
  ): Promise<ReadableHubRow[]> {
    const source = await this.deps.entitiesDAO.findOne(
      { sharedId, language },
      { select: ['sharedId', 'title', 'template'] }
    );
    if (!source) {
      throw new EntityNotFoundError(sharedId);
    }

    const connections =
      await this.deps.relationshipsDataSource.getHubConnectionsForEntity(sharedId);
    if (connections.length === 0) {
      return [];
    }

    return this.readableRowsFromConnections(connections, sharedId, language);
  }

  private async readableRowsFromConnections(
    connections: HubConnection[],
    sharedId: string,
    language: LanguageISO6391
  ): Promise<ReadableHubRow[]> {
    const fileIds = await this.readableFileIds(connections, language);
    const kept = keepHubsWithSource(
      connections.filter(connection => !connection.file || fileIds.has(connection.file)),
      sharedId
    );
    if (kept.length === 0) {
      return [];
    }

    const entityData = await this.entityDataBySharedId(kept, language);
    const rows = kept.flatMap(connection => {
      const data = entityData.get(connection.entity);
      return data ? [toReadableRow(connection, data)] : [];
    });
    return dropSingletonHubs(dropRedundantEntityRows(uniqueById(rows)));
  }

  private async readableFileIds(
    connections: HubConnection[],
    language: LanguageISO6391
  ): Promise<Set<string>> {
    const files = await this.deps.filesDAO.getByEntitySharedIds(
      [...new Set(connections.map(connection => connection.entity))],
      {
        types: ['document'],
        languages: [LanguageUtils.fromISO639_1(language).ISO639_3],
        projection: { _id: 1 },
      }
    );
    return new Set(files.map(file => String(file._id)));
  }

  private async entityDataBySharedId(
    connections: HubConnection[],
    language: LanguageISO6391
  ): Promise<Map<string, EntityLabel>> {
    const entities = await this.deps.entitiesDAO.find(
      { sharedIds: [...new Set(connections.map(connection => connection.entity))], language },
      { select: ['sharedId', 'title', 'template'] }
    );
    const entries: [string, EntityLabel][] = [];
    entities.forEach(entity => {
      if (!entity.template) return;
      entries.push([entity.sharedId, { title: entity.title, template: String(entity.template) }]);
    });
    return new Map(entries);
  }
}

export { RelationshipsQueryService };
