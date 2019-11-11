/** @format */
// TEST!!!

import React, { Component } from 'react';
import { connect } from 'react-redux';
// import { bindActionCreators } from 'redux';
// import QRCode from 'qrcode.react';

import { RequestParams } from 'app/utils/RequestParams';

import Auth2faAPI from './Auth2faAPI';

type Configure2faProps = {
  user: { using2fa: boolean };
};

type State = {
  using2fa: boolean;
  otpauth: string;
};

class Configure2fa extends Component<Configure2faProps, State> {
  static defaultProps: Configure2faProps;

  constructor(props: Configure2faProps) {
    super(props);
    this.state = {
      using2fa: props.user.using2fa || false,
      otpauth: '',
    };
    this.getSecret = this.getSecret.bind(this);
  }

  async getSecret() {
    const { otpauth } = await Auth2faAPI.getSecret(new RequestParams());
    this.setState({ otpauth });
  }

  render() {
    const { using2fa, otpauth } = this.state;
    return (
      <div>
        <p>Using: {using2fa}</p>
        <p>OtpAuth: {otpauth}</p>
        <p>Configure 2fa</p>
      </div>
    );
  }
}

Configure2fa.defaultProps = {
  user: { using2fa: false },
};

export function mapStateToProps(state: any) {
  return { user: state.user.toJS() };
}

// function mapDispatchToProps(dispatch) {
//   return bindActionCreators(
//     { setUser: actions.set.bind(null, 'auth/user'), notify: notifyAction },
//     dispatch
//   );
// }

export default connect(mapStateToProps)(Configure2fa);
