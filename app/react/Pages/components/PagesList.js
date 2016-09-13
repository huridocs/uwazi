import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {Link} from 'react-router';
import {bindActionCreators} from 'redux';

import {deletePage} from 'app/Pages/actions/pageActions';


export class PagesList extends Component {

  deletePage(page) {
    return this.context.confirm({
      accept: () => {
        this.props.deletePage({_id: page.get('_id')});
      },
      title: 'Confirm delete page: ' + page.get('title'),
      message: 'Are you sure you want to delete this page?'
    });
  }

  render() {
    const {pages} = this.props;

    return (
      <div className="panel panel-default">
        <div className="panel-heading">Pages</div>
        <ul className="list-group pages">
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
  pages: PropTypes.object,
  deletePage: PropTypes.func
};

PagesList.contextTypes = {
  confirm: PropTypes.func
};

export function mapStateToProps({pages}) {
  return {pages};
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({deletePage}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(PagesList);
