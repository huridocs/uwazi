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

      // <div className="account-settings">
      //   <div className="panel panel-default">
      //     <div className="metadataTemplate-heading panel-heading">
      //       <a className="btn btn-default" href="/settings/documents">
      //         <i className="fa fa-arrow-left"></i> Back
      //       </a>&nbsp;
      //       <div className="template-name form-group">
      //         <input placeholder="Template name" className="form-control" name="template.data.name" />
      //       </div>
      //       &nbsp;
      //       <button type="submit" className="btn btn-success save-template">
      //         <i className="fa fa-save"></i> Save
      //       </button>
      //     </div>
      //     <div className="panel-body">
      //       <div className="alert alert-info">
      //         <i className="fa fa-terminal"></i> http...
      //       </div>
      //       <div className="markdownEditor">
      //         <div className="tab-nav">
      //           <div className="tab-link">Edit</div>
      //           <div className="tab-link tab-link-active">Preview</div>
      //           <div className="tab-link">Help</div>
      //         </div>
      //         <div className="tab-content tab-content-visible">

      //           <textarea className="form-control" rows="18"></textarea>

      //           <div className="markdownViewer">
      //           </div>

      //         </div>
      //       </div>
      //     </div>
      //   </div>

      // </div>

    );
  }
}

PagesList.propTypes = {
  pages: PropTypes.object
};

export function mapStateToProps(state) {
  return {pages: state.pages};
}

export default connect(mapStateToProps)(PagesList);
