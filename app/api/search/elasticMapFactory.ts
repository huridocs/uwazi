import { template } from 'api/relationships/specs/fixtures';
import { MetadataTemplate } from 'app/Templates/components/MetadataTemplate';
import { TemplateSchema } from 'shared/types/templateType';
import { isArrayLiteralExpression } from 'typescript';

const text = {
  type: 'text',
  index: true,
  analyzer: 'tokenizer',
  fields: {
    raw: { type: 'keyword' },
    sort: { type: 'text', fielddata: true, analyzer: 'string_sorter' },
  },
  term_vector: 'with_positions_offsets',
};

const noSorttext = {
  type: 'text',
  index: true,
  analyzer: 'tokenizer',
  term_vector: 'with_positions_offsets',
};

const noIndexText = {
  type: 'text',
  index: false,
};

const id = {
  type: 'keyword',
  index: true,
};

const date = { type: 'date', doc_values: true };

const geolocation = { type: 'object' };
const nested = { type: 'nested' };
const number = {
  type: 'double',
  doc_values: true,
  fields: {
    raw: { type: 'double', index: false },
    sort: { type: 'double' },
  },
};

const noSortNumber = {
  type: 'double',
  doc_values: true,
};

const alias = (path, key) => {
  return {
    type: 'alias',
    path: `${path}.${key}`,
  };
};

const textType = () => {
  return {
    label: text,
    value: text,
  };
};

const dateType = () => {
  return {
    label: text,
    value: date,
  };
};

const daterangeType = () => {
  return {
    label: text,
    value: {
      properties: {
        from: date,
        to: date,
      },
    },
  };
};

const geolocationType = () => {
  return {
    value: {
      properties: {
        label: text,
        lat: noSortNumber,
        lon: noSortNumber,
      },
    },
  };
};

const imageType = () => {
  return {
    value: noIndexText,
  };
};

const linkType = () => {
  return {
    value: {
      properties: {
        label: text,
        url: noIndexText,
      },
    },
  };
};

const markdownType = () => {
  return {
    value: noSorttext,
  };
};

const selectType = () => {
  return {
    label: text,
    value: id,
  };
};

const noMapping = () => {
  return;
};

const numericType = () => {
  return {
    value: number,
  };
};

const relationshipType = () => {
  return {
    label: text,
    value: id,
    type: noIndexText,
  };
};

const mappings = {
  text: textType,
  date: dateType,
  daterange: daterangeType,
  geolocation: geolocationType,
  image: imageType,
  link: linkType,
  markdown: markdownType,
  media: imageType,
  multidate: dateType,
  multidaterange: daterangeType,
  multiselect: selectType,
  nested: noMapping,
  numeric: numericType,
  preview: noMapping,
  relationship: relationshipType,
  select: selectType,
};

export default {
  mapping: (templates: TemplateSchema[]) => {
    const baseMappingObject = {
      properties: {
        metadata: {
          properties: {},
        },
      },
    };

    return templates.reduce((baseMapping: any, template: TemplateSchema) => {
      return template.properties?.reduce((map: any, property) => {
        if (!property.name || !property.type) {
          return map;
        }

        map.properties.metadata.properties[`${property.name}_${property.type}`] = {
          properties: mappings[property.type](),
        };

        return map;
      }, baseMapping);
    }, baseMappingObject);
  },

  aliasses: (templates: TemplateSchema[]) => {
    const baseAliasObject = {
      properties: {
        metadata: {
          properties: {},
        },
      },
    };

    return templates.reduce((baseAlias: any, template: TemplateSchema) => {
      return template.properties?.reduce((aliases: any, property) => {
        if (!property.name || !property.type) {
          return aliases;
        }
        const mapping = mappings[property.type]();
        const properties = Object.keys(mapping || {}).reduce((map: any, key) => {
          map[key] = {
            type: 'alias',
            path: `metadata.${property.name}_${property.type}.${key}`,
          };

          return map;
        }, {});

        aliases.properties.metadata.properties[`${property.name}`] = { properties };

        return aliases;
      }, baseAlias);
    }, baseAliasObject);
  },

  ingest: (templates: TemplateSchema[]) => {
    const basePipelineObject = {
      description: 'rename pipeline',
      processors: [],
    };
    return templates.reduce((basePipeline, template) => {
      return template.properties?.reduce((pipeline: any, property) => {
        if (!property.name || !property.type) {
          return pipeline;
        }

        pipeline.processors.push({
          rename: {
            field: `metadata.${property.name}`,
            target_field: `metadata.${property.name}_${property.type}`,
          },
        });

        return pipeline;
      }, basePipeline);
    }, basePipelineObject);
  },
};
