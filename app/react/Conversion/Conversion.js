import RouteHandler from 'app/App/RouteHandler';
import React from 'react';

export class Conversion extends RouteHandler {
  constructor(props, context) {
    super(props, context);
    this.state = {
      value: '',
      output: '',
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(event) {
    this.setState({ value: event.target.value });
  }

  handleSubmit(event) {
    event.preventDefault();
    try {
      const entityJson = JSON.parse(this.state.value);
      this.setState({ output: entityJson.originalname });
    } catch (error) {
      this.setState({ output: 'Invalid entity' });
    }
  }

  render() {
    return (
      <form onSubmit={this.handleSubmit}>
        <div>
          <textarea
            value={this.state.value}
            onChange={this.handleChange}
            style={{
              marginTop: '50px',
              width: '500px',
              height: '500px',
            }}
          />
        </div>
        <input type="submit" value="Convert" />
        <div>{this.state.output}</div>
      </form>
    );
  }
}

export default Conversion;
