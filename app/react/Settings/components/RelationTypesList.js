import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { I18NLink, t, Translate } from 'app/I18N';
import {
  deleteRelationType,
  checkRelationTypeCanBeDeleted,
} from 'app/RelationTypes/actions/relationTypesActions';
import relationTypesAPI from 'app/RelationTypes/RelationTypesAPI';
import RouteHandler from 'app/App/RouteHandler';
import { Icon } from 'UI';
import { actions } from 'app/BasicReducer';
import { notify } from 'app/Notifications/actions/notificationsActions';

class RelationTypesList extends RouteHandler {
  static async requestState(requestParams) {
    const relationTypes = await relationTypesAPI.get(requestParams.onlyHeaders());
    return [actions.set('relationTypes', relationTypes)];
  }

  deleteRelationType(relationType) {
    return this.props
      .checkRelationTypeCanBeDeleted(relationType)
      .then(() => {
        this.context.confirm({
          accept: () => {
            this.props.deleteRelationType(relationType);
          },
          title: (
            <>
              <Translate>Confirm delete connection type:</Translate>&nbsp;{relationType.name}
            </>
          ),
          message: 'Are you sure you want to delete this connection type?',
        });
      })
      .catch(() => {
        this.context.confirm({
          accept: () => {},
          noCancel: true,
          title: (
            <>
              <Translate>Cannot delete connection type:</Translate>&nbsp;{relationType.name}
            </>
          ),
          message: 'This connection type is being used and cannot be deleted.',
        });
      });
  }

  render() {
    return (
      <div className="settings-content">
        <div className="panel panel-default">
          <div className="panel-heading">{t('System', 'Relationship types')}</div>
          <ul className="list-group relation-types">
            {this.props.relationTypes.toJS().map((relationType, index) => (
              <li key={index} className="list-group-item">
                <I18NLink to={`/settings/connections/edit/${relationType._id}`}>
                  {relationType.name}
                </I18NLink>
                <div className="list-group-item-actions">
                  <I18NLink
                    to={`/settings/connections/edit/${relationType._id}`}
                    className="btn btn-default btn-xs"
                  >
                    <Icon icon="pencil-alt" />
                    &nbsp;
                    <span>{t('System', 'Edit')}</span>
                  </I18NLink>
                  <a
                    onClick={this.deleteRelationType.bind(this, relationType)}
                    className="btn btn-danger btn-xs template-remove"
                  >
                    <Icon icon="trash-alt" />
                    &nbsp;
                    <span>{t('System', 'Delete')}</span>
                  </a>
                </div>
              </li>
            ))}
          </ul>
          <div className="settings-footer">
            <I18NLink to="/settings/connections/new" className="btn btn-default">
              <Icon icon="plus" />
              <span className="btn-label">{t('System', 'Add connection')}</span>
            </I18NLink>
          </div>
        </div>
      </div>
    );
  }
}

RelationTypesList.propTypes = {
  relationTypes: PropTypes.object,
  deleteRelationType: PropTypes.func,
  notify: PropTypes.func,
  checkRelationTypeCanBeDeleted: PropTypes.func,
};

RelationTypesList.contextTypes = {
  confirm: PropTypes.func,
  store: PropTypes.object,
};

function mapStateToProps(state) {
  return { relationTypes: state.relationTypes };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    { notify, deleteRelationType, checkRelationTypeCanBeDeleted },
    dispatch
  );
}

export { RelationTypesList, mapStateToProps };

export default connect(mapStateToProps, mapDispatchToProps)(RelationTypesList);
