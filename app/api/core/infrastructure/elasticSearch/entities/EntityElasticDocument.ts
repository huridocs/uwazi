import { EntityDBO } from '#api/entities.v2/database/schemas/EntityTypes.js';
import { Serialize } from '../../mongodb/common/Serialize.js';
import type { LanguageISO6391 } from '#shared/types/commonTypes.js';

type SlotValueByPrefix = {
  txt: string[];
  date: number[];
  num: number[];
  range: DateRange[];
  select: SelectValue[];
  relationship: RelationshipValue[];
  geolocation: GeoPointValue[];
  relationship_txt: RelationshipValue[];
  relationship_num: number[];
  relationship_date: number[];
  relationship_range: DateRange[];
  relationship_select: SelectValue[];
  relationship_geolocation: GeoPointValue[];
};

type SlottedMetadata = {
  [K in keyof SlotValueByPrefix as `${string & K}_${string}`]?: SlotValueByPrefix[K];
};

type DateRange = {
  gte?: number;
  lte?: number;
};

type SelectValue = {
  label: string;
  value: string;
  parent?: {
    label: string;
    value: string;
  };
};

type RelationshipValue = {
  label: string;
  value: string;
  inheritedValue?: string[] | number[] | DateRange[] | SelectValue[] | RelationshipValue[];
};

type GeoPointValue = { lat: number; lon: number };

type EntityElasticDocument = {
  tenantId: string;
  sharedId: string;
  template: string;

  rawEntities: Partial<Record<LanguageISO6391, Serialize<EntityDBO>>>;

  metadata: SlottedMetadata;

  published: boolean;
  permissionRefIds: string[];

  user?: string;
  creationDate: number;
  editDate: number;

  created_at: string;
  updated_at: string;

  fullText: {
    name: 'entity';
  };
};

export type {
  EntityElasticDocument,
  SlotValueByPrefix,
  SlottedMetadata,
  DateRange,
  SelectValue,
  RelationshipValue,
  GeoPointValue,
};
