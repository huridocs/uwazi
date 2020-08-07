import React from 'react';
import PropTypes from 'prop-types';
import { DropdownList } from 'app/Forms';
import { Icon } from 'UI';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { wrapDispatch } from 'app/Multireducer';
import { setTableViewColumnHidden, setTableViewAllColumnsHidden } from '../actions/libraryActions';

const ColumnItem = ({ item }) => {
  if (item.selectAll) {
    return (
      <React.Fragment>
        <input
          ref={elem => {
            // eslint-disable-next-line no-param-reassign
            if (elem) elem.indeterminate = item.indeterminate;
          }}
          type="checkbox"
          checked={!item.hidden}
        />
        {item.label}
      </React.Fragment>
    );
  }

  return (
    <React.Fragment>
      <input type="checkbox" checked={!item.hidden} />
      {item.label}
    </React.Fragment>
  );
};

const hiddenColumnsMessage = columns => {
  const count = columns.filter(column => column.hidden).length;
  if (count) {
    return `${count} columns hidden`;
  }

  return 'Hide columns';
};

const ValueItem = columns => () => (
  <span>
    <Icon icon="bars" rotation={90} />
    {hiddenColumnsMessage(columns)}
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
      if (item.indeterminate) {
        this.props.setTableViewAllColumnsHidden(false);
      } else {
        this.props.setTableViewAllColumnsHidden(!item.hidden);
      }
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
          valueComponent={ValueItem(sortedColumns)}
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
