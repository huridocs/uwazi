import { CommonProperty } from 'api/templates.v2/model/CommonProperty';
import { Context } from 'api/templates.v2/model/Property';
import { TitleProperty, TitlePropertyProps } from './TitleProperty';
import { CreationDateProperty } from './CreationDateProperty';
import { ModifiedDateProperty } from './ModifiedDateProperty';

type CreateInput = TitlePropertyProps;

class CommonPropertyFactory {
  static create(input: CreateInput, context: Context): CommonProperty {
    if (input.type === 'text') return new TitleProperty(input, context);

    if (input.type === 'date') {
      if (input.name === 'creationDate') return new CreationDateProperty(input, context);
      if (input.name === 'editDate') return new ModifiedDateProperty(input, context);
    }

    throw new Error(`The following type was not handled. Type = ${input.type}`);
  }
}

export { CommonPropertyFactory };
