import { Field, Form, actions as formActions } from 'react-redux-form';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Icon } from 'UI';

import { t } from 'app/I18N';

import saveSettings from '../actions/settingsActions';

export class Customisation extends Component {
  componentDidMount() {
    this.props.loadForm('settings.settings', { customCSS: this.props.settings.get('customCSS') });
  }

  render() {
    return (
      <div className="panel panel-default settings-custom-css">
        <div className="panel-heading">{t('System', 'Custom styles')}</div>
        <div className="panel-body">
          <Form model="settings.settings" onSubmit={this.props.saveSettings}>
            <Field model=".customCSS">
              <label className="form-group-label" htmlFor="custom_css">
                {t('System', 'Custom CSS')}
                <textarea className="form-control" id="custom_css" />
              </label>
            </Field>
            <div className="settings-footer">
              <button type="submit" className="btn btn-success">
                <Icon icon="save" />
                <span className="btn-label">{t('System', 'Update')}</span>
              </button>
            </div>
          </Form>
        </div>
      </div>
    );
  }
}

Customisation.propTypes = {
  loadForm: PropTypes.func.isRequired,
  settings: PropTypes.instanceOf(Immutable.Map).isRequired,
  saveSettings: PropTypes.func.isRequired,
};

const mapStateToProps = state => ({ settings: state.settings.collection });
const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      loadForm: formActions.load,
      saveSettings,
    },
    dispatch
  );

export default connect(mapStateToProps, mapDispatchToProps)(Customisation);
