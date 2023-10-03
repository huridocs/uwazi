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
import { t, Translate } from 'app/I18N';
import { Icon } from 'UI';
import { SettingsHeader } from './SettingsHeader';

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

class FiltersForm extends Component {
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
    } else {
      delete filter._id;
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
    const newGroup = { id: ID(), name: t('System', 'New group', null, false), items: [] };
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
      <div className="settings-content">
        <div className="FiltersForm">
          <div className="FiltersForm-list">
            <div className="panel panel-default">
              <SettingsHeader>
                <Translate>Filters configuration</Translate>
              </SettingsHeader>
              <div className="panel-body">
                <div className="row">
                  <div className="col-sm-9">
                    <div className="alert alert-info">
                      <Icon icon="info-circle" size="2x" />
                      <div className="force-ltr">
                        <p>
                          <Translate translationKey="Filters configuration description">
                            By default, users can filter the entities in the library based on the
                            types you have defined. However, you can configure how these entity
                            types will be displayed:
                          </Translate>
                        </p>
                        <ul>
                          <li>
                            <Translate translationKey="Filters configuration">
                              drag and drop each entity type into the window in order to configure
                              their order
                            </Translate>
                          </li>
                          <li>
                            <Translate translationKey="Filters configuration example">
                              select &quot;Create group&quot; below to group filters under a label
                              e.g (&quot;Documents &quot;or &quot;People&quot;)
                            </Translate>
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
                        <i>
                          <Translate>Entity types</Translate>
                        </i>
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
            <div className="btn-cluster">
              <button type="button" onClick={this.addGroup.bind(this)} className="btn btn-default">
                <Icon icon="plus" />
                <span className="btn-label">
                  <Translate>Create group</Translate>
                </span>
              </button>
            </div>
            <div className="btn-cluster content-right">
              <button
                type="button"
                onClick={this.save.bind(this)}
                className="btn btn-success btn-extra-padding"
              >
                <span className="btn-label">
                  <Translate>Save</Translate>
                </span>
              </button>
            </div>
          </div>
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

export { FiltersForm };

export default connect(mapStateToProps, mapDispatchToProps)(FiltersForm);
