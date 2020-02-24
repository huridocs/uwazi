import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Link } from 'react-router';
import {
  deleteTemplate,
  checkTemplateCanBeDeleted,
  setAsDefault,
} from 'app/Templates/actions/templatesActions';
import { t } from 'app/I18N';
import { Icon } from 'UI';
import { notificationActions } from 'app/Notifications';
import Tip from '../../Layout/Tip';

export class EntityTypesList extends Component {
  setAsDefaultButton(template) {
    return (
      <button
        onClick={this.props.setAsDefault.bind(null, template)}
        className="btn btn-success btn-xs"
      >
        <span>{t('System', 'Set as default')}</span>
      </button>
    );
  }

  deleteTemplate(template) {
    return this.props
      .checkTemplateCanBeDeleted(template)
      .then(() => {
        this.context.confirm({
          accept: () => {
            this.props.deleteTemplate(template);
          },
          title: `Confirm delete document type: ${template.name}`,
          message: `Are you sure you want to delete this document type?
        This will delete the template and all relationship properties from other templates pointing to this one.`,
        });
      })
      .catch(() => {
        this.context.confirm({
          accept: () => {},
          noCancel: true,
          title: `Can not delete document type: ${template.name}`,
          message: 'This document type has associated documents',
        });
      });
  }

  defaultTemplateMessage() {
    return (
      <span>
        {t('System', 'Default template')}
        <Tip>This template will be used as default for new entities.</Tip>
      </span>
    );
  }

  deleteTemplateButton(template) {
    return (
      <button
        onClick={this.deleteTemplate.bind(this, template)}
        className="btn btn-danger btn-xs template-remove"
      >
        <Icon icon="trash-alt" />
        &nbsp;
        <span>{t('System', 'Delete')}</span>
      </button>
    );
  }

  render() {
    return (
      <div className="panel panel-default">
        <div className="panel-heading">{t('System', 'Templates')}</div>
        <ul className="list-group document-types">
          {this.props.templates.toJS().map((template, index) => (
            <li key={index} className="list-group-item">
              <Link to={`/settings/templates/edit/${template._id}`}>{template.name}</Link>
              {template.default ? this.defaultTemplateMessage() : ''}
              <div className="list-group-item-actions">
                {!template.default ? this.setAsDefaultButton(template) : ''}
                <Link
                  to={`/settings/templates/edit/${template._id}`}
                  className="btn btn-default btn-xs"
                >
                  <Icon icon="pencil-alt" />
                  &nbsp;
                  <span>{t('System', 'Edit')}</span>
                </Link>
                {!template.default ? this.deleteTemplateButton(template) : ''}
              </div>
            </li>
          ))}
        </ul>
        <div className="settings-footer">
          <Link to="/settings/templates/new" className="btn btn-success">
            <Icon icon="plus" />
            <span className="btn-label">{t('System', 'Add template')}</span>
          </Link>
        </div>
      </div>
    );
  }
}

EntityTypesList.propTypes = {
  templates: PropTypes.object.isRequired,
  deleteTemplate: PropTypes.func.isRequired,
  setAsDefault: PropTypes.func.isRequired,
  notify: PropTypes.func.isRequired,
  checkTemplateCanBeDeleted: PropTypes.func.isRequired,
};

EntityTypesList.contextTypes = {
  confirm: PropTypes.func,
};

export function mapStateToProps(state) {
  return { templates: state.templates };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    { ...notificationActions, deleteTemplate, checkTemplateCanBeDeleted, setAsDefault },
    dispatch
  );
}

export default connect(mapStateToProps, mapDispatchToProps)(EntityTypesList);
