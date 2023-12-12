import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { is, fromJS as Immutable } from 'immutable';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import { t } from 'app/I18N';
import ShowIf from 'app/App/ShowIf';
import { Icon } from 'UI';

import { setFilter } from '../actions/actions';

class ConnectionsGroup extends Component {
  static getDerivedStateFromProps(props, state) {
    if (props.group.get('templates').size > state.groupTemplates.size) {
      return {
        selected: false,
        groupTemplates: props.group.get('templates'),
      };
    }

    return { groupTemplates: props.group.get('templates') };
  }

  constructor(props) {
    super(props);
    this.state = {
      expanded: true,
      selected: false,
      selectedItems: Immutable([]),
      groupTemplates: Immutable([]),
    };
  }

  shouldComponentUpdate(nextProps, nextState) {
    return (
      !is(this.props.group, nextProps.group) ||
      this.state.expanded !== nextState.expanded ||
      this.state.selected !== nextState.selected ||
      this.state.selectedItems.size !== nextState.selectedItems.size
    );
  }

  setGroupFilter(selectedItems) {
    const newFilter = {};
    newFilter[this.props.group.get('key')] = selectedItems;
    this.props.setFilter(newFilter);
  }

  toggleSelectItem(item) {
    let selectedItems;
    let groupSelected;

    if (this.state.selectedItems.includes(item)) {
      groupSelected = false;
      selectedItems = this.state.selectedItems.splice(this.state.selectedItems.indexOf(item), 1);
    }

    if (!this.state.selectedItems.includes(item)) {
      selectedItems = this.state.selectedItems.push(item);
      groupSelected = selectedItems.size === this.props.group.get('templates').size;
    }

    this.setGroupFilter(selectedItems);
    this.setState({ selectedItems, selected: groupSelected });
  }

  toggleSelectGroup() {
    const { group } = this.props;
    const selectedItems = !this.state.selected
      ? group.get('templates').map(i => group.get('key') + i.get('_id'))
      : Immutable([]);

    this.setGroupFilter(selectedItems);
    this.setState(currentState => ({ selected: !currentState.selected, selectedItems }));
  }

  toggleExpandGroup() {
    this.setState(currentState => ({ expanded: !currentState.expanded }));
  }

  render() {
    const group = this.props.group.toJS();
    const { connectionLabel, templates } = group;
    return (
      <li className="relationshipFilters">
        <div className="multiselectItem">
          <input
            type="checkbox"
            className="form-control multiselectItem-input"
            id={`group${group.key}`}
            onChange={this.toggleSelectGroup.bind(this)}
            checked={this.state.selected}
          />
          <label htmlFor={`group${group.key}`} className="multiselectItem-label">
            <span className="multiselectItem-icon">
              <Icon icon={['far', 'square']} className="checkbox-empty" />
              <Icon icon="check" className="checkbox-checked" />
            </span>
            <span className="multiselectItem-name">
              <b>{group.key ? t(group.context, connectionLabel) : t('System', 'No Label')}</b>
            </span>
          </label>
          <span className="multiselectItem-results">
            <span>{group.templates.reduce((size, i) => size + i.count, 0)}</span>
          </span>
          <span className="multiselectItem-action" onClick={this.toggleExpandGroup.bind(this)}>
            <Icon icon={this.state.expanded ? 'caret-up' : 'caret-down'} />
          </span>
        </div>
        <ShowIf if={this.state.expanded}>
          <ul className="multiselectChild is-active">
            {templates.map((template, index) => (
              <li className="multiselectItem" key={index} title={template.label}>
                <input
                  type="checkbox"
                  className="multiselectItem-input"
                  id={group.key + template._id}
                  onChange={this.toggleSelectItem.bind(this, group.key + template._id)}
                  checked={this.state.selectedItems.includes(group.key + template._id)}
                />
                <label className="multiselectItem-label" htmlFor={group.key + template._id}>
                  <span className="multiselectItem-icon">
                    <Icon icon={['far', 'square']} className="checkbox-empty" />
                    <Icon icon="check" className="checkbox-checked" />
                  </span>
                  <span className="multiselectItem-name">{t(template._id, template.label)}</span>
                </label>
                <span className="multiselectItem-results">{template.count}</span>
              </li>
            ))}
          </ul>
        </ShowIf>
      </li>
    );
  }
}

ConnectionsGroup.propTypes = {
  group: PropTypes.object,
  setFilter: PropTypes.func,
};

const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      setFilter,
    },
    dispatch
  );

export { ConnectionsGroup, mapDispatchToProps };
export default connect(null, mapDispatchToProps)(ConnectionsGroup);
