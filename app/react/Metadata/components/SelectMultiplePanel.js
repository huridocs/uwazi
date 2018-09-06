import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Form } from 'react-redux-form';
import { t } from 'app/I18N';
import { deleteEntities } from 'app/Entities/actions/actions';
import ShowIf from 'app/App/ShowIf';
import { comonProperties } from 'shared/comonProperties';
import * as metadataActions from 'app/Metadata/actions/actions';
import validator from 'app/Metadata/helpers/validator';
import { Select as SimpleSelect, FormGroup } from 'app/Forms';
import { IconSelector } from 'app/ReactReduxForms';
import { createSelector } from 'reselect';
import { wrapDispatch } from 'app/Multireducer';
import { advancedSort } from 'app/utils/advancedSort';
import TemplateLabel from 'app/Layout/TemplateLabel';
import SidePanel from 'app/Layout/SidePanel';
import Immutable from 'immutable';
import MetadataFormFields from './MetadataFormFields';
import { Icon } from 'UI';

const sortedTemplates = createSelector(
  s => s.templates,
  (templates) => {
    const _templates = templates ? templates.toJS() : [];
    return advancedSort(_templates, { property: 'name' });
  }
);

const commonTemplate = createSelector(
  sortedTemplates,
  s => s.entitiesSelected,
  (templates, entitiesSelected) => {
    const selectedTemplates = entitiesSelected.map(entity => entity.get('template'))
    .filter((type, index, _types) => _types.indexOf(type) === index);
    const properties = comonProperties(templates, selectedTemplates);
    const _id = selectedTemplates.size === 1 ? selectedTemplates.first() : '';

    const withoutTemplate = entitiesSelected.reduce((memo, entity) => memo && !entity.get('template'), true);

    if (withoutTemplate) {
      return Immutable.fromJS(templates.filter(template => template.isEntity !== true)[0]);
    }
    return Immutable.fromJS({ _id, properties });
  }
);

export class SelectMultiplePanel extends Component {
  constructor(props) {
    super(props);
    this.close = this.close.bind(this);
    this.delete = this.delete.bind(this);
    this.save = this.save.bind(this);
    this.edit = this.edit.bind(this);
    this.publish = this.publish.bind(this);
    this.unpublish = this.unpublish.bind(this);
  }

  close() {
    this.props.unselectAllDocuments();
    this.props.resetForm(this.props.formKey);
  }

  delete() {
    this.context.confirm({
      accept: () => {
        this.props.deleteEntities(this.props.entitiesSelected.toJS());
      },
      title: t('System', 'Confirm', null, false),
      message: t('System', 'Confirm delete multiple items', null, false)
    });
  }

  metadataFieldModified(key) {
    return !this.props.formState.metadata[key].pristine &&
    (!this.props.formState.metadata[key].$form || !this.props.formState.metadata[key].$form.pristine);
  }

  save(formValues) {
    const modifiedValues = { metadata: {} };
    const comonTemplate = this.props.template.toJS();
    Object.keys(formValues.metadata).forEach((key) => {
      if (this.metadataFieldModified(key)) {
        modifiedValues.metadata[key] = formValues.metadata[key];
      }
    });

    if (comonTemplate._id) {
      modifiedValues.template = comonTemplate._id;
    }

    if (this.props.formState.icon && !this.props.formState.icon.pristine) {
      modifiedValues.icon = formValues.icon;
    }

    return this.props.multipleUpdate(this.props.entitiesSelected, modifiedValues)
    .then((updatedEntities) => {
      this.props.updateEntities(updatedEntities);
      this.props.unselectAllDocuments();
      this.props.resetForm(this.props.formKey);
    });
  }

  publish() {
    this.context.confirm({
      accept: () => {
        this.props.multipleUpdate(this.props.entitiesSelected, { published: true });
      },
      title: t('System', 'Confirm', null, false),
      message: t('System', 'Confirm publish multiple items', null, false)
    });
  }

  unpublish() {
    this.context.confirm({
      accept: () => this.props.multipleUpdate(this.props.entitiesSelected, { published: false }),
      title: t('System', 'Confirm', null, false),
      message: t('System', 'Confirm unpublish multiple items', null, false)
    });
  }

  changeTemplate(template) {
    const updatedEntities = this.props.entitiesSelected.map(entity => entity.set('template', template));
    this.props.updateSelectedEntities(updatedEntities);
  }

  cancel() {
    this.context.confirm({
      accept: () => {
        this.props.resetForm(this.props.formKey);
      },
      title: t('System', 'Confirm', null, false),
      message: t('System', 'Discard changes', null, false)
    });
  }

  edit() {
    this.props.loadForm(this.props.formKey, this.props.template.toJS());
  }

  validation(template) {
    if (!template) {
      return {};
    }
    const validation = validator.generate(template.toJS());
    delete validation.title;
    Object.keys(this.props.state.metadata || {}).forEach((key) => {
      if (!this.metadataFieldModified(key)) {
        delete validation[`metadata.${key}`];
      }
    });

    return validation;
  }

  render() {
    const { entitiesSelected, open, editing, templates, template } = this.props;
    const validation = this.validation(template);
    const templateId = template ? template.get('_id') : null;

    const typesSelected = this.props.entitiesSelected.map(entity => entity.get('type'))
    .filter((type, index, _types) => _types.indexOf(type) === index);
    const comonTypeSelected = typesSelected.size === 1 ? typesSelected.first() : null;

    const templateOptions = templates.toJS()
    .filter((_template) => {
      if (!comonTypeSelected) {
        return false;
      }
      if (comonTypeSelected === 'entity') {
        return _template.isEntity;
      }
      return !_template.isEntity;
    })
    .map(tmpl => ({ label: tmpl.name, value: tmpl._id }));

    const canBePublished = this.props.entitiesSelected.reduce((previousCan, entity) => {
      const isEntity = entity.get('type') === 'entity';
      return previousCan && (entity.get('processed') || isEntity) && !entity.get('published') && !!entity.get('template');
    }, true);

    const canBeUnPublished = this.props.entitiesSelected.reduce((previousCan, entity) => previousCan && entity.get('published'), true);

    return (
      <SidePanel open={open} className="multi-edit">
        <div className="sidepanel-header">
          <Icon icon="check" /> <span>{entitiesSelected.size} {t('System', 'selected')}</span>
          <button className="closeSidepanel close-modal" onClick={this.close}>
            <Icon icon="times" />
          </button>
        </div>
        <div className="sidepanel-body">
          <ShowIf if={!editing}>
            <ul className="entities-list">
              {entitiesSelected.map((entity, index) => {
                const onClick = this.props.getAndSelectDocument.bind(this, entity.get('sharedId'));
                return (
                  <li key={index} onClick={onClick}>
                    <span className="entity-title">{entity.get('title')}</span>
                    <TemplateLabel template={entity.get('template')}/>
                  </li>
              );
              })}
            </ul>
          </ShowIf>
          <ShowIf if={editing}>
            <Form id="multiEdit" model={this.props.formKey} onSubmit={this.save} validators={validation}>
              <FormGroup>
                <div className="alert alert-warning">
                  <Icon icon="exclamation-triangle" size="2x" />
                  <p>
                    Warning: you are editing multiple files.
                    Fields marked with a <Icon icon="exclamation-triangle" /> will be updated with the same value.
                  </p>
                </div>
                <ShowIf if={!!templateOptions.length}>
                  <FormGroup>
                    <ul className="search__filter">
                      <li><label>{t('System', 'Type')} <span className="required">*</span></label></li>
                      <li className="wide">
                        <SimpleSelect
                          className="form-control template-selector"
                          value={templateId}
                          options={templateOptions}
                          onChange={e => this.changeTemplate(e.target.value)}
                        />
                      </li>
                    </ul>
                  </FormGroup>
                </ShowIf>
                <ul className="search__filter">
                  <li>
                    <ShowIf if={this.props.formState.icon && !this.props.formState.icon.pristine}>
                      <span><i className="fa fa-warning" />&nbsp;</span>
                    </ShowIf>
                    <label>{t('System', 'Icon')} / {t('System', 'Flag')}</label>
                  </li>
                  <li className="wide">
                    <IconSelector model=".icon"/>
                  </li>
                </ul>
              </FormGroup>
              <MetadataFormFields
                model={this.props.formKey}
                template={template}
                thesauris={this.props.thesauris}
                multipleEdition
              />
            </Form>
          </ShowIf>
        </div>
        <div className="sidepanel-footer">
          <ShowIf if={!editing}>
            <button onClick={this.edit} className="edit btn btn-primary">
              <Icon icon="pencil-alt" />
              <span className="btn-label">{t('System', 'Edit')}</span>
            </button>
          </ShowIf>
          <ShowIf if={!editing}>
            <button className="delete btn btn-danger" onClick={this.delete}>
              <Icon icon="trash-alt" />
              <span className="btn-label">{t('System', 'Delete')}</span>
            </button>
          </ShowIf>
          <ShowIf if={!editing && canBePublished}>
            <button className="publish btn btn-success" onClick={this.publish}>
              <Icon icon="paper-plane" />
              <span className="btn-label">{t('System', 'Publish')}</span>
            </button>
          </ShowIf>
          <ShowIf if={!editing && canBeUnPublished}>
            <button className="unpublish btn btn-warning" onClick={this.unpublish}>
              <Icon icon="paper-plane" />
              <span className="btn-label">{t('System', 'Unpublish')}</span>
            </button>
          </ShowIf>
          <ShowIf if={editing}>
            <button onClick={this.cancel} className="cancel-edit-metadata btn btn-primary">
              <Icon icon="times" />
              <span className="btn-label">{t('System', 'Cancel')}</span>
            </button>
          </ShowIf>
          <ShowIf if={editing}>
            <button type="submit" form="multiEdit" className="btn btn-success">
              <Icon icon="save" />
              <span className="btn-label">{t('System', 'Save')}</span>
            </button>
          </ShowIf>
        </div>
      </SidePanel>
    );
  }
}

SelectMultiplePanel.defaultProps = {
  entitiesSelected: Immutable.fromJS([]),
  template: null,
  open: false,
  editing: false,
};

SelectMultiplePanel.propTypes = {
  entitiesSelected: PropTypes.instanceOf(Immutable.List),
  template: PropTypes.instanceOf(Immutable.Map),
  open: PropTypes.bool,
  editing: PropTypes.bool,
  unselectAllDocuments: PropTypes.func.isRequired,
  loadForm: PropTypes.func.isRequired,
  resetForm: PropTypes.func.isRequired,
  deleteEntities: PropTypes.func.isRequired,
  multipleUpdate: PropTypes.func.isRequired,
  updateEntities: PropTypes.func.isRequired,
  updateSelectedEntities: PropTypes.func.isRequired,
  getAndSelectDocument: PropTypes.func.isRequired,
  templates: PropTypes.instanceOf(Immutable.List).isRequired,
  thesauris: PropTypes.instanceOf(Immutable.List).isRequired,
  formState: PropTypes.instanceOf(Object).isRequired,
  state: PropTypes.instanceOf(Object).isRequired,
  formKey: PropTypes.string.isRequired
};

SelectMultiplePanel.contextTypes = {
  confirm: PropTypes.func
};

export const mapStateToProps = (state, props) => ({
    template: commonTemplate(props),
    open: props.entitiesSelected.size > 1,
    editing: Object.keys(props.state).length > 0
});

function mapDispatchToProps(dispatch, props) {
  return bindActionCreators({
    deleteEntities,
    loadForm: metadataActions.loadTemplate,
    resetForm: metadataActions.resetReduxForm,
    multipleUpdate: metadataActions.multipleUpdate
  }, wrapDispatch(dispatch, props.storeKey));
}

export default connect(mapStateToProps, mapDispatchToProps)(SelectMultiplePanel);
