/** @format */

import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Immutable from 'immutable';
import { MetadataFormFields, validator, wrapEntityMetadata } from 'app/Metadata';
import { LocalForm, actions, Control } from 'react-redux-form';
import { Captcha } from 'app/ReactReduxForms';
import { Translate } from 'app/I18N';
import { publicSubmit } from 'app/Uploads/actions/uploadsActions';
import { bindActionCreators } from 'redux';
import { FormGroup } from 'app/Forms';
import { Icon } from 'UI';
import Loader from 'app/components/Elements/Loader';
import './scss/public-form.scss';
import Dropzone from 'react-dropzone';
import { BrowserView, MobileView } from 'react-device-detect';

class PublicForm extends Component {
  static renderTitle(template) {
    const titleLabel = template
      .get('commonProperties')
      .find(p => p.get('name') === 'title')
      .get('label');

    return (
      <FormGroup key="title" model=".title">
        <ul className="search__filter">
          <li>
            <label htmlFor="title">
              <Translate context={template.get('_id')}>{titleLabel}</Translate>
              <span className="required">*</span>
            </label>
          </li>
          <li className="wide">
            <Control.text id="title" className="form-control" model=".title" />
          </li>
        </ul>
      </FormGroup>
    );
  }

  static renderSubmitState() {
    return (
      <div className="public-form submiting">
        <h3>
          <Translate>Submiting</Translate>
        </h3>
        <Loader />
      </div>
    );
  }

  constructor(props) {
    super(props);
    this.removeAttachment = this.removeAttachment.bind(this);
    this.fileDropped = this.fileDropped.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.validators = {
      captcha: { required: val => val && val.text.length },
      ...validator.generate(props.template.toJS()),
    };
    this.state = { submiting: false, files: [] };
  }

  fileDropped(files) {
    const uploadedFiles = files;
    this.state.files.forEach(file => uploadedFiles.push(file));
    this.setState({
      files: uploadedFiles,
    });
  }

  async removeAttachment(removedFile) {
    await this.setState(prevState => ({
      files: prevState.files.filter(file => file !== removedFile),
    }));
    if (!this.state.files.length) {
      const input = document.querySelector('input[name="publicform.file"]');
      input.value = '';
    }
  }

  attachDispatch(dispatch) {
    this.formDispatch = dispatch;
  }

  resetForm() {
    this.formDispatch(actions.reset('publicform'));
  }

  handleSubmit(_values) {
    const values = wrapEntityMetadata(_values);
    const { submit, template, remote } = this.props;
    values.file = _values.file ? _values.file[0] : undefined;
    values.template = template.get('_id');
    values.attachments = this.state.files.length ? this.state.files : undefined;

    submit(values, remote)
      .then(uploadCompletePromise => {
        this.setState({ submiting: true });
        return uploadCompletePromise.promise
          .then(() => {
            this.setState({ submiting: false });
            this.resetForm();
            this.refreshCaptcha();
          })
          .catch(() => {
            this.setState({ submiting: false });
            this.refreshCaptcha();
          });
      })
      .catch(() => {
        this.setState({ submiting: false });
        this.refreshCaptcha();
      });
  }

  renderFileField(id, options) {
    const defaults = { className: 'form-control on-mobile', model: `.${id}` };
    const props = Object.assign(defaults, options);
    return (
      <div className="form-group">
        <ul className="search__filter">
          <li className="attachments-list">
            <Translate>{id === 'file' ? 'Document' : 'Attachments'}</Translate>
            <BrowserView>
              <Dropzone
                onDrop={this.fileDropped}
                className="dropzone"
                accept={id === 'file' ? '.pdf' : undefined}
              >
                <label>
                  <div className="text-content">
                    <div id="icon">
                      <Icon icon="cloud-upload-alt" />
                    </div>
                    <div id="upload-text">Drop your files here to upload or</div>
                    <div id="upload-button">
                      <div id="button">Select files on your device</div>
                    </div>
                  </div>
                </label>
              </Dropzone>
            </BrowserView>
            <MobileView>
              <Control.file
                id={id}
                {...props}
                onChange={e => this.fileDropped([...e.target.files])}
              />
            </MobileView>
            <div className="preview-list">
              <ul>
                {this.state.files.map(file => (
                  <li key={file.preview}>
                    <div className="preview-title">{file.name}</div>
                    <div>
                      <span onClick={() => this.removeAttachment(file)}>
                        <Icon icon="times" />
                        &nbsp;Remove
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </li>
        </ul>
      </div>
    );
  }

  renderCaptcha() {
    const { remote } = this.props;
    return (
      <FormGroup key="captcha" model=".captcha">
        <ul className="search__filter">
          <li>
            <label>
              <Translate>Captcha</Translate>
              <span className="required">*</span>
            </label>
          </li>
          <li className="wide">
            <Captcha
              remote={remote}
              refresh={refresh => {
                this.refreshCaptcha = refresh;
              }}
              model=".captcha"
            />
          </li>
        </ul>
      </FormGroup>
    );
  }

  render() {
    const { template, thesauris, file, attachments } = this.props;
    const { submiting } = this.state;
    return (
      <LocalForm
        validators={this.validators}
        model="publicform"
        getDispatch={dispatch => this.attachDispatch(dispatch)}
        onSubmit={this.handleSubmit}
      >
        {submiting ? (
          PublicForm.renderSubmitState()
        ) : (
          <div className="public-form">
            {PublicForm.renderTitle(template)}
            <MetadataFormFields thesauris={thesauris} model="publicform" template={template} />
            {file ? this.renderFileField('file', { accept: '.pdf' }) : false}
            {attachments ? this.renderFileField('attachments', { multiple: 'multiple' }) : false}
            {this.renderCaptcha()}
            <input type="submit" className="btn btn-success" value="Submit" />
          </div>
        )}
      </LocalForm>
    );
  }
}

PublicForm.propTypes = {
  file: PropTypes.bool.isRequired,
  attachments: PropTypes.bool.isRequired,
  remote: PropTypes.bool.isRequired,
  template: PropTypes.instanceOf(Immutable.Map).isRequired,
  thesauris: PropTypes.instanceOf(Immutable.List).isRequired,
  submit: PropTypes.func.isRequired,
};

export const mapStateToProps = (state, props) => ({
  template: state.templates.find(template => template.get('_id') === props.template),
  thesauris: state.thesauris,
  file: props.file !== undefined,
  remote: props.remote !== undefined,
  attachments: props.attachments !== undefined,
});

export function mapDispatchToProps(dispatch) {
  return bindActionCreators({ submit: publicSubmit }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(PublicForm);
