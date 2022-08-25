import { Field, Form, actions as formActions } from 'react-redux-form';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import { Translate, t } from 'app/I18N';

import saveSettings from '../actions/settingsActions';

class Customisation extends Component {
  componentDidMount() {
    this.props.loadForm('settings.settings', { customCSS: this.props.settings.get('customCSS') });
  }

  render() {
    return (
      <div className="settings-content">
        <div className="panel panel-default settings-custom-css">
          <div className="panel-heading">{t('System', 'Custom styles')}</div>
          <div className="panel-body">
            <Form model="settings.settings" onSubmit={this.props.saveSettings}>
              <Field model=".customCSS" className="test">
                <label className="form-group-label" htmlFor="custom_css">
                  {t('System', 'Custom CSS')}
                  <textarea className="form-control" id="custom_css" />
                </label>
              </Field>
              <div className="settings-footer remove-extra-nesting">
                <div className="btn-cluster content-right">
                  <button type="submit" className="btn btn-success btn-extra-padding">
                    <Translate>Save</Translate>
                  </button>
                </div>
              </div>
            </Form>
          </div>
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

export { Customisation };

export default connect(mapStateToProps, mapDispatchToProps)(Customisation);
