/* eslint-disable class-methods-use-this */
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { LanguageUtils } from '#shared/language/index.js';
import type {
  RelationshipAnchor,
  RelationshipResolved,
  RelationshipSummary,
  SelectionRect,
} from '#shared/contracts/Relationships.js';
import { EntityNotFoundError } from '#api/core/domain/entity/errors.js';
import { EntitiesDAO } from '#api/core/application/contracts/EntitiesDAO.js';
import { MongoFilesDAO } from '#api/core/infrastructure/mongodb/files/MongoFilesDAO.js';
import {
  MongoRelationshipsV1DataSource,
  type HubConnection,
} from '#api/core/infrastructure/mongodb/MongoRelationshipsV1DataSource.js';

type Deps = {
  entitiesDAO: EntitiesDAO;
  filesDAO: MongoFilesDAO;
  relationshipsDataSource: MongoRelationshipsV1DataSource;
};

type EntityLabel = {
  title: string;
  template: string;
};

type ReadableHubRow = RelationshipSummary & {
  reference?: {
    text: string;
    selectionRectangles: SelectionRect[];
  };
};

type RelationshipsQuery = {
  sharedId: string;
  language: LanguageISO6391;
};

type GetSummaryInput = RelationshipsQuery;
type GetResolvedInput = RelationshipsQuery;
type GetAnchorsInput = RelationshipsQuery & { file: string };

type ToReadableRowParams = {
  connection: HubConnection;
  entityData: EntityLabel;
};

type KeepHubsWithSourceParams = {
  connections: HubConnection[];
  sharedId: string;
};

type ReadableRowsFromConnectionsParams = {
  connections: HubConnection[];
  sharedId: string;
  language: LanguageISO6391;
};

type ReadableFileIdsParams = {
  connections: HubConnection[];
  language: LanguageISO6391;
};

type EntityDataBySharedIdParams = {
  connections: HubConnection[];
  language: LanguageISO6391;
};

type LoadReadableHubRowsParams = {
  sharedId: string;
  language: LanguageISO6391;
};

class RelationshipsQueryService {
  constructor(private deps: Deps) {}

  async getSummary(input: GetSummaryInput): Promise<RelationshipSummary[]> {
    const rows = await this.loadReadableHubRows(input);
    return rows.map(row => ({
      _id: row._id,
      hub: row.hub,
      entity: row.entity,
      template: row.template,
      ...(row.file ? { file: row.file } : {}),
      entityData: row.entityData,
    }));
  }

  async getAnchors(input: GetAnchorsInput): Promise<RelationshipAnchor[]> {
    const rows = await this.loadReadableHubRows(input);
    const result: RelationshipAnchor[] = [];
    rows.forEach(row => {
      if (row.file !== input.file) return;
      const first = row.reference?.selectionRectangles[0];
      if (!first) return;
      const selectionRectangles: readonly [SelectionRect] = [first];
      result.push({ _id: row._id, reference: { selectionRectangles } });
    });
    return result;
  }

  async getResolved(input: GetResolvedInput): Promise<RelationshipResolved[]> {
    const rows = await this.loadReadableHubRows(input);
    const result: RelationshipResolved[] = [];
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

  private async loadReadableHubRows({
    sharedId,
    language,
  }: LoadReadableHubRowsParams): Promise<ReadableHubRow[]> {
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

    return this.readableRowsFromConnections({ connections, sharedId, language });
  }

  private async readableRowsFromConnections({
    connections,
    sharedId,
    language,
  }: ReadableRowsFromConnectionsParams): Promise<ReadableHubRow[]> {
    const fileIds = await this.readableFileIds({ connections, language });
    const kept = this.keepHubsWithSource({
      connections: connections.filter(
        connection => !connection.file || fileIds.has(connection.file)
      ),
      sharedId,
    });
    if (kept.length === 0) {
      return [];
    }

    const entityData = await this.entityDataBySharedId({ connections: kept, language });
    const rows = kept.flatMap(connection => {
      const data = entityData.get(connection.entity);
      return data ? [this.toReadableRow({ connection, entityData: data })] : [];
    });
    return this.dropSingletonHubs(this.dropRedundantEntityRows(rows));
  }

  private async readableFileIds({
    connections,
    language,
  }: ReadableFileIdsParams): Promise<Set<string>> {
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

  private async entityDataBySharedId({
    connections,
    language,
  }: EntityDataBySharedIdParams): Promise<Map<string, EntityLabel>> {
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

  private dropRedundantEntityRows(rows: ReadableHubRow[]): ReadableHubRow[] {
    const withFile = new Set(rows.filter(row => row.file).map(row => `${row.hub}:${row.entity}`));
    return rows.filter(row => row.file || !withFile.has(`${row.hub}:${row.entity}`));
  }

  private dropSingletonHubs(rows: ReadableHubRow[]): ReadableHubRow[] {
    const counts = new Map<string, number>();
    rows.forEach(row => counts.set(row.hub, (counts.get(row.hub) ?? 0) + 1));
    return rows.filter(row => (counts.get(row.hub) ?? 0) >= 2);
  }

  private keepHubsWithSource({ connections, sharedId }: KeepHubsWithSourceParams): HubConnection[] {
    const hubs = new Set(
      connections
        .filter(connection => connection.entity === sharedId)
        .map(connection => connection.hub)
    );
    return connections.filter(connection => hubs.has(connection.hub));
  }

  private toReadableRow({ connection, entityData }: ToReadableRowParams): ReadableHubRow {
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
}

export { RelationshipsQueryService };
