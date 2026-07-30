import { RelationshipTypesDataSource } from '#api/core/application/contracts/RelationshipTypesDataSource.js';
import { SettingsDataSource } from '#api/core/application/contracts/SettingsDataSource.js'; // Todo
import { ArrayUtils } from '#api/common.v2/utils/Array.js';
import { TemplatesDataSource } from '../contracts/TemplatesDataSource.js';
import { Context, Property } from '../../domain/template/Property.js';
import { IdGenerator } from '../contracts/IdGenerator.js';
import { PropertyType } from '../../domain/template/PropertyType.js';
import { PropertyFactoryCreateInput } from '../../domain/template/PropertyFactory.js';
import { AbstractPropertyCreatorService } from './AbstractPropertyCreatorService.js';
import { PropertyCreatorService } from './PropertyCreatorService.js';
import {
  SelectPropertyCreatorService,
  ThesauriDataSource,
} from './SelectPropertyCreatorService.js';
import { RelationshipPropertyCreatorService } from './RelationshipPropertyCreatorService.js';
import { NestedPropertyCreatorService } from './NestedPropertyCreatorService.js';

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
      nested: new NestedPropertyCreatorService({ templatesDS, settingsDS }),
    });
  }
}

export { PropertyCreatorServiceStrategy };
