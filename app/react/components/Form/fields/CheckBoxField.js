import React, {Component, PropTypes} from 'react';

class CheckBoxField extends Component {

  constructor(props) {
    super(props);
    this.state = {value: props.value};
  }

  handleChange() {
    this.setState({value: this.value()});
  }

  value() {
    return this.field.checked;
  }

  render() {
    return (

      <div className="form-group">
        <div className="checkbox">
          <label>
            <input
              type="checkbox"
              ref={(ref) => this.field = ref}
              defaultChecked={this.props.defaultValue}
              onChange={this.handleChange}
              checked={this.state.value}
            />
            {this.props.label}
          </label>
        </div>
      </div>

    );
  }
}

CheckBoxField.propTypes = {
  label: PropTypes.string,
  defaultValue: PropTypes.bool,
  value: PropTypes.bool
};

export default CheckBoxField;
