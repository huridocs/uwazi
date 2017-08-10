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

  renderItem(item) {
    if (item.items) {
      let onChange = (items) => {
        item.items = items;
        this.setState(this.state);
      };

      let nameChange = (e) => {
        let name = e.target.value;
        item.name = name;
        this.setState(this.state);
      };

      return <div>
              <div className="input-group">
                <input type="text" className="form-control" value={item.name} onChange={nameChange.bind(this)} />
                <span className="input-group-btn">
                  <button className="btn btn-danger" onClick={this.removeGroup.bind(this, item)} disabled={item.items.length}>
                    <i className="fa fa-trash"></i>
                  </button>
                </span>
              </div>
              <DragAndDropContainer id={item.id} onChange={onChange.bind(this)} renderItem={this.renderItem.bind(this)} items={item.items}/>
            </div>;
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

  render() {
    return <div className="FiltersForm">
            <div className="FiltersForm-list">
              <div className="panel panel-default">
                <div className="panel-heading">
                  {t('System', 'Filters')}
                </div>
                <div className="panel-body">
                  <div className="col-sm-9">
                    <DragAndDropContainer
                      id="active"
                      onChange={this.activesChange.bind(this)}
                      renderItem={this.renderItem.bind(this)}
                      items={this.state.activeFilters}
                      />
                  </div>
                  <div className="col-sm-3">
                    <div className="FiltersForm-constructor">
                      <div><i>Document and entities</i></div>
                      <DragAndDropContainer
                        id="inactive"
                        onChange={this.unactivesChange.bind(this)}
                        renderItem={this.renderItem.bind(this)}
                        items={this.state.inactiveFilters}
                        />
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
