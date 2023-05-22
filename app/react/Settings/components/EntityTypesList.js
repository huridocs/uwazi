import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Link } from 'react-router-dom';
import { withContext } from 'app/componentWrappers';
import {
  deleteTemplate,
  checkTemplateCanBeDeleted,
  setAsDefault,
} from 'app/Templates/actions/templatesActions';
import { Translate } from 'app/I18N';
import { Icon } from 'UI';
import { notificationActions } from 'app/Notifications';
import { shouldDisplayTranslation } from '../utils/shouldDisplayTranslation';
import { SettingsHeader } from './SettingsHeader';
import Tip from '../../Layout/Tip';

class EntityTypesList extends Component {
  setAsDefaultButton(template) {
    return (
      <>
        {!template.synced && (
          <button
            type="button"
            onClick={this.props.setAsDefault.bind(null, template)}
            className="btn btn-success btn-xs"
          >
            <Translate>Set as default</Translate>
          </button>
        )}
      </>
    );
  }

  deleteTemplate(template) {
    return this.props
      .checkTemplateCanBeDeleted(template)
      .then(() => {
        this.props.mainContext.confirm({
          accept: () => {
            this.props.deleteTemplate(template);
          },
          title: (
            <>
              <Translate>Confirm deletion of template:</Translate>&nbsp;{template.name}
            </>
          ),
          messageKey: 'confirm delete template',
          message: `Are you sure you want to delete this entity type?
        This will delete the template and all relationship properties from other templates pointing to this one.`,
        });
      })
      .catch(() => {
        this.props.mainContext.confirm({
          accept: () => {},
          noCancel: true,
          title: (
            <>
              <Translate>Cannot delete template:</Translate>&nbsp;{template.name}
            </>
          ),
          message: 'This template has associated entities',
        });
      });
  }

  defaultTemplateMessage() {
    return (
      <span>
        <Translate>Default template</Translate>
        <Tip>
          <Translate>This template will be used as default for new entities.</Translate>
        </Tip>
      </span>
    );
  }

  syncedTemplateMessage() {
    return (
      <span>
        <Translate>Synced template</Translate>
        <Tip>
          <Translate translationKey="syncedTemplateListMessage">
            The source of this template is a sync. All editing options will be disabled.
          </Translate>
        </Tip>
      </span>
    );
  }

  deleteTemplateButton(template) {
    return (
      <>
        {!template.synced && (
          <button
            type="button"
            onClick={this.deleteTemplate.bind(this, template)}
            className="btn btn-danger btn-xs template-remove"
          >
            <Icon icon="trash-alt" />
            &nbsp;
            <Translate>Delete</Translate>
          </button>
        )}
      </>
    );
  }

  sortTemplates() {
    return this.props.templates.toJS().sort((a, b) => (a.name > b.name ? 1 : -1));
  }

  render() {
    return (
      <div className="settings-content">
        <div className="panel panel-default">
          <SettingsHeader>
            <Translate>Templates</Translate>
          </SettingsHeader>
          <ul className="list-group document-types">
            {this.sortTemplates().map((template, index) => (
              <li key={index} className="list-group-item">
                <span>
                  <Link to={`/settings/templates/edit/${template._id}`}>{template.name}</Link>
                  {shouldDisplayTranslation(
                    template.name,
                    template._id,
                    this.props.locale,
                    this.props.languages
                  ) && (
                    <>
                      &nbsp;&#40;<Translate context={template._id}>{template.name}</Translate>&#41;
                    </>
                  )}
                </span>
                {template.default ? this.defaultTemplateMessage() : ''}
                {template.synced ? this.syncedTemplateMessage() : ''}
                <div className="list-group-item-actions">
                  {!template.default ? this.setAsDefaultButton(template) : ''}
                  <Link
                    to={`/settings/templates/edit/${template._id}`}
                    className="btn btn-default btn-xs"
                  >
                    <Icon icon="pencil-alt" />
                    &nbsp;
                    <Translate>Edit</Translate>
                  </Link>
                  {!template.default ? this.deleteTemplateButton(template) : ''}
                </div>
              </li>
            ))}
          </ul>
          <div className="settings-footer">
            <Link to="/settings/templates/new" className="btn btn-default">
              <Icon icon="plus" />
              <span className="btn-label">
                <Translate>Add template</Translate>
              </span>
            </Link>
          </div>
        </div>
      </div>
    );
  }
}

EntityTypesList.propTypes = {
  templates: PropTypes.object.isRequired,
  locale: PropTypes.string.isRequired,
  languages: PropTypes.object.isRequired,
  deleteTemplate: PropTypes.func.isRequired,
  setAsDefault: PropTypes.func.isRequired,
  notify: PropTypes.func.isRequired,
  checkTemplateCanBeDeleted: PropTypes.func.isRequired,
  mainContext: PropTypes.shape({
    confirm: PropTypes.func,
  }).isRequired,
};

function mapStateToProps(state) {
  return {
    templates: state.templates,
    locale: state.locale,
    languages: state.settings.collection.get('languages'),
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    { ...notificationActions, deleteTemplate, checkTemplateCanBeDeleted, setAsDefault },
    dispatch
  );
}

export { EntityTypesList };
export default connect(mapStateToProps, mapDispatchToProps)(withContext(EntityTypesList));
