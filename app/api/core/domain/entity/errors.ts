/* eslint-disable max-classes-per-file */
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { InputFile } from '#api/core/infrastructure/files/InputFile.js';
import { DomainError } from '../error/DomainError.js';
import { AJVObject, ValidationError } from '../error/ValidationError.js';

export class EntityTranslationDoesNotExistError extends DomainError {
  constructor(language: LanguageISO6391, availableLanguages: LanguageISO6391[]) {
    super(
      `Translation for language '${language}' does not exist. ${JSON.stringify(availableLanguages)}`,
      'entity.entity.translation_does_not_exist_error'
    );
  }
}

export class EntityNotFoundError extends DomainError {
  constructor(sharedId: string) {
    super(
      `Entity with shared ID '${sharedId}' does not exist.`,
      'entity.entity.does_not_exist_error'
    );
  }
}

export class CannotCreateEntityFromNonPDFError extends DomainError {
  constructor() {
    super(
      'Cannot create entity from non-PDF file.',
      'entity.entity.cannot_create_entity_from_non_pdf_error'
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

export class EntityTemplateDoesNotExistError extends DomainError {
  constructor(templateIds: string[]) {
    super(
      `Entities reference non-existent templates: ${templateIds.join(', ')}`,
      'entity.entity.template_does_not_exist_error'
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

export class PropertyNotTranslatableError extends ValidationError {
  constructor(
    readonly language: LanguageISO6391,
    readonly property: string
  ) {
    super(
      `Property "${property}" is not translatable; send it with the target language values, not under "${language}".`,
      'entity.entity.property_not_translatable_error'
    );
  }

  asAJV(): AJVObject {
    return { message: this.message, keyword: 'propertyNotTranslatable' };
  }
}

export class MissingTranslatedPropertyError extends ValidationError {
  constructor(
    readonly language: LanguageISO6391,
    readonly property: string
  ) {
    super(
      `Translation "${language}" is missing the translatable property "${property}".`,
      'entity.entity.missing_translated_property_error'
    );
  }

  asAJV(): AJVObject {
    return { message: this.message, keyword: 'missingTranslatedProperty' };
  }
}

export class RequiredTranslatedPropertyError extends ValidationError {
  constructor(
    readonly language: LanguageISO6391,
    readonly property: string
  ) {
    super(
      `Property "${property}" is required and cannot be empty in translation "${language}".`,
      'entity.entity.required_translated_property_error'
    );
  }

  asAJV(): AJVObject {
    return { message: this.message, keyword: 'requiredTranslatedProperty' };
  }
}
