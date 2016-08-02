import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {Link} from 'react-router';
import {deleteTemplate} from 'app/Templates/actions/templatesActions';

import {notify} from 'app/Notifications/actions/notificationsActions';

export class DocumentTypesList extends Component {

  deleteTemplate(template) {
    this.context.confirm({
      accept: () => {
        this.props.deleteTemplate(template);
      },
      title: 'Confirm delete document type',
      message: 'Are you sure you want to delete this document type?'
    });
  }

  render() {
    return <div className="panel panel-default">
      <div className="panel-heading">Document Types</div>
      <ul className="list-group">
        {this.props.templates.toJS().map((template, index) => {
          return <li key={index} className="list-group-item">
              <a className="" href="#">{template.name}</a>
              <div className="list-group-item-actions">
                <Link to={'/templates/edit/' + template._id} className="btn btn-default btn-xs">
                  <i className="fa fa-pencil"></i>
                </Link>
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
  templates: PropTypes.object,
  deleteTemplate: PropTypes.func,
  notify: PropTypes.func
};

DocumentTypesList.contextTypes = {
  confirm: PropTypes.func
};

export function mapStateToProps(state) {
  return {templates: state.templates};
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({notify, deleteTemplate}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(DocumentTypesList);
