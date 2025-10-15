import { Context, Property, PropertyTypes } from 'api/templates.v2/model/Property';
import { TemplatesDataSource } from 'api/templates.v2/contracts/TemplatesDataSource';
import { RelationshipTypesDataSource } from 'api/relationshiptypes.v2/contracts/RelationshipTypesDataSource';
import { SettingsDataSource } from 'api/settings.v2/contracts/SettingsDataSource';
import { ArrayUtils } from 'api/common.v2/utils/Array';
import { IdGenerator } from 'api/common.v2/contracts/IdGenerator';
import { AbstractPropertyCreatorService, CreateInput } from './AbstractPropertyCreatorService';
import { PropertyCreatorService } from './PropertyCreatorService';
import { SelectPropertyCreatorService, ThesauriDataSource } from './SelectPropertyCreatorService';
import { RelationshipPropertyCreatorService } from './RelationshipPropertyCreatorService';
import { NestedPropertyCreatorService } from './NestedPropertyCreatorService';

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

type BulkCreateInput = (Omit<CreateInput, 'id' | 'template'> & { id?: string })[];

class PropertyCreatorServiceStrategy {
  constructor(private props: Props) {}

  getStrategy(type: PropertyTypes): AbstractPropertyCreatorService {
    switch (type) {
      case 'multiselect':
      case 'select':
        return this.props.select;

      case 'nested':
        return this.props.nested;

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
        { ...property, id: property.id || this.props.idGenerator.generate(), template },
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
      nested: new NestedPropertyCreatorService({ templatesDS, settingsDS }),
    });
  }
}

export { PropertyCreatorServiceStrategy };
