import { MappingProperty } from '@elastic/elasticsearch/api/types';
import { AmountPerSlotType, SlotBootstrapDefinitions } from './SlotBootstrapDefinitions.js';
import type { SlotType } from './SlotType.js';

const slotMappingRegistry: Record<SlotType, MappingProperty> = {
  txt: {
    type: 'text',
    analyzer: 'other',
    fields: {
      sort: {
        type: 'keyword',
        ignore_above: 1024,
        normalizer: 'string_sorter_normalized',
      },
    },
  },
  date: { type: 'date', format: 'epoch_millis' },
  num: { type: 'double' },
  range: { type: 'date_range' },
  select: {
    properties: {
      label: { type: 'text', analyzer: 'other' },
      value: { type: 'keyword' },

      parent: {
        properties: {
          label: { type: 'text', analyzer: 'other' },
          value: { type: 'keyword' },
        },
      },
    },
  },
  relationship: {
    properties: {
      label: { type: 'text', analyzer: 'other' },
      value: { type: 'keyword' },
    },
  },
  geolocation: {
    properties: {
      value: {
        type: 'geo_point',
      },
    },
  },
  relationship_txt: {
    properties: {
      label: { type: 'text', analyzer: 'other' },
      value: { type: 'keyword' },

      inheritedValue: {
        type: 'text',
        analyzer: 'other',
        fields: {
          sort: {
            type: 'keyword',
            ignore_above: 1024,
            normalizer: 'string_sorter_normalized',
          },
        },
      },
    },
  },
  relationship_date: {
    properties: {
      label: { type: 'text', analyzer: 'other' },
      value: { type: 'keyword' },

      inheritedValue: {
        type: 'date',
        format: 'epoch_millis',
      },
    },
  },
  relationship_num: {
    properties: {
      label: { type: 'text', analyzer: 'other' },
      value: { type: 'keyword' },

      inheritedValue: {
        type: 'double',
      },
    },
  },
  relationship_range: {
    properties: {
      label: { type: 'text', analyzer: 'other' },
      value: { type: 'keyword' },

      inheritedValue: {
        type: 'date_range',
      },
    },
  },
  relationship_select: {
    properties: {
      label: { type: 'text', analyzer: 'other' },
      value: { type: 'keyword' },

      inheritedValue: {
        properties: {
          label: { type: 'text', analyzer: 'other' },
          value: { type: 'keyword' },
          parent: {
            properties: {
              label: { type: 'text', analyzer: 'other' },
              value: { type: 'keyword' },
            },
          },
        },
      },
    },
  },
  relationship_geolocation: {
    properties: {
      label: { type: 'text', analyzer: 'other' },
      value: { type: 'keyword' },

      inheritedValue: {
        type: 'geo_point',
      },
    },
  },
};

const slotMapping = (slotType: SlotType): MappingProperty => slotMappingRegistry[slotType];

export const createEntityMetadataMapping = () => {
  const metadata: Record<string, MappingProperty> = {};

  SlotBootstrapDefinitions.slotList().forEach(slotType => {
    const slotAmount = AmountPerSlotType[slotType];
    if (!slotAmount) throw new Error(`No slot amount defined for prefix: ${slotType}`);

    for (let i = 0; i < slotAmount; i += 1) {
      const slotKey = `${slotType}_${String(i + 1).padStart(2, '0')}`;

      metadata[slotKey] = slotMapping(slotType);
    }
  });

  return metadata;
};
