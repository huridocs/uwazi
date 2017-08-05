import PropTypes from 'prop-types';
import React, {Component} from 'react';
import {t} from 'app/I18N';

export default class Switcher extends Component {

  onChange(e) {
    this.props.onChange(e.target.checked);
  }

  render() {
    return (
      <div className="switcher-wrapper">
        <span className={this.props.value ? 'is-active' : ''}>{t('System', 'Filters AND operator')}</span>
        <input
          id={this.props.prefix + 'switcher'}
          type='checkbox'
          checked={this.props.value}
          onChange={this.onChange.bind(this)}
        />
        <label htmlFor={this.props.prefix + 'switcher'} className="switcher"></label>
        <span className={this.props.value ? '' : 'is-active'}>{t('System', 'Filters OR operator')}</span>
    </div>
    );
  }

}

Switcher.propTypes = {
  onChange: PropTypes.func,
  value: PropTypes.bool,
  prefix: PropTypes.string
};
