import React, { Component } from 'react';
import { Form, Field } from 'react-redux-form';
import { t } from 'app/I18N';

export class Customisation extends Component {
  render() {
    return (
      <div className="panel panel-default">
        <div className="panel-heading">{t('System', 'Customisation')}</div>
        <div className="panel-body" />
        <Form model="settings" >
          <div className="form-group">
            <label className="form-group-label" htmlFor="collection_name">{t('System', 'Custom CSS')}</label>
            <Field model=".customCSS">
              <textarea className="form-control" rows="30" ></textarea>
            </Field>
          </div>
        </Form>
      </div>
    );
  }
}

export default Customisation;
