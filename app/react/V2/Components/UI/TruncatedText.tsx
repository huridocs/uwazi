import React, { useState, useRef, useEffect, isValidElement } from 'react';
import { usePopper } from 'react-popper';
import { Popover } from '@headlessui/react';
import { createPortal } from 'react-dom';

type TruncatedTextProps = {
  children: React.ReactNode;
  maxLength?: number;
};

const truncateText = (text: string, maxLength: number): [start: string, end: string] => {
  if (text.length <= maxLength) {
    return [text, ''];
  }

  const startTextEndIndex = Math.min(
    text.indexOf('.', Math.floor(maxLength / 2)) + 1 || maxLength,
    maxLength
  );
  const startText = text.slice(0, startTextEndIndex);

  const endTextStartIndex = Math.max(text.length - maxLength, startTextEndIndex);
  const adjustedEndTextStartIndex = text.lastIndexOf(' ', endTextStartIndex);
  const endText = text.slice(
    adjustedEndTextStartIndex > startTextEndIndex ? adjustedEndTextStartIndex : endTextStartIndex
  );

  return [startText, endText];
};

const getTextContent = (node: React.ReactNode): string => {
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node);
  }

  if (isValidElement(node)) {
    const { children } = node.props;
    return getTextContent(children);
  }

  return '';
};

const getClassName = (node: React.ReactNode): string => {
  if (isValidElement(node)) {
    return node.props.className || '';
  }
  return '';
};

// eslint-disable-next-line max-statements
const TruncatedText = ({ children, maxLength = 20 }: TruncatedTextProps) => {
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout>();
  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: 'bottom',
    strategy: 'absolute',
  });
  const [popoverOpen, setPopoverOpen] = useState(false);

  const text = getTextContent(children);
  const childClassName = getClassName(children);
  const shouldEllipsize = text.length > maxLength * 2;

  const [startText, endText] = truncateText(text, maxLength);

  const handleClose = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setPopoverOpen(false);
    }, 200);
  };

  const handleMouseEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
  };

  useEffect(
    () => () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    },
    []
  );

  if (!shouldEllipsize) {
    return <>{children}</>;
  }

  return (
    <div>
      <Popover>
        <span className={childClassName}>{startText}</span>
        <Popover.Button
          onMouseOver={() => setPopoverOpen(true)}
          onMouseLeave={handleClose}
          onTouchStart={() => setPopoverOpen(true)}
          onTouchEnd={handleClose}
          ref={setReferenceElement}
          as="span"
          className={`pointer-events-auto cursor-pointer font-bold px-2 ${childClassName || ''}`}
        >
          [...]
        </Popover.Button>
        {popoverOpen &&
          createPortal(
            <Popover.Panel
              static
              ref={setPopperElement}
              style={styles.popper}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleClose}
              // eslint-disable-next-line react/jsx-props-no-spreading
              {...attributes.popper}
              as="div"
              className="tw-content"
            >
              <div className="bg-white overflow-y-auto px-2 py-3 rounded mb-3 text-xs font-normal text-gray-500 shadow-md max-h-[60vh] max-w-56 lg:max-w-4xl">
                {text}
              </div>
            </Popover.Panel>,
            document.body
          )}
        <span className={childClassName}>{endText}</span>
      </Popover>
    </div>
  );
};

export { TruncatedText };
