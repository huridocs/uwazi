/* eslint-disable max-statements */
/* eslint-disable max-classes-per-file */
import { AbstractImageProperty } from 'api/core/domain/template/AbstractImageProperty';
import { CreationDateProperty } from 'api/core/domain/template/CreationDateProperty';
import { FilterableProperty } from 'api/core/domain/template/FilterableProperty';
import { ModifiedDateProperty } from 'api/core/domain/template/ModifiedDateProperty';
import { MultiSelectProperty } from 'api/core/domain/template/MultiSelectProperty';
import { SelectProperty } from 'api/core/domain/template/SelectProperty';
import { TextProperty } from 'api/core/domain/template/TextProperty';
import { TitleProperty } from 'api/core/domain/template/TitleProperty';
import { TemplateDBO } from 'api/templates.v2/database/schemas/TemplateDBO';
import { CommonProperty } from 'api/templates.v2/model/CommonProperty';
import { Property } from 'api/templates.v2/model/Property';
import { Template } from 'api/templates.v2/model/Template';
import { ObjectId } from 'mongodb';
import { PropertySchema } from 'shared/types/commonTypes';

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

    throw new Error(`Unhandled CommonProperty type: ${base}`);
  }
}

class PropertyMapper {
  static toSchema(domain: Property): PropertySchema {
    const base: PropertySchema = {
      _id: ObjectId.createFromHexString(domain.id),
      type: domain.type,
      label: domain.label,
      name: domain.name,
      noLabel: domain.noLabel,
      required: domain.required,
      showInCard: domain.showInCard,
    };

    if (domain instanceof TextProperty) {
      return {
        ...base,
        generatedId: domain.generatedId,
        filter: domain.filter,
        defaultfilter: domain.defaultfilter,
        prioritySorting: domain.prioritySorting,
      };
    }

    if (domain instanceof AbstractImageProperty) {
      return { ...base, style: domain.style, fullWidth: domain.fullWidth };
    }

    if (domain instanceof SelectProperty || domain instanceof MultiSelectProperty) {
      return {
        ...base,
        filter: domain.filter,
        defaultfilter: domain.defaultfilter,
        prioritySorting: domain.prioritySorting,
        content: domain.content,
      };
    }

    if (domain instanceof FilterableProperty) {
      return {
        ...base,
        filter: domain.filter,
        defaultfilter: domain.defaultfilter,
        prioritySorting: domain.prioritySorting,
      };
    }

    if (domain instanceof Property) {
      return base;
    }

    throw new Error(`Unhandled CommonProperty type: ${base}`);
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
    };
  }
}

export { TemplateMapper };
