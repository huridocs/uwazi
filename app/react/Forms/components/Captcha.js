import React, { Component } from 'react';
import PropTypes from 'prop-types';
import api from '../../utils/api';

class Captcha extends Component {
  constructor(props) {
    super(props);
    this.onChange = this.onChange.bind(this);
    const { refresh, remote } = this.props;
    const url = remote ? 'remotecaptcha' : 'captcha';
    this.state = { captchaUrl: url };
    refresh(this.refresh.bind(this));
    this.state = { svg: '', id: '' };
  }

  componentDidMount() {
    this.refresh();
  }

  onChange(e) {
    const { onChange } = this.props;
    onChange({ captcha: e.target.value, id: this.state.id });
  }

  async refresh() {
    const { remote } = this.props;
    const url = remote ? 'remotecaptcha' : 'captcha';
    const response = await api.get(url);
    this.setState(response.json);
  }

  render() {
    const { value } = this.props;
    const { svg } = this.state;
    return (
      <div className="captcha">
        <div dangerouslySetInnerHTML={{ __html: svg }} />
        <input className="form-control" onChange={this.onChange} value={value.captcha} />
      </div>
    );
  }
}

Captcha.defaultProps = {
  value: { captcha: '', id: '' },
  refresh: () => {},
  remote: false,
};

Captcha.propTypes = {
  value: PropTypes.shape({ captcha: PropTypes.string, id: PropTypes.string }),
  onChange: PropTypes.func.isRequired,
  refresh: PropTypes.func,
  remote: PropTypes.bool,
};

export default Captcha;
