/* eslint-disable no-console */
import React from 'react';
import { useAtomValue } from 'jotai';
import { useLoaderData } from 'react-router';
import { Table, Button } from 'V2/Components/UI';
import {
  PXParagraphLoaderResponse,
  TablePXEntityParagraphRow,
} from 'V2/shared/ParagraphExtractionTypes';
import { Translate } from 'app/I18N';
import { templatesAtom } from 'app/V2/atoms';
import { TableTitle } from '../TableTitle';
import { PXTableFooter } from '../PXTableFooter';
import { tableBuilder } from './TableElements';

interface ParagraphsTableProps {
  pxParagraphData: TablePXEntityParagraphRow[];
  filters: { [key: string]: number };
  viewParagraph: (params: any) => void;
  totalRows: number;
}

const ParagraphsTable = ({
  pxParagraphData,
  filters,
  viewParagraph,
  totalRows,
}: ParagraphsTableProps) => {
  const templates = useAtomValue(templatesAtom);
  const { sourceEntity, extractor } = useLoaderData() as PXParagraphLoaderResponse;

  const languageNames = new Intl.DisplayNames([sourceEntity[0].language || 'en'], {
    type: 'language',
  });

  const entityLanguages = sourceEntity
    .filter(entity => entity.language !== undefined)
    .map(entity => ({
      _id: entity.language!,
      name: languageNames.of(entity.language!) || entity.language!,
    }));

  const template = templates.find(temp => temp._id === extractor?.sourceTemplateId)!;

  return (
    <Table
      data={pxParagraphData}
      columns={tableBuilder({ onViewAction: viewParagraph })}
      header={
        <TableTitle
          items={[
            { _id: sourceEntity[0].sharedId, name: sourceEntity[0].title! },
            template,
            ...entityLanguages,
          ]}
          Buttons={
            filters.length > 0 && (
              <div className="flex gap-3">
                {/* {filters.length > 0 && <FilterSidePanel availableFilters={filters} />} */}
                <Button
                  onClick={() => console.log('open pdf')}
                  styling="light"
                  className="leading-4 flex gap-2 items-center text-gray-800"
                >
                  <Translate>Open PDF</Translate>
                </Button>
              </div>
            )
          }
        />
      }
      footer={<PXTableFooter total={totalRows} currentDataLength={pxParagraphData.length} />}
      groupColumnPosition={3}
    />
  );
};

export { ParagraphsTable };
