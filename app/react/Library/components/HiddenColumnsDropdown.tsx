import React, { RefObject, useCallback, useRef, useState } from 'react';
import { bindActionCreators, Dispatch } from 'redux';
import { connect } from 'react-redux';
import { List } from 'immutable';
import { DropdownList } from 'app/Forms';
import { TableViewColumn, IStore } from 'app/istore';
import { wrapDispatch } from 'app/Multireducer';
import {
  ColumnItem,
  ValueItem,
  SelectableColumn,
} from 'app/Library/components/HiddenColumnsDropdownItem';
import {
  setTableViewColumnHidden,
  setTableViewAllColumnsHidden,
} from 'app/Library/actions/libraryActions';
import { IImmutable } from 'shared/types/Immutable';
import { useOnClickOutsideElement } from 'app/utils/useOnClickOutsideElementHook';

interface HideColumnsComponentProps {
  columns: List<IImmutable<TableViewColumn>>;
  setTableViewColumnHidden: (name: string, hidden: boolean) => void;
  setTableViewAllColumnsHidden: (hidden: boolean) => void;
}
const mapStateToProps = (state: IStore) => ({
  columns: state.library.ui.get('tableViewColumns'),
});
const mapDispatchToProps = (dispatch: Dispatch<IStore>) =>
  bindActionCreators(
    { setTableViewColumnHidden, setTableViewAllColumnsHidden },
    wrapDispatch(dispatch, 'library')
  );
const connector = connect(mapStateToProps, mapDispatchToProps);

const processColumns = (
  columnsMap: List<{
    toJS(): TableViewColumn;
    get<Field extends keyof TableViewColumn>(_field: Field): IImmutable<TableViewColumn[Field]>;
    filter(fn: (listElement: any) => boolean | undefined): List<any>;
  }>
) => {
  const columns = columnsMap.toJS().slice(1);
  const hiddenColumns = columns.filter((c: TableViewColumn) => c.hidden);
  const shownColumns = columns.filter((c: TableViewColumn) => !c.hidden);
  const selectAllColumn: Partial<SelectableColumn> = {
    label: 'Show all',
    selectAll: true,
    indeterminate: hiddenColumns.length !== 0 && shownColumns.length !== 0,
    hidden: shownColumns.length === 0,
    type: 'text',
  };
  const sortedColumns = [selectAllColumn].concat(
    shownColumns.concat(hiddenColumns).map((c: TableViewColumn) => ({ ...c, selectAll: false }))
  );
  return { sortedColumns, hiddenColumns };
};

export const HideColumnsComponent = ({
  setTableViewAllColumnsHidden: setAllColumnsHidden,
  setTableViewColumnHidden: setColumnHidden,
  columns: columnsMap,
}: HideColumnsComponentProps) => {
  const [open, setOpen] = useState(false);
  const [clickedOutside, setClickedOutside] = useState(false);

  const { sortedColumns, hiddenColumns } = processColumns(columnsMap);
  const dropdownContainerRef = useRef(null);
  const dropdownRef: RefObject<React.Component & React.ReactElement> = useRef(null);

  const onClickOutside = useCallback((event: MouseEvent) => {
    const target = event.target as HTMLElement;
    if (
      target.className !== 'columns-hint' &&
      (!target.parentElement || target.parentElement.className !== 'columns-hint')
    ) {
      setClickedOutside(true);
      dropdownRef.current?.props.onToggle(null);
    }
  }, []);

  const handleClick = () => {
    if (open) {
      setOpen(false);
    }
  };

  useOnClickOutsideElement<HTMLLIElement>(dropdownContainerRef, onClickOutside);

  const onSelect = (item: SelectableColumn) =>
    item.selectAll
      ? setAllColumnsHidden(item.indeterminate ? false : !item.hidden)
      : setColumnHidden(item.name, !item.hidden);

  return (
    <div className="hidden-columns-dropdown" ref={dropdownContainerRef}>
      <DropdownList
        ref={dropdownRef}
        open={open}
        data={sortedColumns}
        filter={(item: SelectableColumn, searchTerm: string) =>
          item.label.toLowerCase().includes(searchTerm.toLowerCase())
        }
        itemComponent={ColumnItem}
        valueComponent={ValueItem(hiddenColumns, open, handleClick)}
        onSelect={(selected: SelectableColumn) => {
          onSelect(selected);
        }}
        onToggle={(value: boolean) => {
          if (value === null || clickedOutside) {
            setOpen(false);
            setClickedOutside(false);
            dropdownRef.current?.forceUpdate();
            return;
          }
          if (!open) {
            setOpen(true);
          }
        }}
      />
    </div>
  );
};
export const HiddenColumnsDropdown = connector(HideColumnsComponent);
