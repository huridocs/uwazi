import React, { Component, PropTypes } from 'react'
import api from '../../utils/api'

class TemplatesController extends Component {

  static contextTypes = { getInitialData: PropTypes.func }

  static requestState(templateKey){
    return api.get('templates')
    .then((response) => {
      let templates = response.json.rows;

      return {
        templates:templates,
        template: templates.find(template => template.key == templateKey)
      };
    })
  }

  constructor(props, context){
    super(props);

    TemplatesController.requestState(props.params.templateKey)
    .then((response) => {
      this.setState(response);
    });

    this.state = context.getInitialData(this);

  }

  render = () => {
    return (
      <div>
      </div>
    )
  }

}

export default TemplatesController;
