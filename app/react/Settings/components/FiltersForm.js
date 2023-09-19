import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { List } from 'immutable';
import { TrashIcon } from '@heroicons/react/20/solid';

import { Icon } from 'UI';
import { actions } from 'app/BasicReducer';
import { t, Translate } from 'app/I18N';
import { RequestParams } from 'app/utils/RequestParams';
import { Button } from 'app/V2/Components/UI';
import SettingsAPI from 'app/Settings/SettingsAPI';
import { notify as notifyAction } from 'app/Notifications/actions/notificationsActions';
import ID from 'shared/uniqueID';
import {
  DragSource,
  Container,
  addSubject$,
  removeSubject$,
} from 'app/V2/Components/Layouts/DradAndDrop/';

import { ItemTypes } from 'app/V2/shared/types';
import { SettingsHeader } from './SettingsHeader';

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
    this.setActiveFilters = this.setActiveFilters.bind(this);
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
    addSubject$.next({ ...newGroup, target: 'root' });
  }

  setActiveFilters(items) {
    this.setState({ activeFilters: items });
  }

  renderGroup(group) {
    const nameChange = e => {
      const name = e.target.value;
      group.name = name;
      this.setState(this.state);
    };

    return (
      <div className="w-full ">
        <div className="flex flex-row items-center w-full">
          <input
            type="text"
            className="w-full text-sm border-r-0 border-gray-300 rounded-md rounded-r-none "
            value={group.name}
            onChange={nameChange.bind(this)}
          />
          <Button
            type="button"
            color="error"
            size="small"
            className="p-1 ml-auto rounded-l-none"
            disabled={group.items && group.items.size > 0}
            onClick={() => {
              removeSubject$.next(group);
            }}
          >
            <TrashIcon className="w-4" />
          </Button>
        </div>
        <Container
          type={ItemTypes.FILTER}
          items={group.items}
          itemComponent={this.renderActiveItems}
          name={`group_${group.name}`}
          className="w-full text-xs"
          onChange={this.setActiveFilters}
        />
      </div>
    );
  }

  renderActiveItems(item) {
    if (item.items) {
      return this.renderGroup(item);
    }
    return (
      <div className="flex flex-row items-center w-full">
        <span>{item.name}</span>
        <Button
          type="button"
          color="error"
          size="small"
          className="p-1 ml-auto "
          onClick={() => {
            removeSubject$.next(item);
          }}
        >
          <TrashIcon className="w-4" />
        </Button>
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
                    <Container
                      type={ItemTypes.FILTER}
                      items={activeFilters}
                      itemComponent={this.renderActiveItems}
                      name="root"
                      onChange={this.setActiveFilters}
                    />
                  </div>
                  <div className="col-sm-3">
                    <div className="FiltersForm-constructor">
                      <div>
                        <i>
                          <Translate>Entity types</Translate>
                        </i>
                      </div>
                      <DragSource items={inactiveFilters} type={ItemTypes.FILTER} />
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
