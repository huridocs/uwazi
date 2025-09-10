import { PropertyTypes } from 'api/templates.v2/model/Property';
import { AbstractPropertyCreatorService } from './AbstractPropertyCreatorService';
import { PropertyCreatorService } from './PropertyCreatorService';
import { SelectPropertyCreatorService } from './SelectPropertyCreatorService';
import { RelationshipPropertyCreatorService } from './RelationshipPropertyCreatorService';

type Props = {
  default: PropertyCreatorService;
  select: SelectPropertyCreatorService;
  relationship: RelationshipPropertyCreatorService;
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
}

export { PropertyCreatorServiceStrategy };
