import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import {actions} from 'app/BasicReducer';
import {notify} from 'app/Notifications/actions/notificationsActions';

export class DocumentTypesList extends Component {

  render() {
    return <div className="panel panel-default">
      <div className="panel-heading">Document Types</div>
      <ul className="list-group">
        {this.props.templates.toJS().map((template, index) => {
          return <li key={index} className="list-group-item">
              <a className="" href="#">{template.name}</a>
              <div className="list-group-item-actions">
                <a className="btn btn-default btn-xs" href="#">
                  <i className="fa fa-pencil"></i>
                  <span>Edit</span>
                </a>
                <a className="btn btn-danger btn-xs template-remove" href="#">
                  <i className="fa fa-trash"></i>
                  <span>Delete</span>
                </a>
              </div>
            </li>;
        })}
      </ul>
      <div className="panel-body">
        <button className="btn btn-success">
          <i className="fa fa-plus"></i>
          <span>Add document type</span>
        </button>
      </div>
    </div>;
  }
}

DocumentTypesList.propTypes = {
  templates: PropTypes.object
};

export function mapStateToProps(state) {
  return {templates: state.templates};
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({notify}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(DocumentTypesList);
