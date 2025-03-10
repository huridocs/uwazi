/* eslint-disable max-lines */
/* eslint-disable react/no-multi-comp */
import React from 'react';
import { CellContext, createColumnHelper } from '@tanstack/react-table';
import { Translate } from 'app/I18N';
import { Button, Pill } from 'V2/Components/UI';
import { Tooltip } from 'flowbite-react';
import { PXParagraphTable } from '../types';

const pxColumnHelper = createColumnHelper<PXParagraphTable>();

const TableHeaderContainer = ({ children }: { children: React.ReactNode }) => (
  <span className="text-gray-500 font-semibold text-xs">{children}</span>
);
const TemplateHeader = () => (
  <TableHeaderContainer>
    <Translate>Paragraph</Translate> #
  </TableHeaderContainer>
);
const LanguageHeader = () => (
  <TableHeaderContainer>
    <Translate>Language</Translate>
  </TableHeaderContainer>
);
const EntityHeader = () => (
  <TableHeaderContainer>
    <Translate>Text</Translate>
  </TableHeaderContainer>
);
const ActionHeader = () => (
  <TableHeaderContainer>
    <Translate> </Translate>
  </TableHeaderContainer>
);

const DisplayCell = ({ cell }: CellContext<PXParagraphTable, PXParagraphTable['text']>) => (
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

const ParagraphNoCell = ({
  cell,
}: CellContext<PXParagraphTable, PXParagraphTable['paragraphCount']>) => (
  <span className="text-xs font-medium text-gray-900 text-center flex items-center">
    {cell.getValue()}
  </span>
);

const LanguagesCell = ({ cell }: CellContext<PXParagraphTable, PXParagraphTable['languages']>) => (
  <div className="flex flex-wrap gap-2">
    {cell.getValue().map(value => (
      <div key={value} className="whitespace-nowrap uppercase text-xs font-medium">
        <Pill color="gray">{value}</Pill>
      </div>
    ))}
  </div>
);

const ViewButton = (action: () => void) => (
  <Button className="leading-4" styling="outline" onClick={action}>
    <Translate>View</Translate>
  </Button>
);

const tableBuilder = ({ onViewAction }: { onViewAction: (paragraphId: string) => void }) => [
  pxColumnHelper.accessor('paragraphCount', {
    header: TemplateHeader,
    cell: ParagraphNoCell,
    enableSorting: false,
  }),
  pxColumnHelper.accessor('languages', {
    header: LanguageHeader,
    cell: LanguagesCell,
    enableSorting: true,
  }),
  pxColumnHelper.accessor('text', {
    header: EntityHeader,
    cell: DisplayCell,
    meta: { headerClassName: 'w-5/6' },
    enableSorting: true,
  }),
  pxColumnHelper.accessor('_id', {
    header: ActionHeader,
    cell: props =>
      ViewButton(() => {
        const paragraphId = props.cell.getValue();
        if (paragraphId) {
          onViewAction(paragraphId);
        }
      }),
    enableSorting: false,
  }),
];

export { tableBuilder };
