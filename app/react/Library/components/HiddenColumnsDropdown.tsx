import React from 'react';
import { DropdownList } from 'app/Forms';
import { connect } from 'react-redux';
import { bindActionCreators, Dispatch } from 'redux';
import { wrapDispatch } from 'app/Multireducer';
import { ColumnItem, ValueItem } from 'app/Library/components/HiddenColumnsDropdownItem';
import { setTableViewColumnHidden, setTableViewAllColumnsHidden } from '../actions/libraryActions';

interface HideColumnsComponentProps {
  columns: any[];
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

    const selectAllColumn = [
      {
        label: 'Show all',
        selectAll: true,
        indeterminate: hiddenColumns.length !== 0 && shownColumns.length !== 0,
        hidden: shownColumns.length === 0,
      },
    ];

    const sortedColumns = selectAllColumn.concat(shownColumns.concat(hiddenColumns));

    return (
      <div className="hidden-columns-dropdown">
        {/*
        // @ts-ignore */}
        <DropdownList
          data={sortedColumns}
          filter={(item: any, searchTerm: string) =>
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

const mapStateToProps = (state: any, props: HideColumnsComponentProps) => ({
  columns: state[props.storeKey].ui
    .get('tableViewColumns')
    .toJS()
    .slice(1),
});

const mapDispatchToProps = (dispatch: Dispatch<any>, props: HideColumnsComponentProps) =>
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
