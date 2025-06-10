/* eslint-disable react/no-multi-comp */
import React, { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { templatesAtom } from 'V2/atoms';
import { Table } from 'V2/Components/UI';
import { propertyIcons } from 'V2/Components/UI/Icons';
import { Translate, t } from 'app/I18N';
import { CellContext, ColumnDef, createColumnHelper } from '@tanstack/react-table';
import { PropertyTypeSchema } from 'shared/types/commonTypes';
import { ClientTemplateSchema } from 'V2/shared/types';
import { translationsKeys } from '../helpers';

type MatchingPropRow = {
  templateId: string;
  templateName: string;
  type: PropertyTypeSchema;
  rowId: string;
  propId?: string;
};

const TypeCell =
  (currentType: PropertyTypeSchema) => (cell: CellContext<MatchingPropRow, string>) => {
    const value = cell.getValue();
    const isMismatch = value !== currentType;
    return (
      <span className={`flex items-center gap-2 ${isMismatch ? 'text-red-600' : ''}`}>
        {propertyIcons[value as keyof typeof propertyIcons]}
        {t(
          'System',
          translationsKeys[value as keyof typeof translationsKeys] || value,
          null,
          false
        )}
      </span>
    );
  };

const TemplateNameCell = (cell: CellContext<MatchingPropRow, string>) => (
  <div className="flex items-center gap-2">
    <span>{cell.getValue()}</span>
  </div>
);

const TemplateNameHeader = () => <Translate>Template</Translate>;
const TypeHeader = () => <Translate>Type</Translate>;

export const MatchingPropertiesTable = ({
  label,
  _id,
  type,
  template,
}: {
  label: string;
  _id?: string;
  type: PropertyTypeSchema;
  template: ClientTemplateSchema;
}) => {
  const templates = useAtomValue(templatesAtom);

  const rows = useMemo(() => {
    const lowerLabel = label?.trim().toLowerCase();
    let result: MatchingPropRow[] = templates.flatMap(templ =>
      [...(templ.properties || [])]
        .filter(prop => prop.label?.trim().toLowerCase() === lowerLabel)
        .filter(prop => prop._id !== _id)
        .map(prop => ({
          templateId: templ._id,
          templateName: templ.name,
          type: prop.type,
          propId: prop._id,
          rowId: `${templ.name}-${prop.name}`,
        }))
    );

    result = [
      {
        templateId: '',
        templateName: `${template.name} (${t('System', 'this template', null, false)})`,
        type,
        propId: _id,
        rowId: `${template.name}-${label}-current`,
      },
      ...result,
    ];

    return result;
  }, [templates, label, _id, type, template]);

  const columnHelper = createColumnHelper<MatchingPropRow>();
  const columns: ColumnDef<MatchingPropRow, any>[] = [
    columnHelper.accessor('templateName', {
      id: 'templateName',
      header: TemplateNameHeader,
      cell: TemplateNameCell,
    }),
    columnHelper.accessor('type', {
      id: 'type',
      header: TypeHeader,
      cell: TypeCell(type),
    }),
  ];

  return (
    <div className="mt-4">
      <Table columns={columns} data={rows} />
    </div>
  );
};
