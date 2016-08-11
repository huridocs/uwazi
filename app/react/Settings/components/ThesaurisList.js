import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {Link} from 'react-router';
import {deleteThesauri, checkThesauriCanBeDeleted} from 'app/Thesauris/actions/thesaurisActions';

import {notify} from 'app/Notifications/actions/notificationsActions';

export class ThesaurisList extends Component {

  deleteThesauri(thesauri) {
    return this.props.checkThesauriCanBeDeleted(thesauri)
    .then(() => {
      this.context.confirm({
        accept: () => {
          this.props.deleteThesauri(thesauri);
        },
        title: 'Confirm delete thesauri: ' + thesauri.name,
        message: 'Are you sure you want to delete this thesauri?'
      });
    })
    .catch(() => {
      this.context.confirm({
        accept: () => {},
        noCancel: true,
        title: 'Cannot delete thesauri: ' + thesauri.name,
        message: 'This thesauri is being used in document types and cannot be deleted.'
      });
    });
  }

  render() {
    return <div className="panel panel-default">
      <div className="panel-heading">Thesauris</div>
      <ul className="list-group relation-types">
        {this.props.thesauris.toJS().map((thesauri, index) => {
          return <li key={index} className="list-group-item">
              <Link to={'/settings/thesauris/edit/' + thesauri._id}>{thesauri.name}</Link>
              <div className="list-group-item-actions">
                <Link to={'/settings/thesauris/edit/' + thesauri._id} className="btn btn-default btn-xs">
                  <i className="fa fa-pencil"></i>
                  <span>Edit</span>
                </Link>
                <button onClick={this.deleteThesauri.bind(this, thesauri)} className="btn btn-danger btn-xs template-remove">
                  <i className="fa fa-trash"></i>
                  <span>Delete</span>
                </button>
              </div>
            </li>;
        })}
      </ul>
      <div className="panel-body">
        <Link to="/settings/thesauris/new" className="btn btn-success">
          <i className="fa fa-plus"></i>
          &nbsp;
          <span>Add thesauri</span>
        </Link>
      </div>
    </div>;
  }
}

ThesaurisList.propTypes = {
  thesauris: PropTypes.object,
  deleteThesauri: PropTypes.func,
  notify: PropTypes.func,
  checkThesauriCanBeDeleted: PropTypes.func
};

ThesaurisList.contextTypes = {
  confirm: PropTypes.func
};

export function mapStateToProps(state) {
  return {thesauris: state.thesauris};
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({notify, deleteThesauri, checkThesauriCanBeDeleted}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(ThesaurisList);
