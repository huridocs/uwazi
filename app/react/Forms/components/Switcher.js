import PropTypes from 'prop-types';
import React, {Component} from 'react';
import {t} from 'app/I18N';

export default class Switcher extends Component {

  constructor(props) {
    super(props);
    this.state = {value: props.value};
  }

  onChange(e) {
    const value = e.target.checked;
    this.setState({value: value});
    this.props.onChange(e.target.checked);
  }

  render() {
    return (
      <div className="switcher-wrapper">
        <span className={this.state.value ? 'is-active' : ''}>{t('System', 'Filters AND operator')}</span>
        <input
          id={this.props.prefix + 'switcher'}
          type='checkbox'
          value={this.state.value}
          onChange={this.onChange.bind(this)}
        />
        <label htmlFor={this.props.prefix + 'switcher'} className="switcher"></label>
        <span className={this.state.value ? '' : 'is-active'}>{t('System', 'Filters OR operator')}</span>
    </div>
    );
  }

}

Switcher.propTypes = {
  onChange: PropTypes.func,
  value: PropTypes.bool,
  prefix: PropTypes.string
};
