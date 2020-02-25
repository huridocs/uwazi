import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { t } from 'app/I18N';
import { deleteEntities } from 'app/Entities/actions/actions';
import * as metadataActions from 'app/Metadata/actions/actions';
import { createSelector } from 'reselect';
import { wrapDispatch } from 'app/Multireducer';
import { advancedSort } from 'app/utils/advancedSort';
import TemplateLabel from 'app/Layout/TemplateLabel';
import SidePanel from 'app/Layout/SidePanel';
import Immutable from 'immutable';
import { Icon } from 'UI';
import MetadataForm from './MetadataForm';
import comonTemplate from '../helpers/comonTemplate';

const sortedTemplates = createSelector(
  s => s.templates,
  templates => {
    const _templates = templates ? templates.toJS() : [];
    return advancedSort(_templates, { property: 'name' });
  }
);

const commonTemplate = createSelector(sortedTemplates, s => s.entitiesSelected, comonTemplate);

export class SelectMultiplePanel extends Component {
  constructor(props) {
    super(props);
    this.close = this.close.bind(this);
    this.delete = this.delete.bind(this);
    this.cancel = this.cancel.bind(this);
    this.save = this.save.bind(this);
    this.edit = this.edit.bind(this);
    this.publish = this.publish.bind(this);
    this.unpublish = this.unpublish.bind(this);
    this.changeTemplate = this.changeTemplate.bind(this);
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
      message: t('System', 'Confirm delete multiple items', null, false),
    });
  }

  metadataFieldModified(key) {
    return (
      !this.props.formState.metadata[key].pristine &&
      (!this.props.formState.metadata[key].$form ||
        !this.props.formState.metadata[key].$form.pristine)
    );
  }

  save(formValues) {
    const modifiedValues = { metadata: {} };
    const template = this.props.template.toJS();
    Object.keys(formValues.metadata).forEach(key => {
      if (this.metadataFieldModified(key)) {
        modifiedValues.metadata[key] = formValues.metadata[key];
      }
    });

    if (template._id) {
      modifiedValues.template = template._id;
    }

    if (this.props.formState.icon && !this.props.formState.icon.pristine) {
      modifiedValues.icon = formValues.icon;
    }

    return this.props
      .multipleUpdate(this.props.entitiesSelected, modifiedValues)
      .then(updatedEntities => {
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
      message: t('System', 'Confirm publish multiple items', null, false),
      type: 'success',
    });
  }

  unpublish() {
    this.context.confirm({
      accept: () => this.props.multipleUpdate(this.props.entitiesSelected, { published: false }),
      title: t('System', 'Confirm', null, false),
      message: t('System', 'Confirm unpublish multiple items', null, false),
      type: 'success',
    });
  }

  changeTemplate(_formModel, template) {
    const updatedEntities = this.props.entitiesSelected.map(entity =>
      entity.set('template', template)
    );
    this.props.updateSelectedEntities(updatedEntities);
  }

  cancel() {
    this.context.confirm({
      accept: () => {
        this.props.resetForm(this.props.formKey);
      },
      title: t('System', 'Confirm', null, false),
      message: t('System', 'Discard changes', null, false),
    });
  }

  edit() {
    this.props.loadForm(this.props.formKey, this.props.template.toJS());
  }

  renderEditingForm() {
    const { formKey, thesauris } = this.props;

    return (
      <React.Fragment>
        <div className="alert alert-warning">
          <Icon icon="exclamation-triangle" size="2x" />
          <p>
            Warning: you are editing multiple files. Fields marked with a{' '}
            <Icon icon="exclamation-triangle" /> will be updated with the same value.
          </p>
        </div>
        <MetadataForm
          id="multiEdit"
          model={formKey}
          onSubmit={this.save}
          thesauris={thesauris}
          template={this.props.template}
          changeTemplate={this.changeTemplate}
          multipleEdition
        />
      </React.Fragment>
    );
  }

  renderEditingButtons() {
    return (
      <React.Fragment>
        <button
          type="button"
          onClick={this.cancel}
          className="cancel-edit-metadata btn btn-primary"
        >
          <Icon icon="times" />
          <span className="btn-label">{t('System', 'Cancel')}</span>
        </button>
        <button type="submit" form="multiEdit" className="btn btn-success">
          <Icon icon="save" />
          <span className="btn-label">{t('System', 'Save')}</span>
        </button>
      </React.Fragment>
    );
  }

  renderListButtons(canBePublished, canBeUnPublished) {
    return (
      <React.Fragment>
        <button type="button" onClick={this.edit} className="edit btn btn-primary">
          <Icon icon="pencil-alt" />
          <span className="btn-label">{t('System', 'Edit')}</span>
        </button>
        <button type="button" className="delete btn btn-danger" onClick={this.delete}>
          <Icon icon="trash-alt" />
          <span className="btn-label">{t('System', 'Delete')}</span>
        </button>
        {canBePublished && (
          <button type="button" className="publish btn btn-success" onClick={this.publish}>
            <Icon icon="paper-plane" />
            <span className="btn-label">{t('System', 'Publish')}</span>
          </button>
        )}
        {canBeUnPublished && (
          <button type="button" className="unpublish btn btn-warning" onClick={this.unpublish}>
            <Icon icon="paper-plane" />
            <span className="btn-label">{t('System', 'Unpublish')}</span>
          </button>
        )}
      </React.Fragment>
    );
  }

  renderList() {
    const { entitiesSelected, getAndSelectDocument } = this.props;
    return (
      <ul className="entities-list">
        {entitiesSelected.map((entity, index) => {
          const onClick = getAndSelectDocument.bind(this, entity.get('sharedId'));
          return (
            <li key={index} onClick={onClick}>
              <span className="entity-title">{entity.get('title')}</span>
              <TemplateLabel template={entity.get('template')} />
            </li>
          );
        })}
      </ul>
    );
  }

  render() {
    const { entitiesSelected, open, editing } = this.props;
    const canBePublished = this.props.entitiesSelected.reduce((previousCan, entity) => {
      const isEntity = !entity.get('file');
      return (
        previousCan &&
        (entity.get('processed') || isEntity) &&
        !entity.get('published') &&
        !!entity.get('template')
      );
    }, true);

    const canBeUnPublished = this.props.entitiesSelected.reduce(
      (previousCan, entity) => previousCan && entity.get('published'),
      true
    );

    return (
      <SidePanel open={open} className="multi-edit">
        <div className="sidepanel-header">
          <Icon icon="check" />{' '}
          <span>
            {entitiesSelected.size} {t('System', 'selected')}
          </span>
          <button type="button" className="closeSidepanel close-modal" onClick={this.close}>
            <Icon icon="times" />
          </button>
        </div>
        <div className="sidepanel-body">
          {!editing && this.renderList()}
          {editing && this.renderEditingForm()}
        </div>
        <div className="sidepanel-footer">
          {!editing && this.renderListButtons(canBePublished, canBeUnPublished)}
          {editing && this.renderEditingButtons()}
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
  formKey: PropTypes.string.isRequired,
};

SelectMultiplePanel.contextTypes = {
  confirm: PropTypes.func,
};

export const mapStateToProps = (_state, props) => ({
  template: commonTemplate(props),
  open: props.entitiesSelected.size > 1,
  editing: Object.keys(props.state).length > 0,
});

function mapDispatchToProps(dispatch, props) {
  return bindActionCreators(
    {
      deleteEntities,
      loadForm: metadataActions.loadTemplate,
      resetForm: metadataActions.resetReduxForm,
      multipleUpdate: metadataActions.multipleUpdate,
    },
    wrapDispatch(dispatch, props.storeKey)
  );
}

export default connect(mapStateToProps, mapDispatchToProps)(SelectMultiplePanel);
