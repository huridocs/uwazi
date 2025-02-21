import entitiesUtil from 'app/Entities/utils/filterBaseProperties';
import { Select as SimpleSelect } from 'app/Forms';
import { I18NLink, t, Translate } from 'app/I18N';
import { notificationActions } from 'app/Notifications';
import { FormGroup } from 'app/ReactReduxForms';
import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Field, Form } from 'react-redux-form';
import { bindActionCreators } from 'redux';
import { createSelector } from 'reselect';
import { Icon } from 'UI';
import { wrapEntityMetadata } from 'app/Metadata';
import defaultTemplate from '../helpers/defaultTemplate';
import validator from '../helpers/validator';
import { IconField } from './IconField';
import MetadataFormFields from './MetadataFormFields';
import { MetadataExtractor } from './MetadataExtractor';
import { SupportingFiles } from './SupportingFiles';
import { PDFUpload } from './PDFUpload';
import { DeleteSelectionButton } from './DeleteSelectionButton';

const immutableDefaultTemplate = Immutable.fromJS(defaultTemplate);
const selectTemplateOptions = createSelector(
  s => s.templates,
  templates => templates.map(tmpl => ({ label: tmpl.get('name'), value: tmpl.get('_id') }))
);

class MetadataForm extends Component {
  constructor(props) {
    super(props);
    this.onSubmit = this.onSubmit.bind(this);
    this.onSubmitFailed = this.onSubmitFailed.bind(this);
  }

  componentWillUnmount() {
    this.props.componentWillUnmount();
  }

  onSubmit(entity) {
    this.props.onSubmit(
      wrapEntityMetadata(entitiesUtil.filterBaseProperties(entity), this.props.template.toJS()),
      this.props.model
    );
  }

  onSubmitFailed() {
    this.props.notify(t('System', 'Invalid form', null, false), 'danger');
  }

  renderTemplateSelect(templateOptions, template) {
    if (templateOptions.size) {
      const sortedTemplates = templateOptions.toJS().sort((a, b) => (a.label > b.label ? 1 : -1));

      return (
        <FormGroup>
          <ul className="search__filter">
            <li>
              <label>{t('System', 'Type')}</label>
            </li>
            <li className="wide">
              {this.props.initialTemplateId !== undefined &&
                this.props.initialTemplateId !== this.props.templateId && (
                  <span>
                    <Icon icon="exclamation-triangle" />
                    <Translate context="System">
                      Changing the type will erase all relationships to this entity.
                    </Translate>
                  </span>
                )}
            </li>
            <li className="wide">
              <SimpleSelect
                className="form-control"
                value={template.get('_id')}
                options={sortedTemplates}
                onChange={e => {
                  this.props.changeTemplate(this.props.model, e.target.value);
                }}
              />
            </li>
          </ul>
        </FormGroup>
      );
    }

    return (
      <ul className="search__filter">
        <div className="text-center protip">
          <Icon icon="lightbulb" />{' '}
          <b>
            <Translate>ProTip!</Translate>
          </b>
          <span>
            <Translate>You can create metadata templates in</Translate>{' '}
            <I18NLink to="/settings">
              <Translate>settings</Translate>
            </I18NLink>
            .
          </span>
        </div>
      </ul>
    );
  }

  render() {
    const {
      model,
      template,
      templateOptions,
      id,
      multipleEdition,
      showSubset,
      version,
      storeKey,
      highlightedProps,
      attachments,
      sharedId,
      progress,
    } = this.props;

    if (!template) {
      return <div />;
    }
    const titleLabel = template.get('commonProperties')
      ? template
          .get('commonProperties')
          .find(p => p.get('name') === 'title')
          .get('label')
      : 'Title';

    return (
      <fieldset disabled={progress !== undefined}>
        <Form
          id={id}
          model={model}
          onSubmit={this.onSubmit}
          validators={validator.generate(template.toJS(), multipleEdition)}
          onSubmitFailed={this.onSubmitFailed}
        >
          {!multipleEdition && (!showSubset || showSubset.includes('title')) && (
            <FormGroup model=".title">
              <ul className="search__filter">
                <li>
                  <label>
                    <Translate context={template.get('_id')}>{titleLabel}</Translate>{' '}
                    <span className="required">*</span>
                  </label>
                </li>
                <li className="wide">
                  <div className="metadata-extractor-container">
                    {storeKey === 'documentViewer' && (
                      <MetadataExtractor fieldName="title" model={`${model}.title`} />
                    )}
                    <Field model=".title">
                      <textarea className="form-control" />
                    </Field>
                  </div>
                </li>
                <div className="form-title-actions">
                  {storeKey === 'documentViewer' && <DeleteSelectionButton propertyName="title" />}
                  <IconField model={model} />
                </div>
              </ul>
            </FormGroup>
          )}

          {(!showSubset || showSubset.includes('template')) &&
            this.renderTemplateSelect(templateOptions, template)}
          <MetadataFormFields
            multipleEdition={multipleEdition}
            thesauris={this.props.thesauris}
            model={model}
            template={template}
            showSubset={showSubset}
            version={version}
            highlightedProps={highlightedProps}
            storeKey={storeKey}
          />
          {!multipleEdition && !showSubset && (
            <>
              <PDFUpload entitySharedID={sharedId} model={model} />
              <SupportingFiles
                supportingFiles={attachments}
                entitySharedID={sharedId}
                model={model}
              />
            </>
          )}
        </Form>
      </fieldset>
    );
  }
}

MetadataForm.defaultProps = {
  id: 'metadataForm',
  multipleEdition: false,
  showSubset: undefined,
  version: undefined,
  initialTemplateId: undefined,
  componentWillUnmount: () => {},
  notify: () => {},
  changeTemplate: () => {},
  onSubmit: () => {},
  highlightedProps: [],
  storeKey: '',
  attachments: [],
  sharedId: '',
  progress: undefined,
};
MetadataForm.propTypes = {
  model: PropTypes.string.isRequired,
  template: PropTypes.instanceOf(Immutable.Map).isRequired,
  templateId: PropTypes.string,
  initialTemplateId: PropTypes.string,
  multipleEdition: PropTypes.bool,
  templateOptions: PropTypes.instanceOf(Immutable.List).isRequired,
  thesauris: PropTypes.instanceOf(Immutable.List).isRequired,
  changeTemplate: PropTypes.func,
  onSubmit: PropTypes.func,
  notify: PropTypes.func,
  id: PropTypes.string,
  showSubset: PropTypes.arrayOf(PropTypes.string),
  version: PropTypes.string,
  componentWillUnmount: PropTypes.func,
  highlightedProps: PropTypes.arrayOf(PropTypes.string),
  storeKey: PropTypes.string,
  attachments: PropTypes.instanceOf(Array),
  sharedId: PropTypes.string,
  progress: PropTypes.number,
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ notify: notificationActions.notify }, dispatch);
}
export const mapStateToProps = (state, ownProps) => {
  const entityModel = ownProps.model.split('.').reduce((o, i) => o[i], state);
  const { attachments, sharedId } = entityModel;
  let progress = state.attachments.progress.get('NEW_ENTITY');
  if (sharedId) {
    const storeProgress = state.attachments.progress.get(sharedId);
    progress = storeProgress < 100 ? storeProgress : undefined;
  }
  return {
    thesauris: ownProps.thesauris ? ownProps.thesauris : state.thesauris || Immutable.fromJS([]),
    template: ownProps.template
      ? ownProps.template
      : state.templates.find(tmpl => tmpl.get('_id') === ownProps.templateId) ||
        immutableDefaultTemplate,
    templateOptions: selectTemplateOptions(state),
    attachments,
    sharedId,
    progress,
  };
};

export { MetadataForm };
export default connect(mapStateToProps, mapDispatchToProps)(MetadataForm);
