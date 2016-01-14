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
      <div className="form-group col-xs-9">
        <label htmlFor="label" className="col-xs-2 control-label">{this.props.label}</label>
        <div className="col-xs-10">
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
