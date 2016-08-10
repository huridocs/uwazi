import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {Link} from 'react-router';
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
      <div className="panel-heading">Connections</div>
      <ul className="list-group relation-types">
        {this.props.relationTypes.toJS().map((relationType, index) => {
          return <li key={index} className="list-group-item">
              <Link to={'/settings/connections/edit/' + relationType._id}>{relationType.name}</Link>
              <div className="list-group-item-actions">
                <Link to={'/settings/connections/edit/' + relationType._id} className="btn btn-default btn-xs">
                  <i className="fa fa-pencil"></i>
                  <span>Edit</span>
                </Link>
                <button onClick={this.deleteRelationType.bind(this, relationType)} className="btn btn-danger btn-xs template-remove">
                  <i className="fa fa-trash"></i>
                  <span>Delete</span>
                </button>
              </div>
            </li>;
        })}
      </ul>
      <div className="panel-body">
        <Link to="/settings/connections/new" className="btn btn-success">
          <i className="fa fa-plus"></i>
          <span>Add connection</span>
        </Link>
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
