/* eslint-disable react/jsx-props-no-spreading */
import React, { useState, useRef, useEffect, isValidElement } from 'react';
import { usePopper } from 'react-popper';
import { Popover } from '@headlessui/react';
import { createPortal } from 'react-dom';
import { isClient } from 'app/utils';

type TruncatedTextProps = {
  children: React.ReactNode;
  maxLength?: number;
  tooltipClassname?: string;
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
const TruncatedText = ({ children, maxLength = 20, tooltipClassname }: TruncatedTextProps) => {
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  const [arrowElement, setArrowElement] = useState<HTMLDivElement | null>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const closeTimeoutRef = useRef<NodeJS.Timeout>();
  const { styles, attributes, update } = usePopper(referenceElement, popperElement, {
    placement: 'bottom',
    strategy: 'absolute',
    modifiers: [
      {
        name: 'arrow',
        options: {
          element: arrowElement,
          padding: 5,
        },
      },
      {
        name: 'offset',
        options: {
          offset: [0, 8],
        },
      },
      {
        name: 'preventOverflow',
        options: {
          padding: 5,
        },
      },
    ],
  });

  const text = getTextContent(children);
  const childClassName = getClassName(children);
  const shouldEllipsize = text.length > maxLength * 2;

  const [startText, endText] = truncateText(text, maxLength);

  const handleClose = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setPopoverOpen(false);
    }, 100);
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

  useEffect(() => {
    let resizeObserver: ResizeObserver;

    if (referenceElement && update) {
      resizeObserver = new ResizeObserver(async () => {
        if (popoverOpen) {
          await update();
        }
      });

      resizeObserver.observe(referenceElement);
    }

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [referenceElement, update, popoverOpen]);

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
          className={`pointer-events-auto cursor-pointer font-bold px-2 my-2 ${childClassName || ''}`}
          aria-expanded={popoverOpen}
          aria-haspopup="dialog"
        >
          [...]
        </Popover.Button>
        {isClient &&
          document.body &&
          createPortal(
            <Popover.Panel
              static
              ref={setPopperElement}
              style={{
                ...styles.popper,
                opacity: popoverOpen ? 1 : 0,
                transform: `${styles.popper.transform} ${popoverOpen ? 'scale(1)' : 'scale(0.95)'}`,
                transition: 'opacity 300ms ease-out, transform 300ms ease-out',
                pointerEvents: popoverOpen ? 'auto' : 'none',
                background: 'white',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                borderRadius: '0.75rem',
              }}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleClose}
              {...attributes.popper}
              as="div"
              role="dialog"
              aria-label="Tooltip for truncated text"
              className="tw-content"
            >
              <div
                ref={setArrowElement}
                {...attributes.arrow}
                style={{
                  ...styles.arrow,
                  width: 12,
                  height: 12,
                  background: 'red',
                  transform: 'rotate(45deg)',
                }}
              />
              <div
                className={`overflow-y-auto px-4 py-6 max-h-[60vh] max-w-56 lg:max-w-4xl ${tooltipClassname || ''}`}
              >
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
