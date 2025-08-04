import React from 'react';
import { useParams } from 'react-router';
import { useAtomValue } from 'jotai';
import { get } from 'lodash';
import { ClientTemplateSchema } from 'app/istore';
import { Translate } from 'app/I18N';
import { secondsToDate } from 'V2/shared/dateHelpers';
import { Truncate } from 'V2/Components/UI';
import { thesauriAtom } from 'V2/atoms';
import { ClientThesaurus, ClientThesaurusValue } from 'app/apiResponseTypes';
import { EntitySuggestion } from '../types';

// eslint-disable-next-line max-statements
const SuggestedValue = ({
  value,
  suggestion,
  templateProperties,
}: {
  value?: EntitySuggestion['suggestedValue'];
  suggestion: EntitySuggestion;
  templateProperties: ClientTemplateSchema['properties'];
}) => {
  const locale = useParams().lang;
  const thesauris = useAtomValue(thesauriAtom);

  let colorClass = '';
  if (!suggestion || suggestion.suggestedValue === '') {
    colorClass = 'text-orange-600';
  }
  if (value === suggestion.suggestedValue) {
    colorClass = 'text-green-600';
  } else {
    colorClass = 'text-orange-600';
  }

  const property = templateProperties.find(prop => prop.name === suggestion.propertyName);
  const { content, type } = property || {};
  const thesaurus = thesauris.find(t => t._id === content);

  const getLabelFromThesaurus = (id: string, _thesaurus: ClientThesaurus | undefined) => {
    if (!_thesaurus) {
      return '';
    }

    const flattenedValues = _thesaurus.values.reduce((acc: any, v) => {
      if (v.values) {
        return [...acc, ...v.values];
      }
      return [...acc, v];
    }, []);

    const thesaurusValue = flattenedValues.find((v: ClientThesaurusValue) => v.id === id);

    return thesaurusValue?.label || '';
  };

  const getCurrentValue = () => {
    if (value === '' || value === undefined) {
      return '-';
    }
    if (type === 'date') {
      return secondsToDate(value as string | number, locale);
    }

    if (type === 'select' || type === 'multiselect' || type === 'relationship') {
      const label = getLabelFromThesaurus(value as string, thesaurus);
      return <Translate context={content}>{label}</Translate>;
    }

    return value?.toString();
  };

  const getSuggestedValue = () => {
    if (suggestion.suggestedValue === '') {
      return '-';
    }
    if (type === 'date') {
      return secondsToDate((suggestion.suggestedValue as string | number) || '', locale);
    }
    if (type === 'select' || type === 'multiselect' || type === 'relationship') {
      const suggestedValueId =
        get(suggestion.suggestedValue, 'id') || (suggestion.suggestedValue as string);
      const label = getLabelFromThesaurus(suggestedValueId, thesaurus);
      return <Translate context={content}>{label}</Translate>;
    }
    return suggestion.suggestedValue!.toString();
  };

  return (
    <div className="flex flex-col gap-1">
      <Truncate maxLength={100} ellipsisPosition="center" tooltipClassname="text-xs text-gray-500">
        <span className="text-gray-500">{getCurrentValue()}</span>
      </Truncate>
      <Truncate maxLength={100} ellipsisPosition="center" tooltipClassname="text-xs">
        {suggestion.state.obsolete && (
          <span className="text-gray-400 italic">
            (<Translate>obsolete</Translate>) {getSuggestedValue()}
          </span>
        )}

        {!suggestion.state.obsolete && !suggestion.state.error && (
          <span className={`text-left ${colorClass}`}>{getSuggestedValue()}</span>
        )}
      </Truncate>
    </div>
  );
};

export { SuggestedValue };
