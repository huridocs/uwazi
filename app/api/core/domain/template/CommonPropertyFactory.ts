import { CommonProperty } from './CommonProperty.js';
import { LoggerFactory } from '#api/core/infrastructure/factories/LoggerFactory.js';
import { CreationDateProperty } from './CreationDateProperty.js';
import { ModifiedDateProperty } from './ModifiedDateProperty.js';
import { TitleProperty, TitlePropertyProps } from './TitleProperty.js';

type CreateInput = TitlePropertyProps;

class CommonPropertyFactory {
  static create(input: CreateInput): CommonProperty {
    if (input.type === 'text') return new TitleProperty(input);

    if (input.type === 'date') {
      if (input.name === 'creationDate') return new CreationDateProperty(input);
      if (input.name === 'editDate') return new ModifiedDateProperty(input);
    }

    LoggerFactory.systemLogger().warning(
      `The following CommonProperty was not properly handled. ${JSON.stringify(input, null, 2)}`
    );

    return new CommonProperty({
      id: input.id,
      label: input.label,
      template: input.template,
      type: input.type as any,
      isCommonProperty: input.isCommonProperty,
      name: input.name,
      noLabel: input.noLabel,
      required: input.required,
      showInCard: input.showInCard,
    });
  }
}

export { CommonPropertyFactory };
