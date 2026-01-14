/* eslint-disable max-classes-per-file */
import { LanguageISO6391 } from 'shared/types/commonTypes';
import { InputFile } from 'api/core/infrastructure/files/InputFile';
import { DomainError } from '../error/DomainError';

export class EntityTranslationDoesNotExistError extends DomainError {
  constructor(language: LanguageISO6391, availableLanguages: LanguageISO6391[]) {
    super(
      `Translation for language '${language}' does not exist. ${JSON.stringify(availableLanguages)}`,
      'entity.entity.translation_does_not_exist_error'
    );
  }
}

export class AttachmentNotFoundError extends DomainError {
  constructor(index: number, available: InputFile[]) {
    super(
      `Attachment at index '${index}' was not found. ${JSON.stringify(available.map(f => f.filename))}`,
      'entity.entity.attachment_not_found_error'
    );
  }
}

export class RelationshipPropertyDoesNotExistError extends DomainError {
  constructor(propertyName: string, missing: string[]) {
    super(
      `Relationship property "${propertyName}" references non-existent entities: ${missing.join(
        ', '
      )}`,
      'entity.entity.relationship_property_does_not_exist_error'
    );
  }
}

export class RelationshipTemplateMismatchError extends DomainError {
  constructor(propertyName: string, expectedContent: string, wrongTemplate: string[]) {
    super(
      `Relationship property "${propertyName}" expects template ${expectedContent}, got: ${wrongTemplate.join(
        ', '
      )}`,
      'entity.entity.relationship_template_mismatch_error'
    );
  }
}

export class DuplicatePermissionsError extends DomainError {
  constructor() {
    super(
      'Permissions should be unique by person/group',
      'entity.entity.duplicate_permissions_error'
    );
  }
}

export class PropertyDoesNotExistError extends DomainError {
  constructor(propertyName: string) {
    super(
      `Property ${propertyName} does not exist in entity metadata`,
      'entity.entity.property_does_not_exist_error'
    );
  }
}

export class PropertyTypeMismatchOnSetError extends DomainError {
  constructor(propertyName: string, currentType: string, newType: string) {
    super(
      `Cannot change the type of property ${propertyName} from ${currentType} to ${newType}`,
      'entity.entity.property_type_mismatch_on_set_error'
    );
  }
}
