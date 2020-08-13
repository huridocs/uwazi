import React from 'react';
import PropTypes from 'prop-types';
import { DropdownList } from 'app/Forms';
import { Icon } from 'UI';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { wrapDispatch } from 'app/Multireducer';
import { setTableViewColumnHidden, setTableViewAllColumnsHidden } from '../actions/libraryActions';

function updateIndeterminate(item) {
  return elem => {
    // eslint-disable-next-line no-param-reassign
    if (elem) elem.indeterminate = item.indeterminate;
  };
}

export const ColumnItem = ({ item }) => (
  <React.Fragment>
    <input
      ref={item.selectAll && updateIndeterminate(item)}
      type="checkbox"
      checked={!item.hidden}
    />
    {item.label}
  </React.Fragment>
);

export const ValueItem = hiddenColumns => () => (
  <span>
    <Icon icon="bars" rotation={90} />
    {hiddenColumns.length ? `${hiddenColumns.length} columns hidden` : 'Hide columns'}
  </span>
);

ColumnItem.propTypes = {
  item: PropTypes.object.isRequired,
};

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
  columns: PropTypes.array.isRequired,
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
