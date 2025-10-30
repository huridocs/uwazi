import { TranslationsDataSource } from 'api/i18n.v2/contracts/TranslationsDataSource';
import { Template } from 'api/core/domain/template/Template';
import { ArrayUtils } from 'api/common.v2/utils/Array';
import { PropertyType } from 'api/core/domain/template/PropertyType';
import { PropertyAssignment } from 'api/core/domain/template/PropertyValue';
import { SettingsDataSource } from '../contracts/SettingsDataSource';
import { SelectPropertyAssignmentCreatorService } from './SelectPropertyAssignmentCreatorService';
import { ThesauriDataSource } from '../propertyCreatorService/SelectPropertyCreatorService';
import { PropertyAssignmentInput } from '../CreateEntity';
import { PropertyAssignmentCreatorService } from './PropertyAssignmentCreatorService';
import { DefaultPropertyAssignmentCreatorService } from './DefaultPropertyAssignmentCreatorService';

type Props = {
  default: DefaultPropertyAssignmentCreatorService;
  select: SelectPropertyAssignmentCreatorService;
};

type CreateProps = {
  settingsDS: SettingsDataSource;
  translationsDS: TranslationsDataSource;
  thesauriDS: ThesauriDataSource;
};

class PropertyAssignmentCreatorServiceStrategy {
  constructor(private props: Props) {}

  getStrategy(type: PropertyType): PropertyAssignmentCreatorService {
    switch (type) {
      case 'select':
      case 'multiselect':
        return this.props.select;

      default:
        return this.props.default;
    }
  }

  async bulkCreate(
    propertyAssignments: PropertyAssignmentInput[],
    template: Template
  ): Promise<PropertyAssignment[]> {
    const created = await ArrayUtils.sequentialFor(
      propertyAssignments,
      async propertyAssignment => {
        const property = template.getPropertyByName(propertyAssignment.name).getDataOrThrow();
        const strategy = this.getStrategy(property.type);

        return strategy.create({ propertyAssignment, template });
      }
    );

    return created.flat();
  }

  static create({ settingsDS, thesauriDS, translationsDS }: CreateProps) {
    return new PropertyAssignmentCreatorServiceStrategy({
      select: new SelectPropertyAssignmentCreatorService({
        settingsDS,
        thesauriDS,
        translationsDS,
      }),
      default: new DefaultPropertyAssignmentCreatorService(),
    });
  }
}

export { PropertyAssignmentCreatorServiceStrategy };
