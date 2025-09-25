import { PropertyTypes } from 'api/templates.v2/model/Property';
import { TemplatesDataSource } from 'api/templates.v2/contracts/TemplatesDataSource';
import { RelationshipTypesDataSource } from 'api/relationshiptypes.v2/contracts/RelationshipTypesDataSource';
import { SettingsDataSource } from 'api/settings.v2/contracts/SettingsDataSource';
import { AbstractPropertyCreatorService } from './AbstractPropertyCreatorService';
import { PropertyCreatorService } from './PropertyCreatorService';
import { SelectPropertyCreatorService, ThesauriDataSource } from './SelectPropertyCreatorService';
import { RelationshipPropertyCreatorService } from './RelationshipPropertyCreatorService';
import { NestedPropertyCreatorService } from './NestedPropertyCreatorService';

type Props = {
  default: PropertyCreatorService;
  select: SelectPropertyCreatorService;
  relationship: RelationshipPropertyCreatorService;
  nested: NestedPropertyCreatorService;
};

type CreateProps = {
  templatesDS: TemplatesDataSource;
  relationshipTypesDS: RelationshipTypesDataSource;
  thesauriDS: ThesauriDataSource;
  settingsDS: SettingsDataSource;
};

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

  static create({ relationshipTypesDS, templatesDS, thesauriDS, settingsDS }: CreateProps) {
    return new PropertyCreatorServiceStrategy({
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
