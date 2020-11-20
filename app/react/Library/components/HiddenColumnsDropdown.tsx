import React from 'react';
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

interface HideColumnsComponentProps {
  columns: List<IImmutable<TableViewColumn>>;
  setTableViewColumnHidden: (name: string, hidden: boolean) => void;
  setTableViewAllColumnsHidden: (hidden: boolean) => void;
  storeKey: 'library' | 'uploads';
}

class HideColumnsComponent extends React.Component<HideColumnsComponentProps> {
  onSelect = (item: any) => {
    if (item.selectAll) {
      this.props.setTableViewAllColumnsHidden(item.indeterminate ? false : !item.hidden);
    } else {
      this.props.setTableViewColumnHidden(item.name, !item.hidden);
    }
  };

  render() {
    const columns = this.props.columns.toJS().slice(1);
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

    return (
      <div className="hidden-columns-dropdown">
        {/*
        // @ts-ignore */}
        <DropdownList
          data={sortedColumns}
          filter={(item: SelectableColumn, searchTerm: string) =>
            item.label.toLowerCase().includes(searchTerm.toLowerCase())
          }
          itemComponent={ColumnItem}
          valueComponent={ValueItem(hiddenColumns)}
          onSelect={this.onSelect}
        />
      </div>
    );
  }
}

const mapStateToProps = (state: IStore, props: HideColumnsComponentProps) => ({
  columns: state[props.storeKey].ui.get('tableViewColumns'),
});

const mapDispatchToProps = (dispatch: Dispatch<IStore>, props: HideColumnsComponentProps) =>
  bindActionCreators(
    {
      setTableViewColumnHidden,
      setTableViewAllColumnsHidden,
    },
    wrapDispatch(dispatch, props.storeKey)
  );

export const HiddenColumnsDropdown = connect(
  mapStateToProps,
  mapDispatchToProps
)(HideColumnsComponent);
