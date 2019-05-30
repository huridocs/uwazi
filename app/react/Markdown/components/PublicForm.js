import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Immutable from 'immutable';
import { MetadataFormFields } from 'app/Metadata';
import { LocalForm, actions, Control } from 'react-redux-form';
import { Captcha } from 'app/ReactReduxForms';
import { Translate } from 'app/I18N';
import { publicSubmit } from 'app/Uploads/actions/uploadsActions';
import { bindActionCreators } from 'redux';

export class PublicForm extends Component {
  static renderTitle() {
    return (
      <div className="form-group">
        <ul className="search__filter">
          <li>
            <label htmlFor="title"><Translate>Title</Translate></label>
          </li>
          <li className="wide">
            <Control.text id="title" className="form-control" model=".title" />
          </li>
        </ul>
      </div>
    );
  }

  constructor(props) {
    super(props);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.fileFields = [];
  }

  attachDispatch(dispatch) {
    this.formDispatch = dispatch;
  }

  resetForm() {
    this.formDispatch(actions.reset('publicform'));
    this.fileFields.forEach((input) => { input.value = ''; });
  }

  handleSubmit(_values) {
    const values = { ..._values };
    const { submit } = this.props;
    values.file = _values.file ? _values.file[0] : undefined;
    submit(values).then(() => {
      this.refreshCaptcha();
      this.resetForm();
    });
  }

  renderCaptcha() {
    return (
      <ul className="search__filter">
        <li><label><Translate>Are you a robot?</Translate><span className="required">*</span></label></li>
        <li className="wide">
          <Captcha refresh={(refresh) => { this.refreshCaptcha = refresh; }} model=".captcha"/>
        </li>
      </ul>
    );
  }

  renderFileField(id, options) {
    const defaults = { getRef: (node) => { this.fileFields.push(node); }, className: 'form-control', model: `.${id}` };
    const props = Object.assign(defaults, options);
    return (
      <div className="form-group">
        <ul className="search__filter">
          <li>
            <label htmlFor={id}>
              <Translate>File</Translate>
              <Control.file id={id} {...props} />
            </label>
          </li>
        </ul>
      </div>
    );
  }

  render() {
    const { template, thesauris, file, attachments } = this.props;
    const model = '';
    return (
      <LocalForm model="publicform" getDispatch={dispatch => this.attachDispatch(dispatch)} onSubmit={this.handleSubmit}>
        {PublicForm.renderTitle()}
        <MetadataFormFields thesauris={thesauris} model={model} template={template} />
        {file ? this.renderFileField('file', { accept: '.pdf' }) : false}
        {attachments ? this.renderFileField('attachments', { multiple: 'multiple' }) : false}
        {this.renderCaptcha()}
        <input type="submit" className="btn btn-success" value="Submit"/>
      </LocalForm>
    );
  }
}

PublicForm.propTypes = {
  file: PropTypes.bool.isRequired,
  attachments: PropTypes.bool.isRequired,
  template: PropTypes.instanceOf(Immutable.Map).isRequired,
  thesauris: PropTypes.instanceOf(Immutable.List).isRequired,
  submit: PropTypes.func.isRequired,
};

export const mapStateToProps = (state, props) => ({
    template: state.templates.find(template => template.get('_id') === props.template),
    thesauris: state.thesauris,
    file: props.file !== undefined,
    attachments: props.attachments !== undefined,
});

export function mapDispatchToProps(dispatch) {
  return bindActionCreators({ submit: publicSubmit }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(PublicForm);
