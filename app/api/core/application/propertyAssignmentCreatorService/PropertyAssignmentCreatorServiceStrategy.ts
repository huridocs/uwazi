import { TranslationsDataSource } from 'api/i18n.v2/contracts/TranslationsDataSource';
import { Template } from 'api/core/domain/template/Template';
import { ArrayUtils } from 'api/common.v2/utils/Array';
import { PropertyType } from 'api/core/domain/template/PropertyType';
import { PropertyAssignment } from 'api/core/domain/template/PropertyValue';
import { MultiLanguageEntityDataSource } from 'api/entities.v2/contracts/MultiLanguageEntitiesDataSource';
import { SettingsDataSource } from '../contracts/SettingsDataSource';
import { SelectPropertyAssignmentCreatorService } from './SelectPropertyAssignmentCreatorService';
import { ThesauriDataSource } from '../propertyCreatorService/SelectPropertyCreatorService';
import { RelationshipPropertyAssignmentCreatorService } from './RelationshipPropertyAssignmentCreatorService';
import {
  PropertyAssignmentCreatorService,
  PropertyAssignmentInput,
} from './PropertyAssignmentCreatorService';
import { DefaultPropertyAssignmentCreatorService } from './DefaultPropertyAssignmentCreatorService';
import { ImagePropertyAssignmentCreatorService } from './ImagePropertyAssignmentCreatorService';

type Props = {
  default: DefaultPropertyAssignmentCreatorService;
  select: SelectPropertyAssignmentCreatorService;
  relationship: RelationshipPropertyAssignmentCreatorService;
  image: ImagePropertyAssignmentCreatorService;
};

type CreateProps = {
  settingsDS: SettingsDataSource;
  translationsDS: TranslationsDataSource;
  thesauriDS: ThesauriDataSource;
  multiLanguageEntityDS: MultiLanguageEntityDataSource;
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

      default:
        return this.props.default;
    }
  }

  async bulkCreate(
    propertyAssignments: PropertyAssignmentInput[],
    template: Template,
    attachments: Express.Multer.File[]
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

  static create({ settingsDS, thesauriDS, translationsDS, multiLanguageEntityDS }: CreateProps) {
    return new PropertyAssignmentCreatorServiceStrategy({
      select: new SelectPropertyAssignmentCreatorService({
        settingsDS,
        thesauriDS,
        translationsDS,
      }),
      relationship: new RelationshipPropertyAssignmentCreatorService({
        settingsDS,
        multiLanguageEntityDS,
      }),
      image: new ImagePropertyAssignmentCreatorService(),
      default: new DefaultPropertyAssignmentCreatorService(),
    });
  }
}

export { PropertyAssignmentCreatorServiceStrategy };
