import React from 'react';

type ConnectionColumn = { label: string; inheritedType?: string };

const columnShare = (inheritedType?: string) => (inheritedType === 'markdown' ? 3 : 1);

const markdownTable = (columns: { inheritedType?: string }[]) =>
  columns.some(column => column.inheritedType === 'markdown');

const connectionCols = (columns: ConnectionColumn[], actionCol: boolean) => {
  const total = columns.reduce((sum, column) => sum + columnShare(column.inheritedType), 0);
  return [
    { key: 'entity', width: 'max-content' },
    ...columns.map(column => ({
      key: column.label,
      width: `${(columnShare(column.inheritedType) / total) * 100}%`,
    })),
    ...(actionCol ? [{ key: 'actions', width: '2.5rem' }] : []),
  ];
};

const connectionsTableClass = (probe: boolean, columns: { inheritedType?: string }[]) =>
  `w-full border-collapse text-sm${probe ? '' : ' min-w-max'}${
    markdownTable(columns) ? ' table-fixed' : ''
  }`;

const entityColumnClass = (columns: { inheritedType?: string }[]) =>
  `${markdownTable(columns) ? 'whitespace-nowrap' : 'max-w-40'} border-t border-border/40 px-1 py-1.5 align-middle`;

const ConnectionCols = ({
  columns,
  actionCol,
}: {
  columns: ConnectionColumn[];
  actionCol: boolean;
}) => {
  if (!markdownTable(columns)) {
    return null;
  }
  return (
    <colgroup>
      {connectionCols(columns, actionCol).map(column => (
        <col key={column.key} style={{ width: column.width }} />
      ))}
    </colgroup>
  );
};

export { ConnectionCols, connectionsTableClass, entityColumnClass };
