/* eslint-disable max-statements */
/* eslint-disable react/no-multi-comp */
import React, { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { templatesAtom, thesauriAtom, relationshipTypesAtom } from 'V2/atoms';
import { Table } from 'V2/Components/UI';
import { propertyIconsSmall } from 'V2/Components/UI/Icons';
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
  content?: string;
  relationType?: string;
  inherit?: { property: string; type: string };
};

const TypeCell =
  (currentType: PropertyTypeSchema) => (cell: CellContext<MatchingPropRow, string>) => {
    const value = cell.getValue() as keyof typeof translationsKeys;
    const isMismatch = value !== currentType;
    return (
      <span className={`flex items-center gap-2 ${isMismatch ? 'text-red-600' : ''}`}>
        {propertyIconsSmall[value]}
        {t('System', translationsKeys[value] || value, null, false)}
      </span>
    );
  };

const TemplateNameCell =
  (currentTemplateId: string) => (cell: CellContext<MatchingPropRow, string>) => {
    const value = cell.getValue();
    const { templateId } = cell.row.original;
    return (
      <div className="flex items-center gap-2">
        <Translate context={templateId} truncate={30}>
          {value}
        </Translate>{' '}
        {currentTemplateId === templateId ? `(${t('System', 'this template', null, false)})` : ''}
      </div>
    );
  };

const TemplateNameHeader = () => <Translate>Template</Translate>;
const TypeHeader = () => <Translate>Type</Translate>;
const ThesauriHeader = () => <Translate>Thesauri</Translate>;
const RelationTypeHeader = () => <Translate>Relation type</Translate>;
const EntitiesHeader = () => <Translate>Entities</Translate>;
const InheritTypeHeader = () => <Translate>Inherit type</Translate>;

interface ThesauriCellProps {
  value?: string;
  currentContent?: string;
  thesauri: { _id: string; name: string }[];
}
const ThesauriCellComponent: React.FC<ThesauriCellProps> = ({
  value,
  currentContent,
  thesauri,
}) => {
  const matches = value === (currentContent || '');
  const thesaurus = thesauri.find(thesaurusItem => thesaurusItem._id === value);
  const displayName = thesaurus ? thesaurus.name : value || '-';
  return <span className={matches ? '' : 'text-red-600'}>{displayName}</span>;
};

function thesauriCellRenderer(
  content: string | undefined,
  thesauri: { _id: string; name: string }[]
) {
  return (cell: CellContext<MatchingPropRow, string | undefined>) => (
    <ThesauriCellComponent value={cell.getValue()} currentContent={content} thesauri={thesauri} />
  );
}

function entitiesCellRenderer(content: string | undefined, templates: ClientTemplateSchema[]) {
  return (cell: CellContext<MatchingPropRow, string | undefined>) => {
    const value = cell.getValue();
    const matches = value === content || (!content && !value);
    const foundTemplate = templates.find(tmpl => tmpl._id === value);
    const displayValue = foundTemplate ? (
      <Translate context={foundTemplate._id} truncate={30}>
        {foundTemplate.name}
      </Translate>
    ) : (
      <Translate>Any entity</Translate>
    );
    return <span className={matches ? '' : 'text-red-600'}>{displayValue}</span>;
  };
}

function relationTypeCellRenderer(
  relationType: string | undefined,
  relationshipTypes: { _id: string; name: string }[]
) {
  return (cell: CellContext<MatchingPropRow, string | undefined>) => {
    const value = cell.getValue();
    const matches = value === (relationType || '');
    const relationshipType = relationshipTypes.find(rt => rt._id === value);
    const displayValue = relationshipType ? relationshipType.name : '-';
    return <span className={matches ? '' : 'text-red-600'}>{displayValue}</span>;
  };
}

function inheritTypeCellRenderer(inheritType: string | undefined) {
  return (cell: CellContext<MatchingPropRow, { type: string } | undefined>) => {
    const value = cell.getValue()?.type as keyof typeof translationsKeys;
    const matches = value === inheritType || (!inheritType && !value);
    return (
      <span className={`flex items-center gap-2 ${matches ? '' : 'text-red-600'}`}>
        {propertyIconsSmall[value]}
        {value ? t('System', translationsKeys[value] || value, null, false) : '-'}
      </span>
    );
  };
}

export const MatchingPropertiesTable = ({
  label,
  _id,
  type,
  template,
  content,
  relationType,
  inherit,
}: {
  label: string;
  _id?: string;
  type: PropertyTypeSchema;
  template: ClientTemplateSchema;
  content?: string;
  relationType?: string;
  inherit?: { property: string; type: string };
}) => {
  const templates = useAtomValue(templatesAtom);
  const thesauri = useAtomValue(thesauriAtom);
  const relationshipTypes = useAtomValue(relationshipTypesAtom);

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
          content: prop.content,
          relationType: prop.relationType,
          inherit: prop.inherit,
        }))
    );

    result = [
      {
        templateId: template._id,
        templateName: template.name,
        type,
        propId: _id,
        rowId: `${template.name}-${label}-current`,
        content,
        relationType,
        inherit,
      },
      ...result,
    ];

    return result;
  }, [templates, label, _id, type, template, content, relationType, inherit]);

  const columnHelper = createColumnHelper<MatchingPropRow>();
  const columns: ColumnDef<MatchingPropRow, any>[] = [
    columnHelper.accessor('templateName', {
      id: 'templateName',
      header: TemplateNameHeader,
      cell: TemplateNameCell(template._id),
      enableSorting: false,
    }),
    columnHelper.accessor('type', {
      id: 'type',
      header: TypeHeader,
      cell: TypeCell(type),
      enableSorting: false,
    }),
  ];

  if (['select', 'multiselect'].includes(type)) {
    columns.push(
      columnHelper.accessor('content', {
        id: 'thesauriOrRelationship',
        header: ThesauriHeader,
        cell: thesauriCellRenderer(content, thesauri),
        enableSorting: false,
      })
    );
  }

  if (type === 'relationship') {
    columns.push(
      columnHelper.accessor('relationType', {
        id: 'relationType',
        header: RelationTypeHeader,
        cell: relationTypeCellRenderer(relationType, relationshipTypes),
        enableSorting: false,
      }),
      columnHelper.accessor('content', {
        id: 'entities',
        header: EntitiesHeader,
        cell: entitiesCellRenderer(content, templates),
        enableSorting: false,
      }),
      columnHelper.accessor('inherit', {
        id: 'inheritType',
        header: InheritTypeHeader,
        cell: inheritTypeCellRenderer(inherit?.type),
        enableSorting: false,
      })
    );
  }

  return (
    <div className="mt-4">
      <Table columns={columns} data={rows} />
    </div>
  );
};
