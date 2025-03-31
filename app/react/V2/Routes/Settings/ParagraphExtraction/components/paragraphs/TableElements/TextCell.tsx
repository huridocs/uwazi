import React from 'react';
import { CellContext } from '@tanstack/react-table';
import { Tooltip } from 'flowbite-react';
import { PXParagraphTable } from '../../../types';

const TextCell = ({ cell }: CellContext<PXParagraphTable, PXParagraphTable['text']>) => (
  <Tooltip
    content={cell.getValue()}
    arrow
    animation="duration-100"
    // eslint-disable-next-line react/style-prop-object
    style="light"
    className="text-xs font-normal text-gray-900 shadow-xl"
  >
    <span className="text-xs font-normal text-gray-900 line-clamp-2 overflow-ellipsis cursor-pointer">
      {cell.getValue()}
    </span>
  </Tooltip>
);

export { TextCell };
