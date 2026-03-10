import { ObjectId } from 'mongodb';

import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { TemplateSchema } from 'shared/types/templateType';

type Props = {
  targetTemplate: TemplateSchema;
  sourceTemplate: TemplateSchema;
  targetRelationship: any;
  sourceRelationship: any;
};

export class MongoExtractorBuilder {
  static factory: ReturnType<typeof getFixturesFactory>;

  private constructor(private props: Props) {}

  static create() {
    MongoExtractorBuilder.factory = getFixturesFactory();

    const sourceTemplate = MongoExtractorBuilder.factory.template('Source Template', [
      MongoExtractorBuilder.factory.property('text', 'text'),
    ]);

    const sourceRelationship = {
      _id: MongoExtractorBuilder.factory.id('source_relationship_type'),
      name: 'Source Relationship Type',
      properties: [],
    };

    const paragraphProperty = MongoExtractorBuilder.factory.property(
      'target_paragraph_property',
      'markdown'
    );
    const paragraphNumberProperty = MongoExtractorBuilder.factory.property(
      'target_paragraph_number_property',
      'numeric'
    );
    const relationshipProperty = MongoExtractorBuilder.factory.property(
      'paragraph_to_source_entity',
      'relationship',
      {
        content: sourceTemplate._id.toString(),
        relationType: sourceRelationship._id.toString(),
      }
    );

    const targetTemplate = MongoExtractorBuilder.factory.template('target_template', [
      paragraphProperty,
      paragraphNumberProperty,
      relationshipProperty,
    ]);

    const targetRelationship = {
      _id: MongoExtractorBuilder.factory.id('target_relationship_type'),
      name: 'Target Relationship Type',
      properties: [],
    };

    return new MongoExtractorBuilder({
      sourceRelationship,
      sourceTemplate,
      targetRelationship,
      targetTemplate,
    });
  }

  withSourceTemplate(sourceTemplate: TemplateSchema) {
    this.props.sourceTemplate = sourceTemplate;

    return this;
  }

  withTargetTemplate(targetTemplate: TemplateSchema) {
    this.props.targetTemplate = targetTemplate;

    return this;
  }

  withTargetRelationship(targetRelationship: any) {
    this.props.targetRelationship = targetRelationship;

    return this;
  }

  withSourceRelationship(sourceRelationship: any) {
    this.props.sourceRelationship = sourceRelationship;

    return this;
  }

  build() {
    const [paragraphProperty, paragraphNumberProperty] = this.props.targetTemplate.properties!;

    return {
      ...this.props,
      extractor: {
        _id: new ObjectId(),
        paragraphNumberPropertyId: paragraphNumberProperty._id as ObjectId,
        paragraphPropertyId: paragraphProperty._id as ObjectId,
        sourceRelationshipTypeId: this.props.sourceRelationship._id,
        sourceTemplateId: this.props.sourceTemplate._id,
        targetRelationshipTypeId: this.props.targetRelationship._id,
        targetTemplateId: this.props.targetTemplate._id,
      },
    };
  }
}
