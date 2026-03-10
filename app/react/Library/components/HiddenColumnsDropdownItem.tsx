import React from 'react';
import { Icon } from 'UI';
import { PropertySchema } from 'shared/types/commonTypes';
import { TableViewColumn } from 'app/istore';
import { Translate } from 'app/I18N';

interface SelectableColumn extends TableViewColumn {
  indeterminate?: boolean;
  selectAll: boolean;
}

const updateIndeterminate = (item: SelectableColumn) => (elem: HTMLInputElement) => {
  if (item.selectAll && elem && item.indeterminate !== undefined) {
    // eslint-disable-next-line no-param-reassign
    elem.indeterminate = item.indeterminate;
  }
};

const ColumnItem = ({ item }: { item: SelectableColumn }) => (
  <>
    <input
      ref={updateIndeterminate(item)}
      type="checkbox"
      checked={!item.hidden}
      onChange={() => {}}
    />
    <Translate context={item.translationContext}>{item.label}</Translate>
  </>
);

const ValueItem =
  (hiddenColumns: PropertySchema[], isOpen: boolean, closeFunction: () => void) => () => (
    <span className="columns-hint" onClick={closeFunction}>
      {isOpen ? <Icon icon="times" /> : <Icon icon="bars" rotation={90} />}
      {hiddenColumns.length ? `${hiddenColumns.length} ` : ''}
      <Translate>{hiddenColumns.length ? 'columns hidden' : 'Hide columns'}</Translate>
    </span>
  );

export type { SelectableColumn };
export { ColumnItem, ValueItem };
