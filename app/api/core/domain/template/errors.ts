/* eslint-disable max-classes-per-file */
import { Property } from 'api/templates.v2/model/Property';
import { Template } from 'api/templates.v2/model/Template';
import { DomainError } from '../DomainError';
import { AJVObject, ValidationError } from '../error/ValidationError';

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

class PropertyNotUniqueOnTheSystemError extends DomainError {
  constructor(property: Property) {
    super(
      `The following Property is not unique on the system. Label = ${property.label} and Name = ${property.name}`,
      'template.property.property_not_unique_on_the_system_error'
    );
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
  PropertyNotUniqueOnTheSystemError,
  TemplateWithDuplicatedNameOnTheSystemError,
  FieldIsRequiredError,
  SelectPropertyWithInvalidThesaurusError,
  RelationshipTypeDoesNotExistError,
  TemplateDoesNotExistError,
  RelationshipTargetPropertyNotFoundError,
  RelationshipTargetTypeMismatchError,
};
