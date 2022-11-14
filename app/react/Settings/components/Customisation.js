import { Field, Form, actions as formActions } from 'react-redux-form';
import { Tabs, TabLink, TabContent } from 'react-tabs-redux';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import { Translate } from 'app/I18N';
import { SettingsHeader } from './SettingsHeader';

import saveSettings from '../actions/settingsActions';

class Customisation extends Component {
  componentDidMount() {
    this.props.loadForm('settings.settings', {
      customCSS: this.props.settings.get('customCSS'),
      customJS: this.props.settings.get('customJS'),
    });
  }

  render() {
    const allowcustomJS = this.props.settings.get('allowcustomJS');
    return (
      <div className="settings-content global-css-js">
        <div className="panel-heading">
          {allowcustomJS ? (
            <SettingsHeader><Translate>Global CSS & JS</Translate></SettingsHeader>
          ) : (
            <SettingsHeader><Translate>Global CSS</Translate></SettingsHeader>
          )}
        </div>
        <Tabs>
          <div style={{ position: 'relative' }}>
            <TabLink to="css" default role="button" tabIndex="0" aria-label="CSS">
              <Translate>Custom CSS</Translate>
            </TabLink>
            {allowcustomJS && (
              <TabLink to="js" default role="button" tabIndex="0" aria-label="JS">
                <Translate>Custom JS</Translate>
              </TabLink>
            )}
          </div>
          <TabContent for="css" className="css">
            <div className="panel panel-default settings-custom">
              <div className="panel-body">
                <Form model="settings.settings" onSubmit={this.props.saveSettings}>
                  <Field model=".customCSS" className="field">
                    <textarea className="form-control" id="custom_css" />
                  </Field>
                  <div className="settings-footer">
                    <div className="btn-cluster content-right">
                      <button type="submit" className="btn btn-success btn-extra-padding">
                        <Translate>Save</Translate>
                      </button>
                    </div>
                  </div>
                </Form>
              </div>
            </div>
          </TabContent>
          <TabContent for="js" className="js">
            <div className="panel panel-default settings-custom-js">
              <div className="panel-body">
                <Form model="settings.settings" onSubmit={this.props.saveSettings}>
                  <Field model=".customJS">
                    <textarea className="form-control" id="custom_js" />
                  </Field>
                  <div className="settings-footer">
                    <div className="btn-cluster content-right">
                      <button type="submit" className="btn btn-success btn-extra-padding">
                        <Translate>Save</Translate>
                      </button>
                    </div>
                  </div>
                </Form>
              </div>
            </div>
          </TabContent>
        </Tabs>
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
