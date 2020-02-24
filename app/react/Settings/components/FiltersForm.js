import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { List } from 'immutable';

import { RequestParams } from 'app/utils/RequestParams';
import { DragAndDropContainer } from 'app/Layout/DragAndDrop';
import ID from 'shared/uniqueID';
import { actions } from 'app/BasicReducer';
import SettingsAPI from 'app/Settings/SettingsAPI';
import { notify as notifyAction } from 'app/Notifications/actions/notificationsActions';
import { t } from 'app/I18N';
import { Icon } from 'UI';

const removeItem = itemId => {
  const removeItemIterator = items =>
    items
      .filter(item => item.id !== itemId)
      .map(_item => {
        const item = { ..._item };
        if (item.items) {
          item.items = removeItemIterator(item.items);
        }
        return item;
      });

  return removeItemIterator;
};

export class FiltersForm extends Component {
  constructor(props) {
    super(props);
    const activeFilters = props.settings.collection.toJS().filters || [];
    const inactiveFilters = props.templates
      .toJS()
      .filter(
        tpl =>
          !activeFilters.find(filt => {
            const matchId = filt.id === tpl._id;
            let insideGroup = false;
            if (filt.items) {
              insideGroup = filt.items.find(_filt => _filt.id === tpl._id);
            }

            return matchId || insideGroup;
          })
      )
      .map(tpl => ({ id: tpl._id, name: tpl.name }));

    this.state = { activeFilters, inactiveFilters };
    this.activesChange = this.activesChange.bind(this);
    this.unactivesChange = this.unactivesChange.bind(this);
    this.renderActiveItems = this.renderActiveItems.bind(this);
    this.renderInactiveItems = this.renderInactiveItems.bind(this);
  }

  activesChange(items) {
    items.forEach(item => {
      if (!item.items) {
        return;
      }
      // eslint-disable-next-line
      item.items = item.items.filter(subitem => {
        if (subitem.items) {
          items.push(subitem);
          return false;
        }
        return true;
      });
    });
    this.setState({ activeFilters: items });
  }

  unactivesChange(items) {
    this.setState({ inactiveFilters: items });
  }

  sanitizeFilterForSave(_filter) {
    const filter = { ..._filter };
    delete filter.container;
    delete filter.index;
    if (filter.items) {
      filter.items = filter.items.map(item => this.sanitizeFilterForSave(item));
    }

    return filter;
  }

  save() {
    const { activeFilters } = this.state;
    const { settings: propSettings, notify, setSettings } = this.props;

    const settings = propSettings.collection.toJS();
    const filters = activeFilters.map(filter => this.sanitizeFilterForSave(filter));
    settings.filters = filters;
    SettingsAPI.save(new RequestParams(settings)).then(result => {
      notify(t('System', 'Settings updated', null, false), 'success');
      setSettings(Object.assign(settings, result));
    });
  }

  addGroup() {
    const { activeFilters } = this.state;
    const newGroup = { id: ID(), name: 'New group', items: [] };
    this.setState({ activeFilters: activeFilters.concat([newGroup]) });
  }

  removeGroup(group) {
    const { activeFilters: activeFiltersState } = this.state;
    const activeFilters = activeFiltersState.filter(item => item.id !== group.id);
    this.setState({ activeFilters });
  }

  removeItem(item) {
    const { activeFilters: activeFiltersState, inactiveFilters } = this.state;
    const activeFilters = removeItem(item.id)(activeFiltersState);
    this.setState({ activeFilters, inactiveFilters: inactiveFilters.concat([item]) });
  }

  renderGroup(group) {
    const onChange = items => {
      group.items = items;
      this.setState(this.state);
    };

    const nameChange = e => {
      const name = e.target.value;
      group.name = name;
      this.setState(this.state);
    };

    return (
      <div>
        <div className="input-group">
          <input
            type="text"
            className="form-control"
            value={group.name}
            onChange={nameChange.bind(this)}
          />
          <span className="input-group-btn">
            <button
              type="button"
              className="btn btn-danger"
              onClick={this.removeGroup.bind(this, group)}
              disabled={group.items.length}
            >
              <Icon icon="trash-alt" />
            </button>
          </span>
        </div>
        <DragAndDropContainer
          id={group.id}
          onChange={onChange.bind(this)}
          renderItem={this.renderActiveItems}
          items={group.items}
        />
      </div>
    );
  }

  renderActiveItems(item) {
    if (item.items) {
      return this.renderGroup(item);
    }
    return (
      <div>
        <span>{item.name}</span>
        <button
          type="button"
          className="btn btn-xs btn-danger"
          onClick={this.removeItem.bind(this, item)}
        >
          <Icon icon="trash-alt" />
        </button>
      </div>
    );
  }

  renderInactiveItems(item) {
    if (item.items) {
      return this.renderGroup(item);
    }
    return (
      <div>
        <span>{item.name}</span>
      </div>
    );
  }

  render() {
    const { activeFilters, inactiveFilters } = this.state;
    return (
      <div className="FiltersForm">
        <div className="FiltersForm-list">
          <div className="panel panel-default">
            <div className="panel-heading">{t('System', 'Filters configuration')}</div>
            <div className="panel-body">
              <div className="row">
                <div className="col-sm-9">
                  <div className="alert alert-info">
                    <Icon icon="info-circle" size="2x" />
                    <div className="force-ltr">
                      <p>
                        By default, users can filter the documents or entities in the library based
                        on the types of documents/entities you have defined. However, you can
                        configure how these document/entity types will be displayed:
                      </p>
                      <ul>
                        <li>
                          drag and drop each document/entity type into the window in order to
                          configure their order
                        </li>
                        <li>
                          select &quote;Create group&quote; below to group filters under a label
                          (e.g. &quote;Documents&quote; or &quote;People&quote;)
                        </li>
                      </ul>
                    </div>
                  </div>
                  <DragAndDropContainer
                    id="active"
                    onChange={this.activesChange}
                    renderItem={this.renderActiveItems}
                    items={activeFilters}
                  />
                </div>
                <div className="col-sm-3">
                  <div className="FiltersForm-constructor">
                    <div>
                      <i>{t('System', 'Document and entity types')}</i>
                    </div>
                    <DragAndDropContainer
                      id="inactive"
                      onChange={this.unactivesChange}
                      renderItem={this.renderInactiveItems}
                      items={inactiveFilters}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="settings-footer">
          <button
            type="button"
            onClick={this.addGroup.bind(this)}
            className="btn btn-sm btn-primary"
          >
            <Icon icon="plus" />
            <span className="btn-label">{t('System', 'Create group')}</span>
          </button>
          <button type="button" onClick={this.save.bind(this)} className="btn btn-sm btn-success">
            <Icon icon="save" />
            <span className="btn-label">{t('System', 'Save')}</span>
          </button>
        </div>
      </div>
    );
  }
}

FiltersForm.propTypes = {
  templates: PropTypes.instanceOf(List).isRequired,
  settings: PropTypes.instanceOf(Object).isRequired,
  setSettings: PropTypes.func.isRequired,
  notify: PropTypes.func.isRequired,
};

const mapStateToProps = state => ({
  templates: state.templates,
  settings: state.settings,
});

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    { setSettings: actions.set.bind(null, 'settings/collection'), notify: notifyAction },
    dispatch
  );
}

export default connect(mapStateToProps, mapDispatchToProps)(FiltersForm);
