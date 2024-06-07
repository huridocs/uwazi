/* eslint-disable @typescript-eslint/no-unused-vars */
import Ajv from 'ajv';

import date from 'api/utils/date';
import { PropertySchema } from 'shared/types/commonTypes';
import { EntitySchema } from 'shared/types/entityType';
import {
  CommonSuggestion,
  IXSuggestionType,
  TextSelectionSuggestion,
  ValuesSelectionSuggestion,
} from 'shared/types/suggestionType';
import {
  TextSelectionSuggestionSchema,
  ValuesSelectionSuggestionSchema,
} from 'shared/types/suggestionSchema';
import { syncWrapValidator } from 'shared/tsUtils';
import { InternalIXResultsMessage } from './InformationExtraction';
import { AllowedPropertyTypes, checkTypeIsAllowed } from './ixextractors';

type RawSuggestion = TextSelectionSuggestion | ValuesSelectionSuggestion;

class RawSuggestionValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RawSuggestionValidationError';
  }
}

const createAjvValidator = (schema: any) => {
  const ajv = new Ajv({ allErrors: true });
  ajv.addVocabulary(['tsType']);
  return syncWrapValidator(ajv.compile(schema));
};

const textSelectionAjv = createAjvValidator(TextSelectionSuggestionSchema);
const valuesSelectionAjv = createAjvValidator(ValuesSelectionSuggestionSchema);

const textSelectionValidator = (
  suggestion: RawSuggestion
): suggestion is TextSelectionSuggestion => {
  textSelectionAjv(suggestion);
  return true;
};

const VALIDATORS = {
  text: textSelectionValidator,
  numeric: textSelectionValidator,
  date: textSelectionValidator,
  select: (suggestion: RawSuggestion): suggestion is ValuesSelectionSuggestion => {
    valuesSelectionAjv(suggestion);

    if (!('values' in suggestion) || suggestion.values.length > 1) {
      throw new RawSuggestionValidationError('Select suggestions must have one or zero values.');
    }

    return true;
  },
  multiselect: (suggestion: RawSuggestion): suggestion is ValuesSelectionSuggestion => {
    valuesSelectionAjv(suggestion);
    return true;
  },
};

const simpleSuggestion = (
  suggestedValue: string | number | null,
  rawSuggestion: TextSelectionSuggestion
) => ({
  suggestedValue,
  segment: rawSuggestion.segment_text,
  selectionRectangles: rawSuggestion.segments_boxes.map((box: any) => {
    const rect = { ...box, page: box.page_number.toString() };
    delete rect.page_number;
    return rect;
  }),
});

/* eslint-disable @typescript-eslint/no-unused-vars */
const FORMATTERS: Record<
  AllowedPropertyTypes,
  (
    rawSuggestion: RawSuggestion,
    currentSuggestion: IXSuggestionType,
    entity: EntitySchema
  ) => Partial<IXSuggestionType>
> = {
  text: (
    rawSuggestion: RawSuggestion,
    currentSuggestion: IXSuggestionType,
    entity: EntitySchema
  ) => {
    if (!VALIDATORS.text(rawSuggestion)) {
      throw new Error('Text suggestion is not valid.');
    }

    const rawText = rawSuggestion.text;
    const suggestedValue = rawText.trim();

    const suggestion: Partial<IXSuggestionType> = simpleSuggestion(suggestedValue, rawSuggestion);

    return suggestion;
  },
  numeric: (
    rawSuggestion: RawSuggestion,
    currentSuggestion: IXSuggestionType,
    entity: EntitySchema
  ) => {
    if (!VALIDATORS.numeric(rawSuggestion)) {
      throw new Error('Numeric suggestion is not valid.');
    }

    const suggestedValue = parseFloat(rawSuggestion.text.trim()) || null;
    const suggestion: Partial<IXSuggestionType> = simpleSuggestion(suggestedValue, rawSuggestion);

    return suggestion;
  },
  date: (
    rawSuggestion: RawSuggestion,
    currentSuggestion: IXSuggestionType,
    entity: EntitySchema
  ) => {
    if (!VALIDATORS.date(rawSuggestion)) {
      throw new Error('Date suggestion is not valid.');
    }

    const suggestedValue = date.dateToSeconds(
      rawSuggestion.text.trim(),
      currentSuggestion?.language || entity.language
    );
    const suggestion: Partial<IXSuggestionType> = {
      ...simpleSuggestion(suggestedValue, rawSuggestion),
      suggestedText: rawSuggestion.text,
    };

    return suggestion;
  },
  select: (
    rawSuggestion: RawSuggestion,
    currentSuggestion: IXSuggestionType,
    entity: EntitySchema
  ) => {
    if (!VALIDATORS.select(rawSuggestion)) {
      throw new Error('Select suggestion is not valid.');
    }

    const suggestedValue = rawSuggestion.values[0]?.id;

    const suggestion: Partial<IXSuggestionType> = {
      suggestedValue: suggestedValue || '',
      segment: rawSuggestion.segment_text,
    };

    return suggestion;
  },
  multiselect: (
    rawSuggestion: RawSuggestion,
    currentSuggestion: IXSuggestionType,
    entity: EntitySchema
  ) => {
    if (!VALIDATORS.multiselect(rawSuggestion)) {
      throw new Error('Multiselect suggestion is not valid.');
    }

    const suggestedValue = rawSuggestion.values.map(value => value.id);

    const suggestion: Partial<IXSuggestionType> = {
      suggestedValue,
      segment: rawSuggestion.segment_text,
    };

    return suggestion;
  },
};
/* eslint-enable @typescript-eslint/no-unused-vars */

const formatRawSuggestion = (
  rawSuggestion: RawSuggestion,
  property: PropertySchema | undefined,
  currentSuggestion: IXSuggestionType,
  entity: EntitySchema
) => {
  const type = checkTypeIsAllowed(property?.type || '');
  const formatter = FORMATTERS[type];
  return formatter(rawSuggestion, currentSuggestion, entity);
};

const readMessageSuccess = (message: InternalIXResultsMessage) =>
  message.success
    ? {}
    : {
        status: 'failed' as 'failed',
        error: message.error_message ? message.error_message : 'Unknown error',
      };

const formatSuggestion = async (
  property: PropertySchema | undefined,
  rawSuggestion: RawSuggestion,
  currentSuggestion: IXSuggestionType,
  entity: EntitySchema,
  message: InternalIXResultsMessage
) => {
  const suggestion: IXSuggestionType = {
    ...currentSuggestion,
    status: 'ready' as 'ready',
    error: '',
    ...formatRawSuggestion(rawSuggestion, property, currentSuggestion, entity),
    ...readMessageSuccess(message),
    date: new Date().getTime(),
  };

  return suggestion;
};

export { formatSuggestion };
export type { CommonSuggestion, TextSelectionSuggestion, ValuesSelectionSuggestion, RawSuggestion };
