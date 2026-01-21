import { Context, Property } from '#api/core/domain/template/Property.js';
import { AbstractPropertyCreatorService } from '#api/core/application/propertyCreatorService/AbstractPropertyCreatorService.js';
import { ThesauriDataSource } from '#api/core/infrastructure/mongodb/thesauri/MongoThesauriDS.js';
import { SelectPropertyWithInvalidThesaurusError } from '#api/core/domain/template/errors.js';
import { IncorrectPropertyTypeError } from '#api/core/application/errors.js';
import {
  MultiSelectPropertyProps,
  MultiSelectProperty,
} from '#api/core/domain/template/select/MultiSelectProperty.js';
import { SelectPropertyProps, SelectProperty } from '#api/core/domain/template/select/SelectProperty.js';

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

    throw new IncorrectPropertyTypeError(props.type || 'undefined', 'SelectPropertyCreatorService');
  }
}

export { SelectPropertyCreatorService };
export type { ThesauriDataSource };
