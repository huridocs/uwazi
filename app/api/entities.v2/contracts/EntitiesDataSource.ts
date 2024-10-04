import { ResultSet } from 'api/common.v2/contracts/ResultSet';
import { Entity, EntityMetadata, MetadataValue } from '../model/Entity';

type MarkAsChangedCriteria = { template: string } | { sharedId: string };
type MarkAsChangedData = { property: string } | { properties: string[] };
export type MarkAsChangedItems = MarkAsChangedCriteria & MarkAsChangedData;

export interface EntitiesDataSource {
  updateEntity(entity: Entity): Promise<void>;
  updateObsoleteMetadataValues(
    id: Entity['_id'],
    values: Record<string, EntityMetadata[]>
  ): Promise<void>;
  updateMetadataValues(
    id: Entity['_id'],
    values: Record<string, { value: MetadataValue }[]>,
    title?: string
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
