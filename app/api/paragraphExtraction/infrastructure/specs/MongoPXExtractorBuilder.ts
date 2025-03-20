import { ObjectId } from 'mongodb';

import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { TemplateSchema } from 'shared/types/templateType';

import { MongoPXExtractorDBO } from '../MongoPXExtractorDBO';

type Props = {
  extractor: MongoPXExtractorDBO;
  targetTemplate: TemplateSchema;
  sourceTemplate: TemplateSchema;
  targetRelationship: any;
  sourceRelationship: any;
};

const factory = getFixturesFactory();

export class MongoExtractorBuilder {
  private constructor(private props: Props) {}

  static create() {
    const sourceTemplate = factory.template('Source Template', [factory.property('text', 'text')]);
    const sourceRelationship = {
      _id: factory.id('source_relationship_type'),
      name: 'Source Relationship Type',
      properties: [],
    };

    const paragraphProperty = factory.property('target_paragraph_property', 'markdown');
    const paragraphNumberProperty = factory.property('target_paragraph_number_property', 'numeric');
    const relationshipProperty = factory.property('paragraph_to_source_entity', 'relationship', {
      content: sourceTemplate._id.toString(),
      relationType: sourceRelationship._id.toString(),
    });

    const targetTemplate = factory.template('target_template', [
      paragraphProperty,
      paragraphNumberProperty,
      relationshipProperty,
    ]);

    const targetRelationship = {
      _id: factory.id('target_relationship_type'),
      name: 'Target Relationship Type',
      properties: [],
    };

    return new MongoExtractorBuilder({
      extractor: {
        _id: new ObjectId(),
        paragraphNumberPropertyId: paragraphNumberProperty._id as ObjectId,
        paragraphPropertyId: paragraphProperty._id as ObjectId,
        sourceRelationshipTypeId: sourceRelationship._id,
        sourceTemplateId: sourceTemplate._id,
        targetRelationshipTypeId: targetRelationship._id,
        targetTemplateId: targetTemplate._id,
      },
      sourceRelationship,
      sourceTemplate,
      targetRelationship,
      targetTemplate,
    });
  }

  build(): Props {
    return { ...this.props };
  }
}
