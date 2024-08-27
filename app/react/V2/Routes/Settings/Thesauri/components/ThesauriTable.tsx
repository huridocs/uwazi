import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createColumnHelper, Row } from '@tanstack/react-table';
import { Translate } from 'app/I18N';
import { Table } from 'app/V2/Components/UI';
import { ClientThesaurus, Template } from 'app/apiResponseTypes';
import { ObjectIdSchema } from 'shared/types/commonTypes';
import {
  EditButton,
  LabelHeader,
  ActionHeader,
  TemplateHeader,
  ThesaurusLabel,
  templatesCells,
} from './TableComponents';

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
  const columnHelper = createColumnHelper<ThesauriRow>();
  const columns = ({ edit }: { edit: Function }) => [
    columnHelper.accessor('name', {
      id: 'name',
      header: LabelHeader,
      cell: ThesaurusLabel,
      meta: { headerClassName: 'w-6/12 font-medium' },
    }),
    columnHelper.accessor('templates', {
      header: TemplateHeader,
      cell: templatesCells,
      enableSorting: false,
      meta: { headerClassName: 'w-6/12' },
    }),
    columnHelper.accessor('_id', {
      header: ActionHeader,
      cell: EditButton,
      enableSorting: false,
      meta: { action: edit },
    }),
  ];

  return (
    <Table
      data={currentThesauri}
      columns={columns({ edit: navigateToEditThesaurus })}
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
