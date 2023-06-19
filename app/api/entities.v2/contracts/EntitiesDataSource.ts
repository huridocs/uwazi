import { ResultSet } from 'api/common.v2/contracts/ResultSet';
import { Entity, MetadataValue } from '../model/Entity';

type MarkAsChangedCriteria = { template: string } | { sharedId: string };
type MarkAsChangedData = { property: string } | { properties: string[] };
export type MarkAsChangedItems = MarkAsChangedCriteria & MarkAsChangedData;

export interface EntitiesDataSource {
  updateObsoleteMetadataValues(
    id: Entity['_id'],
    values: Record<string, MetadataValue[]>
  ): Promise<void>;
  entitiesExist(sharedIds: string[]): Promise<boolean>;
  getByIds(sharedIds: string[], language?: string): ResultSet<Entity>;
  getIdsByTemplate(templateId: string): ResultSet<string>;
  getByDenormalizedId(properties: string[], sharedIds?: string[]): ResultSet<string>;
  markMetadataAsChanged(propData: MarkAsChangedItems[]): Promise<void>;
  updateDenormalizedMetadataValues(
    denormalizedSharedId: string,
    language: string,
    title: string,
    propertiesToNewValues: { propertyName: string; value?: any }[]
  ): Promise<void>;
}
