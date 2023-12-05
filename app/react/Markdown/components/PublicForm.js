/* eslint-disable react/jsx-pascal-case */
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { actions, Control } from 'react-redux-form';
import { bindActionCreators } from 'redux';
import { BrowserView, MobileView } from 'react-device-detect';
import Immutable from 'immutable';
import Dropzone from 'react-dropzone';
import PropTypes from 'prop-types';
import { LocalForm } from 'app/Forms/Form';
import { MetadataFormFields, validator, prepareMetadataAndFiles } from 'app/Metadata';
import { Translate } from 'app/I18N';
import { publicSubmit } from 'app/Uploads/actions/uploadsActions';
import { reloadThesauri } from 'app/Thesauri/actions/thesaurisActions';
import { FormGroup } from 'app/Forms';
import { Icon } from 'UI';
import { Loader } from 'app/components/Elements/Loader';
import './scss/public-form.scss';
import { generateID } from 'shared/IDGenerator';
import { FormCaptcha } from './FormCaptcha';

class PublicFormComponent extends Component {
  static renderTitle(template) {
    const titleProperty = template.get('commonProperties').find(p => p.get('name') === 'title');
    const useGeneratedId = Boolean(titleProperty.get('generatedId'));
    let input = <Control.text id="title" className="form-control" model=".title" />;
    if (useGeneratedId) {
      input = React.cloneElement(input, { defaultValue: generateID(3, 4, 4) });
    }
    return (
      <FormGroup key="title" model=".title">
        <ul className="search__filter">
          <li>
            <label htmlFor="title">
              <Translate context={template.get('_id')}>{titleProperty.get('label')}</Translate>
              <span className="required">*</span>
            </label>
          </li>
          <li className="wide">{input}</li>
        </ul>
      </FormGroup>
    );
  }

  static renderSubmitState() {
    return (
      <div className="public-form submiting">
        <h3>
          <Translate>Submitting</Translate>
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
    const generatedIdTitle = props.template
      .get('commonProperties')
      .find(p => p.get('name') === 'title' && p.get('generatedId') === true);
    this.state = { submiting: false, files: [], generatedIdTitle };
    this.refreshFn = refresh => {
      this.refreshCaptcha = refresh;
    };
  }

  async handleSubmit(_values) {
    const { submit, remote } = this.props;
    const values = await prepareMetadataAndFiles(
      _values,
      this.state.files,
      this.props.template.toJS()
    );
    try {
      this.setState({ submiting: true });
      const submitResult = await submit(values, remote);
      await submitResult.promise;
      this.resetForm();
      this.setState({ submiting: false, files: [] });
    } catch (e) {
      this.setState({ submiting: false });
    }
    this.refreshCaptcha();
  }

  attachDispatch(dispatch) {
    this.formDispatch = dispatch;
  }

  async removeAttachment(removedFile) {
    await this.setState(prevState => ({
      files: prevState.files.filter(file => file !== removedFile),
    }));
    if (!this.state.files.length) {
      const input = document.querySelector('#upload-button');
      input.value = '';
    }
  }

  resetForm() {
    this.formDispatch(actions.reset('publicform'));
    if (this.state.generatedIdTitle) {
      this.formDispatch(actions.load('publicform', { title: generateID(3, 4, 4) }));
    }
  }

  async fileDropped(files) {
    const uploadedFiles = files;
    this.state.files.forEach(file => uploadedFiles.push(file));
    this.setState(prevState => ({
      ...prevState,
      files: uploadedFiles,
    }));
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
                accept={
                  id === 'file'
                    ? {
                        'application/pdf': ['.pdf'],
                      }
                    : undefined
                }
              >
                {({ getRootProps, getInputProps }) => (
                  // eslint-disable-next-line react/jsx-props-no-spreading
                  <div {...getRootProps()}>
                    <div className="drop-zone">
                      <label>
                        <div className="text-content">
                          <div id="icon">
                            <Icon icon="cloud-upload-alt" />
                          </div>
                          <div id="upload-text">
                            <Translate>Drop your files here to upload or</Translate>
                          </div>
                        </div>
                      </label>
                      {/* eslint-disable-next-line react/jsx-props-no-spreading */}
                      <input id="upload-button" {...getInputProps()} />
                      <button id="button" type="button">
                        <Translate>Select files on your device</Translate>
                      </button>
                    </div>
                  </div>
                )}
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
                        &nbsp;<Translate>Remove</Translate>
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

  render() {
    const { template, thesauris, file, attachments, reloadThesauri } = this.props;
    const { submiting } = this.state;
    reloadThesauri();
    return (
      <LocalForm
        validators={this.validators}
        model="publicform"
        getDispatch={dispatch => this.attachDispatch(dispatch)}
        onSubmit={this.handleSubmit}
      >
        {submiting && PublicFormComponent.renderSubmitState()}
        {!submiting && (
          <div className="public-form">
            {PublicFormComponent.renderTitle(template)}
            <MetadataFormFields
              thesauris={thesauris}
              model="publicform"
              template={template}
              boundChange={(formModel, value) =>
                this.formDispatch(actions.change(formModel, value))
              }
            />
            {file ? this.renderFileField('file', { accept: '.pdf' }) : false}
            {attachments ? this.renderFileField('attachments', { multiple: 'multiple' }) : false}
            <FormCaptcha remote={this.props.remote} refresh={this.refreshFn} />
            <button type="submit" className="btn btn-success">
              <Translate>Submit</Translate>
            </button>
          </div>
        )}
      </LocalForm>
    );
  }
}
PublicFormComponent.propTypes = {
  file: PropTypes.bool.isRequired,
  attachments: PropTypes.bool.isRequired,
  remote: PropTypes.bool.isRequired,
  template: PropTypes.instanceOf(Immutable.Map).isRequired,
  thesauris: PropTypes.instanceOf(Immutable.List).isRequired,
  submit: PropTypes.func.isRequired,
  reloadThesauri: PropTypes.func.isRequired,
};
export const mapStateToProps = (state, props) => ({
  template: state.templates.find(template => template.get('_id') === props.template),
  thesauris: state.thesauris,
  file: props.file !== undefined,
  remote: props.remote !== undefined,
  attachments: props.attachments !== undefined,
});
export function mapDispatchToProps(dispatch) {
  return bindActionCreators({ submit: publicSubmit, reloadThesauri }, dispatch);
}
export { PublicFormComponent };
export default connect(mapStateToProps, mapDispatchToProps)(PublicFormComponent);
