import { EntityStatus } from '../domain/PXEntityStatusModel';
import { EntityStatusDTO } from '../types';

export class PXEntityStatusMapper {
  static toDTO(status: EntityStatus): EntityStatusDTO {
    switch (status) {
      case EntityStatus.Error:
        return EntityStatusDTO.Error;

      case EntityStatus.New:
        return EntityStatusDTO.New;

      case EntityStatus.Obsolete:
        return EntityStatusDTO.Obsolete;

      case EntityStatus.Processed:
        return EntityStatusDTO.Processed;

      case EntityStatus.ProcessingObsolete:
        return EntityStatusDTO.Processing;

      case EntityStatus.Processing:
        return EntityStatusDTO.Processing;

      default:
        throw new Error(`Unknown status: ${status}`);
    }
  }
}
