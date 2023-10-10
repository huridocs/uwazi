import { RawEntity } from 'api/csv/entityRow';
import { MetadataObjectSchema, PropertySchema } from 'shared/types/commonTypes';
import { ensure } from 'shared/tsUtils';
import { generateID } from 'shared/IDGenerator';

export const generatedid = async (
  entityToImport: RawEntity,
  property: PropertySchema
): Promise<MetadataObjectSchema[]> => {
  const value = entityToImport.propertiesFromColumns[ensure<string>(property.name)] || generateID(3, 4, 4);
  return [{ value }];
};
