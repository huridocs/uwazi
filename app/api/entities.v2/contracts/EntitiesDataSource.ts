import { ResultSet } from 'api/common.v2/contracts/ResultSet';
import { Entity } from '../model/Entity';

export interface EntitiesDataSource {
  entitiesExist(sharedIds: string[]): Promise<boolean>;
  getByIds(sharedIds: string[]): ResultSet<Entity>;
  markMetadataAsChanged(
    propData: { sharedId: string; propertiesToBeMarked: string[] }[]
  ): Promise<void>;
}
