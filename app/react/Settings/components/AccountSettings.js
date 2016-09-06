import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {actions} from 'app/BasicReducer';

import UsersAPI from 'app/Users/UsersAPI';
import {notify} from 'app/Notifications/actions/notificationsActions';


export class AccountSettings extends Component {

  constructor(props, context) {
    super(props, context);
    this.state = {email: props.user.email, password: '', repeatPassword: ''};
  }

  componentWillReceiveProps(props) {
    this.setState({email: props.user.email});
  }

  emailChange(e) {
    this.setState({email: e.target.value});
  }

  passwordChange(e) {
    this.setState({password: e.target.value});
    this.setState({passwordError: false});
  }

  repeatPasswordChange(e) {
    this.setState({repeatPassword: e.target.value});
    this.setState({passwordError: false});
  }

  updateEmail(e) {
    e.preventDefault();
    let userData = Object.assign({}, this.props.user, {email: this.state.email});
    UsersAPI.save(userData)
    .then((result) => {
      this.props.notify('Email updated', 'success');
      this.props.setUser(Object.assign(userData, {_rev: result.rev}));
    });
  }

  updatePassword(e) {
    e.preventDefault();
    let passwordsDontMatch = this.state.password !== this.state.repeatPassword;
    let emptyPassword = this.state.password.trim() === '';
    if (emptyPassword || passwordsDontMatch) {
      this.setState({passwordError: true});
      return;
    }

    UsersAPI.save(Object.assign({}, this.props.user, {password: this.state.password}))
    .then((result) => {
      this.props.notify('Password updated', 'success');
      this.props.setUser(Object.assign(this.props.user, {_rev: result.rev}));
    });
    this.setState({password: '', repeatPassword: ''});
  }

  render() {
    return <div className="account-settings">
      {/** /}
              <div className="panel panel-default">
                <div className="panel-heading">Email address</div>
                <div className="panel-body">
                  <form onSubmit={this.updateEmail.bind(this)}>
                    <div className="form-group">
                      <label htmlFor="collection_name">Email</label>
                      <input type="email" onChange={this.emailChange.bind(this)} value={this.state.email} className="form-control"/>
                    </div>
                    <button type="submit" className="btn btn-success">Update</button>
                  </form>
                </div>
              </div>
              <div className="panel panel-default">
                <div className="panel-heading">Change password</div>
                <div className="panel-body">
                  <form onSubmit={this.updatePassword.bind(this)}>
                    <div className={'form-group' + (this.state.passwordError ? ' has-error' : '')}>
                      <label htmlFor="password">New password</label>
                      <input
                        type="password"
                        onChange={this.passwordChange.bind(this)}
                        value={this.state.password}
                        id="password"
                        className="form-control"/>
                    </div>
                    <div className={'form-group' + (this.state.passwordError ? ' has-error' : '')}>
                      <label htmlFor="repeatPassword">Confirm new password</label>
                      <input
                        type="password"
                        onChange={this.repeatPasswordChange.bind(this)}
                        value={this.state.repeatPassword}
                        id="repeatPassword"
                        className="form-control"/>
                    </div>
                    {(() => {
                      if (this.state.passwordError) {
                        return <div className="validation-error validation-error-centered">
                                  <i className="fa fa-exclamation-triangle"></i>
                                  &nbsp;
                                  Both fields are required and should match.
                              </div>;
                      }
                    })()}
                    <button type="submit" className="btn btn-success">Update</button>
                  </form>
                </div>
              </div>
              <div className="panel panel-default">
                <div className="panel-heading">Close admin session</div>
                <div className="panel-body">
                  <a href='/logout' className="btn btn-danger"><i className="fa fa-sign-out"></i><span> Logout</span></a>
                </div>
              </div>
              {/**/}

              <div className="panel panel-default">
                <div className="metadataTemplate-heading panel-heading">
                  <a className="btn btn-default" href="/settings/documents">
                    <i className="fa fa-arrow-left"></i> Back
                  </a>&nbsp;
                  <div className="template-name form-group">
                    <input placeholder="Template name" className="form-control" name="template.data.name" />
                  </div>
                  &nbsp;
                  <button type="submit" className="btn btn-success save-template">
                    <i className="fa fa-save"></i> Save
                  </button>
                </div>
                <div className="panel-body">
                  <div className="alert alert-info">
                    <i className="fa fa-terminal"></i> http...
                  </div>
                  <div className="markdownEditor">
                    <div className="tab-nav">
                      <div className="tab-link">Edit</div>
                      <div className="tab-link tab-link-active">Preview</div>
                      <div className="tab-link">Help</div>
                    </div>
                    <div className="tab-content tab-content-visible">
                      {/**/}
                      <textarea className="form-control" rows="18"></textarea>
                      {/** /}
                      <div className="markdownViewer">
                        <h1>a</h1>
                        <h2>b</h2>
                        <h3>c</h3>
                        <h4>d</h4>
                        <h5>e</h5>
                        <h6>f</h6>
                        <p>You can use one <code>#</code> all the way up to <code>######</code> six for different heading sizes.</p>
                        <p>If you'd like to quote someone, use the &gt; character before the line:</p>
                        <blockquote>
                        <p>Coffee. The finest organic suspension ever devised... I beat the Borg with it.</p>
                        <ul>
                        <li>Captain Janeway</li>
                        </ul>
                        </blockquote>
                        <p><a href="http://google.com">Uwazi!</a></p>
                        <p><em>This text will be italic</em>
                        <em>This will also be italic</em></p>
                        <p><strong>This text will be bold</strong>
                        <strong>This will also be bold</strong></p>
                        <p><em>You <strong>can</strong> combine them</em></p>
                        <p>Sometimes you want numbered lists:</p>
                        <ol>
                        <li>One</li>
                        <li>Two</li>
                        <li>Three</li>
                        </ol>
                        <p>Sometimes you want bullet points:</p>
                        <ul>
                        <li>Start a line with a star</li>
                        <li>Profit!</li>
                        </ul>
                        <p>Alternatively,</p>
                        <ul>
                        <li>Dashes work just as well</li>
                        <li>And if you have sub points, put two spaces before the dash or star:<ul>
                        <li>Like this</li>
                        <li>And this</li>
                        </ul>
                        </li>
                        </ul>
                        <p><img src="https://octodex.github.com/images/yaktocat.png" alt="Image of Yaktocat" /></p>
                      </div>
                      {/**/}
                    </div>
                  </div>
                </div>
              </div>

            </div>;
  }
}

AccountSettings.propTypes = {
  user: PropTypes.object,
  notify: PropTypes.func,
  setUser: PropTypes.func
};

export function mapStateToProps(state) {
  return {user: state.user.toJS()};
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({setUser: actions.set.bind(null, 'auth/user'), notify}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(AccountSettings);
