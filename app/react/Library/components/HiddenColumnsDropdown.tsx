import React from 'react';
import { DropdownList } from 'app/Forms';
import { connect } from 'react-redux';
import { bindActionCreators, Dispatch } from 'redux';
import { wrapDispatch } from 'app/Multireducer';
import { ColumnItem, ValueItem, SelectableColumn } from 'app/Library/components/HiddenColumnsDropdownItem';
import { setTableViewColumnHidden, setTableViewAllColumnsHidden } from '../actions/libraryActions';
import { TableViewColumn, IStore } from 'app/istore';

interface HideColumnsComponentProps {
  columns: TableViewColumn[];
  setTableViewColumnHidden: (name: string, hidden: boolean) => void;
  setTableViewAllColumnsHidden: (hidden: boolean) => void;
  storeKey: 'library' | 'uploads';
}

class HideColumnsComponent extends React.Component<HideColumnsComponentProps> {
  constructor(props: HideColumnsComponentProps) {
    super(props);
    this.onSelect = this.onSelect.bind(this);
  }

  onSelect(item: any) {
    if (item.selectAll) {
      this.props.setTableViewAllColumnsHidden(item.indeterminate ? false : !item.hidden);
    } else {
      this.props.setTableViewColumnHidden(item.name, !item.hidden);
    }
  }

  render() {
    const hiddenColumns = this.props.columns.filter(c => c.hidden);
    const shownColumns = this.props.columns.filter(c => !c.hidden);

    const selectAllColumn: SelectableColumn = 
      {
        label: 'Show all',
        selectAll: true,
        indeterminate: hiddenColumns.length !== 0 && shownColumns.length !== 0,
        hidden: shownColumns.length === 0,
        type: 'text',
      };

    const sortedColumns = [selectAllColumn].concat(shownColumns.concat(hiddenColumns).map(c => ({ ...c, selectAll: false })));

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

// TODO: define uploads as a property of IStore and remove the interfaces merge.
const mapStateToProps = (state: IStore & { uploads: IStore['library']}, props: HideColumnsComponentProps) => ({
  columns: state[props.storeKey].ui
    .get('tableViewColumns')
    .toJS()
    .slice(1),
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
