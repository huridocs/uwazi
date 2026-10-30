import { ThesauriDataSource } from '#api/core/application/contracts/ThesauriDataSource.js';
import { Property } from '../../domain/template/Property.js';
import { SelectPropertyWithInvalidThesaurusError } from '../../domain/template/errors.js';
import { IncorrectPropertyTypeError } from '../errors.js';
import {
  MultiSelectPropertyProps,
  MultiSelectProperty,
} from '../../domain/template/select/MultiSelectProperty.js';
import {
  SelectPropertyProps,
  SelectProperty,
} from '../../domain/template/select/SelectProperty.js';
import { AbstractPropertyCreatorService } from './AbstractPropertyCreatorService.js';

type Deps = {
  thesauriDS: ThesauriDataSource;
};

type Props = SelectPropertyProps | MultiSelectPropertyProps;

class SelectPropertyCreatorService extends AbstractPropertyCreatorService<Deps> {
  // eslint-disable-next-line class-methods-use-this
  protected async createProperty(props: Props): Promise<Property> {
    const select = this.createSelectOrMultiSelectProperty(props);

    const thesaurusExists = await this.deps.thesauriDS.existsById(select.content);

    if (!thesaurusExists) {
      throw new SelectPropertyWithInvalidThesaurusError(select.content);
    }

    return select;
  }

  // eslint-disable-next-line class-methods-use-this
  private createSelectOrMultiSelectProperty(props: Props): SelectProperty | MultiSelectProperty {
    if (props.type === 'select') return new SelectProperty(props);

    if (props.type === 'multiselect') return new MultiSelectProperty(props);

    throw new IncorrectPropertyTypeError(props.type || 'undefined', 'SelectPropertyCreatorService');
  }
}

export { SelectPropertyCreatorService };
export type { ThesauriDataSource };
