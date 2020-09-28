import { template } from 'api/relationships/specs/fixtures';
import { MetadataTemplate } from 'app/Templates/components/MetadataTemplate';
import { TemplateSchema } from 'shared/types/templateType';
import { isArrayLiteralExpression } from 'typescript';

const text = {
  type: 'text',
  index: true,
  omit_norms: true,
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
  omit_norms: true,
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

const textType = () => {
  return {
    properties: {
      label: text,
      value: text,
    },
  };
};

const dateType = () => {
  return {
    properties: {
      label: text,
      value: date,
    },
  };
};

const daterangeType = () => {
  return {
    properties: {
      label: text,
      value: {
        properties: {
          from: date,
          to: date,
        },
      },
    },
  };
};

const geolocationType = () => {
  return {
    properties: {
      value: {
        properties: {
          label: text,
          lat: noSortNumber,
          lon: noSortNumber,
        },
      },
    },
  };
};

const imageType = () => {
  return {
    properties: {
      value: noIndexText,
    },
  };
};

const linkType = () => {
  return {
    properties: {
      value: {
        properties: {
          label: text,
          url: noIndexText,
        },
      },
    },
  };
};

const markdownType = () => {
  return {
    properties: {
      value: noSorttext,
    },
  };
};

const selectType = () => {
  return {
    properties: {
      label: text,
      value: id,
    },
  };
};

const noMapping = () => {
  return;
};

const numericType = () => {
  return {
    properties: {
      value: number,
    },
  };
};

const relationshipType = () => {
  return {
    properties: {
      label: text,
      value: id,
      type: noIndexText,
    },
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
  mapping: (template: TemplateSchema) => {
    return template.properties?.reduce((map: any, property) => {
      if (!property.name || !property.type) {
        return map;
      }

      map[property.name] = {
        match: property.name,
        match_mapping_type: 'string',
        mapping: mappings[property.type](),
      };

      return map;
    }, {});
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

        aliases.properties.metadata.properties[`${property.name}_${property.type}.value`] = {
          type: 'alias',
          path: `metadata.${property.name}.value`,
        };

        aliases.properties.metadata.properties[`${property.name}_${property.type}.label`] = {
          type: 'alias',
          path: `metadata.${property.name}.label`,
        };

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
            field: property.name,
            target_field: `${property.name}_${property.type}`,
          },
        });

        return pipeline;
      }, basePipeline);
    }, basePipelineObject);
  },
};
