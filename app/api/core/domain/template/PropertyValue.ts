import { PropertyType } from './PropertyType';

type MetadataValue = any;

type BaseMetadataValue = {
  value: MetadataValue;
  label?: string;
};

type InheritedResultValue = BaseMetadataValue & {
  inheritedValue?: BaseMetadataValue[];
  inheritedType?: string;
  icon?: {
    label: string;
    type: string;
  };
};

type EntityMetadata = BaseMetadataValue | InheritedResultValue;

type PropertyValue = {
  name: string;
  type: PropertyType;
  value: EntityMetadata[];
};

export type { PropertyValue, EntityMetadata, InheritedResultValue };
