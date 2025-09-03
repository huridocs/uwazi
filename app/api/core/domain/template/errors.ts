/* eslint-disable max-classes-per-file */
import { DomainError } from '../DomainError';

class TitlePropertyInvalidTypeError extends DomainError {
  constructor(type: string) {
    super(
      `The following type is not valid for TitleProperty. Type = ${type}`,
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

export {
  CreationDatePropertyInvalidNameError,
  CreationDatePropertyInvalidTypeError,
  ModifiedDatePropertyInvalidTypeError,
  ModifiedDatePropertyInvalidNameError,
  TitlePropertyInvalidTypeError,
  TitlePropertyInvalidNameError,
  CommonPropertyInvalidError,
};
