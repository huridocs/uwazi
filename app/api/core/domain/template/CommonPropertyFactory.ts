// @ts-expect-error TS(2307): Cannot find module '../templates.v2/model/CommonPr... Remove this comment to see the full error message
import { CommonProperty } from 'api/templates.v2/model/CommonProperty.js';
// @ts-expect-error TS(2307): Cannot find module '../templates.v2/model/Property... Remove this comment to see the full error message
import { Context } from 'api/templates.v2/model/Property.js';
// @ts-expect-error TS(2307): Cannot find module '../log.v2/infrastructure/Stand... Remove this comment to see the full error message
import { SystemLogger } from '../log.v2/infrastructure/StandardLogger.js';
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
