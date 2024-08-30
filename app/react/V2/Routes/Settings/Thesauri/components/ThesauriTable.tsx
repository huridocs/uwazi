import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Row } from '@tanstack/react-table';
import { Translate } from 'app/I18N';
import { Table } from 'app/V2/Components/UI';
import { ClientThesaurus, Template } from 'app/apiResponseTypes';
import { ObjectIdSchema } from 'shared/types/commonTypes';
import { columnsThesauri } from './TableComponents';

interface ThesauriRow extends ClientThesaurus {
  _id: ObjectIdSchema;
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
  const navigateToEditThesaurus = (thesaurus: Row<ThesauriRow>) => {
    navigate(`./edit/${thesaurus.original._id}`);
  };

  return (
    <Table
      data={currentThesauri}
      columns={columnsThesauri({ edit: navigateToEditThesaurus })}
      defaultSorting={[{ id: 'name', desc: false }]}
      onChange={({ selectedRows }) => {
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
