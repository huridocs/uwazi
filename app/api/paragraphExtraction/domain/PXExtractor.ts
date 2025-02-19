import { ObjectId } from 'mongodb';

import { Entity } from 'api/entities.v2/model/Entity';
import { Template } from 'api/templates.v2/model/Template';
import { EntitySchema } from 'shared/types/entityType';

import { PXValidationError, PXErrorCode } from './PXValidationError';
import { ParagraphOutput } from './PXExtractionService';

export type PXExtractorProps = {
  id: string;
  sourceTemplate: Template;
  targetTemplate: Template;
};

export class PXExtractor {
  id: string;

  targetTemplate: Template;

  sourceTemplate: Template;

  constructor(props: PXExtractorProps) {
    this.id = props.id;
    this.targetTemplate = props.targetTemplate;
    this.sourceTemplate = props.sourceTemplate;

    this.validate();
  }

  private validate() {
    if (!this.targetTemplate.getPropertiesByType('markdown').length) {
      throw new PXValidationError(
        PXErrorCode.TARGET_TEMPLATE_INVALID,
        `Target template with id ${this.targetTemplate.id} should have at least one rich text property`
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

    return translation ?? mainTranslation;
  }

  canExtract(entity: Entity) {
    return this.sourceTemplate.id === entity.template;
  }

  createParagraph(sourceEntity: EntitySchema, extractedParagraph: ParagraphOutput): EntitySchema {
    const [richTextProperty] = this.targetTemplate.getPropertiesByType('markdown');
    const translation = PXExtractor.getTranslation(sourceEntity, extractedParagraph);

    return {
      language: sourceEntity.language,
      title: PXExtractor.createTitle(sourceEntity, extractedParagraph),
      template: new ObjectId(this.targetTemplate.id),
      metadata: {
        [richTextProperty.name]: [{ value: translation?.text, label: richTextProperty.label }],
      },
    };
  }

  createParagraphs(
    sourceEntities: EntitySchema[],
    extractedParagraph: ParagraphOutput
  ): EntitySchema[] {
    return sourceEntities.map(entity => this.createParagraph(entity, extractedParagraph));
  }
}
