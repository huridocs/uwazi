/* eslint-disable max-lines */
/* eslint-disable max-statements */
/* eslint-disable max-classes-per-file */
import {
  AbstractImageProperty,
  ImageStyle,
} from '../../../domain/template/AbstractImageProperty.js';
import { CreationDateProperty } from '../../../domain/template/CreationDateProperty.js';
import { DateProperty } from '../../../domain/template/DateProperty.js';
import { DateRangeProperty } from '../../../domain/template/DateRangeProperty.js';
import { FilterableProperty } from '../../../domain/template/FilterableProperty.js';
import { GenerateIdProperty } from '../../../domain/template/GenerateIdProperty.js';
import { GeolocationProperty } from '../../../domain/template/GeoLocationProperty.js';
import { ImageProperty } from '../../../domain/template/ImageProperty.js';
import { LinkProperty } from '../../../domain/template/LinkProperty.js';
import { MarkdownProperty } from '../../../domain/template/MarkdownProperty.js';
import { MediaProperty } from '../../../domain/template/MediaProperty.js';
import { ModifiedDateProperty } from '../../../domain/template/ModifiedDateProperty.js';
import { MultiDateProperty } from '../../../domain/template/MultiDateProperty.js';
import { MultiDateRangeProperty } from '../../../domain/template/MultiDateRangeProperty.js';
import { MultiSelectProperty } from '../../../domain/template/MultiSelectProperty.js';
import { NumericProperty } from '../../../domain/template/NumericProperty.js';
import { PreviewProperty } from '../../../domain/template/PreviewProperty.js';
import { SelectProperty } from '../../../domain/template/SelectProperty.js';
import { TextProperty } from '../../../domain/template/TextProperty.js';
import { TitleProperty } from '../../../domain/template/TitleProperty.js';
import { TemplateDBO } from 'api/templates.v2/database/schemas/TemplateDBO.js';
import { CommonProperty } from 'api/templates.v2/model/CommonProperty.js';
import { Property } from 'api/templates.v2/model/Property.js';
import { Template } from 'api/templates.v2/model/Template.js';
import { V1RelationshipProperty } from 'api/templates.v2/model/V1RelationshipProperty.js';
import { ObjectId } from 'mongodb';

import { PropertySchema } from '../../../../../shared/types/commonTypes.js';

class CommonPropertyMapper {
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

class PropertyMapper {
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

    return schema as PropertySchema;
  }

  static toDomain(schema: PropertySchema, template: string): Property {
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

      case 'relationship':
        return V1RelationshipProperty.create({
          ...baseProps,
          ...filterableProps,
          relationType: schema.relationType!,
          content: schema.content,
          inherit: schema.inherit as any,
        });

      default:
        throw new Error(
          `The Property type "${schema.type}" was not handled. ${JSON.stringify(schema)}`
        );
    }
  }
}
class TemplateMapper {
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
      properties: domain.properties.map(PropertyMapper.toSchema),
      processing: domain.processing,
      entityViewPage: domain.entityViewPage,
    };
  }

  static toDomain(schema: TemplateDBO): Template {
    const templateId = schema._id.toHexString();

    return new Template(
      templateId,
      schema.name,
      schema.properties.map(item => PropertyMapper.toDomain(item, templateId)),
      schema.commonProperties.map(item => CommonPropertyMapper.toDomain(item, templateId)),
      schema.color,
      schema.default,
      schema.entityViewPage
    );
  }
}

export { TemplateMapper };
