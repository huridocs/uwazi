import { CommonProperty } from 'api/templates.v2/model/CommonProperty';
import { TitleProperty, TitlePropertyProps } from './TitleProperty';
import { CreationDateProperty } from './CreationDateProperty';
import { ModifiedDateProperty } from './ModifiedDateProperty';

type CreateInput = TitlePropertyProps;

class CommonPropertyFactory {
  static create(input: CreateInput): CommonProperty {
    if (input.type === 'text') return new TitleProperty(input);

    if (input.type === 'date') {
      if (input.name === 'creationDate') return new CreationDateProperty(input);
      if (input.name === 'editDate') return new ModifiedDateProperty(input);
    }

    throw new Error(`The following type was not handled. Type = ${input.type}`);
  }
}

export { CommonPropertyFactory };
