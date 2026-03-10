import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Icon } from 'app/UI';
import { Translate } from 'app/I18N';
import api from '../../utils/api';

class Captcha extends Component {
  constructor(props) {
    super(props);
    this.onChange = this.onChange.bind(this);
    const { refresh } = this.props;

    refresh(this.refresh.bind(this));
    this.state = { svg: '', id: '', remoteUnreachable: false };
  }

  componentDidMount() {
    this.refresh();
  }

  onChange(e) {
    const { onChange } = this.props;
    onChange({ text: e.target.value, id: this.state.id });
  }

  async refresh() {
    const { remote } = this.props;
    const url = remote ? 'remotecaptcha' : 'captcha';
    try {
      const response = await api.get(url);
      this.setState(response.json);
    } catch (ex) {
      if (remote) {
        this.setState({ remoteUnreachable: true });
      }
    }
  }

  render() {
    const { value } = this.props;
    const { svg, remoteUnreachable } = this.state;

    if (!remoteUnreachable) {
      return (
        <div className="captcha">
          <div dangerouslySetInnerHTML={{ __html: svg }} />
          <input className="form-control" onChange={this.onChange} value={value.text} />
        </div>
      );
    }
    return (
      <div className="alert-danger">
        <Icon icon="info-circle" />
        &nbsp;<Translate>Remote Server Unreachable</Translate>.
      </div>
    );
  }
}

Captcha.defaultProps = {
  value: { text: '', id: '' },
  refresh: () => {},
  remote: false,
};

Captcha.propTypes = {
  value: PropTypes.shape({ text: PropTypes.string, id: PropTypes.string }),
  onChange: PropTypes.func.isRequired,
  refresh: PropTypes.func,
  remote: PropTypes.bool,
};

export default Captcha;
