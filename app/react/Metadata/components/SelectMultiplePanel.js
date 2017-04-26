import PropTypes from 'prop-types';
import React, {Component} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {Form} from 'react-redux-form';
import {t} from 'app/I18N';
import {deleteEntities} from 'app/Entities/actions/actions';
import MetadataFormFields from './MetadataFormFields';
import ShowIf from 'app/App/ShowIf';
import {comonProperties} from 'app/Metadata/helpers/comonProperties';
import * as metadataActions from 'app/Metadata/actions/actions';
import validator from 'app/Metadata/helpers/validator';
import {FormGroup, IconSelector} from 'app/ReactReduxForms';
import {Select as SimpleSelect} from 'app/Forms';
import {fromJS} from 'immutable';
import {createSelector} from 'reselect';
import {wrapDispatch} from 'app/Multireducer';

import {TemplateLabel, SidePanel} from 'app/Layout';

const commonTemplate = createSelector(
  s => s.templates,
  s => s.entitiesSelected,
  (templates, entitiesSelected) => {
    const selectedTemplates = entitiesSelected.map((entity) => entity.get('template'))
    .filter((type, index, _types) => _types.indexOf(type) === index);
    const properties = comonProperties(templates.toJS(), selectedTemplates);
    let _id = selectedTemplates.size === 1 ? selectedTemplates.first() : '';
    return fromJS({_id, properties});
  }
);

export class SelectMultiplePanel extends Component {

  close() {
    let message = t('System', 'This action will unselect all the entities.');
    if (this.props.editing) {
      message = t('System', 'Discard changes');
    }
    this.context.confirm({
      accept: () => {
        this.props.unselectAllDocuments();
        this.props.resetForm(this.props.formKey);
      },
      title: t('System', 'Confirm'),
      message
    });
  }

  delete() {
    this.context.confirm({
      accept: () => {
        this.props.deleteEntities(this.props.entitiesSelected.toJS());
      },
      title: t('System', 'Confirm'),
      message: t('System', 'Confirm delete multiple items')
    });
  }

  metadataFieldModified(key) {
    return !this.props.formState.metadata[key].pristine &&
    (!this.props.formState.metadata[key].$form || !this.props.formState.metadata[key].$form.pristine);
  }

  save(formValues) {
    let modifiedValues = {metadata: {}};
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

  changeTemplate(template) {
    const updatedEntities = this.props.entitiesSelected.map((entity) => entity.set('template', template));
    this.props.updateSelectedEntities(updatedEntities);
  }

  cancel() {
    this.context.confirm({
      accept: () => {
        this.props.resetForm(this.props.formKey);
      },
      title: t('System', 'Confirm'),
      message: t('System', 'Discard changes')
    });
  }

  edit() {
    this.props.loadForm(this.props.formKey, this.props.template.toJS());
  }

  validation(template) {
    let validation = validator.generate(template.toJS());
    delete validation.title;
    Object.keys(this.props.state.metadata || {}).forEach((key) => {
      if (!this.metadataFieldModified(key)) {
        delete validation[`metadata.${key}`];
      }
    });

    return validation;
  }

  render() {
    const {entitiesSelected, open, editing, templates, template} = this.props;
    const validation = this.validation(template);

    const typesSelected = this.props.entitiesSelected.map((entity) => entity.get('type'))
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
    .map((tmpl) => {
      return {label: tmpl.name, value: tmpl._id};
    });

    return (
      <SidePanel open={open} className="metadata-sidepanel">
        <div className="sidepanel-header">
          <i className="fa fa-check-square"></i> <span>{entitiesSelected.size} {t('System', 'selected')}</span>
          <i className="closeSidepanel fa fa-close close-modal" onClick={this.close.bind(this)}/>&nbsp;
        </div>
        <div className="sidepanel-body">
          <ShowIf if={!editing}>
            <ul className="entities-list">
              {entitiesSelected.map((entity, index) => {
                return <li key={index}>
                  <span className="entity-title">{entity.get('title')}</span>&nbsp;
                  <TemplateLabel template={entity.get('template')}/>
                </li>;
              })}
            </ul>
          </ShowIf>
          <ShowIf if={editing}>
            <Form id='multiEdit' model={this.props.formKey} onSubmit={this.save.bind(this)} validators={validation}>
              <FormGroup>
                <div className="alert alert-warning">
                  <i className="fa fa-warning"></i>
                  Warning: you are editing multiple files. Fields marked with a <i className="fa fa-warning"></i> will be updated with the same value.
                </div>
                <ShowIf if={!!templateOptions.length}>
                  <FormGroup>
                    <ul className="search__filter">
                      <li><label>{t('System', 'Type')} <span className="required">*</span></label></li>
                      <li className="wide">
                        <SimpleSelect
                          className="form-control template-selector"
                          value={template.get('_id')}
                          options={templateOptions}
                          onChange={(e) => this.changeTemplate(e.target.value)}
                        >
                        </SimpleSelect>
                      </li>
                    </ul>
                  </FormGroup>
                </ShowIf>
                <ul className="search__filter">
                  <li>
                    <ShowIf if={this.props.formState.icon && !this.props.formState.icon.pristine}>
                      <span><i className="fa fa-warning"></i>&nbsp;</span>
                    </ShowIf>
                    <label>{t('System', 'Icon')} / {t('System', 'Flag')}</label>
                  </li>
                  <li className="wide">
                    <IconSelector model={'.icon'}/>
                  </li>
                </ul>
              </FormGroup>
              <MetadataFormFields
                model={this.props.formKey}
                template={template}
                thesauris={this.props.thesauris}
                multipleEdition={true}
              />
            </Form>
          </ShowIf>
        </div>
        <div className="sidepanel-footer">
          <ShowIf if={!editing}>
            <button onClick={this.edit.bind(this)} className="edit btn btn-primary">
              <i className="fa fa-pencil"></i>
              <span className="btn-label">{t('System', 'Edit')}</span>
            </button>
          </ShowIf>
          <ShowIf if={!editing}>
            <button className="delete btn btn-danger" onClick={this.delete.bind(this)}>
              <i className="fa fa-trash"></i>
              <span className="btn-label">{t('System', 'Delete')}</span>
            </button>
          </ShowIf>
          <ShowIf if={editing}>
            <button
              onClick={this.cancel.bind(this)}
              className="cancel-edit-metadata btn btn-primary">
              <i className="fa fa-close"></i>
              <span className="btn-label">{t('System', 'Cancel')}</span>
            </button>
          </ShowIf>
          <ShowIf if={editing}>
            <button type="submit" form='multiEdit' className="btn btn-success">
              <i className="fa fa-save"></i>
              <span className="btn-label">{t('System', 'Save')}</span>
            </button>
          </ShowIf>
        </div>
      </SidePanel>
    );
  }
}

SelectMultiplePanel.propTypes = {
  entitiesSelected: PropTypes.object,
  template: PropTypes.object,
  open: PropTypes.bool,
  editing: PropTypes.bool,
  unselectAllDocuments: PropTypes.func,
  loadForm: PropTypes.func,
  resetForm: PropTypes.func,
  deleteEntities: PropTypes.func,
  multipleUpdate: PropTypes.func,
  updateEntities: PropTypes.func,
  updateSelectedEntities: PropTypes.func,
  templates: PropTypes.object,
  thesauris: PropTypes.object,
  formState: PropTypes.object,
  state: PropTypes.object,
  formKey: PropTypes.string
};

SelectMultiplePanel.contextTypes = {
  confirm: PropTypes.func
};

export const mapStateToProps = (state, props) => {
  return {
    template: commonTemplate(props),
    open: props.entitiesSelected.size > 1,
    editing: Object.keys(props.state).length > 0
  };
};

function mapDispatchToProps(dispatch, props) {
  return bindActionCreators({
    deleteEntities,
    loadForm: metadataActions.loadTemplate,
    resetForm: metadataActions.resetReduxForm,
    multipleUpdate: metadataActions.multipleUpdate
  }, wrapDispatch(dispatch, props.storeKey));
}

export default connect(mapStateToProps, mapDispatchToProps)(SelectMultiplePanel);
