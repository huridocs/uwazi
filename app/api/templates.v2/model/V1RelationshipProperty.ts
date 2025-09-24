import {
  FilterableProperty,
  FilterablePropertyProps,
  // @ts-expect-error TS(2307): Cannot find module '../core/domain/template/Filter... Remove this comment to see the full error message
} from '../core/domain/template/FilterableProperty.js';
import {
  PropertyInheritedTypeMismatchError,
  PropertyRelationTypeMismatchError,
  // @ts-expect-error TS(2307): Cannot find module '../core/domain/template/errors... Remove this comment to see the full error message
} from '../core/domain/template/errors.js';
import { Context, Property, PropertyTypes, PropertyUpdateInfo } from './Property';

type Inherit = {
  property: string;
  type: PropertyTypes;
};

type Props = {
  relationType: string;
  content?: string;
  inherit?: Inherit;
} & FilterablePropertyProps;

class V1RelationshipProperty extends FilterableProperty {
  readonly relationType: string;

  readonly content?: string;

  readonly inheritedPropertyId?: string;

  readonly inherit?: Inherit;

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
    this.content = content;
    this.relationType = relationType;
    this.inheritedPropertyId = inheritedPropertyId;
    this.inherit = inherit;
  }

  // @ts-expect-error TS(4112): This member cannot have an 'override' modifier bec... Remove this comment to see the full error message
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
    if (this.relationType !== property.relationType) {
      throw new PropertyRelationTypeMismatchError(this, property);
    }

    if (this.inherit && this.inherit.type !== property.inherit?.type) {
      throw new PropertyInheritedTypeMismatchError(this, property);
    }
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
