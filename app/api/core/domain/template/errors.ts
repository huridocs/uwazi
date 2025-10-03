/* eslint-disable max-classes-per-file */
import { Property } from 'api/templates.v2/model/Property';
import { Template } from 'api/templates.v2/model/Template';
import { V1RelationshipProperty } from 'api/templates.v2/model/V1RelationshipProperty';
import { DomainError } from '../error/DomainError';
import { AJVObject, ValidationError } from '../error/ValidationError';
import { AbstractSelectProperty } from './AbstractSelectProperty';
import { NestedPropertyProps } from './NestedProperty';

class PropertyTypeInvalidTypeError extends DomainError {
  constructor(type: string, propertyName: string) {
    super(
      `The following type is not valid for ${propertyName}. Type = ${type}`,
      'template.property.title_property_have_invalid_type_error'
    );
  }
}

class TitlePropertyInvalidNameError extends DomainError {
  constructor(name: string) {
    super(
      `The following PropertyName is not valid for TitleProperty. PropertyName = ${name}`,
      'template.property.title_property_have_invalid_name_error'
    );
  }
}

class CreationDatePropertyInvalidTypeError extends DomainError {
  constructor(type: string) {
    super(
      `The following type is not valid for CreationDateProperty. Type = ${type}`,
      'template.property.creation_date_property_have_invalid_type_error'
    );
  }
}

class CreationDatePropertyInvalidNameError extends DomainError {
  constructor(name: string) {
    super(
      `The following PropertyName is not valid for CreationDateProperty. PropertyName = ${name}`,
      'template.property.creation_date_property_have_invalid_name_error'
    );
  }
}

class ModifiedDatePropertyInvalidTypeError extends DomainError {
  constructor(type: string) {
    super(
      `The following type is not valid for ModifiedDateProperty. Type = ${type}`,
      'template.property.modified_date_property_have_invalid_type_error'
    );
  }
}

class ModifiedDatePropertyInvalidNameError extends DomainError {
  constructor(name: string) {
    super(
      `The following PropertyName is not valid for CreationDateProperty. PropertyName = ${name}`,
      'template.property.modified_date_property_have_invalid_name_error'
    );
  }
}

class CommonPropertyInvalidError extends DomainError {
  constructor() {
    super(
      'You have tried to create a CommonProperty with wrong properties. isCommonProperty = false',
      'template.property.common_property_have_invalid_property_error'
    );
  }
}

class InvalidStyleTypeError extends DomainError {
  constructor(type: string) {
    super(
      `The following style type is not valid for Image Property. Type = ${type}`,
      'template.property.invalid_style_type_error'
    );
  }
}

class TemplateWithDuplicatedPropertyError extends ValidationError {
  constructor(property: Property) {
    super(
      `Template contains duplicate property: [name=${property.name}, type=${property.type}]`,
      'template.template.template_with_duplicated_property_error'
    );
  }

  asAJV(): AJVObject {
    return {
      message: this.message,
      keyword: 'uniquePropertyFields',
    };
  }
}

class PropertyTypeMismatchError extends DomainError {
  constructor(existing: Property, attempted: Property) {
    super(
      `Property with the name "${existing.name}" must have type "${existing.type}", but type "${attempted.type}" was provided.`,
      'template.property.property_type_mismatch_error'
    );
  }
}

class PropertyThesaurusMismatchError extends DomainError {
  constructor(existing: AbstractSelectProperty, attempted: AbstractSelectProperty) {
    super(
      // eslint-disable-next-line max-len
      `Property with the name "${existing.name}" has a thesaurus mismatch. It must be linked to ${existing.content} thesaurus, but a link to ${attempted.content} thesaurus was provided.`,
      'template.property.thesaurus_mismatch_error'
    );
  }
}

class PropertyRelationTypeMismatchError extends DomainError {
  constructor(existing: V1RelationshipProperty, attempted: V1RelationshipProperty) {
    // eslint-disable-next-line max-len
    const message = `Property with the name "${existing.name}" must define a relationship type to "${existing.relationType}", but a relationship to "${attempted.relationType}" was provided.`;

    const code = 'template.property.relation_type_mismatch_error';

    super(message, code);
  }
}

class PropertyInheritedTypeMismatchError extends DomainError {
  constructor(existing: V1RelationshipProperty, attempted: V1RelationshipProperty) {
    const formatInheritance = (property: V1RelationshipProperty) =>
      property.inherit?.type
        ? `inherit the property "${property.inherit.type}"`
        : 'not inherit any property';

    const message = `Property with the name "${
      existing.name
    }" has an inheritance mismatch. It must ${formatInheritance(
      existing
    )}, but a configuration to ${formatInheritance(attempted)} was provided.`;

    const code = 'template.property.inherited_type_mismatch_error';

    super(message, code);
  }
}

class TemplateWithDuplicatedNameOnTheSystemError extends DomainError {
  constructor(template: Template) {
    super(
      `The following Template has a used Name on the system. Name = ${template.name}`,
      'template.property.property_not_unique_on_the_system_error'
    );
  }
}

class TemplateWithMissingCommonProperty extends DomainError {
  constructor(type: string) {
    super(
      `Template has the missing Property. Type = ${type}`,
      'template.template.template_with_missing_common_property_error'
    );
  }
}

class FieldIsRequiredError extends DomainError {
  constructor(fieldName: string) {
    super(
      `The following field is required. Field = ${fieldName}`,
      'template.field_is_required_error'
    );
  }
}

class SelectPropertyWithInvalidThesaurusError extends DomainError {
  constructor(thesaurusId: string) {
    super(
      `The following Thesaurus does not exist. Thesaurus Id = ${thesaurusId}`,
      'template.property.select_property_with_invalid_thesaurus_error'
    );
  }
}

class RelationshipTypeDoesNotExistError extends DomainError {
  constructor(relationType: string) {
    super(
      `The Relationship Type with Id "${relationType}" was not found.`,
      'template.property.relationship_type_does_not_exist_error'
    );
  }
}

class TemplateDoesNotExistError extends DomainError {
  constructor(templateId: string) {
    super(
      `The Template with Id "${templateId}" was not found.`,
      'template.template.template_does_not_exist_error'
    );
  }
}
class DefaultTemplateNotFoundError extends DomainError {
  constructor() {
    super(
      'A default template is required, but none is configured in the system.',
      'template.default_not_found'
    );
  }
}

class RelationshipTargetPropertyNotFoundError extends DomainError {
  constructor(propertyId: string, templateId: string) {
    super(
      `The provided Target Property with id "${propertyId}" was not found on Template with id "${templateId}"`,
      'template.property.relationship_target_property_not_found_error'
    );
  }
}

class RelationshipTargetTypeMismatchError extends DomainError {
  constructor(providedType: string, existingType: string) {
    super(
      `The provided Target Property type "${providedType}" does not match with the Target Template type "${existingType}"`,
      'template.property.relationship_target_type_mismatch_error'
    );
  }
}

class NestedPropertyNotAvailableError extends DomainError {
  constructor(props: NestedPropertyProps) {
    super(
      `The nested Property type is not available for your organization ${JSON.stringify(props)}`,
      'template.property.nested_property_type_not_available_error'
    );
  }
}

class DefaultTemplateConflictError extends DomainError {
  constructor(message: string) {
    super(message, 'template.default_template_conflict');
  }
}

class DefaultTemplateDeletionError extends DomainError {
  constructor() {
    const message =
      'The default template cannot be deleted. Please set a different template as the default before deleting this one.';
    const code = 'template.cannot_delete_default';
    super(message, code);
  }
}

class TemplateInUseError extends DomainError {
  constructor() {
    const message =
      'Cannot delete a template that has existing entities. Please remove the related entities first.';
    const code = 'template.in_use';
    super(message, code);
  }
}

export {
  CreationDatePropertyInvalidNameError,
  CreationDatePropertyInvalidTypeError,
  ModifiedDatePropertyInvalidTypeError,
  ModifiedDatePropertyInvalidNameError,
  TitlePropertyInvalidNameError,
  PropertyTypeInvalidTypeError,
  InvalidStyleTypeError,
  CommonPropertyInvalidError,
  TemplateWithDuplicatedPropertyError,
  TemplateWithMissingCommonProperty,
  PropertyTypeMismatchError,
  TemplateWithDuplicatedNameOnTheSystemError,
  FieldIsRequiredError,
  SelectPropertyWithInvalidThesaurusError,
  RelationshipTypeDoesNotExistError,
  TemplateDoesNotExistError,
  RelationshipTargetPropertyNotFoundError,
  RelationshipTargetTypeMismatchError,
  PropertyThesaurusMismatchError,
  PropertyRelationTypeMismatchError,
  PropertyInheritedTypeMismatchError,
  NestedPropertyNotAvailableError,
  DefaultTemplateNotFoundError,
  DefaultTemplateDeletionError,
  DefaultTemplateConflictError,
  TemplateInUseError,
};
