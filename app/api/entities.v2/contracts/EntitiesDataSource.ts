import { ResultSet } from 'api/common.v2/contracts/ResultSet';
import { Entity } from '../model/Entity';

export interface EntitiesDataSource {
  entitiesExist(sharedIds: string[]): Promise<boolean>;
  getByIds(sharedIds: string[], language?: string): ResultSet<Entity>;
  getByDenormalizedId(properties: string[], sharedIds?: string[]): ResultSet<string>;
  markMetadataAsChanged(propData: { sharedId: string; property: string }[]): Promise<void>;
  updateDenormalizedMetadataValues(
    denormalizedSharedId: string,
    language: string,
    title: string,
    propertiesToNewValues: { propertyName: string; value?: any }[]
  ): Promise<void>;
}
