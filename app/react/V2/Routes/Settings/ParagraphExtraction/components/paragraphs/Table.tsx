/* eslint-disable no-console */
import React from 'react';
import { Table, Button } from 'V2/Components/UI';
import { TablePXEntityParagraphRow } from 'V2/shared/ParagraphExtractionTypes';
import { Translate } from 'app/I18N';
import { TableTitle } from '../TableTitle';
import { PXTableFooter } from '../PXTableFooter';
import { tableBuilder } from './TableElements';

interface ParagraphsTableProps {
  pxParagraphData: TablePXEntityParagraphRow[];
  paragraphInfo: TablePXEntityParagraphRow;
  filters: { [key: string]: number };
  viewParagraph: (params: any) => void;
  totalRows: number;
}

const ParagraphsTable = ({
  pxParagraphData,
  paragraphInfo,
  filters,
  viewParagraph,
  totalRows,
}: ParagraphsTableProps) => (
  <Table
    data={pxParagraphData}
    columns={tableBuilder({ onViewAction: viewParagraph })}
    header={
      paragraphInfo && (
        <TableTitle
          items={[
            { _id: paragraphInfo.entities[0].sharedId, name: paragraphInfo.entities[0].title },
            // { ...paragraphInfo.entity.template },
            // ...entityLanguages.map(language => ({ name: language })),
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
      )
    }
    defaultSorting={[{ id: '_id', desc: false }]}
    footer={<PXTableFooter total={totalRows} currentDataLength={pxParagraphData.length} />}
    groupColumnPosition={3}
  />
);

export { ParagraphsTable };
