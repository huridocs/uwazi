/* eslint-disable max-statements */
/* eslint-disable max-classes-per-file */
import { AbstractImageProperty } from 'api/core/domain/template/AbstractImageProperty';
import { CommonProperty } from 'api/core/domain/template/CommonProperty';
import { CreationDateProperty } from 'api/core/domain/template/CreationDateProperty';
import { FilterableProperty } from 'api/core/domain/template/FilterableProperty';
import { ModifiedDateProperty } from 'api/core/domain/template/ModifiedDateProperty';
import { MultiSelectProperty } from 'api/core/domain/template/MultiSelectProperty';
import { NestedProperty } from 'api/core/domain/template/NestedProperty';
import { Property } from 'api/core/domain/template/Property';
import { SelectProperty } from 'api/core/domain/template/SelectProperty';
import { Template } from 'api/core/domain/template/Template';
import { TextProperty } from 'api/core/domain/template/TextProperty';
import { TitleProperty } from 'api/core/domain/template/TitleProperty';
import { V1RelationshipProperty } from 'api/core/domain/template/V1RelationshipProperty';
import { ObjectId } from 'mongodb';
import { PropertySchema } from 'shared/types/commonTypes';

class CommonPropertyMapper {
  static toSchema(domain: CommonProperty) {
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
}

class PropertyMapper {
  static toDTO(domain: Property) {
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
}

export class ExpressTemplateMapper {
  static toDTO(domain: Template) {
    return {
      _id: ObjectId.createFromHexString(domain.id),
      color: domain.color,
      name: domain.name,
      default: !!domain.isDefault,
      commonProperties: domain.commonProperties.map(CommonPropertyMapper.toSchema) as [
        PropertySchema,
        ...PropertySchema[],
      ],
      properties: domain.properties.map(PropertyMapper.toDTO),
      processing: domain.processing,
      entityViewPage: domain.entityViewPage,
    };
  }
}
