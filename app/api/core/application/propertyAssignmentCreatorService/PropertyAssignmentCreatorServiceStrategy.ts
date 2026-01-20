import { TranslationsDataSource } from '#api/i18n.v2/contracts/TranslationsDataSource.js';
import { Template } from '#api/core/domain/template/Template.js';
import { ArrayUtils } from '#api/common.v2/utils/Array.js';
import { PropertyType } from '#api/core/domain/template/PropertyType.js';
import { PropertyAssignment } from '#api/core/domain/template/PropertyValue.js';
import { MultiLanguageEntityDataSource } from '#api/entities.v2/contracts/MultiLanguageEntitiesDataSource.js';
import { InputFile } from '#api/core/infrastructure/files/InputFile.js';
import { SettingsDataSource } from '#api/core/application/contracts/SettingsDataSource.js';
import { SelectPropertyAssignmentCreatorService } from '#api/core/application/propertyAssignmentCreatorService/SelectPropertyAssignmentCreatorService.js';
import { ThesauriDataSource } from '#api/core/application/propertyCreatorService/SelectPropertyCreatorService.js';
import { RelationshipPropertyAssignmentCreatorService } from '#api/core/application/propertyAssignmentCreatorService/RelationshipPropertyAssignmentCreatorService.js';
import {
  PropertyAssignmentCreatorService,
  PropertyAssignmentInput,
} from '#api/core/application/propertyAssignmentCreatorService/PropertyAssignmentCreatorService.js';
import { DefaultPropertyAssignmentCreatorService } from '#api/core/application/propertyAssignmentCreatorService/DefaultPropertyAssignmentCreatorService.js';
import { ImagePropertyAssignmentCreatorService } from '#api/core/application/propertyAssignmentCreatorService/ImagePropertyAssignmentCreatorService.js';
import { MediaPropertyAssignmentCreatorService } from '#api/core/application/propertyAssignmentCreatorService/MediaPropertyAssignmentCreatorService.js';

type Props = {
  default: DefaultPropertyAssignmentCreatorService;
  select: SelectPropertyAssignmentCreatorService;
  relationship: RelationshipPropertyAssignmentCreatorService;
  image: ImagePropertyAssignmentCreatorService;
  media: MediaPropertyAssignmentCreatorService;
};

type CreateProps = {
  settingsDS: SettingsDataSource;
  translationsDS: TranslationsDataSource;
  thesauriDS: ThesauriDataSource;
  entitiesDS: MultiLanguageEntityDataSource;
};

class PropertyAssignmentCreatorServiceStrategy {
  constructor(private props: Props) {}

  getStrategy(type: PropertyType): PropertyAssignmentCreatorService {
    switch (type) {
      case 'select':
      case 'multiselect':
        return this.props.select;
      case 'relationship':
        return this.props.relationship;
      case 'image':
        return this.props.image;
      case 'media':
        return this.props.media;

      default:
        return this.props.default;
    }
  }

  async bulkCreate(
    propertyAssignments: PropertyAssignmentInput[],
    template: Template,
    attachments: InputFile[]
  ): Promise<PropertyAssignment[]> {
    const created = await ArrayUtils.sequentialFor(
      propertyAssignments,
      async propertyAssignment => {
        const property = template.getPropertyByName(propertyAssignment.name).getDataOrThrow();
        const strategy = this.getStrategy(property.type);

        return strategy.create({ propertyAssignment, template, attachments });
      }
    );

    return created.flat();
  }

  static create({ settingsDS, thesauriDS, translationsDS, entitiesDS }: CreateProps) {
    return new PropertyAssignmentCreatorServiceStrategy({
      select: new SelectPropertyAssignmentCreatorService({
        settingsDS,
        thesauriDS,
        translationsDS,
      }),
      relationship: new RelationshipPropertyAssignmentCreatorService({
        settingsDS,
        entitiesDS,
      }),
      image: new ImagePropertyAssignmentCreatorService(),
      media: new MediaPropertyAssignmentCreatorService(),
      default: new DefaultPropertyAssignmentCreatorService(),
    });
  }
}

export { PropertyAssignmentCreatorServiceStrategy };
