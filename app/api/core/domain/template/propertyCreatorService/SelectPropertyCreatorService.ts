import { Property } from 'api/templates.v2/model/Property';
import { AbstractPropertyCreatorService } from './AbstractPropertyCreatorService';
import { SelectProperty, SelectPropertyProps } from '../SelectProperty';
import { SelectPropertyWithInvalidThesaurusError } from '../errors';
import { MultiSelectProperty, MultiSelectPropertyProps } from '../MultiSelectProperty';

interface ThesauriDataSource {
  exists(id: string): Promise<boolean>;
}

type Deps = {
  thesauriDS: ThesauriDataSource;
};

type Props = SelectPropertyProps | MultiSelectPropertyProps;

class SelectPropertyCreatorService extends AbstractPropertyCreatorService<Deps> {
  // eslint-disable-next-line class-methods-use-this
  protected async createProperty(props: Props): Promise<Property> {
    const select = this.createSelectOrMultiSelectProperty(props);

    const thesaurusExists = await this.deps.thesauriDS.exists(select.content);

    if (!thesaurusExists) {
      throw new SelectPropertyWithInvalidThesaurusError(select.content);
    }

    return select;
  }

  // eslint-disable-next-line class-methods-use-this
  private createSelectOrMultiSelectProperty(props: Props): SelectProperty | MultiSelectProperty {
    if (props.type === 'select') return new SelectProperty(props);

    if (props.type === 'multiselect') return new MultiSelectProperty(props);

    throw new Error(
      `The following type is incorrect for SelectPropertyCreatorService. Type = ${props.type}`
    );
  }
}

export { SelectPropertyCreatorService };
export type { ThesauriDataSource };
