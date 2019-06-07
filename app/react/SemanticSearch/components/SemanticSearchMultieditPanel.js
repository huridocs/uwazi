import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { t } from 'app/I18N';
import * as metadataActions from 'app/Metadata/actions/actions';
import { createSelector } from 'reselect';
import { wrapDispatch } from 'app/Multireducer';
import { advancedSort } from 'app/utils/advancedSort';
import SidePanel from 'app/Layout/SidePanel';
import Immutable from 'immutable';
import { Icon } from 'UI';
import MetadataForm from './MetadataForm';
import comonTemplate from '../helpers/comonTemplate';

const sortedTemplates = createSelector(
  s => s.templates,
  (templates) => {
    const _templates = templates ? templates.toJS() : [];
    return advancedSort(_templates, { property: 'name' });
  }
);

const commonTemplate = createSelector(
  sortedTemplates,
  s => s.entities,
  comonTemplate
);

export class SemanticSearchMultieditPanel extends Component {
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
    this.props.resetForm(this.props.formKey);
  }

  metadataFieldModified(key) {
    return !this.props.formState.metadata[key].pristine &&
    (!this.props.formState.metadata[key].$form || !this.props.formState.metadata[key].$form.pristine);
  }

  save(formValues) {
    const { entities, template, formState } = this.props;
    const modifiedValues = { metadata: {} };
    Object.keys(formValues.metadata).forEach((key) => {
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

    return this.props.multipleUpdate(entities, modifiedValues)
    .then(() => {
      this.close();
    });
  }

  changeTemplate(formModel, template) {
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

  renderEditingForm() {
    const { formKey, thesauris } = this.props;

    return (
      <React.Fragment>
        <div className="alert alert-warning">
          <Icon icon="exclamation-triangle" size="2x" />
          <p>
          Warning: you are editing multiple files.
          Fields marked with a <Icon icon="exclamation-triangle" /> will be updated with the same value.
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
        <button type="button" onClick={this.cancel} className="cancel-edit-metadata btn btn-primary">
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

  render() {
    const { open } = this.props;
    return (
      <SidePanel open={open} className="multi-edit">
        <div className="sidepanel-header">
          <button type="button" className="closeSidepanel close-modal" onClick={this.close}>
            <Icon icon="times" />
          </button>
        </div>
        <div className="sidepanel-body">
          {this.renderEditingForm()}
        </div>
        <div className="sidepanel-footer">
          {this.renderEditingButtons()}
        </div>
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
  loadForm: PropTypes.func.isRequired,
  resetForm: PropTypes.func.isRequired,
  multipleUpdate: PropTypes.func.isRequired,
  templates: PropTypes.instanceOf(Immutable.List).isRequired,
  thesauris: PropTypes.instanceOf(Immutable.List).isRequired,
  formState: PropTypes.instanceOf(Object).isRequired,
  state: PropTypes.instanceOf(Object).isRequired,
  entities: PropTypes.instanceOf(Object).isRequired,
  formKey: PropTypes.string.isRequired
};

SemanticSearchMultieditPanel.contextTypes = {
  confirm: PropTypes.func
};

export const mapStateToProps = (state, props) => ({
    template: commonTemplate(props),
    open: state.semanticSearch.editing,
});

function mapDispatchToProps(dispatch, props) {
  return bindActionCreators({
    loadForm: metadataActions.loadTemplate,
    resetForm: metadataActions.resetReduxForm,
    multipleUpdate: metadataActions.multipleUpdate,
  }, wrapDispatch(dispatch, props.storeKey));
}

export default connect(mapStateToProps, mapDispatchToProps)(SemanticSearchMultieditPanel);
