import React from 'react';
import PropTypes from 'prop-types';
import { DropdownList } from 'app/Forms';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { wrapDispatch } from 'app/Multireducer';
import { ColumnItem, ValueItem } from 'app/Library/components/HiddenColumnsDropdownItem';
import { setTableViewColumnHidden, setTableViewAllColumnsHidden } from '../actions/libraryActions';

class HideColumnsComponent extends React.Component {
  constructor(props) {
    super(props);
    this.onSelect = this.onSelect.bind(this);
  }

  onSelect(item) {
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
        <DropdownList
          data={sortedColumns}
          filter={(item, searchTerm) => item.label.toLowerCase().includes(searchTerm.toLowerCase())}
          itemComponent={ColumnItem}
          valueComponent={ValueItem(hiddenColumns)}
          onSelect={this.onSelect}
        />
      </div>
    );
  }
}

HideColumnsComponent.propTypes = {
  columns: PropTypes.arrayOf(PropTypes.any).isRequired,
  setTableViewColumnHidden: PropTypes.func.isRequired,
  setTableViewAllColumnsHidden: PropTypes.func.isRequired,
};

const mapStateToProps = (state, props) => ({
  columns: state[props.storeKey].ui
    .get('tableViewColumns')
    .toJS()
    .slice(1),
});

const mapDispatchToProps = (dispatch, props) =>
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
