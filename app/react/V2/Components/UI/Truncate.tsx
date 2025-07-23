import React, { isValidElement } from 'react';
import { Tooltip } from 'flowbite-react';

type TruncateProps = {
  children: React.ReactNode;
  maxLength?: number;
  tooltipClassname?: string;
  ellipsisPosition?: 'center' | 'end';
};

const truncateText = (
  text: string,
  maxLength: number,
  ellipsisPosition: TruncateProps['ellipsisPosition']
): [string, string] => {
  if (text.length <= maxLength) return [text, ''];

  if (ellipsisPosition === 'end') {
    return [text.slice(0, maxLength).trim(), ''];
  }

  const start = text.slice(0, Math.floor(maxLength / 2)).trim();
  const end = text.slice(-Math.floor(maxLength / 2)).trim();
  return [start, end];
};

const getTextContent = (node: React.ReactNode | React.ReactNode[] | string | number): string => {
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node);
  }

  if (Array.isArray(node)) return node.map(child => getTextContent(child)).join('');

  if (isValidElement(node)) {
    const { children } = node.props;
    if (Array.isArray(children)) {
      const texts = children.map(child => getTextContent(child));
      return texts.join('');
    }
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

const Truncate = ({
  children,
  maxLength = 40,
  tooltipClassname,
  ellipsisPosition = 'end',
}: TruncateProps) => {
  const text = getTextContent(children);
  const childClassName = getClassName(children);
  const shouldEllipsize = text.length > maxLength;
  const [startText, endText] = truncateText(text, maxLength, ellipsisPosition);
  if (!shouldEllipsize) {
    return <>{children}</>;
  }

  if (ellipsisPosition === 'end') {
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
            <span className={`pointer-events-auto cursor-pointer px-1 ${childClassName}`}>...</span>
          </Tooltip>
        </span>
      </span>
    );
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

export { Truncate };
