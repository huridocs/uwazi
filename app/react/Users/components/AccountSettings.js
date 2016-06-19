import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

export class AccountSettings extends Component {
  render() {
    return <div>
              <div className="panel panel-default">
                <div className="panel-heading">Email address</div>
                <div className="panel-body">
                  <form>
                    <div className="form-group">
                      <label htmlFor="collection_name">Email</label>
                      <input type="text" className="form-control"/>
                    </div>
                    <button type="submit" className="btn btn-success">Update</button>
                  </form>
                </div>
              </div>
              <div className="panel panel-default">
                <div className="panel-heading">Change password</div>
                <div className="panel-body">
                  <form>
                    <div className="form-group">
                      <label htmlFor="password">New password</label>
                      <input type="text" name="password" id="password" placeholder="New password" className="form-control"/>
                    </div>
                    <div className="form-group">
                      <label htmlFor="password">Confirm new password</label>
                      <input type="text" name="password" id="password" placeholder="New password" className="form-control"/>
                    </div>
                    <button type="submit" className="btn btn-success">Update</button>
                  </form>
                </div>
              </div>
              <div className="panel panel-default">
                <div className="panel-heading">Close admin session</div>
                <div className="panel-body">
                  <button className="btn btn-danger"><i className="fa fa-sign-out"></i><span> Logout</span></button>
                </div>
              </div>
            </div>;
  }
}

AccountSettings.propTypes = {
};


export default connect()(AccountSettings);
