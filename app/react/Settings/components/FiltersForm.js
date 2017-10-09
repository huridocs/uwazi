import PropTypes from 'prop-types';
import React, {Component} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {DragAndDropContainer} from 'app/Layout/DragAndDrop';
import ID from 'shared/uniqueID';
import {actions} from 'app/BasicReducer';
import SettingsAPI from 'app/Settings/SettingsAPI';
import {notify} from 'app/Notifications/actions/notificationsActions';
import {t} from 'app/I18N';

export class FiltersForm extends Component {

  constructor(props) {
    super(props);
    let activeFilters = props.settings.collection.toJS().filters || [];
    let inactiveFilters = props.templates.toJS().filter((tpl) => {
      return !activeFilters.find((filt) => {
        let matchId = filt.id === tpl._id;
        let insideGroup = false;
        if (filt.items) {
          insideGroup = filt.items.find((_filt) => _filt.id === tpl._id);
        }

        return matchId || insideGroup;
      });
    }).map((tpl) => {
      return {id: tpl._id, name: tpl.name};
    });

    this.state = {activeFilters, inactiveFilters};
  }

  renderGroup(group) {
    let onChange = (items) => {
      group.items = items;
      this.setState(this.state);
    };

    let nameChange = (e) => {
      let name = e.target.value;
      group.name = name;
      this.setState(this.state);
    };

    return <div>
            <div className="input-group">
              <input type="text" className="form-control" value={group.name} onChange={nameChange.bind(this)} />
              <span className="input-group-btn">
                <button className="btn btn-danger" onClick={this.removeGroup.bind(this, group)} disabled={group.items.length}>
                  <i className="fa fa-trash"></i>
                </button>
              </span>
            </div>
            <DragAndDropContainer id={group.id} onChange={onChange.bind(this)} renderItem={this.renderActiveItems.bind(this)} items={group.items}/>
          </div>;
  }

  renderActiveItems(item) {
    if (item.items) {
      return this.renderGroup(item);
    }
    return <div>
            <span>{item.name}</span>
            <button className="btn btn-xs btn-danger" onClick={this.removeItem.bind(this, item)}>
              <i className="fa fa-trash"></i>
            </button>
          </div>;
  }

  renderInactiveItems(item) {
    if (item.items) {
      return this.renderGroup(item);
    }
    return <div>
            <span>{item.name}</span>
          </div>;
  }

  activesChange(items) {
    this.setState({activeFilters: items});
  }

  unactivesChange(items) {
    this.setState({inactiveFilters: items});
  }

  save() {
    let settings = this.props.settings.collection.toJS();
    settings.filters = this.state.activeFilters;
    SettingsAPI.save(settings)
    .then((result) => {
      this.props.notify(t('System', 'Settings updated'), 'success');
      this.props.setSettings(Object.assign(settings, result));
    });
  }

  addGroup() {
    this.state.activeFilters.push({
      id: ID(),
      name: 'New group',
      items: []
    });

    this.setState({activeFilters: this.state.activeFilters});
  }

  removeGroup(group) {
    let activeFilters = this.state.activeFilters.filter((item) => item.id !== group.id);
    this.setState({activeFilters});
  }

  removeItem(item) {
    let removeItemFunction = (items) => {
      return items
      .filter((_item) => _item.id !== item.id)
      .map((_item) => {
        if (_item.items) {
          _item.items = removeItemFunction(_item.items);
        }
        return _item;
      });
    };

    let activeFilters = removeItemFunction(this.state.activeFilters);
    this.state.inactiveFilters.push(item);
    this.setState({activeFilters, inactiveFilters: this.state.inactiveFilters});
  }

  render() {
    return <div className="FiltersForm">
            <div className="FiltersForm-list">
              <div className="panel panel-default">
                <div className="panel-heading">
                  {t('System', 'Filters configuration')}
                </div>
                <div className="panel-body">
                  <div className="row">
                    <div className="col-sm-9">
                      <div className="alert alert-info">
                        <i className="fa fa-info-circle"></i>
                        <div>
                          <p>By default, users can filter the documents or entities in the library based on the types of documents/entities you have defined. However, you can configure how these document/entity types will be displayed:</p>
                          <ul>
                            <li>drag and drop each document/entity type into the window in order to configure their order</li>
                            <li>select "Create group" below to group filters under a label (e.g. "Documents" or "People")</li>
                          </ul>
                        </div>
                      </div>
                      <DragAndDropContainer
                        id="active"
                        onChange={this.activesChange.bind(this)}
                        renderItem={this.renderActiveItems.bind(this)}
                        items={this.state.activeFilters}
                        />
                    </div>
                    <div className="col-sm-3">
                      <div className="FiltersForm-constructor">
                        <div><i>{t('System', 'Document and entity types')}</i></div>
                        <DragAndDropContainer
                          id="inactive"
                          onChange={this.unactivesChange.bind(this)}
                          renderItem={this.renderInactiveItems.bind(this)}
                          items={this.state.inactiveFilters}
                          />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="settings-footer">
              <button onClick={this.addGroup.bind(this)} className="btn btn-sm btn-primary">
                <i className="fa fa-plus"></i>
                <span className="btn-label">{t('System', 'Create group')}</span>
              </button>
              <button onClick={this.save.bind(this)} className="btn btn-sm btn-success">
                <i className="fa fa-save"></i>
                <span className="btn-label">{t('System', 'Save')}</span>
              </button>
            </div>
          </div>;
  }
}

FiltersForm.propTypes = {
  templates: PropTypes.object,
  settings: PropTypes.object,
  setSettings: PropTypes.func,
  notify: PropTypes.func
};

const mapStateToProps = (state) => {
  return {
    templates: state.templates,
    settings: state.settings
  };
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({setSettings: actions.set.bind(null, 'settings/collection'), notify}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(FiltersForm);
