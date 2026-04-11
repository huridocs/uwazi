import React from 'react';
import { useAtomValue } from 'jotai';
import { useLoaderData } from 'react-router';
import { availableLanguages } from '#shared/language/index.js';
import { Table, Button } from '#V2/Components/UI/index.js';
import {
  PXParagraphLoaderResponse,
  TablePXEntityParagraphRow,
} from '#V2/shared/ParagraphExtractionTypes.js';
import { Translate } from '#app/I18N/index.js';
import { templatesAtom } from '#V2/atoms/index.js';
import { TableTitle } from '../TableTitle.js';
import { PXTableFooter } from '../PXTableFooter.js';
import { tableBuilder } from './TableElements/index.js';

interface ParagraphsTableProps {
  pxParagraphData: TablePXEntityParagraphRow[];
  viewParagraph: (entityId: string) => void;
  totalRows: number;
  openPDFSidepanel: React.Dispatch<React.SetStateAction<boolean>>;
}

const ParagraphsTable = ({
  pxParagraphData,
  viewParagraph,
  totalRows,
  openPDFSidepanel,
}: ParagraphsTableProps) => {
  const templates = useAtomValue(templatesAtom);
  const { extractor } = useLoaderData() as PXParagraphLoaderResponse;

  const languages =
    pxParagraphData.length > 0
      ? [
          {
            _id: pxParagraphData[0]._id,
            name:
              availableLanguages.find(lang => lang.key === pxParagraphData[0].language)?.label ||
              '',
          },
          ...(pxParagraphData[0].subRows || []).map(subRow => ({
            _id: subRow._id,
            name:
              availableLanguages.find(lang => lang.key === subRow.language)?.localized_label || '',
          })),
        ]
      : [];

  const template = templates.find(temp => temp._id === extractor?.sourceTemplateId)!;
  return (
    <Table
      data={pxParagraphData}
      columns={tableBuilder({ onViewAction: viewParagraph })}
      header={<TableTitle items={[template, ...languages]} />}
      actions={
        <Button
          onClick={() => openPDFSidepanel(true)}
          variant="ghost"
          className="flex items-center gap-2 leading-4 text-gray-800"
        >
          <Translate>Open PDF</Translate>
        </Button>
      }
      footer={<PXTableFooter total={totalRows} currentDataLength={pxParagraphData.length} />}
      groupColumnPosition={3}
    />
  );
};

export { ParagraphsTable };
