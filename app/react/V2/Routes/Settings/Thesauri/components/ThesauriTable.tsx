import React from 'react';
import { useNavigate } from 'react-router';
import { Row } from '@tanstack/react-table';
// @ts-expect-error TS(2307): Cannot find module '../../I18N/index.js' or its co... Remove this comment to see the full error message
import { Translate } from '../../I18N/index.js';
import { Table } from '../../../../Components/UI/index.js';
// @ts-expect-error TS(2307): Cannot find module '../../apiResponseTypes.js' or ... Remove this comment to see the full error message
import { ClientThesaurus, Template } from '../../apiResponseTypes.js';
import { columnsThesauri } from './TableComponents.js';

interface ThesauriRow extends ClientThesaurus {
  rowId: string;
  disableRowSelection?: boolean;
  templates: Template[];
}

interface ThesauriTableProps {
  currentThesauri: ThesauriRow[];
  setSelectedThesauri: React.Dispatch<React.SetStateAction<ThesauriRow[]>>;
}

const ThesauriTable = ({ currentThesauri, setSelectedThesauri }: ThesauriTableProps) => {
  const navigate = useNavigate();
  const navigateToEditThesaurus = async (thesaurus: Row<ThesauriRow>) => {
    // @ts-expect-error TS(2339): Property '_id' does not exist on type 'ThesauriRow... Remove this comment to see the full error message
    await navigate(`./edit/${thesaurus.original._id}`);
  };

  return (
    <Table
      data={currentThesauri}
      columns={columnsThesauri({ edit: navigateToEditThesaurus })}
      defaultSorting={[{ id: 'name', desc: false }]}
      onSelect={({ selectedRows }) => {
        setSelectedThesauri(currentThesauri.filter(thesaurus => thesaurus.rowId in selectedRows));
      }}
      enableSelections
      header={
        <div className="flex flex-col items-start gap-1">
          <h2 className="text-base font-semibold text-left text-gray-900 bg-white">
            <Translate>Thesauri</Translate>
          </h2>
        </div>
      }
    />
  );
};

export type { ThesauriRow };
export { ThesauriTable };
