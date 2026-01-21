import { Property, Context } from '#api/core/domain/template/Property.js';
import { PropertyType } from '#api/core/domain/template/PropertyType.js';
import { PropertyFactory, PropertyFactoryCreateInput } from '#api/core/domain/template/PropertyFactory.js';
import { TemplatesDataSource } from '#api/core/application/contracts/TemplatesDataSource.js';
import { SettingsDataSource } from '#api/core/application/contracts/SettingsDataSource.js';
import { IdGenerator } from '#api/core/application/contracts/IdGenerator.js';
import { RelationshipTypesDataSource } from '#api/relationshiptypes.v2/contracts/RelationshipTypesDataSource.js';
import { AbstractPropertyCreatorService } from '#api/core/application/propertyCreatorService/AbstractPropertyCreatorService.js';
import { PropertyCreatorService } from '#api/core/application/propertyCreatorService/PropertyCreatorService.js';
import { SelectPropertyCreatorService, ThesauriDataSource } from '#api/core/application/propertyCreatorService/SelectPropertyCreatorService.js';
import { RelationshipPropertyCreatorService } from '#api/core/application/propertyCreatorService/RelationshipPropertyCreatorService.js';
import { NestedPropertyCreatorService } from '#api/core/application/propertyCreatorService/NestedPropertyCreatorService.js';
import { ArrayUtils } from '#api/common.v2/utils/Array.js';

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
      nested: new NestedPropertyCreatorService({
        templatesDS,
        settingsDS,
      }),
    });
  }
}

export { PropertyCreatorServiceStrategy };
