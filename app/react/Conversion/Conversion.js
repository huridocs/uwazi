import RouteHandler from 'app/App/RouteHandler';
import React from 'react';
import api from 'app/utils/api';

export class Conversion extends RouteHandler {
  constructor(props, context) {
    super(props, context);
    this.state = {
      // eslint-disable-next-line max-len
      value: '{originalname:"1597396476373xejyuuzweie.pdf"}',
      absolutePosition: '',
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
      this.setState({ absolutePosition: entityJson.originalname });
      const url = 'pdf_character_count_to_absolute/pdf_character_count_to_absolute';
      const absolutePosition = api.get(url, {}).then(response => response.json);
      this.setState({ absolutePosition: absolutePosition });
    } catch (error) {
      this.setState({ absolutePosition: 'Invalid entity' });
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
        <div>{this.state.absolutePosition}</div>
      </form>
    );
  }
}

export default Conversion;
