/* eslint-disable max-lines */
/* eslint-disable max-statements */
/* eslint-disable max-classes-per-file */
import {
  AbstractImageProperty,
  ImageStyle,
} from '#api/core/domain/template/AbstractImageProperty.js';
import { CommonProperty } from '#api/core/domain/template/CommonProperty.js';
import { CreationDateProperty } from '#api/core/domain/template/CreationDateProperty.js';
import { DateProperty } from '#api/core/domain/template/DateProperty.js';
import { DateRangeProperty } from '#api/core/domain/template/DateRangeProperty.js';
import { FilterableProperty } from '#api/core/domain/template/FilterableProperty.js';
import { GenerateIdProperty } from '#api/core/domain/template/GenerateIdProperty.js';
import { GeolocationProperty } from '#api/core/domain/template/GeoLocationProperty.js';
import { ImageProperty } from '#api/core/domain/template/ImageProperty.js';
import { LinkProperty } from '#api/core/domain/template/LinkProperty.js';
import { MarkdownProperty } from '#api/core/domain/template/MarkdownProperty.js';
import { MediaProperty } from '#api/core/domain/template/MediaProperty.js';
import { ModifiedDateProperty } from '#api/core/domain/template/ModifiedDateProperty.js';
import { MultiDateProperty } from '#api/core/domain/template/MultiDateProperty.js';
import { MultiDateRangeProperty } from '#api/core/domain/template/MultiDateRangeProperty.js';
import { MultiSelectProperty } from '#api/core/domain/template/select/MultiSelectProperty.js';
import { NestedProperty } from '#api/core/domain/template/NestedProperty.js';
import { NumericProperty } from '#api/core/domain/template/NumericProperty.js';
import { PreviewProperty } from '#api/core/domain/template/PreviewProperty.js';
import { Property } from '#api/core/domain/template/Property.js';
import { RelationshipProperty } from '#api/relationships.v2/model/RelationshipProperty.js';
import { SelectProperty } from '#api/core/domain/template/select/SelectProperty.js';
import { Template } from '#api/core/domain/template/Template.js';
import { TextProperty } from '#api/core/domain/template/TextProperty.js';
import { TitleProperty } from '#api/core/domain/template/TitleProperty.js';
import { V1RelationshipProperty } from '#api/core/domain/template/V1RelationshipProperty.js';
import { mapPropertyQuery } from '#api/core/infrastructure/mongodb/template/QueryMapper.js';
import { ObjectId } from 'mongodb';
import { PropertySchema } from '#shared/types/commonTypes.js';
import { TraverseQueryDBO } from './DBOs/RelationshipsQueryDBO.js';
import { TemplateDBO } from './DBOs/TemplateDBO.js';

export class CommonPropertyMapper {
  static toSchema(domain: CommonProperty): PropertySchema {
    const base: PropertySchema = {
      _id: ObjectId.createFromHexString(domain.id),
      type: domain.type,
      label: domain.label,
      name: domain.name,
      isCommonProperty: domain.isCommonProperty,
      noLabel: domain.noLabel,
      required: domain.required,
      showInCard: domain.showInCard,
    };

    if (domain instanceof TitleProperty) {
      return {
        ...base,
        generatedId: domain.generatedId,
        prioritySorting: domain.prioritySorting,
      };
    }

    if (domain instanceof CreationDateProperty || domain instanceof ModifiedDateProperty) {
      return {
        ...base,
        prioritySorting: domain.prioritySorting,
      };
    }

    throw new Error(`Unhandled CommonProperty type: ${JSON.stringify(base, null, ' ')}`);
  }

  static toDomain(schema: PropertySchema, template: string): CommonProperty {
    if (schema.name === 'title') {
      return new TitleProperty({
        id: schema._id!.toString(),
        label: schema.label,
        name: schema.name,
        template,
        generatedId: schema.generatedId,
        isCommonProperty: schema.isCommonProperty,
        noLabel: schema.noLabel,
        prioritySorting: schema.prioritySorting,
        required: schema.required,
        showInCard: schema.showInCard,
        type: schema.type,
      });
    }

    if (schema.name === 'creationDate') {
      return new CreationDateProperty({
        id: schema._id!.toString(),
        label: schema.label,
        name: schema.name,
        template,
        isCommonProperty: schema.isCommonProperty,
        noLabel: schema.noLabel,
        prioritySorting: schema.prioritySorting,
        required: schema.required,
        showInCard: schema.showInCard,
        type: schema.type,
      });
    }

    if (schema.name === 'editDate') {
      return new ModifiedDateProperty({
        id: schema._id!.toString(),
        label: schema.label,
        name: schema.name,
        template,
        isCommonProperty: schema.isCommonProperty,
        noLabel: schema.noLabel,
        prioritySorting: schema.prioritySorting,
        required: schema.required,
        showInCard: schema.showInCard,
        type: schema.type,
      });
    }

    throw new Error(
      `The Common Property name "${schema.name}" was not handled. ${JSON.stringify(schema)}`
    );
  }
}

export class MongoTemplatePropertyMapper {
  static toSchema(domain: Property): PropertySchema {
    const schema: Partial<PropertySchema> = {
      _id: ObjectId.createFromHexString(domain.id),
      type: domain.type,
      label: domain.label,
      name: domain.name,
      noLabel: domain.noLabel,
      required: domain.required,
      showInCard: domain.showInCard,
    };

    if (domain instanceof FilterableProperty) {
      schema.filter = domain.filter;
      schema.defaultfilter = domain.defaultfilter;
      schema.prioritySorting = domain.prioritySorting;
    }

    if (domain instanceof TextProperty) {
      schema.generatedId = domain.generatedId;
    }

    if (domain instanceof AbstractImageProperty) {
      schema.style = domain.style;
      schema.fullWidth = domain.fullWidth;
    }

    if (domain instanceof SelectProperty || domain instanceof MultiSelectProperty) {
      schema.content = domain.content;
    }

    if (domain instanceof V1RelationshipProperty) {
      schema.content = domain.content;
      schema.relationType = domain.relationType;
      schema.inherit = domain.inherit;
    }

    if (domain instanceof NestedProperty) {
      schema.nestedProperties = domain.nestedProperties;
    }

    return schema as PropertySchema;
  }

  static toDomain(schema: PropertySchema, template: string): Property {
    if (schema.isCommonProperty) {
      return CommonPropertyMapper.toDomain(schema, template);
    }
    const baseProps = {
      id: schema._id!.toString(),
      name: schema.name,
      label: schema.label,
      noLabel: schema.noLabel,
      required: schema.required,
      showInCard: schema.showInCard,
      template,
    };

    const filterableProps = {
      defaultfilter: schema.defaultfilter,
      filter: schema.filter,
      prioritySorting: schema.prioritySorting,
    };

    switch (schema.type) {
      case 'text':
        return new TextProperty({
          ...baseProps,
          ...filterableProps,
          generatedId: schema.generatedId,
        });

      case 'date':
        return new DateProperty({ ...baseProps, ...filterableProps });

      case 'daterange':
        return new DateRangeProperty({ ...baseProps, ...filterableProps });

      case 'generatedid':
        return new GenerateIdProperty({ ...baseProps, ...filterableProps });

      case 'markdown':
        return new MarkdownProperty({ ...baseProps, ...filterableProps });

      case 'multidate':
        return new MultiDateProperty({ ...baseProps, ...filterableProps });

      case 'multidaterange':
        return new MultiDateRangeProperty({ ...baseProps, ...filterableProps });

      case 'numeric':
        return new NumericProperty({ ...baseProps, ...filterableProps });

      case 'geolocation':
        return new GeolocationProperty(baseProps);

      case 'link':
        return new LinkProperty(baseProps);

      case 'image':
      case 'media':
      case 'preview': {
        const imageStyleProps = {
          fullWidth: schema.fullWidth,
          style: schema.style as ImageStyle,
        };
        if (schema.type === 'image') return new ImageProperty({ ...baseProps, ...imageStyleProps });
        if (schema.type === 'media') return new MediaProperty({ ...baseProps, ...imageStyleProps });
        return new PreviewProperty({ ...baseProps, ...imageStyleProps });
      }

      case 'multiselect':
      case 'select': {
        const selectProps = {
          content: schema.content!,
        };

        if (schema.type === 'multiselect') {
          return new MultiSelectProperty({ ...baseProps, ...filterableProps, ...selectProps });
        }

        return new SelectProperty({ ...baseProps, ...filterableProps, ...selectProps });
      }

      case 'nested':
        return new NestedProperty({
          ...baseProps,
          ...filterableProps,
          nestedProperties: schema.nestedProperties,
        });

      case 'relationship':
        return V1RelationshipProperty.create({
          ...baseProps,
          ...filterableProps,
          relationType: schema.relationType!,
          content: schema.content,
          inherit: schema.inherit as any,
        });

      case 'newRelationship':
        return new RelationshipProperty(
          baseProps.id,
          baseProps.name,
          baseProps.label,
          mapPropertyQuery(schema.query as TraverseQueryDBO[]),
          template,
          schema.denormalizedProperty
        );

      default:
        throw new Error(
          `The Property type "${schema.type}" was not handled. ${JSON.stringify(schema)}`
        );
    }
  }
}

export class MongoTemplateMapper {
  static toSchema(domain: Template): TemplateDBO {
    return {
      _id: ObjectId.createFromHexString(domain.id),
      color: domain.color,
      name: domain.name,
      default: domain.isDefault,
      commonProperties: domain.commonProperties.map(CommonPropertyMapper.toSchema) as [
        PropertySchema,
        ...PropertySchema[],
      ],
      properties: domain.properties.map(MongoTemplatePropertyMapper.toSchema),
      processing: domain.processing,
      entityViewPage: domain.entityViewPage,
    };
  }

  static toDomain(schema: TemplateDBO): Template {
    const templateId = schema._id.toHexString();

    const template = new Template(
      templateId,
      schema.name,
      schema.properties.map(item => MongoTemplatePropertyMapper.toDomain(item, templateId)),
      schema.commonProperties.map(item => CommonPropertyMapper.toDomain(item, templateId)),
      schema.color,
      schema.default,
      schema.entityViewPage
    );

    template.processing = schema.processing;

    return template;
  }
}
