import { ResultSet } from 'api/common.v2/contracts/ResultSet';
import { Entity } from '../model/Entity';

export interface EntitiesDataSource {
  entitiesExist(sharedIds: string[]): Promise<boolean>;
  getByIds(sharedIds: string[]): ResultSet<Entity>;
  getByDenormalizedId(properties: string[], sharedIds: string[]): ResultSet<string>;
  markMetadataAsChanged(propData: { sharedId: string; property: string }[]): Promise<void>;
  updateDenormalizedTitle(
    properties: string[],
    sharedId: string,
    language: string,
    value: string
  ): Promise<void>;
  updateDenormalizedMetadataValues(
    propertiesToNewValues: Record<string, any>,
    sharedId: string,
    language: string
  ): Promise<void>;
}
