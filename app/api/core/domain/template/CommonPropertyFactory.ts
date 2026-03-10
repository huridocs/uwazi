import { CommonProperty } from 'api/core/domain/template/CommonProperty';
import { Context } from 'api/core/domain/template/Property';
import { LoggerFactory } from 'api/core/infrastructure/factories/LoggerFactory';
import { CreationDateProperty } from './CreationDateProperty';
import { ModifiedDateProperty } from './ModifiedDateProperty';
import { TitleProperty, TitlePropertyProps } from './TitleProperty';

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
