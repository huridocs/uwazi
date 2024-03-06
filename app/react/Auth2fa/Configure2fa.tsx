import React, { Component } from 'react';
import { Dispatch, bindActionCreators, ActionCreatorsMapObject } from 'redux';
import { connect } from 'react-redux';
import { Control } from 'react-redux-form';
import loadable from '@loadable/component';

import { Icon } from 'UI';
import { RequestParams } from 'app/utils/RequestParams';
import { t, I18NLink, Translate } from 'app/I18N';
import { SettingsHeader } from 'app/Settings/components/SettingsHeader';
import { LocalForm } from 'app/Forms/Form';
import { enable2fa as enable2faAction, enable2faType } from './actions/actions';
import Auth2faAPI from './Auth2faAPI';

const QRCodeSVG = loadable(
  async () => import(/* webpackChunkName: "qrcode.react" */ 'qrcode.react'),
  {
    resolveComponent: components => components.QRCodeSVG,
  }
);

type Configure2faProps = {
  userUsing2fa: boolean;
  enable2fa: () => enable2faType | void;
};

type State = {
  conflict: boolean;
  otpauth: string;
  secret: string;
};

const goToAccount = (type: string, label: string) => (
  <I18NLink to="/settings/account" className={`btn btn-${type}`}>
    {t('System', label)}
  </I18NLink>
);

class Configure2fa extends Component<Configure2faProps, State> {
  static defaultProps: Configure2faProps;

  constructor(props: Configure2faProps) {
    super(props);
    this.state = {
      conflict: false,
      otpauth: '',
      secret: '',
    };
    this.setSecret = this.setSecret.bind(this);
    this.enable2fa = this.enable2fa.bind(this);
  }

  async componentDidMount() {
    const { userUsing2fa } = this.props;
    if (!userUsing2fa) {
      await this.setSecret();
    }
  }

  async setSecret() {
    const { otpauth, secret } = await Auth2faAPI.setSecret(new RequestParams());
    this.setState({ otpauth, secret });
  }

  async enable2fa(values: { token: string }) {
    const { token } = values;
    const { enable2fa } = this.props;
    try {
      const { success } = await Auth2faAPI.enable(new RequestParams({ token }));
      if (success) {
        enable2fa();
      }
    } catch (err) {
      if (err.status === 409) {
        this.setState({ conflict: true });
      }
    }
  }

  render() {
    const { otpauth, secret, conflict } = this.state;
    const { userUsing2fa } = this.props;
    return (
      <div className="settings-content">
        <div className="configure2fa-settings">
          <div className="panel panel-default">
            <SettingsHeader backUrl="settings/account/">
              <Translate>Two-step verification</Translate>
            </SettingsHeader>

            <div className="panel-body">
              {userUsing2fa && (
                <>
                  <div className="alert alert-success">
                    <Icon icon="check" />
                    <div className="force-ltr">
                      <Translate translationKey="Two-step verification successfully">
                        {`Congratulations!
You have successfully configured two-step verification.`}
                      </Translate>
                    </div>
                  </div>
                  {goToAccount('success', 'OK')}
                </>
              )}
              {!userUsing2fa && (
                <div>
                  <p>
                    <Translate>Activate this feature for enhanced account security</Translate>
                  </p>
                  <h3>
                    <Translate>Using Google Authenticator</Translate>
                  </h3>
                  <LocalForm model="2fa" onSubmit={this.enable2fa}>
                    <ol>
                      <li>
                        <Translate>
                          Install the Google Authenticator app on your mobile device
                        </Translate>
                      </li>
                      <li>
                        <Translate translationKey="2fa add account tip">
                          Open the app and select &quot;Add Account&quot; (usually a plus symbol)
                        </Translate>
                      </li>
                      <li>
                        <Translate translationKey="2fa QA scan tip">
                          Scan the following QR code selecting the &quot;scan barcode&quot; option:
                        </Translate>
                        <div className="qr-code">
                          {otpauth && (
                            <QRCodeSVG
                              value={otpauth}
                              level="Q"
                              includeMargin={false}
                              size={200}
                              bgColor="white"
                              fgColor="black"
                            />
                          )}
                        </div>
                        <Translate>Or enter this secret key into your Authenticator app</Translate>
                        <br />
                        <Translate translationKey="secret key recommendation">
                          (please keep this key secret and don&#39;t share it):
                        </Translate>
                        <div className="secret-key">
                          <span>{secret}</span>
                        </div>
                      </li>
                      <li>
                        <Translate>
                          Enter the 6-digit verification code generated by your Authenticator app:
                        </Translate>
                        <br />
                        <div className="row">
                          <div className={`col-8 col-md-4 col-lg-2 ${conflict ? 'has-error' : ''}`}>
                            <Control.text className="form-control" model=".token" id="token" />
                          </div>
                        </div>
                      </li>
                    </ol>
                    <p>
                      {goToAccount('default', 'Cancel')}
                      <button type="submit" className="btn btn-success">
                        <Translate>Confirm</Translate>
                      </button>
                    </p>
                  </LocalForm>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

Configure2fa.defaultProps = {
  userUsing2fa: false,
  enable2fa: () => {},
};

export const mapStateToProps = (state: any): { userUsing2fa: boolean } => ({
  userUsing2fa: state.user.toJS().using2fa,
});

export const mapDispatchToProps = (dispatch: Dispatch<enable2faType>) =>
  bindActionCreators<ActionCreatorsMapObject>({ enable2fa: enable2faAction }, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(Configure2fa);
