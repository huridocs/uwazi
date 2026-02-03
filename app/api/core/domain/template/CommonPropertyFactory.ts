import { CommonProperty } from './CommonProperty.js';
import { Context } from './Property.js';
import { LoggerFactory } from '#api/core/infrastructure/factories/LoggerFactory.js';
import { CreationDateProperty } from './CreationDateProperty.js';
import { ModifiedDateProperty } from './ModifiedDateProperty.js';
import { TitleProperty, TitlePropertyProps } from './TitleProperty.js';

type CreateInput = TitlePropertyProps;

class CommonPropertyFactory {
  static create(input: CreateInput, context: Context): CommonProperty {
    if (input.type === 'text') return new TitleProperty(input, context);

    if (input.type === 'date') {
      if (input.name === 'creationDate') return new CreationDateProperty(input, context);
      if (input.name === 'editDate') return new ModifiedDateProperty(input, context);
    }

    LoggerFactory.systemLogger().warning(
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
