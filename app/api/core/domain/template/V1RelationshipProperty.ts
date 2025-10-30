import {
  FilterableProperty,
  FilterablePropertyProps,
} from 'api/core/domain/template/FilterableProperty';
import { PropertyInheritedTypeMismatchError } from 'api/core/domain/template/errors';
import { z } from 'zod';
import { Context, CreatePropertyAssignmentInput, Property, PropertyUpdateInfo } from './Property';
import { PropertyType, PropertyTypeEnum } from './PropertyType';
import { InheritedResultValue, PropertyAssignment } from './PropertyValue';

type Inherit = {
  property: string;
  type: PropertyType;
};

type Props = {
  relationType: string;
  content?: string;
  inherit?: Inherit;
  type?: PropertyTypeEnum.Relationship;
} & Omit<FilterablePropertyProps, 'type'>;

const createSchema = (isRequired: boolean) =>
  z.array(z.any()).min(isRequired ? 1 : 0, 'Relationship Property is required');

class V1RelationshipProperty extends FilterableProperty {
  readonly relationType: string;

  readonly content?: string;

  readonly inheritedPropertyId?: string;

  inherit?: Inherit;

  constructor(
    id: string,
    name: string,
    label: string,
    relationType: string,
    template: string,
    content?: string,
    inheritedPropertyId?: string,
    inherit?: Inherit,
    noLabel?: boolean,
    required?: boolean,
    showInCard?: boolean,
    filter?: boolean,
    defaultfilter?: boolean,
    prioritySorting?: boolean,
    context?: Context
  ) {
    super(
      {
        id,
        type: 'relationship',
        name,
        label,
        template,
        noLabel,
        required,
        showInCard,
        filter,
        defaultfilter,
        prioritySorting,
      },
      context
    );
    this.content = content || '';
    this.relationType = relationType;
    this.inheritedPropertyId = inheritedPropertyId;
    this.inherit = inherit;

    if (!inheritedPropertyId) {
      delete this.inherit;
    }
  }

  override updatedAttributes(other: Property): PropertyUpdateInfo {
    if (!(other instanceof V1RelationshipProperty)) {
      throw new Error('Can only compare with another V1RelationshipProperty');
    }

    const updateInfo = super.updatedAttributes(other);

    if (this.relationType !== other.relationType) {
      updateInfo.updatedAttributes.push('relationType');
    }
    if (this.content !== other.content) {
      updateInfo.updatedAttributes.push('content');
    }
    if (this.inheritedPropertyId !== other.inheritedPropertyId) {
      updateInfo.updatedAttributes.push('inheritedPropertyId');
    }

    return updateInfo;
  }

  ensurePropertyIsConsistent(property: V1RelationshipProperty): void {
    super.ensurePropertyIsConsistent(property);

    if (this.inherit && this.inherit.type !== property.inherit?.type) {
      throw new PropertyInheritedTypeMismatchError(this, property);
    }
  }

  createPropertyAssignment({
    value,
  }: CreatePropertyAssignmentInput<InheritedResultValue>): PropertyAssignment {
    const normalizedItems: InheritedResultValue[] = [];
    const seen = new Set<string>();

    value.forEach(item => {
      const formattedValue = String(item?.value || '').trim();
      if (!formattedValue || seen.has(formattedValue)) return;

      seen.add(formattedValue);

      const normalized: InheritedResultValue = {
        value: formattedValue,
        label: item.label,
        inheritedValue: item.inheritedValue,
        inheritedType: item.inheritedType,
        icon: item.icon,
      };

      normalizedItems.push(normalized);
    });

    const parsed = createSchema(this.required).parse(normalizedItems);

    return { name: this.name, type: this.type, value: parsed };
  }

  validatePropertyAssignment({ value }: PropertyAssignment<InheritedResultValue>): void {
    createSchema(this.required).parse(value);
  }

  static create(props: Omit<Props, 'type'>, context?: Context) {
    return new V1RelationshipProperty(
      props.id,
      props?.name!,
      props.label,
      props.relationType,
      props.template,
      props.content,
      props.inherit?.property,
      props.inherit,
      props.noLabel,
      props.required,
      props.showInCard,
      props.filter,
      props.defaultfilter,
      props.prioritySorting,
      context
    );
  }
}

export { V1RelationshipProperty };
export type { Props as V1RelationshipPropertyProps };
