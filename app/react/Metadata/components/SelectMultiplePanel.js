import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import Immutable from 'immutable';
import { createSelector } from 'reselect';
import { withContext } from 'app/componentWrappers';
import { t, Translate } from 'app/I18N';
import { deleteEntities } from 'app/Entities/actions/actions';
import * as metadataActions from 'app/Metadata/actions/actions';
import { wrapDispatch } from 'app/Multireducer';
import { advancedSort } from 'app/utils/advancedSort';
import { ShareButton } from 'app/Permissions/components/ShareButton';
import TemplateLabel from 'app/Layout/TemplateLabel';
import SidePanel from 'app/Layout/SidePanel';
import { Icon } from 'UI';
import { NeedAuthorization } from 'app/Auth';
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

class SelectMultiplePanel extends Component {
  constructor(props) {
    super(props);
    this.close = this.close.bind(this);
    this.delete = this.delete.bind(this);
    this.cancel = this.cancel.bind(this);
    this.save = this.save.bind(this);
    this.edit = this.edit.bind(this);
    this.changeTemplate = this.changeTemplate.bind(this);
  }

  close() {
    this.props.unselectAllDocuments();
    this.props.resetForm(this.props.formKey);
  }

  delete() {
    this.props.mainContext.confirm({
      accept: () => {
        this.props.deleteEntities(this.props.entitiesSelected.toJS());
      },
      title: 'Confirm',
      message: 'Confirm delete multiple items',
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

  changeTemplate(_formModel, template) {
    const updatedEntities = this.props.entitiesSelected.map(entity =>
      entity.set('template', template)
    );
    this.props.updateSelectedEntities(updatedEntities);
  }

  cancel() {
    this.props.mainContext.confirm({
      accept: () => {
        this.props.resetForm(this.props.formKey);
      },
      title: 'Confirm',
      message: 'Discard changes',
    });
  }

  edit() {
    this.props.loadForm(this.props.formKey, this.props.template.toJS());
  }

  sharedIds() {
    return this.props.entitiesSelected.map(entity => entity.get('sharedId'));
  }

  renderEditingForm() {
    const { formKey, thesauris } = this.props;

    return (
      <>
        <div className="alert alert-warning">
          <Icon icon="exclamation-triangle" size="2x" />
          <p>
            <Translate>Warning: you are editing multiple entities. Fields marked with a</Translate>{' '}
            <Icon icon="exclamation-triangle" />{' '}
            <Translate>will be updated with the same value.</Translate>
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
      </>
    );
  }

  renderEditingButtons() {
    return (
      <NeedAuthorization
        roles={['admin', 'editor']}
        orWriteAccessTo={this.props.entitiesSelected.toJS()}
      >
        <div className="btn-cluster content-right">
          <button
            type="button"
            onClick={this.cancel}
            className="cancel-edit-metadata btn btn-default"
          >
            <span className="btn-label">{t('System', 'Cancel')}</span>
          </button>
          <button type="submit" form="multiEdit" className="btn btn-success">
            <span className="btn-label">{t('System', 'Save')}</span>
          </button>
        </div>
      </NeedAuthorization>
    );
  }

  renderListButtons() {
    return (
      <NeedAuthorization
        roles={['admin', 'editor']}
        orWriteAccessTo={this.props.entitiesSelected.toJS()}
      >
        <div className="btn-cluster">
          <button type="button" onClick={this.edit} className="edit btn btn-default">
            <Icon icon="pencil-alt" />
            <span className="btn-label">{t('System', 'Edit')}</span>
          </button>
          <ShareButton sharedIds={this.sharedIds()} storeKey={this.props.storeKey} />
        </div>
        <div className="btn-cluster content-right">
          <button type="button" className="delete btn btn-danger" onClick={this.delete}>
            <Icon icon="trash-alt" />
            <span className="btn-label">{t('System', 'Delete')}</span>
          </button>
        </div>
      </NeedAuthorization>
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
              <span className="entity-title">
                {entity.get('title')}
                <TemplateLabel template={entity.get('template')} />
              </span>
            </li>
          );
        })}
      </ul>
    );
  }

  render() {
    const { entitiesSelected, open, editing } = this.props;
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
          {!editing && this.renderListButtons()}
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
  thesauris: PropTypes.instanceOf(Immutable.List).isRequired,
  formState: PropTypes.instanceOf(Object).isRequired,
  formKey: PropTypes.string.isRequired,
  storeKey: PropTypes.string.isRequired,
  mainContext: PropTypes.shape({
    confirm: PropTypes.func,
  }).isRequired,
};
const mapStateToProps = (_state, props) => ({
  template: commonTemplate(props),
  open: props.entitiesSelected.size > 1,
  editing: Object.keys(props.state || {}).length > 0,
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

export { SelectMultiplePanel, mapStateToProps };

export default connect(mapStateToProps, mapDispatchToProps)(withContext(SelectMultiplePanel));
