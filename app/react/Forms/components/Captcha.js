import React, { Component } from 'react';
import PropTypes from 'prop-types';


class Captcha extends Component {
  constructor(props) {
    super(props);
    this.onChange = this.onChange.bind(this);
  }

  onChange(e) {
    const { onChange } = this.props;
    onChange(e.target.value);
  }

  render() {
    const { value } = this.props;
    return (
      <div className="captcha">
        <img src="/captcha" alt="captcha"/>
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
};

Captcha.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
};

export default Captcha;
