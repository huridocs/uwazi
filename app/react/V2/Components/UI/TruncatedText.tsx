import React, { isValidElement } from 'react';
import { Tooltip } from 'flowbite-react';

type TruncatedTextProps = {
  children: React.ReactNode;
  maxLength?: number;
  tooltipClassname?: string;
};

const truncateText = (text: string, maxLength: number): [string, string] => {
  if (text.length <= maxLength) return [text, ''];
  const start = text.slice(0, Math.floor(maxLength / 2)).trim();
  const end = text.slice(-Math.floor(maxLength / 2)).trim();
  return [start, end];
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

const TruncatedText = ({ children, maxLength = 20, tooltipClassname }: TruncatedTextProps) => {
  const text = getTextContent(children);
  const childClassName = getClassName(children);
  const shouldEllipsize = text.length > maxLength * 2;
  const [startText, endText] = truncateText(text, maxLength);

  if (!shouldEllipsize) {
    return <>{children}</>;
  }

  return (
    <span>
      <span className={childClassName}>{startText}</span>

      <span className="inline-flex">
        <Tooltip
          content={<span className={tooltipClassname}>{text}</span>}
          arrow
          animation="duration-100"
          // eslint-disable-next-line react/style-prop-object
          style="light"
          className="shadow-xl"
        >
          <span className={`pointer-events-auto cursor-pointer px-2 font-bold ${childClassName}`}>
            [...]
          </span>
        </Tooltip>
      </span>

      <span className={childClassName}>{endText}</span>
    </span>
  );
};

export { TruncatedText };
