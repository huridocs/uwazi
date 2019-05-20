import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Immutable from 'immutable';
import { MetadataFormFields } from 'app/Metadata';
import { LocalForm, Field, actions } from 'react-redux-form';
import { FormGroup, Captcha } from 'app/ReactReduxForms';
import { Translate } from 'app/I18N';

export class PublicForm extends Component {
  attachDispatch(dispatch) {
    this.formDispatch = dispatch;
  }

  handleSubmit(values) {
    console.log(values);
    this.formDispatch(actions.reset());
  }

  render() {
    const { properties } = this.props;
    const model = '';
    return (
      <LocalForm getDispatch={dispatch => this.attachDispatch(dispatch)} onSubmit={values => this.handleSubmit(values)}>
        <FormGroup model=".title">
          <ul className="search__filter">
            <li><label><Translate>Title</Translate><span className="required">*</span></label></li>
            <li className="wide">
              <Field model=".title">
                <textarea className="form-control"/>
              </Field>
            </li>
          </ul>
        </FormGroup>
        <MetadataFormFields thesauris={this.props.thesauris} model={model} template={properties} />
        <ul className="search__filter">
          <li><label><Translate>Are you a robot?</Translate><span className="required">*</span></label></li>
          <li className="wide">
            <Captcha model=".captcha"/>
          </li>
        </ul>
        <input type="submit" className="btn btn-success" value="Submit"/>
      </LocalForm>
    );
  }
}

PublicForm.defaultProps = {
};

PublicForm.propTypes = {
  template: PropTypes.string.isRequired,
  properties: PropTypes.instanceOf(Immutable.Map).isRequired,
  thesauris: PropTypes.instanceOf(Immutable.List).isRequired,
};

export const mapStateToProps = (state, props) => ({
  properties: state.templates.find(template => template.get('_id') === props.template),
  thesauris: state.thesauris
});

export default connect(mapStateToProps)(PublicForm);
