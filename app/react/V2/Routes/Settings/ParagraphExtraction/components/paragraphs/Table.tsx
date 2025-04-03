/* eslint-disable no-console */
import React from 'react';
import { Table, Button } from 'V2/Components/UI';
import { Translate } from 'app/I18N';
import { TableTitle } from '../TableTitle';
import { PXTableFooter } from '../PXTableFooter';
import { FilterSidePanel } from '../FilterSidePanel';
import { tableBuilder } from './TableElements';
import { TablePXEntityParagraphRow } from 'app/V2/shared/ParagraphExtractionTypes';

interface ParagraphsTableProps {
  pxParagraphData: TablePXEntityParagraphRow[];
  paragraphInfo: TablePXEntityParagraphRow;
  entityLanguages: string[];
  filters: { [key: string]: number };
  viewParagraph: (params: any) => void;
}

const ParagraphsTable = ({
  pxParagraphData,
  paragraphInfo,
  entityLanguages,
  filters,
  viewParagraph,
}: ParagraphsTableProps) => {
  debugger;
  return (
    <Table
      data={pxParagraphData}
      columns={tableBuilder({ onViewAction: viewParagraph })}
      header={
        paragraphInfo && (
          <TableTitle
            items={[
              { _id: paragraphInfo.entities[0].sharedId, name: paragraphInfo.entities[0].title }
              // { ...paragraphInfo.entity.template },
              // ...entityLanguages.map(language => ({ name: language })),
            ]}
            Buttons={
              filters.length > 0 && (
                <div className="flex gap-3">
                  {filters.length > 0 && <FilterSidePanel availableFilters={filters} />}
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
      footer={<PXTableFooter totalPages={10} currentDataLength={10} total={100} />}
      groupColumnPosition={3}
    />
  )
};

export { ParagraphsTable };
