import React, {PropTypes} from 'react';
import Helmet from 'react-helmet';
import {connect} from 'react-redux';

import RouteHandler from 'app/App/RouteHandler';
import SettingsNavigation from './components/SettingsNavigation';
import AccountSettings from './components/AccountSettings';
import CollectionSettings from './components/CollectionSettings';
import UsersAPI from './UsersAPI';
import {actions} from 'app/BasicReducer';

export class Settings extends RouteHandler {

  static requestState() {
    return UsersAPI.currentUser()
    .then((user) => {
      return {user};
    });
  }

  setReduxState(state) {
    this.context.store.dispatch(actions.set('auth/user', state.user));
  }

  render() {
    let section = this.props.section;
    var title = 'Document types'; var itemList = ['Decision', 'Ruling', 'Judgement'];
    // var title = 'Relation types'; var itemList = ['Against', 'Support', 'Similar'];
    // var title = 'Thesauris'; var itemList = ['Countries'];
    return (
        <div className="row admin-content">
          <Helmet title="Settings" />
          <div className="col-xs-12 col-sm-4">
            <SettingsNavigation/>

            <div className="panel panel-default">
              <div className="panel-heading">Metadata</div>
              <div className="list-group">
                <button className="list-group-item">Document types</button>
                <button className="list-group-item">Relation types</button>
                <button className="list-group-item">Thesauris</button>
              </div>
            </div>

          </div>
          <div className="col-xs-12 col-sm-8">
            {(()=>{
              if (section === 'account') {
                //return <AccountSettings/>;

                return (
                  <div className="panel panel-default">
                    <div className="panel-heading">{title}</div>
                    <ul className="list-group">
                      {itemList.map(function(name){
                          return (
                            <li className="list-group-item">
                              <a className="" href="#">{name}
                                <small>(7 items)</small>
                              </a>
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
                            </li>
                          )
                      })}
                    </ul>
                    <div className="panel-body">
                      <button className="btn btn-success">
                        <i className="fa fa-plus"></i>
                        <span>Add document type</span>
                      </button>
                    </div>
                  </div>
                )
              }
              if (section === 'collection') {
                return <CollectionSettings/>;
              }
            })()}
          </div>
        </div>
    );
  }
}

Settings.propTypes = {
  section: PropTypes.string
};

export function mapStateToProps(state) {
  return {section: state.users.section};
}

export default connect(mapStateToProps)(Settings);
