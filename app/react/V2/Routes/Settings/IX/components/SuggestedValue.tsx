import React, { useState } from 'react';
import { usePopper } from 'react-popper';
import { Popover } from '@headlessui/react';

const SuggestedValue = ({ value, suggestion }: { value: string; suggestion: string }) => {
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  const [arrowElement, setArrowElement] = useState(null);
  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: 'top',
    strategy: 'absolute',
    modifiers: [{ name: 'arrow', options: { element: arrowElement } }],
  });

  let colorClass = '';
  if (!suggestion || suggestion === '') {
    colorClass = 'text-orange-500';
  }
  if (value === suggestion) {
    colorClass = 'text-green-400';
  } else {
    colorClass = 'text-orange-300';
  }
  const currentValue = value === '' ? '-' : value;
  const suggestedValue = suggestion === '' ? '-' : suggestion;
  return (
    <Popover>
      <Popover.Button
        ref={setReferenceElement}
        className="w-full h-full text-xs font-normal text-left focus-visible:outline-none"
      >
        <div>
          <div className="text-gray-500">{currentValue}</div>
          <div className={`text-left ${colorClass}`}>{suggestedValue}</div>
        </div>
      </Popover.Button>
      <Popover.Overlay
        ref={setPopperElement}
        style={styles.popper}
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...attributes.popper}
        as="div"
      >
        <div className="max-w-md px-[10px] py-3 rounded mb-3 overflow-y-auto text-xs font-normal text-gray-500 bg-white shadow-md max-h-56 w-fit">
          <div>
            <span className="font-bold">Current value:</span> {currentValue}
          </div>
          <div>
            <span className="font-bold">Suggestion:</span> {suggestedValue}
          </div>
        </div>
        <span
          ref={setArrowElement}
          className="absolute bottom-[4px] left-0 w-4 h-4 rotate-45 bg-white"
          // style={styles.arrow}
          style={{
            position: styles.arrow.position,
            left: styles.arrow.left,
            transform: styles.arrow.transform + ' rotate(45deg)',
            boxShadow: '2px 2px 3px rgba(40, 40, 40, 0.1)',
          }}
        />
      </Popover.Overlay>
    </Popover>
    // <>
    //   <div
    //     ref={setPopperElement}
    //     {...attributes.popper}
    //     style={styles.popper}
    //     className="max-w-md px-[10px] py-3 rounded mb-3 overflow-y-auto text-xs font-normal text-gray-500 bg-white shadow-md max-h-56 w-fit hidden"
    //   >
    //     This is a popup
    //     <div ref={setArrowElement} style={styles.arrow} className="mt-2" />
    //   </div>
    //   <button type="button" ref={setReferenceElement}>
    //     <div>
    //       <div className="text-xs font-normal text-gray-500">{currentValue}</div>
    //       <div className={`text-xs font-normal ${colorClass}`}>{suggestedValue}</div>
    //     </div>
    //   </button>
    // </>
  );
};

export { SuggestedValue };
