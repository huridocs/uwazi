import PropTypes from 'prop-types';
import React, { Component } from 'react';
import Numeric from './Numeric';
import {t} from 'app/I18N';

export default class NumericRange extends Component {

  constructor(props) {
    super(props);
    const value = props.value || {};
    this.state = {from: value.from, to: value.to};
  }

  onChange(prop, value) {
    let state = Object.assign({}, this.state);
    state[prop] = value;
    this.setState(state);
    this.props.onChange(state);
  }

  render() {
    return (
        <div>
          <div className="Numeric__From">
            <span>{t('System', 'From', 'From')}:</span>
            <Numeric value={this.state.from} onChange={(val) => this.onChange('from', val)}/>
          </div>
          <div className="Numeric__To">
            <span>&nbsp;{t('System', 'To', 'To')}:</span>
            <Numeric value={this.state.to} onChange={(val) => this.onChange('to', val)}/>
          </div>
        </div>
    );
  }

}

NumericRange.propTypes = {
  model: PropTypes.string,
  value: PropTypes.object,
  onChange: PropTypes.func
};
