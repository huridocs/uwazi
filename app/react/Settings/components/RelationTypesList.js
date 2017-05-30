import PropTypes from 'prop-types';
import React, {Component} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {I18NLink, t} from 'app/I18N';
import {deleteRelationType, checkRelationTypeCanBeDeleted} from 'app/RelationTypes/actions/relationTypesActions';

import {notify} from 'app/Notifications/actions/notificationsActions';

export class RelationTypesList extends Component {

  deleteRelationType(relationType) {
    return this.props.checkRelationTypeCanBeDeleted(relationType)
    .then(() => {
      this.context.confirm({
        accept: () => {
          this.props.deleteRelationType(relationType);
        },
        title: 'Confirm delete connection type: ' + relationType.name,
        message: 'Are you sure you want to delete this connection type?'
      });
    })
    .catch(() => {
      this.context.confirm({
        accept: () => {},
        noCancel: true,
        title: 'Cannot delete connection type: ' + relationType.name,
        message: 'This connection type is being used and cannot be deleted.'
      });
    });
  }

  render() {
    return <div className="panel panel-default">
      <div className="panel-heading">{t('System', 'Connections')}</div>
      <ul className="list-group relation-types">
        {this.props.relationTypes.toJS().map((relationType, index) => {
          return <li key={index} className="list-group-item">
              <I18NLink to={'/settings/connections/edit/' + relationType._id}>{relationType.name}</I18NLink>
              <div className="list-group-item-actions">
                <I18NLink to={'/settings/connections/edit/' + relationType._id} className="btn btn-default btn-xs">
                  <i className="fa fa-pencil"></i>&nbsp;
                  <span>{t('System', 'Edit')}</span>
                </I18NLink>
                <a onClick={this.deleteRelationType.bind(this, relationType)} className="btn btn-danger btn-xs template-remove">
                  <i className="fa fa-trash"></i>&nbsp;
                  <span>{t('System', 'Delete')}</span>
                </a>
              </div>
            </li>;
        })}
      </ul>
      <div className="panel-body">
        <I18NLink to="/settings/connections/new" className="btn btn-primary">
          <i className="fa fa-plus"></i>
          &nbsp;
          <span>{t('System', 'Add connection')}</span>
        </I18NLink>
      </div>
    </div>;
  }
}

RelationTypesList.propTypes = {
  relationTypes: PropTypes.object,
  deleteRelationType: PropTypes.func,
  notify: PropTypes.func,
  checkRelationTypeCanBeDeleted: PropTypes.func
};

RelationTypesList.contextTypes = {
  confirm: PropTypes.func
};

export function mapStateToProps(state) {
  return {relationTypes: state.relationTypes};
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({notify, deleteRelationType, checkRelationTypeCanBeDeleted}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(RelationTypesList);
