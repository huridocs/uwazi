import React from 'react';
import { CellContext } from '@tanstack/react-table';
import { Translate } from 'app/I18N';
import { Button } from 'app/V2/Components/UI';
import { ThesaurusSchema } from 'shared/types/thesaurusType';

const ThesaurusLabel = ({ cell }: any) => (
  <Translate>{`${cell.row.original.name} (Default language)`}</Translate>
);

const LabelHeader = () => <Translate>Language (Default language)</Translate>;

const EditButton = ({ cell, column }: CellContext<ThesaurusSchema, string>) => (
  <Button
    styling="outline"
    onClick={() => column.columnDef.meta?.action?.(cell.row)}
    className="leading-4"
  >
    <Translate>Edit</Translate>
  </Button>
);

export { ThesaurusLabel, LabelHeader, EditButton };
