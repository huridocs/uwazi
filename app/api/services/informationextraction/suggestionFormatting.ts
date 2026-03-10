/* eslint-disable camelcase */
/* eslint-disable max-classes-per-file */
/* eslint-disable max-lines */
import Ajv from 'ajv';

import date from 'api/utils/date';
import { LanguageISO6391, PropertySchema } from 'shared/types/commonTypes';
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

type RawSuggestion = {
  entity_name?: string;
} & (TextSelectionSuggestion | ValuesSelectionSuggestion);

class RawSuggestionValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RawSuggestionValidationError';
  }
}

type TitleAsProperty = {
  name: 'title';
  type: 'title';
};

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

const valuesSelectionValidator = (
  suggestion: RawSuggestion
): suggestion is ValuesSelectionSuggestion => {
  valuesSelectionAjv(suggestion);
  return true;
};

const VALIDATORS = {
  title: textSelectionValidator,
  text: textSelectionValidator,
  numeric: textSelectionValidator,
  date: textSelectionValidator,
  select: (suggestion: RawSuggestion): suggestion is ValuesSelectionSuggestion => {
    if (!valuesSelectionValidator(suggestion)) {
      throw new RawSuggestionValidationError('Select suggestion is not valid.');
    }

    if (!('values' in suggestion) || suggestion.values.length > 1) {
      throw new RawSuggestionValidationError('Select suggestions must have one or zero values.');
    }

    return true;
  },
  multiselect: valuesSelectionValidator,
  relationship: valuesSelectionValidator,
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

function multiValueIdsSuggestion(rawSuggestion: ValuesSelectionSuggestion) {
  const suggestedValue = rawSuggestion.values.map(value => ({
    id: value.id,
    label: value.label,
    ...(value.segment_text && { segment: value.segment_text }),
  }));

  const suggestion: Partial<IXSuggestionType> = {
    suggestedValue,
    segment: rawSuggestion.segment_text,
  };
  return suggestion;
}

const textFormatter = (
  rawSuggestion: RawSuggestion,
  _currentSuggestion: IXSuggestionType,
  _entity: EntitySchema
) => {
  if (!VALIDATORS.text(rawSuggestion)) {
    throw new Error('Text suggestion is not valid.');
  }

  const rawText = rawSuggestion.text;
  const suggestedValue = rawText.trim();

  const suggestion: Partial<IXSuggestionType> = simpleSuggestion(suggestedValue, rawSuggestion);

  return suggestion;
};

const FORMATTERS: Record<
  AllowedPropertyTypes,
  (
    rawSuggestion: RawSuggestion,
    currentSuggestion: IXSuggestionType,
    entity: EntitySchema
  ) => Partial<IXSuggestionType>
> = {
  title: textFormatter,
  markdown: textFormatter,
  text: textFormatter,
  numeric: (
    rawSuggestion: RawSuggestion,
    _currentSuggestion: IXSuggestionType,
    _entity: EntitySchema
  ) => {
    if (!VALIDATORS.numeric(rawSuggestion)) {
      throw new Error('Numeric suggestion is not valid.');
    }

    const suggestedValue = parseFloat(rawSuggestion.text.trim()) || '';
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

    let suggestedValue = date.dateToSeconds(
      rawSuggestion.text.trim(),
      currentSuggestion?.language || entity.language
    );

    if (!Number(suggestedValue)) {
      suggestedValue = '' as any;
    }

    const suggestion: Partial<IXSuggestionType> = {
      ...simpleSuggestion(suggestedValue, rawSuggestion),
      suggestedText: rawSuggestion.text,
    };

    return suggestion;
  },
  select: (
    rawSuggestion: RawSuggestion,
    _currentSuggestion: IXSuggestionType,
    _entity: EntitySchema
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
    _currentSuggestion: IXSuggestionType,
    _entity: EntitySchema
  ) => {
    if (!VALIDATORS.multiselect(rawSuggestion)) {
      throw new Error('Multiselect suggestion is not valid.');
    }

    const suggestion: Partial<IXSuggestionType> = multiValueIdsSuggestion(rawSuggestion);

    return suggestion;
  },
  relationship: (
    rawSuggestion: RawSuggestion,
    _currentSuggestion: IXSuggestionType,
    _entity: EntitySchema
  ) => {
    if (!VALIDATORS.relationship(rawSuggestion)) {
      throw new Error('Relationship suggestion is not valid.');
    }

    const suggestion: Partial<IXSuggestionType> = multiValueIdsSuggestion(rawSuggestion);

    return suggestion;
  },
};

type PropertyOrTitle = PropertySchema | TitleAsProperty | undefined;

const formatRawSuggestion = (
  rawSuggestion: RawSuggestion,
  property: PropertyOrTitle,
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

class SuggestionTextSourceFormatter {
  private static title({ text, segment_text }: RawSuggestion) {
    return {
      suggestedValue: text,
      segment: segment_text,
    };
  }

  private static text({ text, segment_text }: RawSuggestion) {
    return {
      suggestedValue: text,
      segment: segment_text,
    };
  }

  private static markdown({ text, segment_text }: RawSuggestion) {
    return {
      suggestedValue: text,
      segment: segment_text,
    };
  }

  private static numeric({ text, segment_text }: RawSuggestion) {
    return {
      suggestedValue: Number(text) || '',
      segment: segment_text,
    };
  }

  private static date({ text, segment_text }: RawSuggestion, language: LanguageISO6391) {
    let suggestedValue = date.dateToSeconds(text, language);
    if (!Number(suggestedValue)) {
      suggestedValue = '' as any;
    }

    return {
      suggestedValue,
      segment: segment_text,
      suggestedText: text,
    };
  }

  private static select({ segment_text, values }: RawSuggestion) {
    const suggestedValue = (values as any[])?.[0]?.id || '';

    return {
      suggestedValue,
      segment: segment_text,
    };
  }

  private static multiselect({ segment_text, values }: RawSuggestion) {
    const suggestedValue = (values as any[]).map(value => ({
      id: value.id,
      label: value.label,
      ...(value.segment_text && { segment: value.segment_text }),
    }));

    return {
      suggestedValue,
      segment: segment_text,
    };
  }

  private static relationship({ segment_text, values }: RawSuggestion) {
    const suggestedValue = (values as any[]).map(value => ({
      id: value.id,
      label: value.label,
      ...(value.segment_text && { segment: value.segment_text }),
    }));

    return {
      suggestedValue,
      segment: segment_text,
    };
  }

  static format(
    targetProperty: PropertySchema,
    rawSuggestion: RawSuggestion,
    language: LanguageISO6391
  ) {
    const type = checkTypeIsAllowed(targetProperty?.type || '');

    switch (type) {
      case 'date':
        return SuggestionTextSourceFormatter.date(rawSuggestion, language);

      case 'multiselect':
        return SuggestionTextSourceFormatter.multiselect(rawSuggestion);

      case 'select':
        return SuggestionTextSourceFormatter.select(rawSuggestion);

      case 'numeric':
        return SuggestionTextSourceFormatter.numeric(rawSuggestion);

      case 'relationship':
        return SuggestionTextSourceFormatter.relationship(rawSuggestion);

      case 'text':
        return SuggestionTextSourceFormatter.text(rawSuggestion);

      case 'title':
        return SuggestionTextSourceFormatter.title(rawSuggestion);

      case 'markdown':
        return SuggestionTextSourceFormatter.markdown(rawSuggestion);

      default: {
        throw new Error(`Unsupported property type for format suggestion: ${type}`);
      }
    }
  }
}

const formatSuggestionPdfSource = (
  property: PropertyOrTitle,
  rawSuggestion: RawSuggestion,
  currentSuggestion: IXSuggestionType,
  entity: EntitySchema,
  message: InternalIXResultsMessage
  // eslint-disable-next-line max-params
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

const formatSuggestionTextSource = (
  targetProperty: PropertySchema,
  rawSuggestion: RawSuggestion,
  currentSuggestion: IXSuggestionType,
  message: InternalIXResultsMessage
): IXSuggestionType => ({
  ...currentSuggestion,
  status: 'ready' as 'ready',
  error: '',
  ...SuggestionTextSourceFormatter.format(
    targetProperty,
    rawSuggestion,
    currentSuggestion.language! as LanguageISO6391
  ),
  ...readMessageSuccess(message),
  date: new Date().getTime(),
});

const formatSuggestionFacade = {
  formatSuggestionPdfSource,
  formatSuggestionTextSource,
};

export { formatSuggestionFacade };

export type { CommonSuggestion, TextSelectionSuggestion, ValuesSelectionSuggestion, RawSuggestion };
