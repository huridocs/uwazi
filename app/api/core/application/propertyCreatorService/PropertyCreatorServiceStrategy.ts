import { PropertyTypes } from '#api/templates.v2/model/Property.js';

import { TemplatesDataSource } from '#api/templates.v2/contracts/TemplatesDataSource.js';

import { RelationshipTypesDataSource } from '#api/relationshiptypes.v2/contracts/RelationshipTypesDataSource.js';
import { AbstractPropertyCreatorService } from './AbstractPropertyCreatorService';
import { PropertyCreatorService } from './PropertyCreatorService';
import { SelectPropertyCreatorService, ThesauriDataSource } from './SelectPropertyCreatorService';
import { RelationshipPropertyCreatorService } from './RelationshipPropertyCreatorService';

type Props = {
  default: PropertyCreatorService;
  select: SelectPropertyCreatorService;
  relationship: RelationshipPropertyCreatorService;
  nested: NestedPropertyCreatorService;
  idGenerator: IdGenerator;
};

type CreateProps = {
  templatesDS: TemplatesDataSource;
  relationshipTypesDS: RelationshipTypesDataSource;
  thesauriDS: ThesauriDataSource;
  settingsDS: SettingsDataSource;
  idGenerator: IdGenerator;
};

type BulkCreateInput = (Omit<PropertyFactoryCreateInput, 'id' | 'template'> & { id?: string })[];

class PropertyCreatorServiceStrategy {
  constructor(private props: Props) {}

  getStrategy(type: PropertyType): AbstractPropertyCreatorService {
    switch (type) {
      case 'multiselect':
      case 'select':
        return this.props.select;

      case 'relationship':
        return this.props.relationship;

      default:
        return this.props.default;
    }
  }

  async bulkCreate(
    input: BulkCreateInput,
    { newNameGeneration, template }: Context & { template: string }
  ): Promise<Property[]> {
    const properties = await ArrayUtils.parallelFor(input, async property =>
      this.getStrategy(property.type!).create(
        {
          ...(property as PropertyFactoryCreateInput),
          id: property.id || this.props.idGenerator.generate(),
          template,
        },
        { newNameGeneration }
      )
    );

    return properties;
  }

  static create({
    relationshipTypesDS,
    templatesDS,
    thesauriDS,
    settingsDS,
    idGenerator,
  }: CreateProps) {
    return new PropertyCreatorServiceStrategy({
      idGenerator,
      default: new PropertyCreatorService({ templatesDS }),
      relationship: new RelationshipPropertyCreatorService({
        templatesDS,
        relationshipTypesDS,
      }),
      select: new SelectPropertyCreatorService({
        templatesDS,
        thesauriDS,
      }),
    });
  }
}

export { PropertyCreatorServiceStrategy };
