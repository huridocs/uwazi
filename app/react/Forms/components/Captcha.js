import React, { Component } from 'react';
import PropTypes from 'prop-types';


class Captcha extends Component {
  constructor(props) {
    super(props);
    this.onChange = this.onChange.bind(this);
    const { refresh } = this.props;
    this.state = { captchaUrl: '/captcha' };
    refresh(this.refresh.bind(this));
  }

  onChange(e) {
    const { onChange } = this.props;
    onChange(e.target.value);
  }

  refresh() {
    this.setState({ captchaUrl: `/captcha?v=${Math.random() * 1000}` });
  }

  render() {
    const { value } = this.props;
    const { captchaUrl } = this.state;
    return (
      <div className="captcha">
        <img src={captchaUrl} alt="captcha"/>
        <input
          className="form-control"
          onChange={this.onChange}
          value={value}
        />
      </div>
    );
  }
}

Captcha.defaultProps = {
  value: '',
  refresh: () => {},
};

Captcha.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  refresh: PropTypes.func,
};

export default Captcha;
