import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { usePopper } from 'react-popper';
import { useAtomValue } from 'jotai';
import { Popover } from '@headlessui/react';
import { secondsToDate } from 'app/V2/shared/dateHelpers';
import { EntitySuggestionType } from 'shared/types/suggestionType';
import { ClientTemplateSchema } from 'app/istore';
import { Translate } from 'app/I18N';
import { thesauriAtom } from 'V2/atoms';
import { ClientThesaurus, ClientThesaurusValue } from 'app/apiResponseTypes';
import { SuggestionValue } from '../types';

const SuggestedValue = ({
  value,
  suggestion,
  templateProperties,
}: {
  value: SuggestionValue | SuggestionValue[] | undefined;
  suggestion: EntitySuggestionType;
  templateProperties: ClientTemplateSchema['properties'];
}) => {
  const locale = useParams().lang;
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  const [arrowElement, setArrowElement] = useState(null);
  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: 'top',
    strategy: 'absolute',
    modifiers: [{ name: 'arrow', options: { element: arrowElement } }],
  });
  const [popoverOpen, setPopoverOpen] = useState(false);
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

    return value;
  };

  const getSuggestedValue = () => {
    if (suggestion.suggestedValue === '') {
      return '-';
    }
    if (type === 'date') {
      return secondsToDate((suggestion.suggestedValue as string | number) || '', locale);
    }
    if (type === 'select' || type === 'multiselect' || type === 'relationship') {
      const label = getLabelFromThesaurus(suggestion.suggestedValue as string, thesaurus);
      return <Translate context={content}>{label}</Translate>;
    }
    return suggestion.suggestedValue!.toString();
  };

  return (
    <Popover>
      <Popover.Button
        onMouseOver={() => setPopoverOpen(true)}
        onMouseLeave={() => setPopoverOpen(false)}
        ref={setReferenceElement}
        className="w-full h-full text-xs font-normal text-left focus-visible:outline-none hover:cursor-default"
      >
        <div>
          <div className="text-gray-500">{getCurrentValue()}</div>
          <div className={`text-left ${colorClass}`}>{getSuggestedValue()}</div>
        </div>
      </Popover.Button>
      {popoverOpen && (
        <Popover.Panel
          static
          ref={setPopperElement}
          style={styles.popper}
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...attributes.popper}
          as="div"
        >
          <div className="px-[10px] py-3 rounded mb-3 overflow-y-auto text-xs font-normal text-gray-500 bg-white shadow-md max-h-56 max-w-xs">
            <div>
              <span className="font-bold">
                <Translate>Current value</Translate>:
              </span>
              &nbsp;
              {getCurrentValue()}
            </div>
            <div>
              <span className="font-bold">
                <Translate>Suggestion:</Translate>
              </span>
              &nbsp;
              {getSuggestedValue()}
            </div>
          </div>
          <span
            // @ts-ignore
            ref={setArrowElement}
            className="absolute bottom-[6px] left-0 w-3 h-3 rotate-45 bg-white"
            style={{
              position: styles.arrow.position,
              left: styles.arrow.left,
              transform: `${styles.arrow.transform} rotate(45deg)`,
              boxShadow: '2px 2px 3px rgba(40, 40, 40, 0.1)',
            }}
          />
        </Popover.Panel>
      )}
    </Popover>
  );
};

export { SuggestedValue };
