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
import { TemplateDBO } from '../../../../templates.v2/database/schemas/TemplateDBO.js';
import { CommonProperty } from '../../../../templates.v2/model/CommonProperty.js';
import { Property } from '../../../../templates.v2/model/Property.js';
import { Template } from '../../../../templates.v2/model/Template.js';
import { V1RelationshipProperty } from '../../../../templates.v2/model/V1RelationshipProperty.js';
import { ObjectId } from 'mongodb';
// @ts-expect-error TS(2307): Cannot find module '../../../../shared/types/commo... Remove this comment to see the full error message
import { PropertySchema } from '../../../../shared/types/commonTypes.js';

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
      // @ts-expect-error TS(2740): Type 'TitleProperty' is missing the following prop... Remove this comment to see the full error message
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
      // @ts-expect-error TS(2740): Type 'CreationDateProperty' is missing the followi... Remove this comment to see the full error message
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
      // @ts-expect-error TS(2740): Type 'ModifiedDateProperty' is missing the followi... Remove this comment to see the full error message
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
        // @ts-expect-error TS(2740): Type 'TextProperty' is missing the following prope... Remove this comment to see the full error message
        return new TextProperty({
          ...baseProps,
          ...filterableProps,
          generatedId: schema.generatedId,
        });

      case 'date':
        // @ts-expect-error TS(2740): Type 'DateProperty' is missing the following prope... Remove this comment to see the full error message
        return new DateProperty({ ...baseProps, ...filterableProps });

      case 'daterange':
        // @ts-expect-error TS(2740): Type 'DateRangeProperty' is missing the following ... Remove this comment to see the full error message
        return new DateRangeProperty({ ...baseProps, ...filterableProps });

      case 'generatedid':
        // @ts-expect-error TS(2740): Type 'GenerateIdProperty' is missing the following... Remove this comment to see the full error message
        return new GenerateIdProperty({ ...baseProps, ...filterableProps });

      case 'markdown':
        // @ts-expect-error TS(2740): Type 'MarkdownProperty' is missing the following p... Remove this comment to see the full error message
        return new MarkdownProperty({ ...baseProps, ...filterableProps });

      case 'multidate':
        // @ts-expect-error TS(2740): Type 'MultiDateProperty' is missing the following ... Remove this comment to see the full error message
        return new MultiDateProperty({ ...baseProps, ...filterableProps });

      case 'multidaterange':
        // @ts-expect-error TS(2740): Type 'MultiDateRangeProperty' is missing the follo... Remove this comment to see the full error message
        return new MultiDateRangeProperty({ ...baseProps, ...filterableProps });

      case 'numeric':
        // @ts-expect-error TS(2740): Type 'NumericProperty' is missing the following pr... Remove this comment to see the full error message
        return new NumericProperty({ ...baseProps, ...filterableProps });

      case 'geolocation':
        // @ts-expect-error TS(2740): Type 'GeolocationProperty' is missing the followin... Remove this comment to see the full error message
        return new GeolocationProperty(baseProps);

      case 'link':
        // @ts-expect-error TS(2740): Type 'LinkProperty' is missing the following prope... Remove this comment to see the full error message
        return new LinkProperty(baseProps);

      case 'image':
      case 'media':
      case 'preview': {
        const imageStyleProps = {
          fullWidth: schema.fullWidth,
          style: schema.style as ImageStyle,
        };
        // @ts-expect-error TS(2740): Type 'ImageProperty' is missing the following prop... Remove this comment to see the full error message
        if (schema.type === 'image') return new ImageProperty({ ...baseProps, ...imageStyleProps });
        // @ts-expect-error TS(2740): Type 'MediaProperty' is missing the following prop... Remove this comment to see the full error message
        if (schema.type === 'media') return new MediaProperty({ ...baseProps, ...imageStyleProps });
        // @ts-expect-error TS(2740): Type 'PreviewProperty' is missing the following pr... Remove this comment to see the full error message
        return new PreviewProperty({ ...baseProps, ...imageStyleProps });
      }

      case 'multiselect':
      case 'select': {
        const selectProps = {
          content: schema.content!,
        };

        if (schema.type === 'multiselect') {
          // @ts-expect-error TS(2740): Type 'MultiSelectProperty' is missing the followin... Remove this comment to see the full error message
          return new MultiSelectProperty({ ...baseProps, ...filterableProps, ...selectProps });
        }

        // @ts-expect-error TS(2740): Type 'SelectProperty' is missing the following pro... Remove this comment to see the full error message
        return new SelectProperty({ ...baseProps, ...filterableProps, ...selectProps });
      }

      case 'relationship':
        // @ts-expect-error TS(2740): Type 'V1RelationshipProperty' is missing the follo... Remove this comment to see the full error message
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
      // @ts-expect-error TS(2322): Type '{ _id: ObjectId; color: string | undefined; ... Remove this comment to see the full error message
      color: domain.color,
      name: domain.name,
      default: domain.isDefault,
      commonProperties: domain.commonProperties.map(CommonPropertyMapper.toSchema) as [
        PropertySchema,
        ...PropertySchema[],
      ],
      // @ts-expect-error TS(2345): Argument of type '(domain: Property) => PropertySc... Remove this comment to see the full error message
      properties: domain.properties.map(PropertyMapper.toSchema),
      processing: domain.processing,
      entityViewPage: domain.entityViewPage,
    };
  }

  static toDomain(schema: TemplateDBO): Template {
    const templateId = schema._id.toHexString();

    return new Template(
      templateId,
      // @ts-expect-error TS(2339): Property 'name' does not exist on type 'TemplateDB... Remove this comment to see the full error message
      schema.name,
      schema.properties.map(item => PropertyMapper.toDomain(item, templateId)),
      schema.commonProperties.map(item => CommonPropertyMapper.toDomain(item, templateId)),
      // @ts-expect-error TS(2339): Property 'color' does not exist on type 'TemplateD... Remove this comment to see the full error message
      schema.color,
      // @ts-expect-error TS(2339): Property 'default' does not exist on type 'Templat... Remove this comment to see the full error message
      schema.default,
      // @ts-expect-error TS(2339): Property 'entityViewPage' does not exist on type '... Remove this comment to see the full error message
      schema.entityViewPage
    );
  }
}

export { TemplateMapper };
