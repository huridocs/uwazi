import { ResultSet } from '#api/core/application/contracts/ResultSet.js';
import { DeprecatedEntity, EntityMetadata, MetadataValue } from '../model/Entity.js';

type MarkAsChangedCriteria = { template: string } | { sharedId: string };
type MarkAsChangedData = { property: string } | { properties: string[] };
export type MarkAsChangedItems = MarkAsChangedCriteria & MarkAsChangedData;

export interface DeprecatedEntitiesDataSource {
  updateObsoleteMetadataValues(
    id: DeprecatedEntity['_id'],
    values: Record<string, EntityMetadata[]>
  ): Promise<void>;
  updateMetadataValues(
    id: DeprecatedEntity['_id'],
    values: Record<string, { value: MetadataValue }[]>,
    title?: string
  ): Promise<void>;
  entitiesExist(sharedIds: string[]): Promise<boolean>;
  getByIds(sharedIds: string[], language?: string): ResultSet<DeprecatedEntity>;
  getIdsByTemplate(templateId: string): ResultSet<string>;
  getByDenormalizedId(properties: string[], sharedIds?: string[]): ResultSet<string>;
  markMetadataAsChanged(propData: MarkAsChangedItems[]): Promise<void>;
  updateDenormalizedMetadataValues(
    denormalizedSharedId: string,
    language: string,
    title: string,
    propertiesToNewValues: { propertyName: string; value?: any }[]
  ): Promise<void>;
  anyExistsForTemplate(templateId: string): Promise<boolean>;
}
