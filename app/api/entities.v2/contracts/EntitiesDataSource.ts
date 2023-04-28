import { ResultSet } from 'api/common.v2/contracts/ResultSet';
import { Entity } from '../model/Entity';

type MarkAsChangedCriteria = { template: string } | { sharedId: string };
type MarkAsChangedData = { property: string } | { properties: string[] };
type MarkAsChangedItems = MarkAsChangedCriteria & MarkAsChangedData;

export interface EntitiesDataSource {
  entitiesExist(sharedIds: string[]): Promise<boolean>;
  getByIds(sharedIds: string[], language?: string): ResultSet<Entity>;
  getByDenormalizedId(properties: string[], sharedIds?: string[]): ResultSet<string>;
  markMetadataAsChanged(propData: MarkAsChangedItems[]): Promise<void>;
  updateDenormalizedMetadataValues(
    denormalizedSharedId: string,
    language: string,
    title: string,
    propertiesToNewValues: { propertyName: string; value?: any }[]
  ): Promise<void>;
}
