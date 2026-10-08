import { PXEntityStatusModel } from '../../domain/PXEntityStatusModel.js';
import { PXEntityStatusRow } from './PXEntityStatusRow.js';

export class PostgresPXEntityStatusMapper {
  static toDomain(row: PXEntityStatusRow): PXEntityStatusModel {
    return {
      id: row._id,
      entitySharedId: row.entitySharedId,
      extractorId: row.extractorId,
      status: row.status,
    };
  }
}
