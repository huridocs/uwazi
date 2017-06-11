import PropTypes from 'prop-types';
import React, {Component} from 'react';

export default class RadioButtons extends Component {

  constructor(props) {
    super(props);
    this.state = {value: props.value};
  }

  change(value) {
    this.setState({value});
    this.props.onChange(value);
  }

  checked(value) {
    return value === this.state.value;
  }

  renderLabel(opt) {
    if (this.props.renderLabel) {
      return this.props.renderLabel(opt);
    }

    const optionsLabel = this.props.optionsLabel || 'label';
    return opt[optionsLabel];
  }

  render() {
    let {optionsValue, optionsLabel, prefix, options} = this.props;
    optionsValue = optionsValue || 'value';
    optionsLabel = optionsLabel || 'label';
    prefix = prefix || '';

    return (
        <div>
        {options.map((option) => {
          return <div className='radio' key={option[optionsValue]}>
                  <label htmlFor={prefix + option[optionsValue]}>
                    <input
                      type='radio'
                      value={option[optionsValue]}
                      id={prefix + option[optionsValue]}
                      onChange={this.change.bind(this, option[optionsValue])}
                      checked={this.checked(option[optionsValue])}
                    />
                    <span className="multiselectItem-name">
                      {this.renderLabel(option)}
                    </span>
                  </label>
                </div>;
        })}
      </div>
    );
  }

}

RadioButtons.propTypes = {
  onChange: PropTypes.func,
  label: PropTypes.string,
  options: PropTypes.array,
  value: PropTypes.string,
  placeholder: PropTypes.string,
  optionsValue: PropTypes.string,
  optionsLabel: PropTypes.string,
  prefix: PropTypes.string,
  renderLabel: PropTypes.func
};
