import { ObjectId } from 'mongodb';

import { Entity } from 'api/entities.v2/model/Entity';
import { Template } from 'api/core/domain/template/Template';
import { EntitySchema } from 'shared/types/entityType';
import { Property } from 'api/core/domain/template/Property';
import { LanguageISO6391 } from 'shared/types/commonTypes';

import { PXValidationError, PXErrorCode } from './PXValidationError';
import { ParagraphOutput } from './PXExtractionService';

export type PXExtractorProps = {
  id: string;
  sourceTemplate: Template;
  targetTemplate: Template;
  paragraphPropertyId: string;
  paragraphNumberPropertyId: string;
  sourceRelationshipTypeId: string;
  targetRelationshipTypeId: string;
};

export class PXExtractor {
  id: string;

  sourceRelationshipTypeId: string;

  targetRelationshipTypeId: string;

  targetTemplate: Template;

  sourceTemplate: Template;

  paragraphProperty: Property;

  paragraphNumberProperty: Property;

  constructor(private props: PXExtractorProps) {
    this.id = props.id;
    this.targetTemplate = props.targetTemplate;
    this.sourceTemplate = props.sourceTemplate;
    this.paragraphProperty = props.targetTemplate.getPropertyById(props.paragraphPropertyId)!;
    this.paragraphNumberProperty = props.targetTemplate.getPropertyById(
      props.paragraphNumberPropertyId
    )!;
    this.sourceRelationshipTypeId = props.sourceRelationshipTypeId;
    this.targetRelationshipTypeId = props.targetRelationshipTypeId;

    this.validate();
  }

  // eslint-disable-next-line max-statements
  private validate() {
    if (!this.paragraphProperty) {
      throw new PXValidationError(
        PXValidationError.codes.PARAGRAPH_PROPERTY_DOES_NOT_EXIST,
        `Target Template does not have a Property with the id ${this.props.paragraphPropertyId}`
      );
    }

    if (!this.paragraphProperty) {
      throw new PXValidationError(
        PXValidationError.codes.PARAGRAPH_PROPERTY_DOES_NOT_EXIST,
        `Target Template does not have a Property with the id ${this.props.paragraphPropertyId}`
      );
    }

    if (!this.paragraphNumberProperty) {
      throw new PXValidationError(
        PXValidationError.codes.PARAGRAPH_NUMBER_PROPERTY_DOES_NOT_EXIST,
        `Target Template does not have a Property with the id ${this.props.paragraphNumberPropertyId}`
      );
    }

    if (this.paragraphProperty.type !== 'markdown') {
      throw new PXValidationError(
        PXValidationError.codes.PARAGRAPH_PROPERTY_IS_NOT_OF_RICH_TEXT,
        'Property type which store Paragraph is not of the rich text type'
      );
    }

    if (this.paragraphNumberProperty.type !== 'numeric') {
      throw new PXValidationError(
        PXValidationError.codes.PARAGRAPH_NUMBER_PROPERTY_IS_NOT_A_NUMBER,
        'Property type which store Paragraph number is not of the number type'
      );
    }

    if (this.targetTemplate.id === this.sourceTemplate.id) {
      throw new PXValidationError(
        PXErrorCode.TARGET_SOURCE_TEMPLATE_EQUAL,
        'Target and Source template cannot be the same'
      );
    }
  }

  private static createTitle(
    sourceEntity: EntitySchema,
    extractedParagraph: ParagraphOutput
  ): string {
    return `${sourceEntity.title}.${extractedParagraph.paragraphNumber.toString().padStart(2, '0')}`;
  }

  private static getTranslation(sourceEntity: EntitySchema, extractedParagraph: ParagraphOutput) {
    const translation = extractedParagraph.translations.find(
      t => t.language === sourceEntity.language
    );

    const mainTranslation = extractedParagraph.translations.find(t => t.isMainLanguage)!;

    if (translation?.text.length) {
      return translation;
    }

    return mainTranslation;
  }

  private static sortByMainLanguage(
    a: EntitySchema,
    b: EntitySchema,
    mainLanguage: LanguageISO6391
  ) {
    if (a.language === mainLanguage && b.language !== mainLanguage) {
      return -1;
    }
    if (a.language !== mainLanguage && b.language === mainLanguage) {
      return 1;
    }
    return 0;
  }

  canExtract(sourceEntity: Entity) {
    return this.sourceTemplate.id === sourceEntity.template;
  }

  createParagraph(sourceEntity: EntitySchema, extractedParagraph: ParagraphOutput): EntitySchema {
    const translation = PXExtractor.getTranslation(sourceEntity, extractedParagraph);

    return {
      language: sourceEntity.language,
      title: PXExtractor.createTitle(sourceEntity, extractedParagraph),
      template: new ObjectId(this.targetTemplate.id),
      metadata: {
        [this.paragraphProperty.name]: [{ value: translation.text }],
        [this.paragraphNumberProperty.name]: [{ value: extractedParagraph.paragraphNumber }],
      },
    };
  }

  createParagraphs(
    sourceEntities: EntitySchema[],
    extractedParagraph: ParagraphOutput
  ): EntitySchema[] {
    const mainLanguage = extractedParagraph.translations.find(t => t.isMainLanguage)!.language;

    const paragraphs = sourceEntities.map(entity =>
      this.createParagraph(entity, extractedParagraph)
    );

    return paragraphs.sort((a, b) => PXExtractor.sortByMainLanguage(a, b, mainLanguage));
  }
}
