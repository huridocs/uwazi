import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
// import {bindActionCreators} from 'redux';
// import {actions} from 'app/BasicReducer';
// import {notify} from 'app/Notifications/actions/notificationsActions';
import {Link} from 'react-router';

export class PagesList extends Component {

  deletePage(page) {
    console.log(page);
  }

  render() {
    const {pages} = this.props;

    return (
      <div className="panel panel-default">
        <div className="panel-heading">Pages</div>
        <ul className="list-group document-types">
          {pages.map((page, index) =>
            <li key={index} className="list-group-item">
              <Link to={'/settings/pages/edit/' + page.get('_id')}>{page.get('title')}</Link>
              <div className="list-group-item-actions">
                <Link to={'/settings/pages/edit/' + page.get('_id')} className="btn btn-default btn-xs">
                  <i className="fa fa-pencil"></i>
                  <span>Edit</span>
                </Link>
                <button onClick={this.deletePage.bind(this, page)} className="btn btn-danger btn-xs template-remove">
                  <i className="fa fa-trash"></i>
                  <span>Delete</span>
                </button>
              </div>
            </li>
          )}
        </ul>
        <div className="panel-body">
          <Link to="/settings/pages/new" className="btn btn-success">
            <i className="fa fa-plus"></i>
            &nbsp;
            <span>Add page</span>
          </Link>
        </div>
      </div>
    );
  }
}

PagesList.propTypes = {
  pages: PropTypes.object
};

export function mapStateToProps({pages}) {
  return {pages};
}

export default connect(mapStateToProps)(PagesList);
