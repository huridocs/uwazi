import { ObjectId } from 'mongodb';

import { PostgresDataSource } from '#api/core/infrastructure/postgresql/common/PostgresDataSource.js';
import { PostgresResultSet } from '#api/core/infrastructure/postgresql/common/PostgresResultSet.js';
import { PostgresTransactionManager } from '#api/core/infrastructure/postgresql/common/PostgresTransactionManager.js';
import { OperationalError } from '#api/common.v2/errors/OperationalError.js';
import { ResultSet } from '#api/core/application/contracts/ResultSet.js';

import {
  CreateInput,
  GetExistingInput,
  PXEntitiesStatusDataSource,
} from '../../domain/PXEntitiesStatusDataSource.js';
import { EntityStatus, PXEntityStatusModel } from '../../domain/PXEntityStatusModel.js';
import { PXValidationError } from '../../domain/PXValidationError.js';
import { PXEntityStatusRow } from './PXEntityStatusRow.js';
import { PostgresPXEntityStatusMapper } from './PostgresPXEntityStatusMapper.js';

type Deps = {
  tenantId: string;
  pgTransactionManager: PostgresTransactionManager;
};

const UNIQUE_VIOLATION = '23505';

export class PostgresPXEntitiesStatusDataSource
  extends PostgresDataSource<PXEntityStatusRow>
  implements PXEntitiesStatusDataSource
{
  constructor(deps: Deps) {
    super('px_entities_status', {
      tenantId: deps.tenantId,
      pgTransactionManager: deps.pgTransactionManager,
    });
  }

  async createWithStatus(input: CreateInput): Promise<PXEntityStatusModel> {
    const row: PXEntityStatusRow = {
      _id: new ObjectId().toString(),
      entitySharedId: input.entitySharedId,
      extractorId: input.extractorId,
      status: input.status,
    };

    try {
      await this.table.insert(row);
    } catch (e) {
      if ((e as { code?: string }).code === UNIQUE_VIOLATION) {
        throw new PXValidationError(
          PXValidationError.codes.CANNOT_CREATE_ENTITY_STATUS,
          'Cannot create an EntityStatus with duplicated extractorId and entitySharedId in this collection'
        );
      }
      throw e;
    }

    return PostgresPXEntityStatusMapper.toDomain(row);
  }

  async getById(entityStatusId: string): Promise<PXEntityStatusModel | undefined> {
    const row = await this.table.where({ _id: entityStatusId }).first();
    return row ? PostgresPXEntityStatusMapper.toDomain(row) : undefined;
  }

  async getExisting(input: GetExistingInput): Promise<PXEntityStatusModel | undefined> {
    let query = this.table;
    if (input.entitySharedId !== undefined) {
      query = query.where({ entitySharedId: input.entitySharedId });
    }
    if (input.extractorId !== undefined) {
      query = query.where({ extractorId: input.extractorId });
    }

    const row = await query.first();
    return row ? PostgresPXEntityStatusMapper.toDomain(row) : undefined;
  }

  async markAsError(entityStatusId: string): Promise<void> {
    const updatedIds = await this.table
      .where({ _id: entityStatusId })
      .update({ status: EntityStatus.Error });

    if (updatedIds.length === 0) {
      throw new OperationalError(
        `Can not change the status to '${EntityStatus.Error}' of an EntityStatus that does not exist. Id : ${entityStatusId}`
      );
    }
  }

  async markAsObsolete(entityStatusId: string): Promise<void> {
    const current = await this.table.where({ _id: entityStatusId }).first();

    if (current?.status === EntityStatus.New) {
      return;
    }

    await this.table.where({ _id: entityStatusId }).update({
      status:
        current?.status === EntityStatus.Processing
          ? EntityStatus.ProcessingObsolete
          : EntityStatus.Obsolete,
    });
  }

  async markAsProcessing(entityStatusId: string): Promise<void> {
    const updatedIds = await this.table
      .where({ _id: entityStatusId })
      .update({ status: EntityStatus.Processing });

    if (updatedIds.length === 0) {
      throw new OperationalError(
        `Cannot change status to '${EntityStatus.Processing}' of a EntityStatus that does not exist. entityStatusId: ${entityStatusId}`
      );
    }
  }

  async markAsProcessed(entityStatusId: string): Promise<void> {
    const current = await this.table.where({ _id: entityStatusId }).first();

    const newStatus =
      current?.status === EntityStatus.ProcessingObsolete
        ? EntityStatus.Obsolete
        : EntityStatus.Processed;

    await this.table.where({ _id: entityStatusId }).update({ status: newStatus });
  }

  async delete(entityStatusId: string): Promise<void> {
    await this.table.where({ _id: entityStatusId }).delete();
  }

  async deleteBySourceEntity(entitySharedId: string): Promise<void> {
    await this.table.where({ entitySharedId }).delete();
  }

  getAll(input: Partial<PXEntityStatusModel>): ResultSet<PXEntityStatusModel> {
    let query = this.table.query<PXEntityStatusRow>();
    if (input.entitySharedId !== undefined) {
      query = query.where({ entitySharedId: input.entitySharedId });
    }
    if (input.extractorId !== undefined) {
      query = query.where({ extractorId: input.extractorId });
    }
    if (input.status !== undefined) {
      query = query.where({ status: input.status });
    }

    return new PostgresResultSet(query.stream(), PostgresPXEntityStatusMapper.toDomain);
  }
}
