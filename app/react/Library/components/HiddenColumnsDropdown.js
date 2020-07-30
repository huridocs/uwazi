import React from 'react';
import PropTypes from 'prop-types';
import { DropdownList } from 'app/Forms';
import { Icon } from 'UI';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { wrapDispatch } from 'app/Multireducer';
import { SET_TABLE_VIEW_COLUMN_HIDDEN } from '../actions/actionTypes';

const ColumnItem = ({ item }) => (
  <span>
    <input type="checkbox" checked={!item.hidden} />
    {item.label}
  </span>
);

const hiddenColumnsMessage = columns => {
  const count = columns.filter(column => column.hidden).length;
  if (count) {
    return `${count} columns hidden`;
  }

  return 'Hide columns';
};

const ValueItem = columns => () => (
  <span>
    <Icon icon="bars" />
    {hiddenColumnsMessage(columns)}
  </span>
);

ColumnItem.propTypes = {
  item: PropTypes.object.isRequired,
};

ColumnItem.propTypes = {
  item: PropTypes.object.isRequired,
};

class HideColumnsComponent extends React.Component {
  constructor(props) {
    super(props);
    this.onSelect = this.onSelect.bind(this);
  }

  onSelect(item) {
    this.props.setTableViewColumnHidden(item.name, !item.hidden);
  }

  render() {
    const hiddenColumns = this.props.columns.filter(c => c.hidden);
    const shownColumns = this.props.columns.filter(c => !c.hidden);
    const sortedColumns = shownColumns.concat(hiddenColumns);

    return (
      <DropdownList
        data={sortedColumns}
        filter={(item, searchTerm) => item.label.toLowerCase().includes(searchTerm.toLowerCase())}
        itemComponent={ColumnItem}
        valueComponent={ValueItem(sortedColumns)}
        onSelect={this.onSelect}
      />
    );
  }
}

HideColumnsComponent.propTypes = {
  columns: PropTypes.array.isRequired,
  storeKey: PropTypes.string.isRequired,
  setTableViewColumnHidden: PropTypes.func.isRequired,
};

const mapStateToProps = (state, props) => ({
  columns: state[props.storeKey].ui.get('tableViewColumns').toJS(),
});

const mapDispatchToProps = (dispatch, props) =>
  bindActionCreators(
    {
      setTableViewColumnHidden: (name, hidden) => ({
        type: SET_TABLE_VIEW_COLUMN_HIDDEN,
        name,
        hidden,
      }),
    },
    wrapDispatch(dispatch, props.storeKey)
  );

export const HideColumnsDropdown = connect(
  mapStateToProps,
  mapDispatchToProps
)(HideColumnsComponent);
