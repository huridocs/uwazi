import React, { useState } from 'react';
import { usePopper } from 'react-popper';
import { Popover } from '@headlessui/react';
import { propertyValueFormatter } from 'app/V2/shared/helpers';
import { EntitySuggestionType } from 'shared/types/suggestionType';
import { ClientTemplateSchema } from 'app/istore';

const SuggestedValue = ({
  value,
  suggestion,
  templateProperties,
}: {
  value: string;
  suggestion: EntitySuggestionType;
  templateProperties: ClientTemplateSchema['properties'];
}) => {
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  const [arrowElement, setArrowElement] = useState(null);
  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: 'top',
    strategy: 'absolute',
    modifiers: [{ name: 'arrow', options: { element: arrowElement } }],
  });
  const [popoverOpen, setPopoverOpen] = useState(false);

  let colorClass = '';
  if (!suggestion || suggestion.suggestedValue === '') {
    colorClass = 'text-orange-500';
  }
  if (value === suggestion.suggestedValue) {
    colorClass = 'text-green-400';
  } else {
    colorClass = 'text-orange-300';
  }

  const property = templateProperties.find(prop => prop.name === suggestion.propertyName);

  const getCurrentValue = () => {
    if (value === '') return '-';
    if (property?.type === 'date') return propertyValueFormatter.date(value);
    return value;
  };

  const suggestedValue =
    suggestion.suggestedValue?.toString() === '' ? '-' : suggestion.suggestedValue?.toString();
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
          <div className={`text-left ${colorClass}`}>{suggestedValue}</div>
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
              <span className="font-bold">Current value:</span> {getCurrentValue()}
            </div>
            <div>
              <span className="font-bold">Suggestion:</span> {suggestedValue}
            </div>
          </div>
          <span
            // @ts-ignore
            ref={setArrowElement}
            className="absolute bottom-[6px] left-0 w-3 h-3 rotate-45 bg-white"
            style={{
              position: styles.arrow.position,
              left: styles.arrow.left,
              transform: styles.arrow.transform + ' rotate(45deg)',
              boxShadow: '2px 2px 3px rgba(40, 40, 40, 0.1)',
            }}
          />
        </Popover.Panel>
      )}
    </Popover>
  );
};

export { SuggestedValue };
