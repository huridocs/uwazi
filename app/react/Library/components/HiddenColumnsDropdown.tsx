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
  storeKey: 'library' | 'uploads';
}
const mapStateToProps = (state: IStore, props: HideColumnsComponentProps) => ({
  columns: state[props.storeKey].ui.get('tableViewColumns'),
});
const mapDispatchToProps = (dispatch: Dispatch<IStore>, props: HideColumnsComponentProps) =>
  bindActionCreators(
    { setTableViewColumnHidden, setTableViewAllColumnsHidden },
    wrapDispatch(dispatch, props.storeKey)
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

const HideColumnsComponent = ({
  setTableViewAllColumnsHidden: setAllColumnsHidden,
  setTableViewColumnHidden: setColumnHidden,
  columns: columnsMap,
}: HideColumnsComponentProps) => {
  const [open, setOpen] = useState(false);
  const [clickOutside, setClickOutside] = useState(false);

  const { sortedColumns, hiddenColumns } = processColumns(columnsMap);
  const dropdownContainerRef = useRef(null);
  const dropdownRef: RefObject<React.Component & React.ReactElement> = useRef(null);

  const onClickOutside = useCallback(event => {
    if (event.target.className === 'tableview-wrapper') {
      setClickOutside(true);
      if (dropdownRef !== null && dropdownRef.current !== null) {
        dropdownRef.current.props.onToggle(false);
      }
    }
  }, []);

  useOnClickOutsideElement<HTMLLIElement>(dropdownContainerRef, onClickOutside);

  const onSelect = (item: any) => {
    if (item.selectAll) {
      setAllColumnsHidden(item.indeterminate ? false : !item.hidden);
    } else {
      setColumnHidden(item.name, !item.hidden);
    }
  };

  return (
    <div className="hidden-columns-dropdown" ref={dropdownContainerRef}>
      {/*
        // @ts-ignore */}
      <DropdownList
        ref={dropdownRef}
        open={open}
        data={sortedColumns}
        filter={(item: SelectableColumn, searchTerm: string) =>
          item.label.toLowerCase().includes(searchTerm.toLowerCase())
        }
        itemComponent={ColumnItem}
        valueComponent={ValueItem(hiddenColumns)}
        onSelect={(selected: SelectableColumn) => {
          onSelect(selected);
        }}
        onToggle={(openStatus: boolean) => {
          if (clickOutside) {
            setOpen(false);
            setClickOutside(false);
            if (dropdownRef !== null && dropdownRef.current !== null) {
              dropdownRef.current.forceUpdate(() => {});
            }
          } else if (openStatus) {
            setOpen(true);
          }
        }}
      />
    </div>
  );
};
export const HiddenColumnsDropdown = connector(HideColumnsComponent);
