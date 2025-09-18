import { CommonProperty } from 'api/templates.v2/model/CommonProperty';
import { Context } from 'api/templates.v2/model/Property';
import { SystemLogger } from 'api/log.v2/infrastructure/StandardLogger';
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

    SystemLogger().warning(
      `The following CommonProperty was not properly handled. ${JSON.stringify(input, null, 2)}`
    );

    return new CommonProperty(
      {
        id: input.id,
        label: input.label,
        template: input.template,
        type: input.type as any,
        isCommonProperty: input.isCommonProperty,
        name: input.name,
        noLabel: input.noLabel,
        required: input.required,
        showInCard: input.showInCard,
      },
      context
    );
  }
}

export { CommonPropertyFactory };
