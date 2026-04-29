import React from 'react';
import { useNavigate } from 'react-router';
import { Row } from '@tanstack/react-table';
import { Translate } from '#app/I18N/index.js';
import { Table } from '#V2/Components/UI/index.js';
import { ClientThesaurus, Template } from '#app/apiResponseTypes.js';
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
          <h2 className="text-left text-base font-semibold [color:var(--color-theme-text-primary)]">
            <Translate>Thesauri</Translate>
          </h2>
        </div>
      }
    />
  );
};

export type { ThesauriRow };
export { ThesauriTable };
