import React, { Component, PropTypes } from 'react'

class TextareaField extends Component {

  constructor(props) {
    super(props),
    this.state = {value: props.value};
  }

  value = () => {
    return this.field.value
  };

  handleChange = () => {
    this.setState({value: this.value()});
  };

  componentDidUpdate = (prevProps) => {
    if(prevProps.value !== this.props.value){
      this.setState({value:this.props.value || ''});
    }
  };

  render = () => {
    return (
      <div className="form-group">
        <label htmlFor="label">{this.props.label}</label>
        <div>
          <textarea
            className="form-control"
            rows="3"

            onChange={this.handleChange}
            value={this.state.value}
            defaultValue={this.props.defaultValue}
            ref={(ref) => this.field = ref}
          ></textarea>
        </div>
      </div>
    )
  };

}
export default TextareaField;
