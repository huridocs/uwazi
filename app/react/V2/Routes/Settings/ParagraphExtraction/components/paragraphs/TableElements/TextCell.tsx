import React from 'react';
import { Tooltip } from 'flowbite-react';
import { CellContext } from '@tanstack/react-table';
import { TablePXEntityParagraphRow } from 'app/V2/shared/ParagraphExtractionTypes';

const TextCell = ({
  cell,
}: CellContext<TablePXEntityParagraphRow, TablePXEntityParagraphRow['paragraphText']>) => {
  const MAX_LENGTH = 120;

  const text = cell.getValue();
  const shouldEllipsize = text.length > MAX_LENGTH * 2;
  let startText = '';
  let endText = '';

  if (shouldEllipsize) {
    const startTextEndIndex = Math.min(text.indexOf('.', 100) + 1 || MAX_LENGTH, MAX_LENGTH);
    startText = text.slice(0, startTextEndIndex);
    const endTextStartIndex = Math.max(text.length - MAX_LENGTH, startTextEndIndex);
    const adjustedEndTextStartIndex = text.lastIndexOf(' ', endTextStartIndex);
    endText = text.slice(
      adjustedEndTextStartIndex > startTextEndIndex ? adjustedEndTextStartIndex : endTextStartIndex
    );
  }

  return (
    <span className="relative max-w-full text-xs font-normal text-gray-900">
      {shouldEllipsize ? (
        <span className="inline-block max-w-full">
          {startText}
          <span className="inline-flex align-baseline">
            <Tooltip
              content={
                <span
                  className="inline-block max-w-full overflow-hidden text-ellipsis line-clamp-8"
                  style={{
                    display: '-webkit-box',
                    WebkitBoxOrient: 'vertical',
                    WebkitLineClamp: 8,
                  }}
                >
                  {text}
                </span>
              }
              arrow
              animation="duration-100"
              // eslint-disable-next-line react/style-prop-object
              style="light"
              placement="top"
              className="text-xs font-normal text-gray-900 shadow-xl w-full"
            >
              <span className="pointer-events-auto cursor-pointer font-bold inline-block px-1">
                [...]
              </span>
            </Tooltip>
          </span>
          {endText}
        </span>
      ) : (
        <span className="whitespace-nowrap">{text}</span>
      )}
    </span>
  );
};

export { TextCell };
