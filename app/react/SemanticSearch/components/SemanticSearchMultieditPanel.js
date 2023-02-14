import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import Immutable from 'immutable';
import { createSelector } from 'reselect';
import { Icon } from 'UI';
import { t, Translate } from 'app/I18N';
import * as metadataActions from 'app/Metadata/actions/actions';
import { wrapDispatch } from 'app/Multireducer';
import SidePanel from 'app/Layout/SidePanel';
import commonTemplate from 'app/Metadata/helpers/comonTemplate';
import MetadataForm from 'app/Metadata/components/MetadataForm';
import { setEditSearchEntities, getSearch } from 'app/SemanticSearch/actions/actions';

const getTemplates = createSelector(
  s => s.templates,
  templates => templates.toJS()
);

const commonTemplateSelector = createSelector(
  getTemplates,
  s => s.semanticSearch.multiedit,
  commonTemplate
);

export class SemanticSearchMultieditPanel extends Component {
  constructor(props) {
    super(props);
    this.close = this.close.bind(this);
    this.cancel = this.cancel.bind(this);
    this.save = this.save.bind(this);
    this.changeTemplate = this.changeTemplate.bind(this);
  }

  close() {
    this.props.resetForm(this.props.formKey);
    this.props.setEntities([]);
  }

  metadataFieldModified(key) {
    return (
      !this.props.formState.metadata[key].pristine &&
      (!this.props.formState.metadata[key].$form ||
        !this.props.formState.metadata[key].$form.pristine)
    );
  }

  save(formValues) {
    const { entities, template, formState, searchId } = this.props;
    const modifiedValues = { metadata: {} };
    Object.keys(formValues.metadata).forEach(key => {
      if (this.metadataFieldModified(key)) {
        modifiedValues.metadata[key] = formValues.metadata[key];
      }
    });

    if (template.get('_id')) {
      modifiedValues.template = template.get('_id');
    }

    if (formState.icon && !formState.icon.pristine) {
      modifiedValues.icon = formValues.icon;
    }
    return this.props.multipleUpdate(entities, modifiedValues).then(() => {
      this.close();
      this.props.getSearch(searchId);
    });
  }

  changeTemplate(_formModel, template) {
    const updatedEntities = this.props.entities.map(entity => entity.set('template', template));
    this.props.setEntities(updatedEntities);
  }

  cancel() {
    const { confirm } = this.context;
    confirm({
      accept: () => {
        this.close();
      },
      title: 'Confirm',
      message: 'Discard changes',
    });
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
      <>
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
      </>
    );
  }

  render() {
    const { open } = this.props;
    return (
      <SidePanel open={open} className="multi-edit">
        <div className="sidepanel-header">
          <button type="button" className="closeSidepanel close-modal" onClick={this.close}>
            <Icon icon="times" />
          </button>
        </div>
        <div className="sidepanel-body">{this.renderEditingForm()}</div>
        <div className="sidepanel-footer">{this.renderEditingButtons()}</div>
      </SidePanel>
    );
  }
}

SemanticSearchMultieditPanel.defaultProps = {
  template: null,
  open: false,
};

SemanticSearchMultieditPanel.propTypes = {
  template: PropTypes.instanceOf(Immutable.Map),
  open: PropTypes.bool,
  resetForm: PropTypes.func.isRequired,
  setEntities: PropTypes.func.isRequired,
  multipleUpdate: PropTypes.func.isRequired,
  getSearch: PropTypes.func.isRequired,
  thesauris: PropTypes.instanceOf(Immutable.List).isRequired,
  formState: PropTypes.instanceOf(Object).isRequired,
  entities: PropTypes.instanceOf(Object).isRequired,
  formKey: PropTypes.string.isRequired,
  searchId: PropTypes.string.isRequired,
};

export const mapStateToProps = state => {
  const entities = state.semanticSearch.multiedit;
  return {
    template: commonTemplateSelector(state),
    thesauris: state.thesauris,
    entities,
    open: Boolean(entities.size),
    formState: state.semanticSearch.multipleEditForm,
  };
};

export function mapDispatchToProps(dispatch, props) {
  return bindActionCreators(
    {
      loadForm: metadataActions.loadTemplate,
      resetForm: metadataActions.resetReduxForm,
      setEntities: setEditSearchEntities,
      getSearch,
      multipleUpdate: metadataActions.multipleUpdate,
    },
    wrapDispatch(dispatch, props.storeKey)
  );
}

export default connect(mapStateToProps, mapDispatchToProps)(SemanticSearchMultieditPanel);
