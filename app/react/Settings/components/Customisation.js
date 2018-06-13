import { Field, Form, actions as formActions } from 'react-redux-form';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { saveSettings } from '../actions/settingsActions';
// import { actions } from 'app/BasicReducer';

import { t } from 'app/I18N';

export class Customisation extends Component {
  componentDidMount() {
    this.props.loadForm('settings', this.props.settings.toJS());
  }

  render() {
    return (
      <div className="panel panel-default">
        <div className="panel-heading">{t('System', 'Customisation')}</div>
        <div className="panel-body" />
        <Form model="settings.settings" onSubmit={this.props.saveSettings}>
          <div className="form-group">
            <Field model=".customCSS">
              <label className="form-group-label" htmlFor="custom_css">{t('System', 'Custom CSS')}
                <textarea className="form-control" id="custom_css" rows="30" cols="100" />
              </label>
            </Field>
            <button type="submit" className="btn btn-success">{t('System', 'Update')}</button>
          </div>
        </Form>
      </div>
    );
  }
}

Customisation.propTypes = {
  loadForm: PropTypes.func.isRequired,
  settings: PropTypes.instanceOf(Immutable.Map).isRequired,
  saveSettings: PropTypes.func.isRequired
};

const mapStateToProps = state => ({ settings: state.settings.collection });
const mapDispatchToProps = dispatch => bindActionCreators({
  loadForm: formActions.load,
  saveSettings }, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(Customisation);
