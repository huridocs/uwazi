import { PropertyTypes } from 'api/templates.v2/model/Property';
import { TemplatesDataSource } from 'api/templates.v2/contracts/TemplatesDataSource';
import { RelationshipTypesDataSource } from 'api/relationshiptypes.v2/contracts/RelationshipTypesDataSource';
import { AbstractPropertyCreatorService } from './AbstractPropertyCreatorService';
import { PropertyCreatorService } from './PropertyCreatorService';
import { SelectPropertyCreatorService, ThesauriDataSource } from './SelectPropertyCreatorService';
import { RelationshipPropertyCreatorService } from './RelationshipPropertyCreatorService';

type Props = {
  default: PropertyCreatorService;
  select: SelectPropertyCreatorService;
  relationship: RelationshipPropertyCreatorService;
};

type CreateProps = {
  templatesDS: TemplatesDataSource;
  relationshipTypesDS: RelationshipTypesDataSource;
  thesauriDS: ThesauriDataSource;
};

class PropertyCreatorServiceStrategy {
  constructor(private props: Props) {}

  getStrategy(type: PropertyTypes): AbstractPropertyCreatorService {
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

  static create({ relationshipTypesDS, templatesDS, thesauriDS }: CreateProps) {
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
    });
  }
}

export { PropertyCreatorServiceStrategy };
