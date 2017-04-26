import PropTypes from 'prop-types';
import React, {Component} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {Link} from 'react-router';
import {deleteTemplate, checkTemplateCanBeDeleted} from 'app/Templates/actions/templatesActions';
import {t} from 'app/I18N';

import {notify} from 'app/Notifications/actions/notificationsActions';

export class EntityTypesList extends Component {

  deleteTemplate(template) {
    return this.props.checkTemplateCanBeDeleted(template)
    .then(() => {
      this.context.confirm({
        accept: () => {
          this.props.deleteTemplate(template);
        },
        title: 'Confirm delete document type: ' + template.name,
        message: 'Are you sure you want to delete this document type?'
      });
    })
    .catch(() => {
      this.context.confirm({
        accept: () => {},
        noCancel: true,
        title: 'Cannot delete document type: ' + template.name,
        message: 'This document type has associated documnets and cannot be deleted.'
      });
    });
  }

  render() {
    return <div className="panel panel-default">
      <div className="panel-heading">{t('System', 'Entities')}</div>
      <ul className="list-group document-types">
        {this.props.templates.toJS().map((template, index) => {
          if (!template.isEntity) {
            return false;
          }
          return <li key={index} className="list-group-item">
              <Link to={'/settings/entities/edit/' + template._id}>{template.name}</Link>
              <div className="list-group-item-actions">
                <Link to={'/settings/entities/edit/' + template._id} className="btn btn-default btn-xs">
                  <i className="fa fa-pencil"></i>&nbsp;
                  <span>{t('System', 'Edit')}</span>
                </Link>
                <a onClick={this.deleteTemplate.bind(this, template)} className="btn btn-danger btn-xs template-remove">
                  <i className="fa fa-trash"></i>&nbsp;
                  <span>{t('System', 'Delete')}</span>
                </a>
              </div>
            </li>;
        })}
      </ul>
      <div className="panel-body">
        <Link to="/settings/entities/new" className="btn btn-success">
          <i className="fa fa-plus"></i>
          &nbsp;
          <span>{t('System', 'Add entity')}</span>
        </Link>
      </div>
    </div>;
  }
}

EntityTypesList.propTypes = {
  templates: PropTypes.object,
  deleteTemplate: PropTypes.func,
  notify: PropTypes.func,
  checkTemplateCanBeDeleted: PropTypes.func
};

EntityTypesList.contextTypes = {
  confirm: PropTypes.func
};

export function mapStateToProps(state) {
  return {templates: state.templates};
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({notify, deleteTemplate, checkTemplateCanBeDeleted}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(EntityTypesList);
