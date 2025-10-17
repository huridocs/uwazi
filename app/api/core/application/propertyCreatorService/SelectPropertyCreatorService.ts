import { Context, Property } from '../../domain/template/Property';
import { SelectPropertyWithInvalidThesaurusError } from '../../domain/template/errors';
import {
  MultiSelectPropertyProps,
  MultiSelectProperty,
} from '../../domain/template/MultiSelectProperty';
import { SelectPropertyProps, SelectProperty } from '../../domain/template/SelectProperty';
import { AbstractPropertyCreatorService } from './AbstractPropertyCreatorService';

interface ThesauriDataSource {
  exists(id: string): Promise<boolean>;
}

type Deps = {
  thesauriDS: ThesauriDataSource;
};

type Props = SelectPropertyProps | MultiSelectPropertyProps;

class SelectPropertyCreatorService extends AbstractPropertyCreatorService<Deps> {
  // eslint-disable-next-line class-methods-use-this
  protected async createProperty(props: Props, context: Context): Promise<Property> {
    const select = this.createSelectOrMultiSelectProperty(props, context);

    const thesaurusExists = await this.deps.thesauriDS.exists(select.content);

    if (!thesaurusExists) {
      throw new SelectPropertyWithInvalidThesaurusError(select.content);
    }

    return select;
  }

  // eslint-disable-next-line class-methods-use-this
  private createSelectOrMultiSelectProperty(
    props: Props,
    context: Context
  ): SelectProperty | MultiSelectProperty {
    if (props.type === 'select') return new SelectProperty(props, context);

    if (props.type === 'multiselect') return new MultiSelectProperty(props, context);

    throw new Error(
      `The following type is incorrect for SelectPropertyCreatorService. Type = ${props.type}`
    );
  }
}

export { SelectPropertyCreatorService };
export type { ThesauriDataSource };
