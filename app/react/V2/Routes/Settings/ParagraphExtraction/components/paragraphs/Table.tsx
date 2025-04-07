import React from 'react';
import { useAtomValue } from 'jotai';
import { useLoaderData } from 'react-router';
import { availableLanguages } from 'shared/language';
import { Table, Button } from 'V2/Components/UI';
import {
  PXParagraphLoaderResponse,
  TablePXEntityParagraphRow,
} from 'V2/shared/ParagraphExtractionTypes';
import { Translate } from 'app/I18N';
import { templatesAtom } from 'V2/atoms';
import { TableTitle } from '../TableTitle';
import { PXTableFooter } from '../PXTableFooter';
import { tableBuilder } from './TableElements';

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
  const { extractor, sourceEntity } = useLoaderData() as PXParagraphLoaderResponse;

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
      header={
        <TableTitle
          items={[
            { _id: sourceEntity?._id?.toString() || '', name: sourceEntity?.title || '' },
            template,
            ...languages,
          ]}
          Buttons={
            <div className="flex gap-3">
              <Button
                onClick={() => openPDFSidepanel(true)}
                styling="light"
                className="leading-4 flex gap-2 items-center text-gray-800"
              >
                <Translate>Open PDF</Translate>
              </Button>
            </div>
          }
        />
      }
      footer={<PXTableFooter total={totalRows} currentDataLength={pxParagraphData.length} />}
      groupColumnPosition={3}
    />
  );
};

export { ParagraphsTable };
